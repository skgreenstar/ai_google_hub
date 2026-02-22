"use client";

import { FileIcon, Video, MoreVertical, Download, ExternalLink, Folder } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { DriveFile } from "@/lib/google/drive";
import { useAppStore } from "@/lib/store/use-app-store";
import { useFileDownload } from "@/hooks/use-file-download";
import { useEffect, useState } from "react";

interface FileCardProps {
    file: DriveFile;
    isReadOnly?: boolean;
    onFolderOpen?: (fileId: string, fileName: string) => void;
}

export function FileCard({ file, isReadOnly = false, onFolderOpen }: FileCardProps) {
    const isImage = file.mimeType.startsWith("image/");
    const isVideo = file.mimeType.startsWith("video/");
    const isFolder = file.mimeType === "application/vnd.google-apps.folder";
    const [thumbIndex, setThumbIndex] = useState(0);
    const [showImage, setShowImage] = useState(false);

    const { setPreviewFile, setFolderId, setFolderName, selectedFileIds, toggleSelection } = useAppStore();
    const { downloadFile, isDownloading } = useFileDownload();

    const isSelected = selectedFileIds.includes(file.id);
    const unique = (items: (string | undefined)[]) =>
        [...new Set(items.filter(Boolean) as string[])];

    const imageFallbackDownloadUrl = isReadOnly
        ? `/api/drive/public/download?fileId=${encodeURIComponent(file.id)}&inline=true`
        : `/api/drive/download?fileId=${encodeURIComponent(file.id)}&inline=true`;

    const thumbCandidates = unique(
        isImage || isVideo
            ? [
                file.thumbnailLink,
                file.thumbnailLink?.replace(/=s\d+(-\w+)?(-c)?$/, "=s220"),
                file.thumbnailLink?.replace(/=s\d+(-\w+)?(-c)?$/, "=s300"),
                file.thumbnailLink?.replace(/=s\d+(-\w+)?(-c)?$/, "=s1280"),
                `https://drive.google.com/thumbnail?id=${encodeURIComponent(file.id)}&sz=w1280`,
                `https://drive.google.com/thumbnail?id=${encodeURIComponent(file.id)}&sz=w400`,
                imageFallbackDownloadUrl,
                file.iconLink,
            ]
            : [file.iconLink]
    );
    const thumbnailSrc = thumbCandidates[thumbIndex] || "";
    const hasMoreCandidates = thumbIndex < thumbCandidates.length;

    useEffect(() => {
        setThumbIndex(0);
        setShowImage(thumbCandidates.length > 0);
    }, [file.id]);

    const handleThumbError = () => {
        if (thumbIndex < thumbCandidates.length - 1) {
            setShowImage(true);
            setThumbIndex((prev) => prev + 1);
            return;
        }
        setThumbIndex(thumbCandidates.length); // force fallback icon
        setShowImage(false);
    };

    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isFolder || isDownloading) return;
        downloadFile(file);
    };

    const handleClick = (e: React.MouseEvent) => {
        // If selection mode is active or ctrl/cmd click, toggle selection
        if (!isReadOnly && (selectedFileIds.length > 0 || e.ctrlKey || e.metaKey)) {
            toggleSelection(file.id);
            return;
        }

        if (isFolder) {
            if (onFolderOpen) {
                onFolderOpen(file.id, file.name);
            } else {
                setFolderId(file.id);
                setFolderName(file.name);
            }
        } else {
            setPreviewFile(file);
        }
    };

    const handleSelect = (e: React.MouseEvent) => {
        if (isReadOnly) return;
        e.stopPropagation();
        toggleSelection(file.id);
    };

    return (
        <div
            className={`group relative break-inside-avoid mb-4 rounded-xl border overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer ${isSelected ? "bg-primary/5 ring-2 ring-primary border-primary" : "bg-card border-border/50"
                }`}
            onClick={handleClick}
        >
            {/* Visual content */}
            <div className="relative aspect-[4/3] bg-muted/30 overflow-hidden">
                {/* Selection Checkbox */}
                {!isReadOnly && (
                    <div
                        className={`absolute top-2 left-2 z-20 transition-opacity duration-200 ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            }`}
                    >
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => { }} // Handle click on wrapper
                            onClick={handleSelect}
                            className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                        />
                    </div>
                )}

                {isFolder ? (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/50">
                        <Folder className="w-16 h-16 text-blue-500" />
                    </div>
                ) : hasMoreCandidates ? (
                    <div className="relative w-full h-full">
                        {showImage && (
                            <img
                                src={thumbnailSrc}
                                alt={file.name}
                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                onError={handleThumbError}
                                loading="lazy"
                            />
                        )}
                        {!showImage && (
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/50">
                                <FileIcon className="w-16 h-16" />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/50">
                        <FileIcon className="w-16 h-16" />
                    </div>
                )}
                {isVideo && showImage && hasMoreCandidates && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="p-2 bg-black/40 rounded-full backdrop-blur-sm">
                            <Video className="w-8 h-8 text-white" />
                        </div>
                    </div>
                )}
                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                    <div className="flex gap-2 justify-end">
                        {!isFolder && (
                            <button
                                onClick={handleDownload}
                                disabled={isDownloading}
                                className="p-2 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 text-white transition-colors disabled:opacity-50"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                        )}
                        <button className="p-2 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 text-white transition-colors">
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="p-3">
                <h3 className="font-medium text-sm truncate pr-6" title={file.name}>
                    {file.name}
                </h3>
                <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
                    <span>{isFolder ? "Folder" : formatBytes(file.size || 0)}</span>
                    {file.modifiedTime && (
                        <span>{new Date(file.modifiedTime).toLocaleDateString()}</span>
                    )}
                </div>
            </div>

            {/* Context Menu Trigger */}
            {!isReadOnly && (
                <button className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity z-10 text-white drop-shadow-md">
                    <MoreVertical className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
