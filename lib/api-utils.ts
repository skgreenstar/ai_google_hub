import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { refreshGoogleToken } from "@/lib/google/token";

export interface DriveSession extends Session {
    accessToken: string;
}

export type AuthenticatedAction = (
    session: DriveSession,
    request: NextRequest
) => Promise<NextResponse>;

export const withAuth = (action: AuthenticatedAction) => {
    return async (request: NextRequest) => {
        try {
            const session = await getAuthenticatedSession();
            return action(session, request);
        } catch (error: any) {
            if (error.message === "Google Drive not connected") {
                return NextResponse.json({ error: "Google Drive not connected", code: "DRIVE_NOT_CONNECTED" }, { status: 403 });
            }
            if (error.message === "Unauthorized") {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
        }
    };
};

export async function getAuthenticatedSession(): Promise<DriveSession> {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        throw new Error("Unauthorized");
    }

    // Fetch user from DB to verify existence
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) {
        throw new Error("Unauthorized");
    }

    // We no longer need user's access token since we use Service Account
    return { ...session, accessToken: "" };
}
