import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { isAdminEmail } from "@/lib/security/admin";

type AppRole = "Admin" | "Editor" | "Viewer";

interface AppSessionToken {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    role?: AppRole;
    error?: string;
}

const refreshAccessToken = async (token: AppSessionToken): Promise<AppSessionToken> => {
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
        params.set("refresh_token", token.refreshToken);
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
            const typedToken = token as AppSessionToken & typeof token;

            if (account) {
                typedToken.accessToken = account.access_token;
                typedToken.refreshToken = account.refresh_token;
                typedToken.expiresAt = account.expires_at;
                typedToken.role = isAdminEmail(typedToken.email) ? "Admin" : "Viewer";
            }

            if (typedToken.expiresAt && typedToken.expiresAt * 1000 <= Date.now() + 60 * 1000) {
                const refreshedToken = await refreshAccessToken(typedToken);
                return refreshedToken;
            }

            if (!typedToken.role && typedToken.email) {
                typedToken.role = isAdminEmail(typedToken.email) ? "Admin" : "Viewer";
            }

            return typedToken;
        },
        async session({ session, token }) {
            const typedToken = token as AppSessionToken & typeof token;
            if (typedToken) {
                session.accessToken = typedToken.accessToken;
                session.accessTokenExpiresAt = typedToken.expiresAt;
                session.user.role = typedToken.role;
                session.error = typedToken.error;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV !== "production",
};
