import { NextRequest, NextResponse } from "next/server";
import { uploadPublicFile } from "@/lib/services/drive/public-drive.service";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const metadataString = formData.get("metadata") as string;
        const requestedParentId = formData.get("parentId") as string;

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

        const res = await uploadPublicFile(file, metadata, requestedParentId);
        return NextResponse.json(res);
    } catch (error: any) {
        console.error("Public Upload Error:", error);
        if (error.code === 403 || error.errors?.[0]?.reason === "insufficientFilePermissions" || error.message?.includes("Insufficient permissions")) {
            return NextResponse.json(
                { error: "Upload failed: Server lacks permission to write to the public folder. Please ensure the Service Account has 'Editor' access." },
                { status: 403 }
            );
        }

        if (error.message?.includes("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL") || error.message?.includes("Public Drive access is not configured")) {
            return NextResponse.json(
                { error: "Public access not configured. Please contact administrator." },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { error: error.message || "Failed to upload file" },
            { status: 500 }
        );
    }
}
