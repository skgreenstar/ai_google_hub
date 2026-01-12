import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

export async function refreshGoogleToken(userId: string, refreshToken: string) {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
        refresh_token: refreshToken,
    });

    try {
        const { credentials } = await oauth2Client.refreshAccessToken();

        // Update user in DB
        await prisma.user.update({
            where: { id: userId },
            data: {
                googleAccessToken: credentials.access_token,
                googleRefreshToken: credentials.refresh_token || undefined, // It might not be returned if not needed
                googleTokenExpires: credentials.expiry_date ? BigInt(credentials.expiry_date) : undefined,
            },
        });

        return credentials.access_token;
    } catch (error) {
        console.error("Failed to refresh Google token", error);
        throw new Error("Failed to refresh Google token");
    }
}
