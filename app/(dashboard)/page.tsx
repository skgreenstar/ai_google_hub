"use client";

import { FileCard } from "@/components/features/FileCard";
import { DriveFile } from "@/lib/google/drive";
import { useAppStore } from "@/lib/store/use-app-store";
import { useQuery } from "@tanstack/react-query";
import { Loader2, FolderOpen } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

async function fetchFiles(queryKey: any): Promise<{ nextPageToken?: string; files: DriveFile[] }> {
    const [_, { searchQuery, filterType, folderId, sort }] = queryKey.queryKey;

    const params = new URLSearchParams();
    if (searchQuery) params.append("search", searchQuery);
    if (filterType && filterType !== "all") params.append("type", filterType);
    if (folderId) params.append("folderId", folderId);
    if (sort) params.append("sort", sort);

    const res = await fetch(`/api/drive/files?${params.toString()}`);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (errorData.code === "DRIVE_NOT_CONNECTED") {
            throw new Error("DRIVE_NOT_CONNECTED");
        }
        throw new Error(errorData.error || "Failed to fetch files");
    }
    return res.json();
}

import { SelectionBar } from "@/components/features/SelectionBar";

export default function DashboardPage() {
    const { searchQuery, filterType, setFilterType, folderId, setFolderId, folderName, setFolderName } = useAppStore();
    const searchParams = useSearchParams();
    const urlFilter = searchParams.get("filter");
    const urlSort = searchParams.get("sort");


    // Sync URL params to store
    useEffect(() => {
        if (urlFilter) {
            setFilterType(urlFilter);
            setFolderId("root");
            setFolderName("My Drive");
        } else if (!urlFilter && filterType !== 'all' && !searchParams.has("filter")) {
            setFilterType('all');
        }
    }, [urlFilter, setFilterType, filterType, searchParams, setFolderId]);

    const { data, isLoading, error } = useQuery({
        queryKey: ["drive-files", { searchQuery, filterType, folderId, sort: urlSort }],
        queryFn: fetchFiles,
    });

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground text-sm">Loading files...</p>
                </div>
            </div>
        );
    }

    if (error) {
        if (error.message === "DRIVE_NOT_CONNECTED") {
            return (
                <div className="flex flex-col h-[50vh] items-center justify-center gap-4 text-center">
                    <p className="text-lg font-medium">Google Drive Not Connected</p>
                    <p className="text-muted-foreground">Please connect your Google Drive in Settings to view your files.</p>
                    <a
                        href="/settings"
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                        Go to Settings
                    </a>
                </div>
            );
        }
        return (
            <div className="flex h-[50vh] items-center justify-center text-red-500">
                Error loading files. Please try again. reason: {error.message}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold tracking-tight">
                        {searchQuery ? `Search results for "${searchQuery}"` :
                            filterType !== 'all' ? `${filterType.charAt(0).toUpperCase() + filterType.slice(1)}s` :
                                folderName || "My Drive"}
                    </h1>
                    {searchQuery && (
                        <button
                            onClick={() => useAppStore.getState().setSearchQuery("")}
                            className="text-sm px-3 py-1 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                        >
                            Clear Search
                        </button>
                    )}
                </div>
            </div>

            {(!data?.files || data.files.length === 0) ? (
                <div className="flex flex-col items-center justify-center h-[40vh] text-muted-foreground">
                    <FolderOpen className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">No files found</p>
                    <p className="text-sm">Try adjusting your filters or upload a new file.</p>
                </div>
            ) : (
                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                    {data.files.map((file) => (
                        <div key={file.id} className="break-inside-avoid">
                            <FileCard file={file} />
                        </div>
                    ))}
                </div>
            )}
            <SelectionBar />
        </div>
    );
}
