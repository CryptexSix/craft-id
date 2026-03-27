// app/api/verify-payment/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyPayment } from "@/lib/interswitch";

// Helper to get user data from localStorage (server-side won't work)
// We'll handle storage on client-side instead

export async function POST(req: NextRequest) {
  try {
    const { txnRef, amount, username, clientName, artisanName } = await req.json();
    
    if (!txnRef || !amount) {
      return NextResponse.json(
        { error: "txnRef and amount required" },
        { status: 400 }
      );
    }

    const data = await verifyPayment(txnRef, amount);
    
    const success = data.ResponseCode === "00" && Number(data.Amount) === Number(amount);

    // Return transaction data so client can store it
    return NextResponse.json({
      success,
      responseCode: data.ResponseCode,
      description: data.ResponseDescription,
      reference: data.PaymentReference,
      transaction: success ? {
        id: txnRef,
        amount: amount / 100, // Convert back to naira
        clientName: clientName || "Client",
        artisanName: artisanName || "Artisan",
        timestamp: new Date().toISOString(),
        status: "completed"
      } : null
    });
  } catch (err) {
    console.error("[CraftID] Payment verification error:", err);
    return NextResponse.json(
      { error: "Payment verification failed", success: false },
      { status: 500 }
    );
  }
}