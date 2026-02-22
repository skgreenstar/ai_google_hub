import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/security/admin";
import {
    createUser,
    deleteUser,
    getUsers,
    type AuditAction,
    logAdminAction,
    updateUserRole,
    UserRole,
} from "@/lib/services/admin-user.service";
import { type AuditContext } from "@/lib/services/admin-user.service";

const enforceAdmin = async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return null;
    }

    if (session.user.role === "Admin" || isAdminEmail(session.user.email)) {
        return session;
    }

    return null;
};

const isValidRole = (value: unknown): value is UserRole => {
    return value === "Admin" || value === "Editor" || value === "Viewer";
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

const sendAdminAuditFailure = async (
    context: AuditContext,
    action: AuditAction,
    targetEmail?: string,
    reason?: string
) => {
    try {
        await logAdminAction({
            action,
            actorEmail: context.actorEmail,
            actorRole: context.actorRole,
            actorIp: context.actorIp,
            requestPath: context.requestPath,
            requestMethod: context.requestMethod,
            userAgent: context.userAgent,
            reason,
            targetEmail,
        });
    } catch (error) {
        console.error("Audit log failed:", error);
    }
};

export async function GET(request: NextRequest) {
    const session = await enforceAdmin();
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const context = getAuditContext(request, { email: session.user.email, role: session.user.role });

    try {
        const users = await getUsers(context);
        return NextResponse.json(users);
    } catch (error: unknown) {
        const reason = (error as Error).message || "Failed to load users";
        await sendAdminAuditFailure(context, "LIST_USERS", undefined, reason);
        console.error("Admin users GET error:", error);
        return NextResponse.json({ error: reason }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session = await enforceAdmin();
    if (!session || !session.user?.email) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const context = getAuditContext(request, { email: session.user.email, role: session.user.role });

    try {
        const body = await request.json();
        const { name, email, role, avatar } = body as {
            name?: string;
            email?: string;
            role?: unknown;
            avatar?: string;
        };

        if (!name || !email || !isValidRole(role)) {
            return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
        }

        const user = await createUser({
            name,
            email,
            role,
            status: "Pending",
            avatar,
        }, context);

        return NextResponse.json(user);
    } catch (error: unknown) {
        const message = (error as Error).message || "Failed to add user";
        await sendAdminAuditFailure(context, "CREATE_USER", undefined, message);
        console.error("Admin users POST error:", error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    const session = await enforceAdmin();
    if (!session || !session.user?.email) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const context = getAuditContext(request, { email: session.user.email, role: session.user.role });

    try {
        const body = await request.json();
        const { userId, role } = body as { userId?: string; role?: unknown };
        if (!userId || !isValidRole(role)) {
            return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
        }

        const user = await updateUserRole(userId, role, context);
        return NextResponse.json(user);
    } catch (error: unknown) {
        const message = (error as Error).message || "Failed to update user";
        await sendAdminAuditFailure(context, "UPDATE_ROLE", undefined, message);
        console.error("Admin users PATCH error:", error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const session = await enforceAdmin();
    if (!session || !session.user?.email) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const context = getAuditContext(request, { email: session.user.email, role: session.user.role });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) {
        return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    try {
        await deleteUser(userId, context);
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = (error as Error).message || "Failed to delete user";
        await sendAdminAuditFailure(context, "DELETE_USER", userId, message);
        console.error("Admin users DELETE error:", error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
