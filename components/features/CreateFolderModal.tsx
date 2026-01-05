"use client";

import { useAppStore } from "@/lib/store/use-app-store";
import { X, FolderPlus, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function CreateFolderModal() {
    const { createFolderModalOpen, setCreateFolderModalOpen, folderId } = useAppStore();
    const [name, setName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const queryClient = useQueryClient();

    const handleCreate = async () => {
        if (!name.trim()) return;

        try {
            setIsCreating(true);
            const res = await fetch("/api/drive/folders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, parentId: folderId }),
            });

            if (!res.ok) throw new Error("Failed to create folder");

            // Success
            queryClient.invalidateQueries({ queryKey: ["drive-files"] });
            setCreateFolderModalOpen(false);
            setName("");
        } catch (error) {
            console.error("Create folder error", error);
            alert("Failed to create folder. Please try again.");
        } finally {
            setIsCreating(false);
        }
    };

    if (!createFolderModalOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div
                className="absolute inset-0"
                onClick={() => !isCreating && setCreateFolderModalOpen(false)}
            />

            <div className="relative w-full max-w-sm bg-background rounded-xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">New Folder</h2>
                    <button
                        onClick={() => setCreateFolderModalOpen(false)}
                        disabled={isCreating}
                        className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="flex flex-col items-center justify-center py-4 text-primary bg-primary/5 rounded-lg border border-primary/10 mb-2">
                        <FolderPlus className="w-12 h-12 mb-2" />
                        <span className="text-sm font-medium">Create in current location</span>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">Folder Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary outline-none"
                            placeholder="Untitled folder"
                            autoFocus
                            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                            disabled={isCreating}
                        />
                    </div>

                    <div className="flex justify-end pt-2 gap-2">
                        <button
                            onClick={() => setCreateFolderModalOpen(false)}
                            disabled={isCreating}
                            className="px-4 py-2 rounded-lg hover:bg-muted text-foreground transition-colors text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={!name.trim() || isCreating}
                            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Creating...
                                </>
                            ) : "Create"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
