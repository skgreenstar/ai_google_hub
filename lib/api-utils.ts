import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export type AuthenticatedAction = (
    session: Session & { accessToken: string },
    request: NextRequest
) => Promise<NextResponse>;

export const withAuth = (action: AuthenticatedAction) => {
    return async (request: NextRequest) => {
        const session = await getServerSession(authOptions);

        if (!session?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        return action(session as Session & { accessToken: string }, request);
    };
};

export async function getAuthenticatedSession(): Promise<Session & { accessToken: string }> {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
        throw new Error("Unauthorized");
    }
    return session as Session & { accessToken: string };
}
