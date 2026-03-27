// app/api/verify-payment/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyPayment } from "@/lib/interswitch";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

// Helper to get user data from localStorage (server-side won't work)
// We'll handle storage on client-side instead

export async function POST(req: NextRequest) {
  try {
    const {
      txnRef,
      amount,
      username,
      clientName,
      artisanName,
      purpose,
      invoiceRef,
    } = await req.json();

    if (!txnRef || !amount) {
      return NextResponse.json(
        { error: "txnRef and amount required" },
        { status: 400 },
      );
    }

    const data = await verifyPayment(txnRef, amount);

    const success =
      data.ResponseCode === "00" && Number(data.Amount) === Number(amount);

    if (success && typeof username === "string" && username.trim().length > 0) {
      try {
        const supabase = getSupabaseAdminClient();
        const slug = username.toLowerCase();

        await supabase.from("artisans").upsert(
          {
            slug,
            full_name: typeof artisanName === "string" ? artisanName : null,
          },
          { onConflict: "slug" },
        );

        const { error: paymentError } = await supabase.from("payments").insert({
          artisan_slug: slug,
          txn_ref: String(txnRef),
          payment_reference: data.PaymentReference ?? null,
          amount_kobo: Number(amount),
          client_name: typeof clientName === "string" ? clientName : null,
          purpose: typeof purpose === "string" ? purpose : null,
          status: "completed",
          paid_at: new Date().toISOString(),
        });

        if (paymentError) {
          console.error(
            "[CraftID] Supabase insert payment failed:",
            paymentError,
          );
        }

        if (typeof invoiceRef === "string" && invoiceRef.trim().length > 0) {
          const ref = invoiceRef.trim();
          const { error: invErr } = await supabase
            .from("invoices")
            .update({ status: "paid" })
            .eq("reference", ref)
            .eq("artisan_slug", slug);

          if (invErr) {
            console.error("[CraftID] Supabase update invoice failed:", invErr);
          }
        }
      } catch (dbErr) {
        console.error("[CraftID] Supabase write failed:", dbErr);
      }
    }

    // Return transaction data so client can store it
    return NextResponse.json({
      success,
      responseCode: data.ResponseCode,
      description: data.ResponseDescription,
      reference: data.PaymentReference,
      transaction: success
        ? {
            id: txnRef,
            amount: amount / 100, // Convert back to naira
            clientName: clientName || "Client",
            artisanName: artisanName || "Artisan",
            timestamp: new Date().toISOString(),
            status: "completed",
            purpose: purpose || null,
          }
        : null,
    });
  } catch (err) {
    console.error("[CraftID] Payment verification error:", err);
    return NextResponse.json(
      { error: "Payment verification failed", success: false },
      { status: 500 },
    );
  }
}
