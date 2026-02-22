import { NextRequest, NextResponse } from "next/server";
import { getPublicFileStream } from "@/lib/services/drive/public-drive.service";
import { Readable } from "node:stream";

const getHeaderValue = (headers: any, key: string): string | undefined => {
    if (!headers) return undefined;
    const normalized = key.toLowerCase();

    if (typeof headers.get === "function") {
        return headers.get(key) || headers.get(normalized) || undefined;
    }

    return headers[key] || headers[normalized];
};

const safeFileName = (value: string) => value.replace(/["\r\n]/g, "_");

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");
    const fileName = searchParams.get("fileName");
    const isInline = searchParams.get("inline") === "true";

    if (!fileId) {
        return NextResponse.json({ error: "File ID required" }, { status: 400 });
    }

    try {
        const response = await getPublicFileStream(fileId);
        const nodeStream = response.data as any;
        const webStream = Readable.toWeb(nodeStream) as any;
        const contentType = getHeaderValue(response.headers, "content-type") || "application/octet-stream";
        const safeName = safeFileName(fileName || "download");
        const headers = new Headers();
        const dispositionType = isInline ? "inline" : "attachment";
        headers.set("Content-Disposition", `${dispositionType}; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(fileName || "download")}`);
        headers.set("Content-Type", contentType);
        headers.set("Cache-Control", "no-store");

        return new NextResponse(webStream, { status: 200, headers });
    } catch (error: any) {

        console.error("Public Download Error:", error);
        if (error.message?.includes("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL")) {
            return NextResponse.json(
                { error: "Public access not configured." },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { error: "Failed to download file" },
            { status: 500 }
        );
    }
}
