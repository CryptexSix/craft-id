// app/api/verify-bvn/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyBVN } from "@/lib/interswitch";

export async function POST(req: NextRequest) {
  try {
    const { bvn } = await req.json();
    
    console.log("[CraftID] Received BVN:", bvn);
    
    if (!bvn || bvn.length !== 11) {
      return NextResponse.json(
        { error: "BVN must be 11 digits", verified: false },
        { status: 400 }
      );
    }

    const data = await verifyBVN(bvn);
    console.log("[CraftID] BVN API response:", JSON.stringify(data, null, 2));
    
    // The response from your curl shows data is nested under "data" property
    const record = data?.data || data;

    return NextResponse.json({
      verified: record?.allValidationPassed === true,
      firstName: record?.firstName || null,
      lastName: record?.lastName || null,
      dateOfBirth: record?.dateOfBirth || null,
      gender: record?.gender || null,
      mobile: record?.mobile || null,
    });
  } catch (err) {
    console.error("[CraftID] BVN verification error:", err);
    return NextResponse.json(
      { error: "BVN verification failed", verified: false },
      { status: 500 }
    );
  }
}