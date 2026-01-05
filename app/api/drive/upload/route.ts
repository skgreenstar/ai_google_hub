import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/api-utils";
import { getDriveClient } from "@/lib/google/drive";
import { Readable } from "stream";

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

        const metadata = metadataString ? JSON.parse(metadataString) : {};

        // Convert Web File to Node Stream
        const buffer = Buffer.from(await file.arrayBuffer());
        const stream = Readable.from(buffer);

        const drive = getDriveClient(session.accessToken);

        const fileMetadata: any = {
            name: file.name,
            ...metadata,
        };

        if (parentId && parentId !== "root") {
            fileMetadata.parents = [parentId];
        }

        const media = {
            mimeType: file.type,
            body: stream,
        };

        const res = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: "id, name, mimeType, size",
        });

        return NextResponse.json(res.data);
    } catch (error: unknown) {
        console.error("Upload Error:", error);
        return NextResponse.json(
            { error: (error as Error).message || "Failed to upload file" },
            { status: 500 }
        );
    }
}
