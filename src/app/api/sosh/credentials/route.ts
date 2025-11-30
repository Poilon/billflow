import { NextResponse } from "next/server";
import { fetchSoshCredentials, upsertSoshCredentials } from "@/lib/soshCredentials";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const creds = await fetchSoshCredentials();
    if (!creds) return NextResponse.json({ credentials: null });
    return NextResponse.json({
      credentials: {
        login: creds.login,
        contractId: creds.contractId,
      },
    });
  } catch (error) {
    console.error("credentials_get_error", error);
    return NextResponse.json({ error: "Unable to load credentials" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { login, password, contractId } = body || {};
    if (!login || !password || !contractId) {
      return NextResponse.json(
        { error: "login, password and contractId are required" },
        { status: 400 }
      );
    }
    await upsertSoshCredentials({ login, password, contractId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("credentials_post_error", error);
    return NextResponse.json({ error: "Unable to save credentials" }, { status: 500 });
  }
}
