import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/api-utils";
import { listSharedDrives } from "@/lib/google/drive";

export async function GET(request: NextRequest) {
    try {
        const session = await getAuthenticatedSession();
        const { searchParams } = new URL(request.url);
        const pageToken = searchParams.get("pageToken") || undefined;

        const data = await listSharedDrives(session.accessToken, 20, pageToken);
        console.log(`API: Listed Shared Drives: ${data.drives?.length || 0} drives found.`);
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Drive API Error Details:", error);
        if (error.code === 403) {
            return NextResponse.json(
                { error: "Insufficient permissions. Please sign out and sign back in to grant Google Drive access." },
                { status: 403 }
            );
        }
        return NextResponse.json(
            { error: error.message || "Failed to fetch drives" },
            { status: 500 }
        );
    }
}
