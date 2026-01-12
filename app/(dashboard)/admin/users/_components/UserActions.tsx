"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Edit, Trash2, Key, Ban, CheckCircle, Loader2 } from "lucide-react";

interface User {
    id: string;
    name: string | null;
    email: string;
    role: string;
    status: string;
}

export default function UserActions({ user }: { user: User }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // Edit State
    const [editName, setEditName] = useState(user.name || "");
    const [editRole, setEditRole] = useState(user.role);

    // Password State
    const [newPassword, setNewPassword] = useState("");

    const handleAction = async (action: string, data: any = {}) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${user.id}`, {
                method: action === "DELETE" ? "DELETE" : "PATCH",
                headers: { "Content-Type": "application/json" },
                body: action === "DELETE" ? undefined : JSON.stringify(data)
            });

            if (!res.ok) throw new Error("Action failed");

            router.refresh();
            setShowMenu(false);
            setShowEditModal(false);
            setShowPasswordModal(false);
        } catch (error) {
            alert("Failed to perform action");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-secondary rounded-full transition-colors"
            >
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>

            {showMenu && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-background border rounded-lg shadow-xl z-20 overflow-hidden py-1 text-sm">
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="w-full text-left px-4 py-2 hover:bg-secondary flex items-center gap-2"
                        >
                            <Edit className="w-4 h-4" /> Edit Details
                        </button>
                        <button
                            onClick={() => setShowPasswordModal(true)}
                            className="w-full text-left px-4 py-2 hover:bg-secondary flex items-center gap-2"
                        >
                            <Key className="w-4 h-4" /> Reset Password
                        </button>
                        <button
                            onClick={() => handleAction("UPDATE", { status: user.status === "APPROVED" ? "REJECTED" : "APPROVED" })}
                            className="w-full text-left px-4 py-2 hover:bg-secondary flex items-center gap-2"
                        >
                            {user.status === "APPROVED" ? (
                                <><Ban className="w-4 h-4 text-orange-500" /> Deactivate</>
                            ) : (
                                <><CheckCircle className="w-4 h-4 text-green-500" /> Activate</>
                            )}
                        </button>
                        <hr className="my-1 border-muted" />
                        <button
                            onClick={() => {
                                if (confirm("Are you sure you want to delete this user? This cannot be undone.")) {
                                    handleAction("DELETE");
                                }
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" /> Delete User
                        </button>
                    </div>
                </>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-background rounded-lg p-6 w-full max-w-sm shadow-2xl border">
                        <h3 className="text-lg font-bold mb-4">Edit User</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Name</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full p-2 rounded border bg-transparent"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Role</label>
                                <select
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value)}
                                    className="w-full p-2 rounded border bg-transparent"
                                >
                                    <option value="USER">USER</option>
                                    <option value="ADMIN">ADMIN</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button onClick={() => setShowEditModal(false)} className="px-3 py-1.5 rounded hover:bg-secondary text-sm">Cancel</button>
                                <button
                                    onClick={() => handleAction("UPDATE", { name: editName, role: editRole })}
                                    disabled={isLoading}
                                    className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-sm flex items-center gap-2"
                                >
                                    {isLoading && <Loader2 className="w-3 h-3 animate-spin" />} Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Reset Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-background rounded-lg p-6 w-full max-w-sm shadow-2xl border">
                        <h3 className="text-lg font-bold mb-4">Reset Password</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">New Password</label>
                                <input
                                    type="text"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="w-full p-2 rounded border bg-transparent"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button onClick={() => setShowPasswordModal(false)} className="px-3 py-1.5 rounded hover:bg-secondary text-sm">Cancel</button>
                                <button
                                    onClick={() => {
                                        if (newPassword) handleAction("UPDATE", { password: newPassword });
                                    }}
                                    disabled={isLoading || !newPassword}
                                    className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-sm flex items-center gap-2"
                                >
                                    {isLoading && <Loader2 className="w-3 h-3 animate-spin" />} Update Password
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
