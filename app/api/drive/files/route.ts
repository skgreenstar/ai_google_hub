import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/api-utils";
import { listFiles } from "@/lib/google/drive";

export async function GET(request: NextRequest) {
    let session;
    try {
        session = await getAuthenticatedSession();
    } catch (error: any) {
        console.error("API Auth Error:", error.message);
        if (error.message === "Google Drive not connected") {
            return NextResponse.json({ error: "Google Drive not connected", code: "DRIVE_NOT_CONNECTED" }, { status: 403 });
        }
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("API: Authenticated User:", session?.user?.email);

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId") || "root";
    const pageToken = searchParams.get("pageToken") || undefined;
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "all";

    const orderByParam = searchParams.get("sort");
    let orderBy = "folder,name";

    if (orderByParam === "recent") {
        orderBy = "modifiedTime desc";
    }

    // Construct Drive API Query
    const queryParts: string[] = [];

    // Search by name
    if (search) {
        queryParts.push(`name contains '${search.replace(/'/g, "\\'")}'`);
    }

    // Filter by type
    if (type !== 'all') {
        switch (type) {
            case 'image':
                queryParts.push("mimeType contains 'image/'");
                break;
            case 'video':
                queryParts.push("mimeType contains 'video/'");
                break;
            case 'folder':
                queryParts.push("mimeType = 'application/vnd.google-apps.folder'");
                break;
            case 'audio':
                queryParts.push("mimeType contains 'audio/'");
                break;
            case 'document':
                queryParts.push("(mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/pdf' or mimeType contains 'text/')");
                break;
            case 'starred':
                queryParts.push("starred = true");
                break;
            case 'trash':
                queryParts.push("trashed = true");
                break;
        }
    }

    const customQuery = queryParts.length > 0 ? queryParts.join(" and ") : undefined;

    try {
        console.log(`API: Fetching files with FolderID: ${folderId}, Query: ${customQuery}, Order: ${orderBy}`);
        const data = await listFiles(folderId, 20, pageToken, customQuery, orderBy);
        console.log(`API: Fetched ${data.files?.length || 0} files`);
        return NextResponse.json(data);
    } catch (error: unknown) {
        console.error("Drive API Error Details:", error);
        return NextResponse.json(
            { error: (error as Error).message || "Failed to fetch files" },
            { status: 500 }
        );
    }
}
