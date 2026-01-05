"use client";

import { MoreHorizontal, Shield, Mail, User as UserIcon } from "lucide-react";
import { useState } from "react";

// Mock Data Type
export interface User {
    id: string;
    name: string;
    email: string;
    role: "Admin" | "Editor" | "Viewer";
    status: "Active" | "Pending";
    lastActive: string;
    avatar?: string;
}

interface UserTableProps {
    users: User[];
    onRoleChange: (userId: string, newRole: User["role"]) => void;
    onRemoveUser: (userId: string) => void;
}

export function UserTable({ users, onRoleChange, onRemoveUser }: UserTableProps) {
    return (
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-secondary/20 border-b border-border/50">
                        <tr>
                            <th className="px-6 py-4 font-medium">User</th>
                            <th className="px-6 py-4 font-medium">Role</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium">Last Active</th>
                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-muted/30 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {user.avatar ? (
                                            <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full border border-border" />
                                        ) : (
                                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <UserIcon className="w-4 h-4" />
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-medium text-foreground">{user.name}</div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Mail className="w-3 h-3" />
                                                {user.email}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                                        <select
                                            value={user.role}
                                            onChange={(e) => onRoleChange(user.id, e.target.value as User["role"])}
                                            className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer hover:bg-muted p-1 rounded"
                                        >
                                            <option value="Admin">Admin</option>
                                            <option value="Editor">Editor</option>
                                            <option value="Viewer">Viewer</option>
                                        </select>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === "Active"
                                            ? "bg-green-500/10 text-green-500"
                                            : "bg-orange-500/10 text-orange-500"
                                        }`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-muted-foreground">
                                    {user.lastActive}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <UserActions userId={user.id} onRemove={() => onRemoveUser(user.id)} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function UserActions({ userId, onRemove }: { userId: string, onRemove: () => void }) {
    // Simple dropdown simulation or just a button for MVP
    return (
        <button onClick={onRemove} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors" title="Remove User">
            <UserIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
    )
}
