import { NextRequest, NextResponse } from "next/server";
import {
    getPublicFolder,
    listPublicFiles,
} from "@/lib/services/drive/public-drive.service";

const isBrowsingMode = (search: string, type: string) => !search && type === "all";

export async function GET(request: NextRequest) {
    try {
        const baseFolderId = getPublicFolder();

        const { searchParams } = new URL(request.url);
        let requestedFolderId = searchParams.get("folderId");
        if (!requestedFolderId || requestedFolderId === "root") {
            requestedFolderId = baseFolderId;
        }

        const pageToken = searchParams.get("pageToken") || undefined;
        const search = searchParams.get("search") || "";
        const type = searchParams.get("type") || "all";
        const orderByParam = searchParams.get("sort");
        let orderBy = "folder,name";
        if (orderByParam === "recent") orderBy = "modifiedTime desc";

        const queryParts: string[] = [];
        if (isBrowsingMode(search, type)) {
            queryParts.push(`'${requestedFolderId}' in parents`);
        }
        queryParts.push("trashed = false");

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
                case "audio":
                    queryParts.push("mimeType contains 'audio/'");
                    break;
                case "document":
                    queryParts.push("(mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/pdf' or mimeType contains 'text/')");
                    break;
                case "folder":
                    queryParts.push("mimeType = 'application/vnd.google-apps.folder'");
                    break;
            }
        }

        const query = queryParts.join(" and ");
        const res = await listPublicFiles(requestedFolderId, pageToken, query, orderBy);

        return NextResponse.json({
            ...res,
            orderBy,
        });
    } catch (error: any) {
        console.error("Public Drive API Error:", error);

        if (error?.message?.includes("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL")) {
            return NextResponse.json(
                { error: "Public access not configured. Please contact administrator." },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { error: error.message || "Failed to fetch files" },
            { status: error.code || 500 }
        );
    }
}
