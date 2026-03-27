// app/api/craft-score/route.ts
import { NextRequest, NextResponse } from "next/server";

function computeCraftScore(
  bvnVerified: boolean,
  transactionCount: number,
  totalVolume: number,
  accountAgeDays: number
): number {
  let score = 300; // Base score
  
  // Identity verification (+150 if BVN verified)
  if (bvnVerified) score += 150;
  
  // Transaction frequency (up to +200)
  // Each transaction = +5 points, max 200
  score += Math.min(transactionCount * 5, 200);
  
  // Transaction volume (up to +300)
  // Each ₦1000 = +1 point, max 300
  score += Math.min(Math.floor(totalVolume / 1000), 300);
  
  // Account age consistency (up to +200)
  if (accountAgeDays >= 30) score += 50;
  if (accountAgeDays >= 90) score += 50;
  if (accountAgeDays >= 180) score += 50;
  if (accountAgeDays >= 365) score += 50;
  
  // Cap at 1000
  return Math.min(Math.round(score), 1000);
}

function getScoreLevel(score: number): string {
  if (score >= 800) return "Excellent";
  if (score >= 650) return "Good Standing";
  if (score >= 500) return "Fair";
  return "Building";
}

function getUnlocks(score: number) {
  return {
    virtualCard: score >= 500,
    nanoLoan: score >= 650,
    businessAccount: score >= 800,
    premiumLending: score >= 900,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { 
      bvnVerified = false, 
      transactionCount = 0, 
      totalVolume = 0,
      accountAgeDays = 0 
    } = await req.json();
    
    const score = computeCraftScore(
      bvnVerified,
      transactionCount,
      totalVolume,
      accountAgeDays
    );
    
    return NextResponse.json({
      score,
      level: getScoreLevel(score),
      unlocks: getUnlocks(score),
    });
  } catch (err) {
    console.error("[CraftID] CraftScore error:", err);
    return NextResponse.json(
      { error: "Score generation failed" },
      { status: 500 }
    );
  }
}