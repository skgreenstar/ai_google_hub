import { useState } from "react";
import { DriveFile } from "@/lib/google/drive";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export function useFileDownload() {
    const [isDownloading, setIsDownloading] = useState(false);
    const pathname = usePathname();
    const { status } = useSession();
    const isPublic = pathname?.startsWith("/public") || status !== "authenticated";

    const downloadFile = async (file: DriveFile) => {
        try {
            setIsDownloading(true);
            const endpoint = isPublic ? "/api/drive/public/download" : "/api/drive/download";
            const url = `${endpoint}?fileId=${encodeURIComponent(file.id)}&fileName=${encodeURIComponent(
                file.name
            )}`;

            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = file.name;
            anchor.rel = "noopener noreferrer";
            anchor.style.display = "none";
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);

        } catch (error) {
            console.error("Download failed", error);
            alert("Failed to download file");
        } finally {
            setIsDownloading(false);
        }
    };

    return { downloadFile, isDownloading };
}
