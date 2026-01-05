"use client";

import { useAppStore } from "@/lib/store/use-app-store";
import { cn } from "@/lib/utils";
import { Filter, Image, FileText, Folder, Video, Layers, Music } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
export function FilterBar() {
    const { filterType } = useAppStore();
    const router = useRouter();
    const searchParams = useSearchParams();

    const filters = [
        { id: "all", label: "All", icon: Layers },
        { id: "image", label: "Images", icon: Image },
        { id: "video", label: "Videos", icon: Video },
        { id: "folder", label: "Folders", icon: Folder },
        { id: "audio", label: "Audio", icon: Music },
        { id: "document", label: "Documents", icon: FileText },
    ];

    const handleFilterClick = (filterId: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (filterId === 'all') {
            params.delete('filter');
        } else {
            params.set('filter', filterId);
        }
        // Reset query when filtering? Maybe not desired, but let's keep it simple
        // Also reset folderId to root is handled in DashboardPage useEffect
        router.push(`/?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <div className="flex items-center gap-2 px-1">
                <Filter className="w-4 h-4 text-muted-foreground mr-1" />
                <span className="text-sm font-medium text-muted-foreground hidden sm:inline">Filters:</span>
            </div>

            {filters.map((filter) => {
                const Icon = filter.icon;
                const isActive = filterType === filter.id;

                return (
                    <button
                        key={filter.id}
                        onClick={() => handleFilterClick(filter.id)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                            isActive
                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                : "bg-secondary/30 text-secondary-foreground hover:bg-secondary/50"
                        )}
                    >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{filter.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
