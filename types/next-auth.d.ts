import { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

type AppRole = "Admin" | "Editor" | "Viewer"

declare module "next-auth" {
    interface Session {
        accessToken?: string
        accessTokenExpiresAt?: number
        error?: "RefreshAccessTokenError"
        user: {
            id: string
            role?: AppRole
        } & DefaultSession["user"]
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        accessToken?: string
        refreshToken?: string
        expiresAt?: number
        role?: AppRole
        error?: "RefreshAccessTokenError"
    }
}
