"use client";

import { SearchBar } from "@/components/features/SearchBar";
import { FilterBar } from "@/components/features/FilterBar";
import { useSession, signOut } from "next-auth/react";
import { useAppStore } from "@/lib/store/use-app-store";
import { Bell, Plus, FolderPlus } from "lucide-react";

export function Header() {
    const { data: session } = useSession();
    const { setUploadModalOpen, setCreateFolderModalOpen } = useAppStore();

    return (
        <header className="h-auto md:h-28 py-4 border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-40 px-6 flex flex-col justify-center gap-4 transition-all duration-300">
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1 max-w-xl">
                    <SearchBar />
                </div>

                <div className="flex items-center gap-4">
                    {/* Notification Button */}
                    <button className="p-2 text-muted-foreground hover:bg-secondary/10 rounded-full transition-colors relative">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
                    </button>

                    {/* New Folder Button */}
                    <button
                        onClick={() => setCreateFolderModalOpen(true)}
                        className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-full font-medium hover:bg-secondary/80 transition-all active:scale-95"
                    >
                        <FolderPlus className="w-4 h-4" />
                        <span className="hidden sm:inline">New Folder</span>
                    </button>

                    {/* New Upload Button */}
                    <button
                        onClick={() => setUploadModalOpen(true)}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Upload</span>
                    </button>

                    {session?.user?.image && (
                        <div className="relative group">
                            <img
                                src={session.user.image}
                                alt={session.user.name || "User"}
                                className="w-9 h-9 rounded-full border border-border cursor-pointer"
                            />
                            <div className="absolute right-0 top-full mt-2 w-48 bg-popover border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-1">
                                <div className="px-3 py-2 text-sm font-medium border-b border-border/50 mb-1">
                                    {session.user.name}
                                </div>
                                <button
                                    onClick={() => signOut()}
                                    className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                >
                                    Sign out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="w-full max-w-xl animate-in fade-in slide-in-from-top-2 duration-300">
                <FilterBar />
            </div>
        </header>
    );
}
