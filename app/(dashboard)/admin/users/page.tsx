"use client";

import { InviteModal } from "@/components/features/InviteModal";
import { User, UserTable } from "@/components/features/UserTable";
import { Plus, Users } from "lucide-react";
import { useState } from "react";

// Mock Initial Data
const INITIAL_USERS: User[] = [
    { id: "1", name: "Alex Chen", email: "alex@example.com", role: "Admin", status: "Active", lastActive: "Just now", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d" },
    { id: "2", name: "Sarah Miller", email: "sarah@example.com", role: "Editor", status: "Active", lastActive: "2 hours ago", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d" },
    { id: "3", name: "Mike Ross", email: "mike@example.com", role: "Viewer", status: "Pending", lastActive: "-", avatar: undefined },
];

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>(INITIAL_USERS);
    const [isInviteOpen, setIsInviteOpen] = useState(false);

    const handleRoleChange = (userId: string, newRole: User["role"]) => {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    };

    const handleInvite = (email: string, role: string) => {
        const newUser: User = {
            id: Date.now().toString(),
            name: email.split("@")[0], // Simple mock name
            email,
            role: role as User["role"],
            status: "Pending",
            lastActive: "-",
        };
        setUsers([...users, newUser]);
    };

    const handleRemove = (userId: string) => {
        if (confirm("Are you sure you want to remove this user?")) {
            setUsers(users.filter(u => u.id !== userId));
        }
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
                    <p className="text-muted-foreground mt-1">Manage access and roles for your workspace.</p>
                </div>
                <button
                    onClick={() => setIsInviteOpen(true)}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg transition-all active:scale-95 w-full md:w-auto justify-center"
                >
                    <Plus className="w-5 h-5" />
                    <span>Invite Member</span>
                </button>
            </div>

            {/* Stats Overview (Optional) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border/50 p-4 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{users.length}</div>
                        <div className="text-xs text-muted-foreground">Total Members</div>
                    </div>
                </div>
                <div className="bg-card border border-border/50 p-4 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-green-500/10 text-green-500 rounded-lg">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{users.filter(u => u.status === "Active").length}</div>
                        <div className="text-xs text-muted-foreground">Active Now</div>
                    </div>
                </div>
            </div>

            <UserTable
                users={users}
                onRoleChange={handleRoleChange}
                onRemoveUser={handleRemove}
            />

            <InviteModal
                isOpen={isInviteOpen}
                onClose={() => setIsInviteOpen(false)}
                onInvite={handleInvite}
            />
        </div>
    );
}
