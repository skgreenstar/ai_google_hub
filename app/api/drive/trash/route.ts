import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/api-utils";
import { moveToTrash } from "@/lib/google/drive";

export async function POST(request: NextRequest) {
    let session;
    try {
        session = await getAuthenticatedSession();
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { fileIds } = body;

        if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
            return NextResponse.json({ error: "No files provided" }, { status: 400 });
        }

        // Process in parallel
        await Promise.all(fileIds.map((id) => moveToTrash(session.accessToken, id)));

        return NextResponse.json({ success: true, count: fileIds.length });
    } catch (error: unknown) {
        console.error("Trash Error:", error);
        return NextResponse.json(
            { error: (error as Error).message || "Failed to trash files" },
            { status: 500 }
        );
    }
}
