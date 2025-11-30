import { NextResponse } from "next/server";
import { fetchSoshCredentials } from "@/lib/soshCredentials";
import { runOrangeSoshCrawler } from "@/lib/orangeSoshCrawler";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const creds = await fetchSoshCredentials();
    if (!creds) {
      return NextResponse.json({ error: "No credentials stored" }, { status: 400 });
    }

    const result = await runOrangeSoshCrawler({
      login: creds.login,
      password: creds.password,
      contractId: creds.contractId,
      headless: true,
    });

    return NextResponse.json({
      saved: result.saved.length,
      invoicesFound: result.invoicesFound,
      files: result.saved.map((f) => f.file),
    });
  } catch (error: any) {
    const message = error?.message || "Crawl failed";
    console.error("crawl_error", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
