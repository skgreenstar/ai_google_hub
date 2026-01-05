"use client";

import { useAppStore } from "@/lib/store/use-app-store";
import { X, Mail, Shield, Check } from "lucide-react";
import { useState, useEffect } from "react";

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInvite: (email: string, role: string) => void;
}

export function InviteModal({ isOpen, onClose, onInvite }: InviteModalProps) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("Viewer");
    const [isSending, setIsSending] = useState(false);

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsSending(true);
        // Simulate API delay
        setTimeout(() => {
            onInvite(email, role);
            setIsSending(false);
            setEmail("");
            onClose();
        }, 1000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative w-full max-w-md bg-background rounded-2xl shadow-xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold">Invite Team Member</h2>
                        <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="colleague@company.com"
                                    className="w-full pl-9 pr-4 py-2.5 bg-secondary/10 border border-transparent rounded-lg focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Role</label>
                            <div className="grid grid-cols-3 gap-2">
                                {["Viewer", "Editor", "Admin"].map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setRole(r)}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${role === r
                                                ? "bg-primary/10 border-primary text-primary"
                                                : "bg-background border-border hover:bg-secondary/20"
                                            }`}
                                    >
                                        <Shield className={`w-5 h-5 mb-1 ${role === r ? "opacity-100" : "opacity-50"}`} />
                                        <span className="text-xs font-medium">{r}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isSending}
                                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-lg flex items-center justify-center gap-2"
                            >
                                {isSending ? (
                                    "Sending Invite..."
                                ) : (
                                    <>
                                        <span>Send Invite</span>
                                        <Check className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
