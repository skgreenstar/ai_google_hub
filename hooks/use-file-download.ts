import { useState } from "react";
import { DriveFile } from "@/lib/google/drive";

export function useFileDownload() {
    const [isDownloading, setIsDownloading] = useState(false);

    const downloadFile = async (file: DriveFile) => {
        try {
            setIsDownloading(true);
            const response = await fetch(
                `/api/drive/download?fileId=${file.id}&fileName=${encodeURIComponent(
                    file.name
                )}`
            );
            if (!response.ok) throw new Error("Download failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Download failed", error);
            alert("Failed to download file");
        } finally {
            setIsDownloading(false);
        }
    };

    return { downloadFile, isDownloading };
}
