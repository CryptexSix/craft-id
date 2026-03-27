import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const profile = (await req.json()) as unknown;
    if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
      return NextResponse.json({ error: "Invalid profile" }, { status: 400 });
    }

    const profileRecord = profile as Record<string, unknown>;
    const slug = profileRecord.slug;
    const fullName = profileRecord.fullName;
    const phone = profileRecord.phone;

    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    const normalizedSlug = slug.toLowerCase().trim();

    // Prevent one user from overwriting another user's payment link.
    // Rule: if a slug already exists and it has a stored phone, only that same phone can update it.
    // If no phone is stored yet (e.g. created via payment flow), allow onboarding to complete it.
    const { data: existing, error: existingErr } = await supabase
      .from("artisans")
      .select("slug, profile")
      .eq("slug", normalizedSlug)
      .maybeSingle();

    if (existingErr) {
      console.error("[CraftID] Supabase read artisan failed:", existingErr);
      return NextResponse.json({ error: "DB read failed" }, { status: 500 });
    }

    const existingPhone =
      existing &&
      typeof (existing as { profile?: unknown }).profile === "object" &&
      (existing as { profile?: Record<string, unknown> }).profile
        ? ((existing as { profile?: Record<string, unknown> }).profile
            ?.phone as unknown)
        : null;

    if (
      existing &&
      typeof existingPhone === "string" &&
      existingPhone.trim().length > 0
    ) {
      if (
        typeof phone !== "string" ||
        phone.trim().length === 0 ||
        phone.trim() !== existingPhone.trim()
      ) {
        return NextResponse.json(
          {
            error:
              "That payment link is already taken. Please try a different name.",
          },
          { status: 409 },
        );
      }
    }

    const { error } = await supabase.from("artisans").upsert(
      {
        slug: normalizedSlug,
        full_name: typeof fullName === "string" ? fullName : null,
        profile,
      },
      { onConflict: "slug" },
    );

    if (error) {
      console.error("[CraftID] Supabase upsert artisan failed:", error);
      return NextResponse.json(
        { error: error.message || "DB write failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[CraftID] Upsert user error:", err);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
