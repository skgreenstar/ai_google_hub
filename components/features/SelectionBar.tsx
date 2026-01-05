"use client";

import { useAppStore } from "@/lib/store/use-app-store";
import { X, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function SelectionBar() {
    const { selectedFileIds, clearSelection } = useAppStore();
    const [isDeleting, setIsDeleting] = useState(false);
    const queryClient = useQueryClient();

    if (selectedFileIds.length === 0) return null;

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedFileIds.length} items?`)) return;

        try {
            setIsDeleting(true);
            const res = await fetch("/api/drive/trash", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileIds: selectedFileIds }),
            });

            if (!res.ok) throw new Error("Failed to delete files");

            // Success
            queryClient.invalidateQueries({ queryKey: ["drive-files"] });
            clearSelection();
        } catch (error) {
            console.error("Delete error", error);
            alert("Failed to delete files. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="bg-foreground text-background rounded-full shadow-2xl px-6 py-3 flex items-center gap-6 min-w-[300px]">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => clearSelection()}
                        className="p-1 rounded-full hover:bg-background/20 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <span className="font-medium text-sm">
                        {selectedFileIds.length} selected
                    </span>
                </div>

                <div className="h-6 w-px bg-background/20" />

                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-sm font-medium disabled:opacity-50"
                >
                    {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Trash2 className="w-4 h-4" />
                    )}
                    Delete
                </button>
            </div>
        </div>
    );
}
