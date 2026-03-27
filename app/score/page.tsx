"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { CheckCircle2, Lock, Zap } from "lucide-react";
import { CraftScoreGauge } from "@/components/craft-score-gauge";
import { mockScoreHistory } from "@/lib/mock-data";
import { formatNaira } from "@/lib/utils";
import { useUser } from "@/lib/useUser";

interface Transaction {
  id: string;
  amount: number;
  clientName: string;
  artisanName: string;
  timestamp: string;
  status: string;
}

export default function ScorePage() {
  const { user, loading: userLoading } = useUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bvnVerified, setBvnVerified] = useState(false);
  const [craftScore, setCraftScore] = useState(300);
  const [scoreLevel, setScoreLevel] = useState("Building");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ count: 0, volume: 0 });

  const tiers = [
    [500, "Virtual Verve Card", "Spend on tools and materials"],
    [650, "Nano Loan ₦150,000", "Equipment financing in 2 hours"],
    [800, "Business Account", "Full business banking"],
    [900, "Premium Lending ₦1M", "Grow your business further"],
  ] as const;

  // Load data from localStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load transactions
        const savedTransactions = localStorage.getItem("craftid_transactions");
        if (savedTransactions) {
          const txns = JSON.parse(savedTransactions);
          setTransactions(txns);
          
          const totalVolume = txns.reduce((sum: number, t: Transaction) => sum + t.amount, 0);
          setStats({
            count: txns.length,
            volume: totalVolume,
          });
        }
        
        // Load BVN verification status
        const bvnStatus = localStorage.getItem("craftid_bvn_verified");
        setBvnVerified(bvnStatus === "true");
      } catch (err) {
        console.error("Error loading score data:", err);
      }
    };
    
    loadData();
  }, []);

  // Calculate CraftScore
  useEffect(() => {
    const calculateScore = async () => {
      try {
        const accountAgeDays = 34; // Placeholder - calculate from onboarding date later
        const scoreRes = await fetch("/api/craft-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bvnVerified: bvnVerified,
            transactionCount: stats.count,
            totalVolume: stats.volume,
            accountAgeDays: accountAgeDays,
          }),
        });
        
        const scoreData = await scoreRes.json();
        setCraftScore(scoreData.score);
        setScoreLevel(scoreData.level);
      } catch (err) {
        console.error("Error calculating score:", err);
      } finally {
        setLoading(false);
      }
    };
    
    calculateScore();
  }, [bvnVerified, stats.count, stats.volume]);

  // Calculate score factors
  const scoreFactors = [
    { name: "Identity Verification", score: bvnVerified ? 150 : 0, max: 150, description: bvnVerified ? "✓ BVN verified" : "Verify your BVN to unlock identity points" },
    { name: "Transaction Frequency", score: Math.min(stats.count * 5, 200), max: 200, description: `${stats.count} transactions completed` },
    { name: "Payment Volume", score: Math.min(Math.floor(stats.volume / 1000), 300), max: 300, description: `${formatNaira(stats.volume)} total processed` },
    { name: "Account Consistency", score: 100, max: 200, description: "Active for 34 days" },
  ];

  const nextMilestone = () => {
    if (craftScore < 500) return { pointsNeeded: 500 - craftScore, message: "to unlock Virtual Card" };
    if (craftScore < 650) return { pointsNeeded: 650 - craftScore, message: "to unlock Nano Loan" };
    if (craftScore < 800) return { pointsNeeded: 800 - craftScore, message: "to unlock Business Account" };
    if (craftScore < 900) return { pointsNeeded: 900 - craftScore, message: "to unlock Premium Lending" };
    return { pointsNeeded: 0, message: "Maximum level reached!" };
  };

  const milestone = nextMilestone();

  if (loading || userLoading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--orange)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }} className="space-y-4">
      <header>
        <h1 style={{ fontFamily: "var(--font-syne)", fontSize: 28, fontWeight: 700 }}>CraftScore</h1>
        <p style={{ color: "var(--text-2)" }}>Your financial identity, built from your work{user?.firstName ? `, ${user.firstName}` : ""}</p>
      </header>
      
      <section className="grid grid-cols-1 gap-5 rounded-2xl border p-8 lg:grid-cols-2" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.06) 0%, var(--surface) 100%)", borderColor: "rgba(124,58,237,0.2)" }}>
        <div>
          <CraftScoreGauge size="lg" score={craftScore} />
          <p className="mt-3 text-center" style={{ color: "var(--text-2)", fontSize: 12 }}>
            {milestone.pointsNeeded > 0 ? `${milestone.pointsNeeded} more points ${milestone.message}` : scoreLevel}
          </p>
          <div className="mx-auto mt-2 max-w-65 rounded-full px-3 py-2 text-center text-xs" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
            Day 34 of 60
          </div>
          <div className="mx-auto mt-2 h-2 max-w-65 rounded-full" style={{ background: "var(--border)" }}>
            <div className="h-2 rounded-full" style={{ width: `${(34 / 60) * 100}%`, background: "var(--orange)" }} />
          </div>
        </div>
        
        <div className="space-y-5">
          {scoreFactors.map((factor, i) => (
            <motion.div key={factor.name} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span>{factor.name}</span>
                <span style={{ color: "var(--orange)", fontFamily: "var(--font-dm-mono)" }}>{factor.score}/{factor.max}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--border)" }}>
                <motion.div 
                  initial={{ width: 0 }} 
                  whileInView={{ width: `${(factor.score / factor.max) * 100}%` }} 
                  transition={{ duration: 0.8, delay: i * 0.08 }} 
                  className="h-full rounded-full" 
                  style={{ background: "linear-gradient(90deg,var(--orange),var(--purple))" }} 
                />
              </div>
              <p className="mt-1 text-xs italic" style={{ color: "var(--text-2)" }}>{factor.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="mb-3 flex items-center justify-between">
          <h3 style={{ fontFamily: "var(--font-syne)", fontSize: 20, fontWeight: 700 }}>Score Journey</h3>
          <span className="rounded-full px-3 py-1 text-xs" style={{ background: "var(--green-dim)", color: "var(--green)" }}>
            +{craftScore - 300} points
          </span>
        </div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockScoreHistory}>
              <defs>
                <linearGradient id="scoreStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--orange)" />
                  <stop offset="100%" stopColor="var(--purple)" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "var(--text-2)", fontSize: 11 }} interval={9} />
              <YAxis domain={[300, 800]} tick={{ fill: "var(--text-2)", fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }} 
                formatter={(value) => [`Score ${value ?? "-"}`, ""]} 
                labelFormatter={(day) => `Day ${day}`} 
              />
              <Line type="monotone" dataKey="score" stroke="url(#scoreStroke)" strokeWidth={3} dot={false} activeDot={{ fill: "var(--orange)", stroke: "var(--surface)", strokeWidth: 2, r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h3 style={{ fontFamily: "var(--font-syne)", fontSize: 22, fontWeight: 700 }}>What your score unlocks</h3>
        <div className="mt-3 space-y-3">
          {tiers.map(([threshold, title, description]) => {
            const unlocked = craftScore >= threshold;
            const needed = threshold - craftScore;
            return (
              <div key={title} className="flex items-center justify-between rounded-xl border p-4" style={{ background: unlocked ? "var(--green-dim)" : "var(--surface)", borderColor: unlocked ? "rgba(22,163,74,0.25)" : "var(--border)" }}>
                <div className="flex items-center gap-3">
                  {unlocked ? <CheckCircle2 size={18} style={{ color: "var(--green)" }} /> : <Lock size={18} style={{ color: "var(--text-3)" }} />}
                  <div>
                    <p style={{ color: unlocked ? "var(--text-1)" : "var(--text-2)", fontWeight: 600 }}>{title}</p>
                    <p style={{ color: "var(--text-2)", fontSize: 12 }}>{description}</p>
                  </div>
                </div>
                <div>
                  {unlocked ? 
                    <span style={{ color: "var(--green)", fontSize: 13 }}>✓ Unlocked</span> : 
                    <span style={{ color: "var(--text-2)", fontSize: 13 }}>+{needed} points needed</span>
                  }
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {["Collect payments daily to improve consistency", "Ask happy clients to pay through your link", "Keep job descriptions detailed for better insights"].map((tip) => (
          <motion.div key={tip} whileHover={{ y: -3 }} className="rounded-lg border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <p className="mb-1" style={{ color: "var(--orange)" }}><Zap size={15} /></p>
            <p style={{ color: "var(--text-2)", fontSize: 13 }}>{tip}</p>
          </motion.div>
        ))}
      </section>
      
      <section className="flex flex-wrap gap-3">
        <a href="/loan" className="inline-flex rounded-xl px-5 py-3" style={{ background: "var(--orange)", color: "white" }}>View Loan Offer →</a>
        <a href="/card" className="inline-flex rounded-xl border px-5 py-3" style={{ borderColor: "var(--border-light)", color: "var(--text-1)" }}>View My Card</a>
      </section>
    </motion.div>
  );
}