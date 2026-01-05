"use client";

import { FileIcon, ImageIcon, Video, FileText, MoreVertical, Download, ExternalLink, Folder } from "lucide-react";
import Image from "next/image";
import { formatBytes } from "@/lib/utils";
import { DriveFile } from "@/lib/google/drive";
import { useAppStore } from "@/lib/store/use-app-store";
import { useFileDownload } from "@/hooks/use-file-download";

interface FileCardProps {
    file: DriveFile;
}

export function FileCard({ file }: FileCardProps) {
    const isImage = file.mimeType.startsWith("image/");
    const isVideo = file.mimeType.startsWith("video/");
    const isFolder = file.mimeType === "application/vnd.google-apps.folder";

    const { setPreviewFile, setFolderId, setFolderName, selectedFileIds, toggleSelection } = useAppStore();
    const { downloadFile, isDownloading } = useFileDownload();

    const isSelected = selectedFileIds.includes(file.id);

    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isFolder || isDownloading) return;
        downloadFile(file);
    };

    const handleClick = (e: React.MouseEvent) => {
        // If selection mode is active or ctrl/cmd click, toggle selection
        if (selectedFileIds.length > 0 || e.ctrlKey || e.metaKey) {
            toggleSelection(file.id);
            return;
        }

        if (isFolder) {
            setFolderId(file.id);
            setFolderName(file.name);
        } else {
            setPreviewFile(file);
        }
    };

    const handleSelect = (e: React.MouseEvent) => {
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

                {!isFolder && file.thumbnailLink ? (
                    <div className="relative w-full h-full">
                        <Image
                            src={file.thumbnailLink.replace("=s220", "=s800")} // Request larger thumbnail
                            alt={file.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            unoptimized // Google thumbnails often have short expiry or complex params
                        />
                        {isVideo && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <div className="p-2 bg-black/40 rounded-full backdrop-blur-sm">
                                    <Video className="w-8 h-8 text-white" />
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/50">
                        {isFolder ? <Folder className="w-16 h-16 text-blue-500" /> : // Use folder icon if available, generic for now
                            isVideo ? <Video className="w-16 h-16" /> :
                                <FileIcon className="w-16 h-16" />}
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
            <button className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity z-10 text-white drop-shadow-md">
                <MoreVertical className="w-4 h-4" />
            </button>
        </div>
    );
}
