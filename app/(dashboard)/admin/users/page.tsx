"use client";

import { InviteModal } from "@/components/features/InviteModal";
import { User, UserTable } from "@/components/features/UserTable";
import { Plus, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface AuditLog {
    id: number;
    action: string;
    actorEmail: string;
    targetUserId?: string;
    targetEmail?: string;
    reason?: string;
    createdAt: string;
}

interface AuditLogFilters {
    action: string;
    actor: string;
    from: string;
    to: string;
}

interface AuditLogResponse {
    items: AuditLog[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
}

const EMPTY_AUDIT_FILTERS: AuditLogFilters = {
    action: "",
    actor: "",
    from: "",
    to: "",
};

export default function UsersPage() {
    const { data: session, status } = useSession();
    const [users, setUsers] = useState<User[]>([]);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [auditTotal, setAuditTotal] = useState(0);
    const [auditOffset, setAuditOffset] = useState(0);
    const [auditLimit, setAuditLimit] = useState(10);
    const [auditHasMore, setAuditHasMore] = useState(false);
    const [isAuditLoading, setIsAuditLoading] = useState(true);
    const [auditFilterDraft, setAuditFilterDraft] = useState<AuditLogFilters>(EMPTY_AUDIT_FILTERS);
    const [auditFilters, setAuditFilters] = useState<AuditLogFilters>(EMPTY_AUDIT_FILTERS);

    const isAdmin = session?.user?.role === "Admin";

    if (status === "loading") {
        return <div className="p-6">Loading...</div>;
    }

    if (!isAdmin) {
        return (
            <div className="p-6">
                <div className="max-w-xl mx-auto bg-card border border-destructive/30 rounded-xl p-6 text-destructive">
                    <h1 className="text-lg font-bold mb-2">권한이 없습니다</h1>
                    <p className="text-sm text-muted-foreground">팀 관리 화면은 관리자만 접근할 수 있습니다.</p>
                </div>
            </div>
        );
    }

    useEffect(() => {
        let isCancelled = false;

        const loadUsers = async () => {
            const res = await fetch("/api/admin/users");
            if (!res.ok) {
                throw new Error("Failed to load users");
            }
            const data = await res.json();
            if (!isCancelled) {
                setUsers(data);
            }
        };

        loadUsers()
            .catch((error) => {
                console.error("Load admin users error", error);
            })
            .finally(() => {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [isAdmin]);

    useEffect(() => {
        let isCancelled = false;

        const formatFilterDate = (value: string) => {
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) {
                return "";
            }
            return date.toISOString();
        };

        const loadAuditLogs = async () => {
            const params = new URLSearchParams();
            params.set("limit", String(auditLimit));
            params.set("offset", String(auditOffset));

            if (auditFilters.action) {
                params.set("action", auditFilters.action);
            }
            if (auditFilters.actor.trim()) {
                params.set("actor", auditFilters.actor.trim());
            }
            if (auditFilters.from) {
                const from = formatFilterDate(auditFilters.from);
                if (!from) {
                    throw new Error("Invalid from date");
                }
                params.set("from", from);
            }
            if (auditFilters.to) {
                const to = formatFilterDate(auditFilters.to);
                if (!to) {
                    throw new Error("Invalid to date");
                }
                params.set("to", to);
            }

            const res = await fetch(`/api/admin/users/audit?${params.toString()}`);
            if (!res.ok) {
                const error = await res.json().catch(() => ({}));
                throw new Error(error.error || "Failed to load audit logs");
            }

            const data = (await res.json()) as AuditLogResponse | AuditLog[];
            if (isCancelled) return;

            if (Array.isArray(data)) {
                setAuditLogs(data);
                setAuditTotal(data.length);
                setAuditHasMore(false);
                return;
            }

            setAuditLogs(data.items || []);
            setAuditTotal(data.total || 0);
            setAuditHasMore(Boolean(data.hasMore));
            setAuditLimit(data.limit || auditLimit);
        };

        setIsAuditLoading(true);
        loadAuditLogs()
            .catch((error) => {
                console.error("Load admin audit logs error", error);
                setAuditLogs([]);
                setAuditTotal(0);
                setAuditHasMore(false);
            })
            .finally(() => {
                if (!isCancelled) {
                    setIsAuditLoading(false);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [isAdmin, auditFilters, auditOffset, auditLimit]);

    const handleRoleChange = async (userId: string, newRole: User["role"]) => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, role: newRole }),
            });

            if (!res.ok) throw new Error("Failed to change role");
            const updated = await res.json();
            setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
        } catch (error) {
            console.error("Update role error", error);
            alert("Failed to update role.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleInvite = async (email: string, role: string) => {
        const res = await fetch("/api/admin/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: email.split("@")[0], email, role }),
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || "Failed to invite user");
        }

        const created = await res.json();
        setUsers((prev) => [...prev, created]);
    };

    const handleRemove = async (userId: string) => {
        if (!confirm("Are you sure you want to remove this user?")) return;

        setIsSaving(true);
        try {
            const res = await fetch(`/api/admin/users?userId=${encodeURIComponent(userId)}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to remove user");

            setUsers((prev) => prev.filter((u) => u.id !== userId));
        } catch (error) {
            console.error("Remove user error", error);
            alert("Failed to remove user.");
        } finally {
            setIsSaving(false);
        }
    };

    const applyAuditFilters = () => {
        setAuditOffset(0);
        setAuditFilters(auditFilterDraft);
    };

    const resetAuditFilters = () => {
        setAuditOffset(0);
        setAuditFilterDraft(EMPTY_AUDIT_FILTERS);
        setAuditFilters(EMPTY_AUDIT_FILTERS);
    };

    const onChangeAuditLimit = (value: number) => {
        setAuditOffset(0);
        setAuditLimit(value);
    };

    if (isLoading) {
        return <div className="p-6">Loading users...</div>;
    }

    const currentPage = Math.floor(auditOffset / auditLimit) + 1;
    const totalPages = Math.max(1, Math.ceil(auditTotal / auditLimit));

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
                    <p className="text-muted-foreground mt-1">Manage access and roles for your workspace.</p>
                </div>
                <button
                    onClick={() => setIsInviteOpen(true)}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg transition-all active:scale-95 w-full md:w-auto justify-center"
                >
                    <Plus className="w-5 h-5" />
                    <span>Invite Member</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border/50 p-4 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{users.length}</div>
                        <div className="text-xs text-muted-foreground">Total Members</div>
                    </div>
                </div>
                <div className="bg-card border border-border/50 p-4 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-green-500/10 text-green-500 rounded-lg">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{users.filter((u) => u.status === "Active").length}</div>
                        <div className="text-xs text-muted-foreground">Active Now</div>
                    </div>
                </div>
            </div>

            <UserTable
                users={users}
                onRoleChange={handleRoleChange}
                onRemoveUser={handleRemove}
            />

            <div className="bg-card border border-border/50 p-4 rounded-xl">
                <h2 className="text-lg font-semibold mb-3">Audit Log</h2>

                <div className="space-y-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="space-y-1">
                            <label className="text-sm text-muted-foreground" htmlFor="audit-action">
                                Action
                            </label>
                            <select
                                id="audit-action"
                                value={auditFilterDraft.action}
                                onChange={(event) => setAuditFilterDraft((prev) => ({ ...prev, action: event.target.value }))}
                                className="w-full bg-background border border-border/50 rounded-md px-3 py-2"
                            >
                                <option value="">All</option>
                                <option value="LIST_USERS">LIST_USERS</option>
                                <option value="CREATE_USER">CREATE_USER</option>
                                <option value="UPDATE_ROLE">UPDATE_ROLE</option>
                                <option value="DELETE_USER">DELETE_USER</option>
                                <option value="LIST_AUDIT">LIST_AUDIT</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm text-muted-foreground" htmlFor="audit-actor">
                                Actor
                            </label>
                            <input
                                id="audit-actor"
                                type="text"
                                value={auditFilterDraft.actor}
                                onChange={(event) => setAuditFilterDraft((prev) => ({ ...prev, actor: event.target.value }))}
                                placeholder="actor email"
                                className="w-full bg-background border border-border/50 rounded-md px-3 py-2"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm text-muted-foreground" htmlFor="audit-from">
                                From
                            </label>
                            <input
                                id="audit-from"
                                type="datetime-local"
                                value={auditFilterDraft.from}
                                onChange={(event) => setAuditFilterDraft((prev) => ({ ...prev, from: event.target.value }))}
                                className="w-full bg-background border border-border/50 rounded-md px-3 py-2"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm text-muted-foreground" htmlFor="audit-to">
                                To
                            </label>
                            <input
                                id="audit-to"
                                type="datetime-local"
                                value={auditFilterDraft.to}
                                onChange={(event) => setAuditFilterDraft((prev) => ({ ...prev, to: event.target.value }))}
                                className="w-full bg-background border border-border/50 rounded-md px-3 py-2"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={applyAuditFilters}
                            className="bg-primary text-primary-foreground px-3 py-2 rounded-md font-medium"
                        >
                            Apply Filter
                        </button>
                        <button
                            onClick={resetAuditFilters}
                            className="bg-secondary text-secondary-foreground px-3 py-2 rounded-md"
                        >
                            Reset
                        </button>
                        <div className="ml-auto flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">페이지 크기</span>
                            <select
                                value={auditLimit}
                                onChange={(event) => onChangeAuditLimit(Number(event.target.value))}
                                className="bg-background border border-border/50 rounded-md px-3 py-2"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>
                </div>

                {isAuditLoading ? (
                    <p className="text-sm text-muted-foreground">Loading audit logs...</p>
                ) : auditLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No audit records yet.</p>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase border-b border-border/50">
                                    <tr>
                                        <th className="px-3 py-2 font-medium">Action</th>
                                        <th className="px-3 py-2 font-medium">Actor</th>
                                        <th className="px-3 py-2 font-medium">Target</th>
                                        <th className="px-3 py-2 font-medium">Reason</th>
                                        <th className="px-3 py-2 font-medium">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {auditLogs.map((log) => (
                                        <tr key={log.id}>
                                            <td className="px-3 py-2">{log.action}</td>
                                            <td className="px-3 py-2">{log.actorEmail}</td>
                                            <td className="px-3 py-2">{log.targetEmail || "-"}</td>
                                            <td className="px-3 py-2 text-muted-foreground">{log.reason || "-"}</td>
                                            <td className="px-3 py-2 text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 flex items-center gap-3 text-sm">
                            <button
                                disabled={auditOffset === 0}
                                onClick={() => setAuditOffset((prev) => Math.max(prev - auditLimit, 0))}
                                className="px-3 py-1.5 border border-border/50 rounded-md disabled:opacity-40"
                            >
                                이전
                            </button>
                            <span className="text-muted-foreground">
                                {currentPage} / {totalPages} (총 {auditTotal}건)
                            </span>
                            <button
                                disabled={!auditHasMore}
                                onClick={() => setAuditOffset((prev) => prev + auditLimit)}
                                className="px-3 py-1.5 border border-border/50 rounded-md disabled:opacity-40"
                            >
                                다음
                            </button>
                        </div>
                    </>
                )}
            </div>

            <InviteModal
                isOpen={isInviteOpen}
                onClose={() => setIsInviteOpen(false)}
                onInvite={handleInvite}
            />
        </div>
    );
}
