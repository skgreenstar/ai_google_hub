import { NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import { isAdminEmail } from "@/lib/security/admin";

const refreshAccessToken = async (token: JWT): Promise<JWT> => {
    if (!token.refreshToken) {
        return {
            ...token,
            error: "RefreshAccessTokenError",
        };
    }

    try {
        const params = new URLSearchParams();
        params.set("client_id", process.env.GOOGLE_CLIENT_ID || "");
        params.set("client_secret", process.env.GOOGLE_CLIENT_SECRET || "");
        params.set("refresh_token", token.refreshToken as string);
        params.set("grant_type", "refresh_token");

        const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString(),
        });

        const refreshed = (await response.json()) as {
            access_token?: string;
            expires_in?: number;
            refresh_token?: string;
            error?: string;
            error_description?: string;
        };

        if (!response.ok) {
            throw new Error(refreshed.error_description || refreshed.error || "Token refresh failed");
        }

        return {
            ...token,
            accessToken: refreshed.access_token,
            refreshToken: refreshed.refresh_token || token.refreshToken,
            expiresAt: Math.floor(Date.now() / 1000) + Number(refreshed.expires_in || 3600),
            error: undefined,
        };
    } catch {
        return {
            ...token,
            error: "RefreshAccessTokenError",
        };
    }
};

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            authorization: {
                params: {
                    scope: "openid email profile https://www.googleapis.com/auth/drive",
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                },
            },
        }),
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token;
                token.refreshToken = account.refresh_token;
                token.expiresAt = account.expires_at;
                token.role = isAdminEmail(token.email) ? "Admin" : "Viewer";
            }

            if (token.expiresAt && token.expiresAt * 1000 <= Date.now() + 60 * 1000) {
                return refreshAccessToken(token);
            }

            if (!token.role && token.email) {
                token.role = isAdminEmail(token.email) ? "Admin" : "Viewer";
            }

            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.accessToken = token.accessToken as string;
                session.accessTokenExpiresAt = token.expiresAt as number;
                session.user.role = token.role as "Admin" | "Editor" | "Viewer";
                session.error = token.error as "RefreshAccessTokenError";
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV !== "production",
};

