"use client";

import { SelectionBar } from "@/components/features/SelectionBar";
import { FileCard } from "@/components/features/FileCard";
import { DriveFile } from "@/lib/google/drive";
import { useAppStore } from "@/lib/store/use-app-store";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FolderOpen, Loader2, RotateCw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

async function fetchFiles(queryKey: any): Promise<{ nextPageToken?: string; files: DriveFile[] }> {
    const [_, { searchQuery, filterType, folderId, sort }, isPublicMode] = queryKey.queryKey;

    if (!isPublicMode && filterType === "drives" && folderId === "root") {
        const res = await fetch(`/api/drive/drives?pageToken=${queryKey.pageToken || ''}`);
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Failed to fetch drives");
        }
        const data = await res.json();
        // Map drives to files for compatible rendering
        const files: DriveFile[] = (data.drives || []).map((drive: any) => ({
            id: drive.id,
            name: drive.name,
            mimeType: "application/vnd.google-apps.folder", // Treat as folder
            iconLink: drive.backgroundImageLink, // Use background as icon if available
            capabilities: { canDownload: false, canEdit: true, canShare: true }
        }));
        return { nextPageToken: data.nextPageToken, files };
    }

    const normalizedFilterType = ["all", "image", "video", "audio", "document", "folder"].includes(filterType || "all")
        ? filterType || "all"
        : "all";

    const params = new URLSearchParams();
    if (searchQuery) params.append("search", searchQuery);

    if (normalizedFilterType !== "all") params.append("type", normalizedFilterType);

    if (folderId) params.append("folderId", folderId);
    if (sort) params.append("sort", sort);

    const endpoint = isPublicMode
        ? `/api/drive/public/files?${params.toString()}`
        : `/api/drive/files?${params.toString()}`;

    const res = await fetch(endpoint);
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch files");
    }

    return res.json();
}

export default function DashboardPage() {
    const {
        searchQuery,
        setSearchQuery,
        filterType,
        setFilterType,
        folderId,
        folderName,
        setFolderId,
        setFolderName,
        folderPath,
        pushFolder,
        popFolder,
        resetFolderPath,
    } = useAppStore();
    const { status } = useSession();
    const searchParams = useSearchParams();
    const urlFilter = searchParams.get("filter");
    const urlSort = searchParams.get("sort");

    const isPublicMode = status !== "authenticated";
    const publicModeHeading = !filterType || !["all", "image", "video", "audio", "document", "folder", "drives", "shared", "starred", "trash"].includes(filterType)
        ? "Public Drive"
        : filterType === "drives"
            ? "Shared Drives"
            : filterType === "shared"
                ? "Shared with me"
                : filterType === "starred"
                    ? "Starred"
                    : filterType === "trash"
                        ? "Trash"
                        : filterType === "folder"
                            ? "Folders"
                            : filterType !== "all"
                                ? `${filterType.charAt(0).toUpperCase() + filterType.slice(1)}s`
                                : "My Drive";

    const rootFolderName = isPublicMode
        ? "Public Drive"
        : filterType === "drives"
            ? "Shared Drives"
            : filterType === "shared"
                ? "Shared with me"
                : "My Drive";

    // Sync URL params to store
    useEffect(() => {
        if (isPublicMode && filterType && ["drives", "shared", "starred", "trash"].includes(filterType)) {
            setFilterType("all");
            setFolderId("root");
            setFolderName("Public Drive");
            resetFolderPath();
            return;
        }

        if (urlFilter) {
            setFilterType(urlFilter);
            setFolderId("root");
            setFolderName(urlFilter === 'drives' ? "Shared Drives" : urlFilter === 'shared' ? "Shared with me" : "My Drive");
            resetFolderPath();
        } else if (!urlFilter && filterType !== 'all' && !searchParams.has("filter")) {
            setFilterType('all');
            setFolderId("root");
            setFolderName("My Drive");
            resetFolderPath();
        }
    }, [isPublicMode, urlFilter, setFilterType, filterType, searchParams, setFolderId, setFolderName, resetFolderPath]);

    const handleGoRoot = () => {
        setSearchQuery("");
        setFolderId("root");
        setFolderName(rootFolderName);
        resetFolderPath();
    };

    const handleFolderOpen = (nextFolderId: string, nextFolderName: string) => {
        setSearchQuery("");
        pushFolder({ id: folderId, name: folderName });
        setFolderId(nextFolderId);
        setFolderName(nextFolderName);
    };

    const handleGoParent = () => {
        popFolder(rootFolderName, "root");
        setSearchQuery("");
    };

    const currentPath = [
        rootFolderName,
        ...folderPath.map((item) => item.name),
        ...(folderId !== "root" ? [folderName] : []),
    ].join(" / ");

    if (status === "loading") {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    const { data, isLoading, error, refetch, isRefetching } = useQuery({
        queryKey: ["drive-files", { searchQuery, filterType, folderId, sort: urlSort }, isPublicMode],
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
        return (
            <div className="flex h-[50vh] items-center justify-center text-red-500">
                {error.message}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {searchQuery ? `Search: "${searchQuery}"` :
                            isPublicMode
                                ? publicModeHeading
                                : filterType === "drives"
                                    ? "Shared Drives"
                                    : filterType === "shared"
                                        ? "Shared with me"
                                        : filterType !== "all"
                                            ? `${filterType.charAt(0).toUpperCase() + filterType.slice(1)}s`
                                            : "My Drive"}
                    </h1>
                    <p className="mt-1 text-xs text-muted-foreground">현재 경로: {currentPath}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => void refetch()}
                        disabled={isRefetching}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 disabled:opacity-40"
                    >
                        <RotateCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
                        새로고침
                    </button>
                    {folderId !== "root" && (
                        <button
                            type="button"
                            onClick={handleGoParent}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            상위 폴더
                        </button>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <button
                    onClick={handleGoRoot}
                    className="hover:text-foreground transition-colors"
                >
                    홈
                </button>
                <span>/</span>
                <span>{folderId === "root" ? rootFolderName : folderName}</span>
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
                            <FileCard
                                file={file}
                                isReadOnly={isPublicMode}
                                onFolderOpen={handleFolderOpen}
                            />
                        </div>
                    ))}
                </div>
            )}
            <SelectionBar />
        </div>
    );
}
