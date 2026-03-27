import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const slug = (url.searchParams.get("slug") || "").toLowerCase();

  if (!slug) return jsonError("Missing slug");

  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, reference, amount_kobo, customer_name, customer_email, description, address, due_at, status, provider, created_at",
    )
    .eq("artisan_slug", slug)
    .order("created_at", { ascending: false });

  if (error) return jsonError(error.message, 500);

  return NextResponse.json({ invoices: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const artisanSlug = (body?.slug ?? body?.artisanSlug ?? "")
    .toLowerCase()
    .trim();
  const amountKobo = Number(body?.amountKobo);
  const customerName = (body?.customerName ?? "").trim();
  const customerEmail = (body?.customerEmail ?? "").trim();
  const description = (body?.description ?? "").trim();

  if (!artisanSlug) return jsonError("Missing slug");
  if (!Number.isFinite(amountKobo) || amountKobo <= 0)
    return jsonError("Invalid amountKobo");
  if (!customerName) return jsonError("Missing customerName");
  if (!customerEmail) return jsonError("Missing customerEmail");

  const supabase = getSupabaseAdminClient();

  // Ensure artisan exists so FK doesn't fail.
  const { error: artisanErr } = await supabase
    .from("artisans")
    .upsert({ slug: artisanSlug }, { onConflict: "slug" });
  if (artisanErr) return jsonError(artisanErr.message, 500);

  function formatInvoiceRef(n: number) {
    return `INV-${String(n).padStart(8, "0")}`;
  }

  async function getNextInvoiceNumber() {
    // MVP approach: scan recent internal invoices and pick the next number.
    // This keeps the format INV-00000001 and is safe enough for low-volume usage.
    const { data, error } = await supabase
      .from("invoices")
      .select("reference, created_at")
      .like("reference", "INV-%")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw new Error(error.message);

    let max = 0;
    for (const row of data ?? []) {
      const ref = String((row as any)?.reference ?? "").trim();
      const m = /^INV-(\d+)$/.exec(ref);
      if (!m) continue;
      const num = Number(m[1]);
      if (Number.isFinite(num) && num > max) max = num;
    }
    return max + 1;
  }

  const dueAt = body?.dueAt ? new Date(body.dueAt).toISOString() : null;

  let lastErr: any;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const nextNum = (await getNextInvoiceNumber()) + attempt;
      const reference = formatInvoiceRef(nextNum);

      const { data, error } = await supabase
        .from("invoices")
        .insert({
          artisan_slug: artisanSlug,
          reference,
          amount_kobo: Math.trunc(amountKobo),
          customer_name: customerName,
          customer_email: customerEmail,
          description: description || null,
          address: body?.address ? String(body.address) : null,
          due_at: dueAt,
          status: "created",
          provider: "internal",
          provider_payload: {
            source: "craftid",
            createdVia: "api",
          },
        })
        .select(
          "id, reference, amount_kobo, customer_name, customer_email, description, address, due_at, status, provider, created_at",
        )
        .single();

      if (error) {
        // Retry on unique ref collisions
        if (/duplicate key|unique/i.test(error.message)) {
          lastErr = error;
          continue;
        }
        return jsonError(error.message, 500);
      }

      return NextResponse.json({ invoice: data });
    } catch (e: any) {
      lastErr = e;
    }
  }

  return jsonError(lastErr?.message ?? "Failed to create invoice", 500);
}
