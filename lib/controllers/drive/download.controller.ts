import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/api-utils";
import { getFileStream } from "@/lib/services/drive/private-drive.service";
import { Readable } from "node:stream";

const getHeaderValue = (headers: unknown, key: string): string | undefined => {
    if (!headers) return undefined;
    const normalized = key.toLowerCase();

    if (typeof headers === "object" && "get" in headers && typeof (headers as { get: unknown }).get === "function") {
        return (headers as { get: (name: string) => string | null }).get(key) ?? (headers as { get: (name: string) => string | null }).get(normalized);
    }

    const map = headers as Record<string, string>;
    return map[key] || map[normalized];
};

const safeFileName = (value: string) => value.replace(/["\r\n]/g, "_");

export async function GET(request: NextRequest) {
    let session;
    try {
        session = await getAuthenticatedSession();
    } catch (e) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");
    const fileName = searchParams.get("fileName") || "download";
    const isInline = searchParams.get("inline") === "true";

    if (!fileId) {
        return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    try {
        const response = await getFileStream(session.accessToken, fileId);
        const nodeStream = response.data as unknown as NodeJS.ReadableStream;
        const webStream = Readable.toWeb(nodeStream);
        const contentType = getHeaderValue(response.headers, "content-type") || "application/octet-stream";
        const safeName = safeFileName(fileName);
        const dispositionType = isInline ? "inline" : "attachment";

        return new NextResponse(webStream, {
            headers: {
                "Content-Disposition": `${dispositionType}; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
                "Content-Type": contentType,
                "Cache-Control": "no-store",
            },
        });
    } catch (error: unknown) {
        console.error("Download Error:", error);
        return NextResponse.json(
            { error: (error as Error).message || "Failed to download file" },
            { status: 500 }
        );
    }
}
