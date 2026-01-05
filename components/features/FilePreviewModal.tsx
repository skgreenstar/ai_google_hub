"use client";

import { useAppStore } from "@/lib/store/use-app-store";
import { X, Download, ExternalLink, FileIcon, ImageIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { formatBytes } from "@/lib/utils";
import { useFileDownload } from "@/hooks/use-file-download";

export function FilePreviewModal() {
    const { previewFile, setPreviewFile } = useAppStore();
    const { downloadFile, isDownloading } = useFileDownload();
    const [imageError, setImageError] = useState(false);

    // Reset error state when file changes
    useEffect(() => {
        setImageError(false);
    }, [previewFile?.id]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setPreviewFile(null);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [setPreviewFile]);

    if (!previewFile) return null;

    const isImage = previewFile.mimeType.startsWith("image/");
    const isVideo = previewFile.mimeType.startsWith("video/");

    const handleDownload = () => {
        if (isDownloading) return;
        downloadFile(previewFile);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div
                className="absolute inset-0"
                onClick={() => setPreviewFile(null)}
            />

            <div className="relative w-full max-w-5xl max-h-[90vh] bg-background/95 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-50 duration-200">
                {/* Preview Area (Main) */}
                <div className="flex-1 bg-black/5 flex items-center justify-center p-4 relative min-h-[50vh]">
                    {isImage && previewFile.thumbnailLink && !imageError ? (
                        <div className="relative w-full h-full min-h-[300px]">
                            <Image
                                src={previewFile.thumbnailLink.replace("=s220", "=s1024")} // Reduced from 1600 to 1024 for better stability
                                alt={previewFile.name}
                                fill
                                className="object-contain"
                                unoptimized
                                onError={() => setImageError(true)}
                            />
                        </div>
                    ) : isVideo && previewFile.webViewLink ? (
                        <iframe
                            src={previewFile.webViewLink.replace("/view", "/preview")}
                            className="w-full h-full min-h-[400px] rounded-lg border border-border/20"
                            allowFullScreen
                            title={previewFile.name}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-muted-foreground p-12">
                            {isImage ? (
                                <>
                                    <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                                    <p>Image preview unavailable</p>
                                </>
                            ) : (
                                <>
                                    <FileIcon className="w-24 h-24 mb-4 opacity-50" />
                                    <p>Preview not available for this file type</p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar Info (Right) */}
                <div className="w-full md:w-80 border-l border-border/50 bg-card p-6 flex flex-col h-full overflow-y-auto">
                    <div className="flex items-start justify-between mb-6">
                        <h2 className="text-lg font-bold break-words pr-4">{previewFile.name}</h2>
                        <button
                            onClick={() => setPreviewFile(null)}
                            className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-6 flex-1">
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Type</h3>
                            <p className="text-sm">{previewFile.mimeType}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Size</h3>
                            <p className="text-sm">{formatBytes(previewFile.size || 0)}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Modified</h3>
                            <p className="text-sm">{previewFile.modifiedTime && new Date(previewFile.modifiedTime).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-border/50 space-y-3">
                        <button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                        </button>
                        <a
                            href={previewFile.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full flex items-center justify-center gap-2 bg-secondary/10 text-secondary-foreground px-4 py-2.5 rounded-lg hover:bg-secondary/20 transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span>Open in Drive</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
