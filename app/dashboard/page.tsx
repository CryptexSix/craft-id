"use client";

import { useMemo, useState, useEffect } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Bell, Calendar, Repeat2, Share2, TrendingUp, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { CraftScoreGauge } from "@/components/craft-score-gauge";
import { PaymentLinkCard } from "@/components/payment-link-card";
import { StatsCard } from "@/components/stats-card";
import { TransactionFeed } from "@/components/transaction-feed";
import { formatNaira } from "@/lib/utils";
import { mockWeeklyIncome } from "@/lib/mock-data";
import { useUser } from "@/lib/useUser";

interface Transaction {
  id: string;
  amount: number;
  clientName: string;
  artisanName: string;
  timestamp: string;
  status: string;
}

interface Stats {
  count: number;
  volume: number;
}

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({ count: 0, volume: 0 });
  const [bvnVerified, setBvnVerified] = useState(false);
  const [craftScore, setCraftScore] = useState(300);
  const [scoreLevel, setScoreLevel] = useState("Building");
  const [loading, setLoading] = useState(true);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    return "evening";
  }, []);

  // Calculate derived values AFTER state is defined
  const thisMonthEarnings = useMemo(() => {
    const now = new Date();
    const thisMonth = transactions.filter(t => {
      const tDate = new Date(t.timestamp);
      return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
    });
    return thisMonth.reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const avgJobValue = useMemo(() => {
    if (transactions.length === 0) return 0;
    return stats.volume / transactions.length;
  }, [transactions, stats.volume]);

  const uniqueClients = useMemo(() => {
    const clients = new Set(transactions.map(t => t.clientName));
    return clients.size;
  }, [transactions]);

  // Load data from localStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load transactions
        const savedTransactions = localStorage.getItem("craftid_transactions");
        if (savedTransactions) {
          const txns = JSON.parse(savedTransactions);
          setTransactions(txns);
          
          // Calculate stats
          const totalVolume = txns.reduce((sum: number, t: Transaction) => sum + t.amount, 0);
          setStats({
            count: txns.length,
            volume: totalVolume,
          });
        }
        
        // Load BVN verification status from onboarding
        const bvnStatus = localStorage.getItem("craftid_bvn_verified");
        setBvnVerified(bvnStatus === "true");
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      }
    };
    
    loadData();
  }, []);

  // Calculate CraftScore after transactions and bvn status are loaded
  useEffect(() => {
    const calculateScore = async () => {
      try {
        const accountAgeDays = 34;
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

  if (loading || userLoading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--orange)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1
            style={{
              fontFamily: "var(--font-syne)",
              fontSize: "clamp(26px, 4vw, 32px)",
              fontWeight: 700,
            }}
          >
            Good {greeting}, {user?.firstName || "Artisan"} 👋
          </h1>
          <p style={{ color: "var(--text-2)", fontSize: 14 }}>Here&apos;s your business overview</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <Bell size={16} />
            <span
              className="absolute right-2 top-2 h-2 w-2 rounded-full"
              style={{ background: "var(--orange)" }}
            />
          </button>
          <button
            className="hidden items-center gap-2 rounded-xl px-4 py-2 text-sm md:inline-flex"
            style={{ background: "var(--orange)", color: "white" }}
          >
            <Share2 size={15} />Share Link
          </button>
        </div>
      </div>

      <div className="relative mb-4 overflow-hidden rounded-xl border px-6 py-7" style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.08) 0%, var(--surface) 60%)", borderColor: "rgba(249,115,22,0.2)", boxShadow: "0 0 60px rgba(249,115,22,0.04)" }}>
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.3) 0%, transparent 70%)" }} />
        <div className="grid grid-cols-1 items-end gap-4 lg:grid-cols-2">
          <div>
            <p className="text-[12px] uppercase tracking-[0.18em]" style={{ color: "var(--text-2)" }}>Total Earned This Month</p>
            <p style={{ fontFamily: "var(--font-dm-mono)", fontSize: "clamp(32px,6vw,48px)", fontWeight: 800 }}>{formatNaira(thisMonthEarnings)}</p>
            <p style={{ color: "var(--green)", fontSize: 14 }}>{transactions.length > 0 ? `+${formatNaira(stats.volume)} total earnings` : "Make your first payment to see growth"} ↑</p>
          </div>
          <div className="h-20 w-full lg:ml-auto lg:max-w-55"><ResponsiveContainer width="100%" height="100%"><AreaChart data={mockWeeklyIncome}><defs><linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--orange)" stopOpacity={0.3} /><stop offset="100%" stopColor="var(--orange)" stopOpacity={0} /></linearGradient></defs><Area type="monotone" dataKey="amount" stroke="var(--orange)" strokeWidth={2} fill="url(#incomeFill)" /></AreaChart></ResponsiveContainer></div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Transactions" value={stats.count || 47} icon={TrendingUp} trend="up" trendValue={`${stats.count > 0 ? `${stats.count} this month` : "No transactions yet"}`} sub="this month" />
        <StatsCard label="Avg Job Value" value={Math.round(avgJobValue) || 6053} prefix="₦" icon={Zap} sub="per transaction" />
        <StatsCard label="Unique Clients" value={uniqueClients || 12} icon={Repeat2} trend="up" trendValue={uniqueClients > 0 ? `${uniqueClients} total` : "waiting"} sub="come back" />
        <StatsCard label="Days Active" value={34} icon={Calendar} sub="of 60 for score" trendValue="26 left" trend="neutral" />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="rounded-xl border p-6 lg:col-span-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="mb-4 flex items-center justify-between"><h3 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 20 }}>CraftScore</h3><a href="/score" style={{ color: "var(--orange)", fontSize: 13 }}>Full Report →</a></div>
          <p style={{ color: "var(--text-2)", fontSize: 12 }}>{stats.count < 10 ? `${10 - stats.count} more transactions to reach Good Standing` : `${scoreLevel} - ${craftScore} points`}</p>
          <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-start">
            <CraftScoreGauge score={craftScore} size="md" />
            <div className="w-full space-y-4">
              <div className="mb-1 flex justify-between text-xs"><span style={{ color: "var(--text-1)" }}>Identity</span><span style={{ color: "var(--text-2)" }}>{bvnVerified ? "150" : "0"}</span></div>
              <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "var(--border)" }}><div className="h-full rounded-full" style={{ width: bvnVerified ? "150" : "0", background: "linear-gradient(90deg,var(--orange),var(--purple))" }} /></div>
              <div className="mb-1 flex justify-between text-xs"><span style={{ color: "var(--text-1)" }}>Transaction Count</span><span style={{ color: "var(--text-2)" }}>{Math.min(stats.count * 5, 200)}</span></div>
              <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "var(--border)" }}><div className="h-full rounded-full" style={{ width: `${Math.min(stats.count * 5, 200)}`, background: "linear-gradient(90deg,var(--orange),var(--purple))" }} /></div>
              <div className="mb-1 flex justify-between text-xs"><span style={{ color: "var(--text-1)" }}>Volume</span><span style={{ color: "var(--text-2)" }}>{Math.min(Math.floor(stats.volume / 1000), 300)}</span></div>
              <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "var(--border)" }}><div className="h-full rounded-full" style={{ width: `${Math.min(Math.floor(stats.volume / 1000), 300)}`, background: "linear-gradient(90deg,var(--orange),var(--purple))" }} /></div>
            </div>
          </div>
        </div>

        <div className="relative rounded-xl border p-6 lg:col-span-2" style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.06), var(--surface))", borderColor: "rgba(249,115,22,0.25)" }}>
          <div className="pointer-events-none absolute -right-8 -top-6 h-28 w-28 rounded-full" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.25), transparent 70%)" }} />
          <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs" style={{ background: "var(--orange-dim)", borderColor: "rgba(249,115,22,0.2)", color: "var(--orange)" }}>{craftScore >= 650 ? "✓ Pre-Approved" : "🔒 Locked"}</span>
          <p className="mt-3" style={{ fontFamily: "var(--font-syne)", fontSize: "clamp(32px,9vw,44px)", fontWeight: 800 }}>{formatNaira(craftScore >= 650 ? (craftScore >= 800 ? 500000 : 150000) : 0)}</p>
          <p style={{ color: "var(--text-2)", fontSize: 14 }}>Equipment Loan</p>
          <p className="mt-1" style={{ color: "var(--text-2)", fontSize: 13 }}>{craftScore >= 650 ? "6 months · 3.5%/month" : "Reach 650+ score to unlock"}</p>
          {craftScore >= 650 && <p className="mt-2" style={{ color: "var(--yellow)", fontSize: 12 }}>⏳ Offer expires in 30 days</p>}
          <a href="/loan" className={`mt-6 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 ${craftScore >= 650 ? "" : "opacity-50 cursor-not-allowed"}`} style={{ background: craftScore >= 650 ? "var(--orange)" : "var(--surface)", color: craftScore >= 650 ? "white" : "var(--text-3)", fontFamily: "var(--font-syne)", fontWeight: 700 }}>
            {craftScore >= 650 ? "Claim Offer →" : "Build Score to Unlock"}
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="rounded-xl border p-6 lg:col-span-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="mb-3 flex items-center justify-between"><h3 style={{ fontFamily: "var(--font-syne)", fontSize: 20, fontWeight: 700 }}>Recent Payments</h3><button style={{ color: "var(--orange)", fontSize: 13 }}>View All →</button></div>
          {transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.slice(0, 6).map((tx) => (
                <div key={tx.id} className="flex justify-between items-center border-b pb-2" style={{ borderColor: "var(--border)" }}>
                  <div>
                    <p style={{ color: "var(--text-1)", fontSize: 14 }}>{tx.clientName} paid you</p>
                    <p style={{ color: "var(--text-2)", fontSize: 12 }}>{new Date(tx.timestamp).toLocaleDateString()}</p>
                  </div>
                  <p style={{ fontFamily: "var(--font-dm-mono)", fontWeight: 700 }}>{formatNaira(tx.amount)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--text-2)" }}>No payments yet. Share your payment link to get started!</p>
          )}
        </div>
        <div className="space-y-4 lg:col-span-2">
          <PaymentLinkCard link={user?.paymentLink || "/pay/artisan"} name={user?.fullName || "Artisan"} />
          <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="mb-3 flex items-center justify-between"><h3 style={{ fontFamily: "var(--font-syne)", fontSize: 18, fontWeight: 700 }}>Nearby Clients</h3><span className="rounded-full px-2 py-1 text-xs" style={{ background: "var(--green-dim)", color: "var(--green)" }}>3 waiting</span></div>
            {[["Aunty Shade · Alteration", "Budget ₦15,000"], ["Jide B · Wedding Kaftan", "Budget ₦45,000"]].map((row) => (
              <div key={row[0]} className="mb-2 rounded-xl border px-3 py-2" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}><p style={{ color: "var(--text-1)", fontSize: 13 }}>{row[0]}</p><p style={{ color: "var(--text-2)", fontSize: 12 }}>{row[1]}</p></div>
            ))}
            <a href="#" style={{ color: "var(--orange)", fontSize: 13 }}>View all nearby clients →</a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}