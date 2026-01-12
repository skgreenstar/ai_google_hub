import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserCheck, UserX, Users, Shield, User as UserIcon } from "lucide-react";
import AppovalButton from "./_components/ApprovalButton";
import UserActions from "./_components/UserActions";
import { User } from "@prisma/client";

export default async function AdminUsersPage() {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "ADMIN") {
        redirect("/");
    }

    const allUsers = await prisma.user.findMany({
        orderBy: { createdAt: "desc" }
    });

    const pendingUsers = allUsers.filter((u: User) => u.status === "PENDING");
    const activeUsers = allUsers.filter((u: User) => u.status !== "PENDING");

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground mt-1">Manage access, roles, and user accounts.</p>
                </div>
            </div>

            {/* Pending Approvals Section */}
            {pendingUsers.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-amber-500">
                        <UserX className="w-5 h-5" />
                        Pending Approval ({pendingUsers.length})
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {pendingUsers.map((user: User) => (
                            <div key={user.id} className="bg-card border p-4 rounded-xl shadow-sm flex flex-col justify-between gap-4">
                                <div>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-semibold text-lg">{user.name || "No Name"}</p>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                        </div>
                                        <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">Pending</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Registered: {new Date(user.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center justify-end gap-2 pt-2 border-t mt-2">
                                    <UserActions user={user} />
                                    <AppovalButton userId={user.id} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* All Users Table */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    All Users ({activeUsers.length})
                </h2>

                <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-secondary/50 border-b">
                            <tr>
                                <th className="px-6 py-3 font-medium text-muted-foreground">User</th>
                                <th className="px-6 py-3 font-medium text-muted-foreground">Role</th>
                                <th className="px-6 py-3 font-medium text-muted-foreground">Status</th>
                                <th className="px-6 py-3 font-medium text-muted-foreground">Joined</th>
                                <th className="px-6 py-3 font-medium text-muted-foreground text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {activeUsers.map((user: User) => (
                                <tr key={user.id} className="hover:bg-accent/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium">{user.name || "No Name"}</p>
                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.role === "ADMIN" ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                                <Shield className="w-3 h-3" /> Admin
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                <UserIcon className="w-3 h-3" /> User
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.status === "APPROVED" ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                <UserCheck className="w-3 h-3" /> Active
                                            </span>
                                        ) : user.status === "REJECTED" ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                <UserX className="w-3 h-3" /> Suspended
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                                Pending
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <UserActions user={user} />
                                    </td>
                                </tr>
                            ))}
                            {activeUsers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                        No active users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
