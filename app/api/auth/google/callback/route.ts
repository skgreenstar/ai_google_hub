import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");

    if (!code) {
        return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXTAUTH_URL}/api/auth/google/callback`
    );

    try {
        const { tokens } = await oauth2Client.getToken(code);

        await prisma.user.update({
            where: { email: session.user.email },
            data: {
                googleAccessToken: tokens.access_token,
                googleRefreshToken: tokens.refresh_token, // Only returned on first consent or forced prompt
                googleTokenExpires: tokens.expiry_date ? BigInt(tokens.expiry_date) : undefined,
            },
        });

        // Redirect to dashboard with success query param
        return NextResponse.redirect(new URL("/?driveConnected=true", request.url));

    } catch (error) {
        console.error("Error exchanging code for tokens", error);
        return NextResponse.redirect(new URL("/?error=DriveConnectFailed", request.url));
    }
}
