import { NextResponse } from "next/server";
import db from "@/lib/db";
import { readAuthFromCookie } from "@/lib/auth";
import { parseWorkspaceBrandsJson } from "@/lib/workspace-brands";

export async function GET() {
  const auth = await readAuthFromCookie();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const u = db
    .prepare("SELECT workspace_brands_json FROM users WHERE id = ?")
    .get(auth.userId) as { workspace_brands_json: string | null } | undefined;

  const brands = parseWorkspaceBrandsJson(u?.workspace_brands_json);
  return NextResponse.json({ brands });
}

export async function PATCH() {
  const auth = await readAuthFromCookie();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json(
    { error: "Workspace brands are disabled. This app only supports Bambu Lab." },
    { status: 403 },
  );
}
