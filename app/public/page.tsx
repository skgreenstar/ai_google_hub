"use client";

import { FileCard } from "@/components/features/FileCard";
import { DriveFile } from "@/lib/google/drive";
import { useAppStore } from "@/lib/store/use-app-store";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FolderOpen, Upload, Search, FileImage, FileVideo, FileAudio, FileText, Folder, Loader2, RotateCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";

async function fetchPublicFiles(queryKey: any): Promise<{ nextPageToken?: string; files: DriveFile[] }> {
    const [_, { searchQuery, folderId, sort, filterType }] = queryKey.queryKey;

    const params = new URLSearchParams();
    // Default to root if not set, API handles mapping to public folder
    const effectiveFolderId = folderId || 'root';

    if (searchQuery) params.append("search", searchQuery);
    params.append("folderId", effectiveFolderId);
    if (sort) params.append("sort", sort);
    if (filterType && filterType !== 'all') params.append("type", filterType);

    const res = await fetch(`/api/drive/public/files?${params.toString()}`);
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch public files");
    }
    return res.json();
}

const ROOT_FOLDER_NAME = "Public Drive";

export default function PublicPage() {
    const {
        searchQuery,
        setSearchQuery,
        folderId,
        setFolderId,
        folderName,
        setFolderName,
        filterType,
        setFilterType,
        setUploadModalOpen,
        folderPath,
        pushFolder,
        popFolder,
        resetFolderPath,
    } = useAppStore();

    // Local state for search input to implement debounce
    const [localSearch, setLocalSearch] = useState("");
    const [debouncedSearch] = useDebounce(localSearch, 500);

    // Sync search query
    useEffect(() => {
        setSearchQuery(debouncedSearch);
    }, [debouncedSearch, setSearchQuery]);

    // Reset view on mount
    useEffect(() => {
        setFolderId('root');
        setFolderName(ROOT_FOLDER_NAME);
        setSearchQuery('');
        setFilterType('all');
        resetFolderPath();
    }, [setFolderId, setFolderName, setSearchQuery, setFilterType, resetFolderPath]);

    const { data, isLoading, error, refetch, isRefetching } = useQuery({
        queryKey: ["public-files", { searchQuery, folderId, filterType }],
        queryFn: fetchPublicFiles,
    });

    const handleRoot = () => {
        setFolderId('root');
        setFolderName(ROOT_FOLDER_NAME);
        setSearchQuery('');
        resetFolderPath();
    };

    const handleGoParent = () => {
        popFolder(ROOT_FOLDER_NAME, 'root');
        setSearchQuery('');
    };

    const handleFolderOpen = (nextFolderId: string, nextFolderName: string) => {
        pushFolder({ id: folderId, name: folderName });
        setSearchQuery('');
        setFolderId(nextFolderId);
        setFolderName(nextFolderName);
    };

    const currentPath = [
        ROOT_FOLDER_NAME,
        ...folderPath.map((item) => item.name),
        ...(folderId !== 'root' ? [folderName] : [])
    ].join(" / ");

    const filters = [
        { id: 'all', label: '전체', icon: FolderOpen },
        { id: 'image', label: '이미지', icon: FileImage },
        { id: 'video', label: '동영상', icon: FileVideo },
        { id: 'audio', label: '오디오', icon: FileAudio },
        { id: 'document', label: '문서', icon: FileText },
        { id: 'folder', label: '폴더', icon: Folder },
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <span className="text-primary">Open</span>Drive
                    </div>

                    <div className="flex-1 max-w-md hidden sm:block">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="파일 검색..."
                                className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-transparent text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={localSearch}
                                onChange={(e) => setLocalSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                            관리자
                        </Link>
                        <button
                            onClick={() => setUploadModalOpen(true)}
                            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                        >
                            <Upload className="w-4 h-4" />
                            <span className="hidden sm:inline">업로드</span>
                        </button>
                    </div>
                </div>

                {/* Mobile Search - Visible only on small screens */}
                <div className="sm:hidden px-4 pb-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="파일 검색..."
                            className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-transparent text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="container mx-auto px-4 pb-4 overflow-x-auto hide-scrollbar">
                    <div className="flex items-center gap-2">
                        {filters.map((filter) => {
                            const Icon = filter.icon;
                            const isActive = filterType === filter.id;
                            return (
                                <button
                                    key={filter.id}
                                    onClick={() => setFilterType(filter.id)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap
                                        ${isActive
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-secondary/50 text-secondary-foreground hover:bg-secondary"
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {filter.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Breadcrumb / current path */}
                <div className="mb-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <button
                            onClick={handleRoot}
                            className="hover:text-foreground transition-colors"
                        >
                            홈
                        </button>
                        <span>/</span>
                        <span>{folderId === 'root' ? ROOT_FOLDER_NAME : folderName}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">현재 경로: {currentPath}</p>
                </div>
                <div className="mb-6 flex items-center justify-between">
                    <div />
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

                {isLoading ? (
                    <div className="flex h-[50vh] items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-muted-foreground text-sm">파일을 불러오는 중...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex h-[50vh] items-center justify-center text-red-500">
                        <p>{error.message}</p>
                        {error.message.includes("configured") && (
                            <p className="text-sm mt-2 text-muted-foreground">공용 액세스 설정을 확인해주세요.</p>
                        )}
                    </div>
                ) : (!data?.files || data.files.length === 0) ? (
                    <div className="flex flex-col items-center justify-center h-[40vh] text-muted-foreground">
                        <FolderOpen className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg font-medium">파일이 없습니다.</p>
                        <p className="text-sm">첫 번째 파일을 업로드해보세요!</p>
                    </div>
                ) : (
                    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                        {data.files.map((file) => (
                            <div key={file.id} className="break-inside-avoid">
                                <FileCard
                                    file={file}
                                    isReadOnly={true} // Hide sensitive actions
                                    onFolderOpen={handleFolderOpen}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
