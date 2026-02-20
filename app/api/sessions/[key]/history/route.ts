import { getSessionHistory } from "@/lib/gateway-adapter";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/sessions/[key]/history
 * Fetch message history for a session
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;

    if (!key) {
      return NextResponse.json(
        { error: "Session key is required" },
        { status: 400 }
      );
    }

    const limit = request.nextUrl.searchParams.get("limit");
    const history = await getSessionHistory(
      key,
      limit ? parseInt(limit, 10) : undefined
    );

    return NextResponse.json(history);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to fetch session history:", message);
    return NextResponse.json(
      { error: "Failed to fetch session history", details: message },
      { status: 500 }
    );
  }
}
