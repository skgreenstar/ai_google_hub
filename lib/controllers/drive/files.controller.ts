import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/api-utils";
import {
    listFiles,
    listSharedDrives,
    type DriveFile,
} from "@/lib/services/drive/private-drive.service";

export async function GET(request: NextRequest) {
    let session;
    try {
        session = await getAuthenticatedSession();
    } catch {
        console.error("API Auth Error: Session check failed");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId") || "root";
    const pageToken = searchParams.get("pageToken") || undefined;
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "all";
    const orderByParam = searchParams.get("sort");
    const isRecent = orderByParam === "recent";
    const orderBy = isRecent ? "modifiedTime desc" : "folder,name";

    const queryParts: string[] = [];

    if (search) {
        queryParts.push(`name contains '${search.replace(/'/g, "\\'")}'`);
    }

    if (type !== "all") {
        switch (type) {
            case "image":
                queryParts.push("mimeType contains 'image/'");
                break;
            case "video":
                queryParts.push("mimeType contains 'video/'");
                break;
            case "folder":
                queryParts.push("mimeType = 'application/vnd.google-apps.folder'");
                break;
            case "audio":
                queryParts.push("mimeType contains 'audio/'");
                break;
            case "document":
                queryParts.push("(mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/pdf' or mimeType contains 'text/')");
                break;
            case "starred":
                queryParts.push("starred = true");
                break;
            case "trash":
                queryParts.push("trashed = true");
                break;
            case "shared":
                queryParts.push("sharedWithMe = true");
                break;
        }
    }

    const customQuery = queryParts.length > 0 ? queryParts.join(" and ") : undefined;

    try {
        if (type === "drives" && folderId === "root") {
            const data = await listSharedDrives(session.accessToken, 20, pageToken);
            const files: DriveFile[] = (data.drives || []).map((drive) => ({
                id: drive.id,
                name: drive.name,
                mimeType: "application/vnd.google-apps.folder",
                iconLink: (drive as any).backgroundImageLink,
                capabilities: { canDownload: false, canEdit: true, canShare: true },
            }));

            return NextResponse.json({ ...data, files });
        }

        const data = await listFiles(session.accessToken, folderId, 20, pageToken, customQuery, orderBy);
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Drive API Error Details:", error);

        if (error.code === 403) {
            return NextResponse.json(
                { error: "Insufficient permissions. Please sign out and sign back in to grant Google Drive access." },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { error: error.message || "Failed to fetch files" },
            { status: error.code || 500 }
        );
    }
}
