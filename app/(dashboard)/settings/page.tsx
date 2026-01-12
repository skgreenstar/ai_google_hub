import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Cloud, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default async function SettingsPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { googleAccessToken: true, googleTokenExpires: true }
    });

    const isConnected = !!user?.googleAccessToken;
    // Check if expired logic could be added here for UI feedback

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground mt-2">Manage your account and integrations</p>
            </div>

            <div className="bg-background border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-600">
                            <Cloud className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">Google Drive Integration</h2>
                            <p className="text-sm text-muted-foreground">
                                System is connected via Service Account (Shared Drive).
                            </p>
                        </div>
                    </div>

                    <div>
                        <button disabled className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 rounded-lg font-medium cursor-default">
                            <CheckCircle className="w-4 h-4" />
                            System Active
                        </button>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-secondary/50 rounded-lg border border-border/50">
                    <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                            <h3 className="font-medium text-foreground">Service Account Authorization</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                File access is managed globally by the system service account. Individual users do not need to connect their personal Google Drive accounts to view or upload files to the shared drive.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
