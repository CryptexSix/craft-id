import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;
    const emailRaw =
      body && typeof body === "object" && !Array.isArray(body)
        ? (body as Record<string, unknown>).email
        : "";

    const email =
      typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("artisans")
      .select("slug, full_name, profile, created_at")
      .filter("profile->>email", "eq", email)
      .maybeSingle();

    if (error) {
      console.error("[CraftID] Login lookup failed:", error);
      return NextResponse.json({ error: "DB read failed" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "No account found for that email" },
        { status: 404 },
      );
    }

    const profile =
      data.profile &&
      typeof data.profile === "object" &&
      !Array.isArray(data.profile)
        ? (data.profile as Record<string, unknown>)
        : {};

    const normalizedProfile = {
      ...profile,
      email,
      slug:
        typeof profile.slug === "string" && profile.slug
          ? profile.slug
          : data.slug,
      fullName:
        typeof profile.fullName === "string" && profile.fullName
          ? profile.fullName
          : data.full_name || "",
      createdAt:
        typeof profile.createdAt === "string" && profile.createdAt
          ? profile.createdAt
          : data.created_at,
    };

    return NextResponse.json({ ok: true, profile: normalizedProfile });
  } catch (err) {
    console.error("[CraftID] Login API error:", err);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
