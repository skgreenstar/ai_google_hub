"use client";

import { useAppStore } from "@/lib/store/use-app-store";
import { Download, ExternalLink, FileIcon, FileText, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { formatBytes } from "@/lib/utils";
import { useFileDownload } from "@/hooks/use-file-download";
import { useSession } from "next-auth/react";

type PreviewKind = "image" | "video" | "iframe" | "fallback";

export function FilePreviewModal() {
    const { previewFile, setPreviewFile } = useAppStore();
    const { downloadFile, isDownloading } = useFileDownload();
    const [previewError, setPreviewError] = useState(false);
    const [isPreparingPreview, setIsPreparingPreview] = useState(false);
    const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
    const pathname = usePathname();
    const { status } = useSession();
    const isPublic = pathname?.startsWith("/public") || status !== "authenticated";

    const isImage = previewFile?.mimeType?.startsWith("image/") ?? false;
    const isVideo = previewFile?.mimeType?.startsWith("video/") ?? false;
    const isDocument =
        previewFile?.mimeType?.includes("application/pdf") ||
        previewFile?.mimeType?.includes("application/vnd.google-apps.document") ||
        previewFile?.mimeType?.includes("text/") ||
        false;

    const apiDownloadUrl = isPublic
        ? `/api/drive/public/download?fileId=${encodeURIComponent(previewFile?.id || "")}&inline=true`
        : `/api/drive/download?fileId=${encodeURIComponent(previewFile?.id || "")}&inline=true`;

    const externalPreviewUrl = isPublic
        ? apiDownloadUrl
        : previewFile?.webViewLink
            ? previewFile.webViewLink.replace("/view", "/preview")
            : apiDownloadUrl;

    useEffect(() => {
        setPreviewError(false);
        setIsPreparingPreview(false);
        setPreviewBlobUrl(null);
    }, [previewFile?.id]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setPreviewFile(null);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [setPreviewFile]);

    useEffect(() => {
        if (!previewFile) return;
        if (!isImage && !isVideo) {
            setIsPreparingPreview(false);
            setPreviewBlobUrl(null);
            return;
        }

        const MAX_PREVIEW_RETRY_COUNT = 3;
        const controller = new AbortController();
        const asyncLoad = async () => {
            setIsPreparingPreview(true);
            setPreviewError(false);
            try {
                for (let attempt = 1; attempt <= MAX_PREVIEW_RETRY_COUNT; attempt += 1) {
                    try {
                        const res = await fetch(apiDownloadUrl, {
                            method: "GET",
                            signal: controller.signal,
                            credentials: "include",
                        });

                        if (!res.ok) {
                            throw new Error(`Failed to load preview: ${res.status}`);
                        }

                        const blob = await res.blob();
                        if (controller.signal.aborted) return;

                        const nextUrl = URL.createObjectURL(blob);
                        setPreviewBlobUrl((prevUrl) => {
                            if (prevUrl) URL.revokeObjectURL(prevUrl);
                            return nextUrl;
                        });
                        return;
                    } catch (err) {
                        if (controller.signal.aborted) return;

                        if (attempt >= MAX_PREVIEW_RETRY_COUNT) {
                            throw err;
                        }
                        await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
                    }
                }
            } catch {
                if (!controller.signal.aborted) {
                    setPreviewError(true);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsPreparingPreview(false);
                }
            }
        };

        asyncLoad();

        return () => {
            controller.abort();
            setPreviewBlobUrl((prevUrl) => {
                if (prevUrl) URL.revokeObjectURL(prevUrl);
                return null;
            });
            setIsPreparingPreview(false);
        };
    }, [apiDownloadUrl, isImage, isVideo, previewFile?.id]);

    if (!previewFile) return null;

    const previewKind: PreviewKind = previewError
        ? "fallback"
        : isImage
            ? "image"
            : isVideo
                ? "video"
                : isDocument
                    ? "iframe"
                    : "fallback";

    const handleDownload = () => {
        if (isDownloading) return;
        downloadFile(previewFile);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={() => setPreviewFile(null)} />

            <div className="relative w-full max-w-5xl max-h-[90vh] bg-background/95 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-50 duration-200">
                <div className="flex-1 bg-black/5 flex items-center justify-center p-4 relative min-h-[50vh]">
                    {previewKind === "iframe" ? (
                        <iframe
                            src={externalPreviewUrl}
                            className="w-full h-full min-h-[60vh] rounded-lg border border-border/20"
                            title={previewFile.name}
                            onError={() => setPreviewError(true)}
                            allowFullScreen
                        />
                    ) : previewKind === "fallback" ? (
                        <div className="flex flex-col items-center justify-center text-muted-foreground p-12">
                            <FileIcon className="w-24 h-24 mb-4 opacity-50" />
                            <p>미리보기가 불가능한 파일 형식입니다.</p>
                            <p className="text-sm mt-1">다운로드 또는 외부 뷰어로 열어주세요.</p>
                        </div>
                    ) : isPreparingPreview ? (
                        <div className="flex flex-col items-center justify-center text-muted-foreground p-12">
                            <Loader2 className="w-8 h-8 animate-spin mb-3" />
                            <p>미리보기를 불러오는 중입니다...</p>
                        </div>
                    ) : !previewBlobUrl ? (
                        <div className="flex flex-col items-center justify-center text-muted-foreground p-12">
                            <FileText className="w-16 h-16 mb-4 opacity-50" />
                            <p>미리보기가 불가능한 파일 형식입니다.</p>
                            <p className="text-sm mt-1">다운로드 후 확인해 주세요.</p>
                        </div>
                    ) : previewKind === "image" ? (
                        <img
                            src={previewBlobUrl}
                            alt={previewFile.name}
                            className="max-h-[70vh] max-w-full object-contain"
                            onError={() => setPreviewError(true)}
                        />
                    ) : (
                        <video
                            src={previewBlobUrl}
                            controls
                            className="w-full h-full max-h-[70vh] bg-black rounded-lg"
                            onError={() => setPreviewError(true)}
                        />
                    )}
                </div>

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
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">유형</h3>
                            <p className="text-sm">{previewFile.mimeType}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">크기</h3>
                            <p className="text-sm">{formatBytes(previewFile.size || 0)}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">수정일</h3>
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
                            href={externalPreviewUrl}
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
