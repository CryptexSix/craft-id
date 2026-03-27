import { NextRequest, NextResponse } from "next/server";

import { createInvoice } from "@/lib/interswitch";
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

  let providerResponse: any;
  try {
    providerResponse = await createInvoice({
      amountKobo: Math.trunc(amountKobo),
      customerName,
      customerEmail,
      description,
    });
  } catch (e: any) {
    return jsonError(e?.message ?? "Invoice provider error", 502);
  }

  const reference = (
    providerResponse?.reference ??
    providerResponse?.data?.reference ??
    providerResponse?.invoiceReference ??
    ""
  ).toString();

  if (!reference) {
    return jsonError("Provider response missing invoice reference", 502);
  }

  const dueAt = body?.dueAt ? new Date(body.dueAt).toISOString() : null;

  const { data, error } = await supabase
    .from("invoices")
    .upsert(
      {
        artisan_slug: artisanSlug,
        reference,
        amount_kobo: Math.trunc(amountKobo),
        customer_name: customerName,
        customer_email: customerEmail,
        description: description || null,
        address: body?.address ? String(body.address) : null,
        due_at: dueAt,
        status: "created",
        provider: "interswitch",
        provider_payload: providerResponse,
      },
      { onConflict: "reference" },
    )
    .select(
      "id, reference, amount_kobo, customer_name, customer_email, description, address, due_at, status, provider, created_at",
    )
    .single();

  if (error) return jsonError(error.message, 500);

  return NextResponse.json({ invoice: data, provider: providerResponse });
}
