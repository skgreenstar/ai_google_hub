import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/security/admin";
import {
    getAuditLogCount,
    getAuditLogs,
    type AuditAction,
    type AuditContext,
} from "@/lib/services/admin-user.service";

const enforceAdmin = async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return null;
    if (session.user.role === "Admin" || isAdminEmail(session.user.email)) return session;
    return null;
};

const getAuditContext = (request: NextRequest, requestContext: { email: string; role?: string }): AuditContext => {
    const xff = request.headers.get("x-forwarded-for");
    const ip = xff ? xff.split(",")[0].trim() : (request.headers.get("x-real-ip") || "unknown");

    return {
        actorEmail: requestContext.email,
        actorRole: requestContext.role,
        actorIp: ip,
        requestPath: request.nextUrl.pathname,
        requestMethod: request.method,
        userAgent: request.headers.get("user-agent") || undefined,
    };
};

const getQueryInt = (value: string | null, fallback: number, min: number, max = Number.POSITIVE_INFINITY) => {
    const parsed = Number.parseInt(value || "", 10);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }

    const clamped = Math.max(min, parsed);
    return Math.min(clamped, max);
};

const sanitizeAction = (value: string | null): AuditAction | undefined => {
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

const parseDateParam = (value: string | null) => {
    if (!value) return undefined;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return undefined;
    return parsed.toISOString();
};

export async function GET(request: NextRequest) {
    const session = await enforceAdmin();
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const context = getAuditContext(request, { email: session.user.email, role: session.user.role });
    const { searchParams } = request.nextUrl;
    const limit = getQueryInt(searchParams.get("limit"), 50, 1, 200);
    const offset = getQueryInt(searchParams.get("offset"), 0, 0);
    const action = sanitizeAction(searchParams.get("action"));
    const actor = searchParams.get("actor") || undefined;
    const from = parseDateParam(searchParams.get("from"));
    const to = parseDateParam(searchParams.get("to"));

    if (searchParams.get("from") && !from) {
        return NextResponse.json({ error: "Invalid from date" }, { status: 400 });
    }

    if (searchParams.get("to") && !to) {
        return NextResponse.json({ error: "Invalid to date" }, { status: 400 });
    }

    if (from && to && new Date(from).getTime() > new Date(to).getTime()) {
        return NextResponse.json({ error: "from must be earlier than or equal to to" }, { status: 400 });
    }

    try {
        const [logs, total] = await Promise.all([
            getAuditLogs(context, limit, offset, {
                action,
                actorEmail: actor,
                from,
                to,
            }),
            getAuditLogCount({
                action,
                actorEmail: actor,
                from,
                to,
            }),
        ]);

        return NextResponse.json({
            items: logs,
            total,
            limit,
            offset,
            hasMore: offset + logs.length < total,
        });
    } catch (error: unknown) {
        console.error("Admin audit GET error:", error);
        return NextResponse.json({ error: (error as Error).message || "Failed to load audit logs" }, { status: 500 });
    }
}
