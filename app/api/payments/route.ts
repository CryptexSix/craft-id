import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const slug = (url.searchParams.get("slug") || "").toLowerCase();
    const limitRaw = url.searchParams.get("limit");
    const limit = Math.max(1, Math.min(Number(limitRaw || 50), 200));

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    const [
      { data: payments, error: paymentsError },
      { data: statsRows, error: statsError },
    ] = await Promise.all([
      supabase
        .from("payments")
        .select(
          "id, artisan_slug, txn_ref, payment_reference, amount_kobo, client_name, purpose, status, paid_at",
        )
        .eq("artisan_slug", slug)
        .order("paid_at", { ascending: false })
        .limit(limit),
      supabase.rpc("get_payment_stats", { p_slug: slug }),
    ]);

    if (paymentsError) {
      console.error("[CraftID] Fetch payments failed:", paymentsError);
      return NextResponse.json({ error: "DB read failed" }, { status: 500 });
    }

    if (statsError) {
      console.error("[CraftID] Fetch payment stats failed:", statsError);
      return NextResponse.json({ error: "DB read failed" }, { status: 500 });
    }

    const stats =
      Array.isArray(statsRows) && statsRows[0] ? statsRows[0] : null;
    const paymentCount = Number(stats?.payment_count || 0);
    const volumeKobo = Number(stats?.volume_kobo || 0);

    return NextResponse.json({
      payments: payments || [],
      stats: {
        count: paymentCount,
        volume: volumeKobo / 100,
        volumeKobo,
      },
    });
  } catch (err) {
    console.error("[CraftID] Payments API error:", err);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
