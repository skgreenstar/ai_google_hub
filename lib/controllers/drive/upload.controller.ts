import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/api-utils";
import { uploadDriveFile } from "@/lib/services/drive/private-drive.service";

export async function POST(request: NextRequest) {
    let session;
    try {
        session = await getAuthenticatedSession();
    } catch (e) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const metadataString = formData.get("metadata") as string;
        const parentId = formData.get("parentId") as string;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        let metadata: Record<string, unknown> = {};
        if (metadataString) {
            try {
                metadata = JSON.parse(metadataString);
            } catch {
                metadata = {};
            }
        }

        const res = await uploadDriveFile(session.accessToken, file, metadata, parentId);
        return NextResponse.json(res);
    } catch (error: unknown) {
        console.error("Upload Error:", error);
        return NextResponse.json(
            { error: (error as Error).message || "Failed to upload file" },
            { status: 500 }
        );
    }
}
