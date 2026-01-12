import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/api-utils";
import { getDriveStats } from "@/lib/google/drive";

export async function GET(request: NextRequest) {
    let session;
    try {
        session = await getAuthenticatedSession();
    } catch (e) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const data = await getDriveStats();
        return NextResponse.json(data);
    } catch (error: unknown) {
        console.error("Drive Stats Error:", error);
        return NextResponse.json(
            { error: (error as Error).message || "Failed to fetch stats" },
            { status: 500 }
        );
    }
}
