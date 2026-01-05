import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/api-utils";
import { getFileStream } from "@/lib/google/drive";
import { Readable } from "stream";

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

    if (!fileId) {
        return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    try {
        const response = await getFileStream(session.accessToken, fileId);

        // Create a new stream from the drive stream
        const stream = new ReadableStream({
            start(controller) {
                const nodeStream = response.data as unknown as Readable;
                nodeStream.on("data", (chunk) => controller.enqueue(chunk));
                nodeStream.on("end", () => controller.close());
                nodeStream.on("error", (err) => controller.error(err));
            },
        });

        return new NextResponse(stream, {
            headers: {
                "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
                "Content-Type": response.headers["content-type"] || "application/octet-stream",
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
