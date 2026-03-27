import { NextRequest, NextResponse } from "next/server";

import { getInvoice } from "@/lib/interswitch";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/invoices/[reference]">,
) {
  const { reference } = await ctx.params;
  const invoiceRef = (reference ?? "").trim();
  if (!invoiceRef) return jsonError("Missing reference");

  const { searchParams } = new URL(req.url);
  const refresh = searchParams.get("refresh") === "1";

  const supabase = getSupabaseAdminClient();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("reference", invoiceRef)
    .maybeSingle();

  if (error) return jsonError(error.message, 500);

  if (!invoice) {
    return jsonError("Invoice not found", 404);
  }

  if (!refresh) {
    return NextResponse.json({ invoice });
  }

  // Only Interswitch-backed invoices can be refreshed from a provider.
  if ((invoice as any)?.provider !== "interswitch") {
    return NextResponse.json({ invoice });
  }

  let provider: any;
  try {
    provider = await getInvoice(invoiceRef);
  } catch (e: any) {
    return jsonError(e?.message ?? "Invoice provider error", 502);
  }

  const providerStatus = (
    provider?.status ??
    provider?.data?.status ??
    provider?.invoiceStatus ??
    provider?.data?.invoiceStatus ??
    ""
  )?.toString();

  const { data: updated, error: updateErr } = await supabase
    .from("invoices")
    .update({
      status: providerStatus || invoice.status,
      provider_payload: provider,
    })
    .eq("reference", invoiceRef)
    .select("*")
    .single();

  if (updateErr) return jsonError(updateErr.message, 500);

  return NextResponse.json({ invoice: updated, provider });
}
