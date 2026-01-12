import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/api-utils";
import { createFolder } from "@/lib/google/drive";

export async function POST(request: NextRequest) {
    let session;
    try {
        session = await getAuthenticatedSession();
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, parentId } = body;

        if (!name) {
            return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
        }

        const folder = await createFolder(name, parentId);
        return NextResponse.json(folder);
    } catch (error: unknown) {
        console.error("Create Folder Error:", error);
        return NextResponse.json(
            { error: (error as Error).message || "Failed to create folder" },
            { status: 500 }
        );
    }
}
