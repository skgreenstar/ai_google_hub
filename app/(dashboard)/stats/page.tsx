"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, HardDrive, User, Cloud } from "lucide-react";
import { formatBytes } from "@/lib/utils";

async function fetchStats() {
    const res = await fetch("/api/drive/stats");
    if (!res.ok) throw new Error("Failed to fetch stats");
    return res.json();
}

export default function StatsPage() {
    const { data: stats, isLoading, error } = useQuery({
        queryKey: ["drive-stats"],
        queryFn: fetchStats,
    });

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) return <div className="p-6 text-red-500">Failed to load statistics.</div>;

    const usage = stats?.storageQuota?.usage ? parseInt(stats.storageQuota.usage) : 0;
    const limit = stats?.storageQuota?.limit ? parseInt(stats.storageQuota.limit) : 0;
    const percent = limit > 0 ? (usage / limit) * 100 : 0;

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight">Storage & Insights</h1>

            {/* User Profile Card */}
            <div className="bg-card border border-border/50 rounded-xl p-6 flex items-center gap-6 shadow-sm">
                {stats?.user?.photoLink ? (
                    <img src={stats.user.photoLink} alt="User" className="w-20 h-20 rounded-full border-2 border-primary/20" />
                ) : (
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-10 h-10 text-primary" />
                    </div>
                )}
                <div>
                    <h2 className="text-xl font-bold">{stats?.user?.displayName}</h2>
                    <p className="text-muted-foreground">{stats?.user?.emailAddress}</p>
                </div>
            </div>

            {/* Storage Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm relative overflow-hidden group">
                    {/* Background Decoration */}
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
                            <Cloud className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-lg">Storage Usage</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div>
                                <span className="text-3xl font-bold">{formatBytes(usage)}</span>
                                <span className="text-muted-foreground ml-2">used</span>
                            </div>
                            <span className="text-sm text-muted-foreground">of {formatBytes(limit)}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-4 w-full bg-secondary/30 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-1000 ease-out"
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                        <p className="text-sm text-right text-muted-foreground">{percent.toFixed(1)}% Used</p>
                    </div>
                </div>

                <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl group-hover:bg-orange-500/10 transition-colors" />

                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-orange-500/10 text-orange-500 rounded-lg">
                            <HardDrive className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-lg">Drive Details</h3>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between p-3 bg-muted/20 rounded-lg">
                            <span className="text-muted-foreground">Usage in Drive</span>
                            <span className="font-medium">{formatBytes(parseInt(stats?.storageQuota?.usageInDrive || "0"))}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-muted/20 rounded-lg">
                            <span className="text-muted-foreground">Usage in Trash</span>
                            <span className="font-medium">{formatBytes(parseInt(stats?.storageQuota?.usageInDriveTrash || "0"))}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
