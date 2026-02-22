import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export type UserRole = "Admin" | "Editor" | "Viewer";
export type UserStatus = "Active" | "Pending";

export interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    lastActive: string;
    avatar?: string;
}

export type AuditAction = "LIST_USERS" | "CREATE_USER" | "UPDATE_ROLE" | "DELETE_USER" | "LIST_AUDIT";

export interface AuditContext {
    actorEmail: string;
    actorRole?: string;
    actorIp?: string;
    requestPath?: string;
    requestMethod?: string;
    userAgent?: string;
}

export interface AuditRecord {
    id: number;
    action: AuditAction;
    actorEmail: string;
    targetUserId?: string;
    targetEmail?: string;
    reason?: string;
    actorRole?: string;
    actorIp?: string;
    requestPath?: string;
    requestMethod?: string;
    userAgent?: string;
    createdAt: string;
    metadata?: Record<string, unknown>;
}

export interface AuditLogFilter {
    action?: AuditAction;
    actorEmail?: string;
    from?: string;
    to?: string;
}

interface DbSchemaRecord {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    last_active: string;
    avatar: string | null;
    created_at: string;
    created_by: string | null;
    updated_at: string;
    updated_by: string | null;
}

interface DbAuditRecord {
    id: number;
    action: AuditAction;
    actor_email: string;
    target_user_id: string | null;
    target_email: string | null;
    reason: string | null;
    actor_role: string | null;
    actor_ip: string | null;
    request_path: string | null;
    request_method: string | null;
    user_agent: string | null;
    created_at: string;
    metadata: string | null;
}

const parseIntEnv = (value: string | undefined, fallback: number) => {
    if (!value) return fallback;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getRetentionDays = () => {
    const raw = process.env.ADMIN_AUDIT_RETENTION_DAYS;
    if (!raw) return 90;

    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) return 90;
    return parsed;
};
const getRetentionCheckIntervalMs = () => parseIntEnv(process.env.ADMIN_AUDIT_RETENTION_CHECK_INTERVAL_MS, 60 * 60 * 1000);

const normalizeActionFilter = (value: string | null): AuditAction | undefined => {
    if (!value) return undefined;
    if (
        value === "LIST_USERS" ||
        value === "CREATE_USER" ||
        value === "UPDATE_ROLE" ||
        value === "DELETE_USER" ||
        value === "LIST_AUDIT"
    ) {
        return value;
    }
    return undefined;
};

const normalizeDateInput = (value: string | null): string | undefined => {
    if (!value) return undefined;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return undefined;
    return parsed.toISOString();
};

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "admin-hub.db");
let _lastPruneMs = 0;

const DEFAULT_USERS: Array<Omit<AdminUser, "id" | "lastActive"> & { lastActive?: string }> = [
    { name: "Alex Chen", email: "alex@example.com", role: "Admin", status: "Active", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d" },
    { name: "Sarah Miller", email: "sarah@example.com", role: "Editor", status: "Active", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d" },
    { name: "Mike Ross", email: "mike@example.com", role: "Viewer", status: "Pending", avatar: undefined },
];

let _db: DatabaseSync | null = null;
let _migrated = false;

const now = () => new Date().toISOString();

const getDatabase = async () => {
    if (_db) return _db;

    await mkdir(DB_DIR, { recursive: true });
    _db = new DatabaseSync(DB_FILE);
    await migrateSchema(_db);
    _db.exec("PRAGMA journal_mode = WAL;");
    await seedDefaults(_db);
    purgeExpiredAuditLogs(_db);
    return _db;
};

const migrateSchema = async (db: DatabaseSync) => {
    if (_migrated) return;
    _migrated = true;

    db.exec(`
        CREATE TABLE IF NOT EXISTS admin_users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            role TEXT NOT NULL CHECK (role IN ('Admin', 'Editor', 'Viewer')),
            status TEXT NOT NULL CHECK (status IN ('Active', 'Pending')),
            last_active TEXT NOT NULL,
            avatar TEXT,
            created_at TEXT NOT NULL,
            created_by TEXT,
            updated_at TEXT NOT NULL,
            updated_by TEXT
        );
    `);

    db.exec(`
        CREATE TABLE IF NOT EXISTS admin_audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT NOT NULL,
            actor_email TEXT NOT NULL,
            target_user_id TEXT,
            target_email TEXT,
            reason TEXT,
            actor_role TEXT,
            actor_ip TEXT,
            request_path TEXT,
            request_method TEXT,
            user_agent TEXT,
            metadata TEXT,
            created_at TEXT NOT NULL
        );
    `);
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at ON admin_audit_logs(created_at);
    `);
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON admin_audit_logs(action);
    `);
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_admin_audit_actor_email ON admin_audit_logs(actor_email);
    `);
};

const seedDefaults = async (db: DatabaseSync) => {
    const hasUsers = db.prepare("SELECT COUNT(*) as count FROM admin_users").get() as any as { count: number } | undefined;
    if (hasUsers && hasUsers.count > 0) return;

    const nowValue = now();
    const insert = db.prepare(`
        INSERT INTO admin_users (
            id, name, email, role, status, last_active, avatar, created_at, created_by, updated_at, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const defaultActors = "system";

    for (const u of DEFAULT_USERS) {
        insert.run(randomUUID(), u.name, u.email.toLowerCase(), u.role, u.status, u.lastActive || "-", u.avatar || null, nowValue, defaultActors, nowValue, defaultActors);
    }
};

const purgeExpiredAuditLogs = (db: DatabaseSync) => {
    const retentionDays = getRetentionDays();
    if (!retentionDays || retentionDays <= 0) {
        return;
    }

    const now = Date.now();
    if (now - _lastPruneMs < getRetentionCheckIntervalMs()) {
        return;
    }

    const retentionDate = new Date(now - retentionDays * 24 * 60 * 60 * 1000).toISOString();
    db.prepare("DELETE FROM admin_audit_logs WHERE created_at < ?").run(retentionDate);
    _lastPruneMs = now;
};

const toAdminUser = (row: DbSchemaRecord): AdminUser => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    lastActive: row.last_active,
    avatar: row.avatar || undefined,
});

const toAuditRecord = (row: DbAuditRecord): AuditRecord => ({
    id: row.id,
    action: row.action,
    actorEmail: row.actor_email,
    targetUserId: row.target_user_id || undefined,
    targetEmail: row.target_email || undefined,
    reason: row.reason || undefined,
    actorRole: row.actor_role || undefined,
    actorIp: row.actor_ip || undefined,
    requestPath: row.request_path || undefined,
    requestMethod: row.request_method || undefined,
    userAgent: row.user_agent || undefined,
    createdAt: row.created_at,
    metadata: row.metadata ? (JSON.parse(row.metadata) as Record<string, unknown>) : undefined,
});

const buildAuditFilters = (filters: AuditLogFilter) => {
    const actionFilter = normalizeActionFilter(filters.action ? String(filters.action) : null);
    const actorEmail = (filters.actorEmail || "").trim().toLowerCase();
    const fromFilter = normalizeDateInput(filters.from || null);
    const toFilter = normalizeDateInput(filters.to || null);

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (actionFilter) {
        conditions.push("action = ?");
        params.push(actionFilter);
    }

    if (actorEmail) {
        conditions.push("LOWER(actor_email) = ?");
        params.push(actorEmail);
    }

    if (fromFilter) {
        conditions.push("created_at >= ?");
        params.push(fromFilter);
    }

    if (toFilter) {
        conditions.push("created_at <= ?");
        params.push(toFilter);
    }

    return {
        conditions,
        params,
        whereClause: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    };
};

const withDb = async <T>(fn: (db: DatabaseSync) => T): Promise<T> => {
    const db = await getDatabase();
    return fn(db);
};

export const getUsers = async (context: AuditContext) => {
    return withDb((db) => {
        const rows = db.prepare("SELECT * FROM admin_users ORDER BY created_at DESC").all() as any as DbSchemaRecord[];
        return rows.map(toAdminUser);
    }).then(async (users) => {
        void logAdminAction({
            action: "LIST_USERS",
            actorEmail: context.actorEmail,
            actorRole: context.actorRole,
            actorIp: context.actorIp,
            requestPath: context.requestPath,
            requestMethod: context.requestMethod,
            userAgent: context.userAgent,
        }).catch(() => void 0);
        return users;
    });
};

export const createUser = async (input: Omit<AdminUser, "id" | "lastActive">, context: AuditContext) => {
    return withDb((db) => {
        const existing = db.prepare("SELECT id FROM admin_users WHERE lower(email) = lower(?)")
            .get(input.email) as any as { id: string } | undefined;

        if (existing) {
            throw new Error("User already exists");
        }

        const nowValue = now();
        const id = randomUUID();
        const lastActive = "Pending";
        const email = input.email.trim().toLowerCase();

        db.prepare(`
            INSERT INTO admin_users (
                id, name, email, role, status, last_active, avatar, created_at, created_by, updated_at, updated_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            id,
            input.name,
            email,
            input.role,
            input.status,
            lastActive,
            input.avatar ?? null,
            nowValue,
            context.actorEmail,
            nowValue,
            context.actorEmail
        );

        return {
            id,
            name: input.name,
            email,
            role: input.role,
            status: input.status,
            lastActive,
            avatar: input.avatar,
        } as AdminUser;
    }).then(async (created) => {
        void logAdminAction({
            action: "CREATE_USER",
            actorEmail: context.actorEmail,
            targetUserId: created.id,
            targetEmail: created.email,
            actorRole: context.actorRole,
            actorIp: context.actorIp,
            requestPath: context.requestPath,
            requestMethod: context.requestMethod,
            userAgent: context.userAgent,
        }).catch(() => void 0);
        return created;
    });
};

export const updateUserRole = async (id: string, role: UserRole, context: AuditContext) => {
    return withDb((db) => {
        const nowValue = now();
        const target = db.prepare("SELECT email FROM admin_users WHERE id = ?").get(id) as any as { email: string } | undefined;
        if (!target) {
            throw new Error("User not found");
        }

        db.prepare("UPDATE admin_users SET role = ?, updated_at = ?, updated_by = ? WHERE id = ?")
            .run(role, nowValue, context.actorEmail, id);

        const row = db.prepare("SELECT * FROM admin_users WHERE id = ?").get(id) as any as DbSchemaRecord;
        const updated = toAdminUser(row);

        void logAdminAction({
            action: "UPDATE_ROLE",
            actorEmail: context.actorEmail,
            targetUserId: updated.id,
            targetEmail: updated.email,
            actorRole: context.actorRole,
            actorIp: context.actorIp,
            requestPath: context.requestPath,
            requestMethod: context.requestMethod,
            userAgent: context.userAgent,
            metadata: { role },
        }).catch(() => void 0);

        return updated;
    });
};

export const deleteUser = async (id: string, context: AuditContext) => {
    return withDb((db) => {
        const target = db.prepare("SELECT email FROM admin_users WHERE id = ?").get(id) as any as { email: string } | undefined;
        if (!target) {
            throw new Error("User not found");
        }

        db.prepare("DELETE FROM admin_users WHERE id = ?").run(id);

        void logAdminAction({
            action: "DELETE_USER",
            actorEmail: context.actorEmail,
            targetUserId: id,
            targetEmail: target.email,
            actorRole: context.actorRole,
            actorIp: context.actorIp,
            requestPath: context.requestPath,
            requestMethod: context.requestMethod,
            userAgent: context.userAgent,
        }).catch(() => void 0);

        return { id };
    });
};

export const getAuditLogs = async (
    context: AuditContext,
    limit = 100,
    offset = 0,
    filters: AuditLogFilter = {}
) => {
    const query = buildAuditFilters(filters);

    return withDb((db) => {
        purgeExpiredAuditLogs(db);
        const rows = db.prepare(`
            SELECT * FROM admin_audit_logs
            ${query.whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `).all(...query.params, limit, offset) as any as DbAuditRecord[];

        return rows.map(toAuditRecord);
    }).then(async (logs) => {
        void logAdminAction({
            action: "LIST_AUDIT",
            actorEmail: context.actorEmail,
            actorRole: context.actorRole,
            actorIp: context.actorIp,
            requestPath: context.requestPath,
            requestMethod: context.requestMethod,
            userAgent: context.userAgent,
            metadata: { limit, offset },
        }).catch(() => void 0);
        return logs;
    });
};

export const getAuditLogCount = async (filters: AuditLogFilter = {}) => {
    const query = buildAuditFilters(filters);

    return withDb((db) => {
        purgeExpiredAuditLogs(db);
        const row = db.prepare(`
            SELECT COUNT(*) as count
            FROM admin_audit_logs
            ${query.whereClause}
        `).get(...query.params) as any as { count: number } | undefined;

        return row?.count ?? 0;
    });
};

export const logAdminAction = async (event: {
    action: AuditAction;
    actorEmail: string;
    targetUserId?: string;
    targetEmail?: string;
    reason?: string;
    actorRole?: string;
    actorIp?: string;
    requestPath?: string;
    requestMethod?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
}) => {
    await withDb((db) => {
        db.prepare(`
            INSERT INTO admin_audit_logs (
                action, actor_email, target_user_id, target_email, reason, actor_role,
                actor_ip, request_path, request_method, user_agent, metadata, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            event.action,
            event.actorEmail,
            event.targetUserId ?? null,
            event.targetEmail ?? null,
            event.reason ?? null,
            event.actorRole ?? null,
            event.actorIp ?? null,
            event.requestPath ?? null,
            event.requestMethod ?? null,
            event.userAgent ?? null,
            event.metadata ? JSON.stringify(event.metadata) : null,
            now()
        );

        return true;
    });
};
