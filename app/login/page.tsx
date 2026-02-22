"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { Suspense } from "react";

function LoginForm() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";
    const error = searchParams.get("error");

    const errorMessage = (() => {
        if (!error) return null;
        if (error === "OAuthCallback") {
            return "Google 로그인 응답 처리 중 오류가 발생했습니다. 팝업/브라우저를 새로고침 후 다시 시도해 주세요.";
        }
        if (error === "AccessDenied") {
            return "Google 계정 접근이 거부되었습니다. 계정 동의를 허용했는지 확인해 주세요.";
        }
        if (error === "Configuration") {
            return "서버 인증 설정이 올바르지 않습니다. NEXTAUTH_URL과 Google OAuth Redirect URI를 확인해 주세요.";
        }
        return "로그인 처리 중 문제가 발생했습니다.";
    })();

    return (
        <div className="w-full max-w-md space-y-8">
            <div className="text-center lg:hidden">
                <LayoutDashboard className="w-12 h-12 mx-auto text-primary mb-4" />
                <h1 className="text-2xl font-bold text-foreground">Google Drive Hub</h1>
            </div>

            <div className="space-y-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
                    <p className="text-sm text-muted-foreground mt-2">
                        Sign in to your account to continue
                    </p>
                </div>

                {errorMessage && (
                    <div className="rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
                        {errorMessage}
                    </div>
                )}

                <button
                    onClick={() => signIn("google", { callbackUrl })}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-all duration-200 group text-gray-700 font-medium"
                >
                    <img
                        src="https://www.google.com/favicon.ico"
                        alt="Google"
                        className="w-5 h-5"
                    />
                    <span>Continue with Google</span>
                </button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            Secure Enterprise Access
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-background">
            {/* Left Column - Brand/Visual */}
            <div className="hidden lg:flex flex-col justify-center items-center bg-primary text-primary-foreground p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent opacity-50" />
                <div className="relative z-10 max-w-lg text-center">
                    <LayoutDashboard className="w-24 h-24 mx-auto mb-8 opacity-90" />
                    <h1 className="text-4xl font-bold mb-6 font-display">
                        Google Drive Hub
                    </h1>
                    <p className="text-lg opacity-90 leading-relaxed">
                        Enterprise-grade file management with intuitive visual exploration.
                        Experience your documents like never before.
                    </p>
                </div>
            </div>

            {/* Right Column - Login Form */}
            <div className="flex flex-col justify-center items-center p-8 lg:p-12">
                <Suspense fallback={<div className="text-center">Loading...</div>}>
                    <LoginForm />
                </Suspense>
            </div>
        </div>
    );
}
