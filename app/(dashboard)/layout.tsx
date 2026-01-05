"use client";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAppStore } from "@/lib/store/use-app-store";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FilePreviewModal } from "@/components/features/FilePreviewModal";
import { UploadModal } from "@/components/features/UploadModal";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { sidebarOpen } = useAppStore();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    if (status === "loading") {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!session) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <div
                className={cn(
                    "transition-all duration-300 ease-in-out min-h-screen",
                    sidebarOpen ? "ml-64" : "ml-20"
                )}
            >
                <Header />
                <main className="p-6">
                    {children}
                </main>
            </div>
            <FilePreviewModal />
            <UploadModal />
        </div>
    );
}
