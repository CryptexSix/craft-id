import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/users/[slug]">,
) {
  try {
    const { slug } = await ctx.params;
    const normalizedSlug = (slug || "").toLowerCase();

    if (!normalizedSlug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("artisans")
      .select("slug, full_name, profile, created_at, updated_at")
      .eq("slug", normalizedSlug)
      .maybeSingle();

    if (error) {
      console.error("[CraftID] Fetch artisan failed:", error);
      return NextResponse.json({ error: "DB read failed" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ artisan: data });
  } catch (err) {
    console.error("[CraftID] Fetch artisan error:", err);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
