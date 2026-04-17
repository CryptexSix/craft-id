"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { CheckCircle2, Zap } from "lucide-react";
import { CraftScoreGauge } from "@/components/craft-score-gauge";
import { formatNaira, MAX_CRAFT_SCORE } from "@/lib/utils";
import { useUser } from "@/lib/useUser";

interface Transaction {
  id: string;
  amount: number;
  clientName: string;
  artisanName: string;
  timestamp: string;
  status: string;
}

type PaymentRow = {
  id?: string;
  txn_ref?: string;
  amount_kobo?: number;
  client_name?: string;
  artisan_slug?: string;
  paid_at?: string;
  created_at?: string;
  status?: string;
};

function computeCraftScore(
  bvnVerified: boolean,
  transactionCount: number,
  totalVolume: number,
  accountAgeDays: number
): number {
  const hasPayments = (transactionCount ?? 0) > 0 || (totalVolume ?? 0) > 0;

  // If there are no payments yet, only BVN contributes.
  // This keeps early scores low (no “free” volume/frequency/age points) but still rewards identity.
  if (!hasPayments) return bvnVerified ? 150 : 0;

  let score = 0;

  if (bvnVerified) score += 150;
  score += Math.min(transactionCount * 5, 200);
  score += Math.min(Math.floor(totalVolume / 1000), 300);

  if (accountAgeDays >= 30) score += 50;
  if (accountAgeDays >= 90) score += 50;
  if (accountAgeDays >= 180) score += 50;
  if (accountAgeDays >= 365) score += 50;

  return Math.min(Math.round(score), MAX_CRAFT_SCORE);
}

export default function ScorePage() {
  const { user, loading: userLoading } = useUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bvnVerified, setBvnVerified] = useState(false);
  const [bvn, setBvn] = useState("");
  const [bvnName, setBvnName] = useState<string>("");
  const [bvnVerifying, setBvnVerifying] = useState(false);
  const [bvnError, setBvnError] = useState<string | null>(null);
  const [craftScore, setCraftScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ count: 0, volume: 0 });
  const [accountAgeDays, setAccountAgeDays] = useState(0);
  const hasPayments = stats.count > 0 || stats.volume > 0;

  useEffect(() => {
    const loadData = async () => {
      try {
        if (user?.createdAt) {
          const created = new Date(user.createdAt);
          if (!Number.isNaN(created.getTime())) {
            const diffMs = new Date().getTime() - created.getTime();
            setAccountAgeDays(Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1));
          }
        }

        if (user?.slug) {
          const res = await fetch(`/api/payments?slug=${encodeURIComponent(user.slug)}`);
          if (res.ok) {
            const data = await res.json();
            const payments = Array.isArray(data?.payments) ? data.payments : [];
            const mapped = (payments as PaymentRow[]).map((p, index) => ({
              id: p.txn_ref || p.id || `payment-${index}`,
              amount: Number(p.amount_kobo || 0) / 100,
              clientName: p.client_name || "Client",
              artisanName: user.fullName,
              timestamp: p.paid_at || p.created_at || new Date().toISOString(),
              status: p.status || "completed",
            }));

            setTransactions(mapped);
            setStats({
              count: Number(data?.stats?.count || mapped.length),
              volume: Number(
                data?.stats?.volume || mapped.reduce((sum: number, t: Transaction) => sum + t.amount, 0)
              ),
            });
          }
        }

        if (!user?.slug) {
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
        }

        // Load BVN verification status
        const bvnStatus = localStorage.getItem("craftid_bvn_verified");
        setBvnVerified(bvnStatus === "true");

        // Load any saved BVN/name (for convenience)
        if (user?.bvn) setBvn(String(user.bvn));
        if (user?.bvnName) setBvnName(String(user.bvnName));

        if (!user?.bvn || !user?.bvnName) {
          const savedUser = localStorage.getItem("craftid_user");
          if (savedUser) {
            const parsed = JSON.parse(savedUser);
            if (!user?.bvn && parsed?.bvn) setBvn(String(parsed.bvn));
            if (!user?.bvnName && parsed?.bvnName) setBvnName(String(parsed.bvnName));
          }
        }
      } catch (err) {
        console.error("Error loading score data:", err);
      }
    };

    void loadData();
  }, [user?.bvn, user?.bvnName, user?.createdAt, user?.fullName, user?.slug]);

  const handleVerifyBVN = async () => {
    const digits = bvn.replace(/\D/g, "");
    if (digits.length !== 11) {
      setBvnError("BVN must be 11 digits");
      return;
    }

    setBvnVerifying(true);
    setBvnError(null);

    try {
      const res = await fetch("/api/verify-bvn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bvn: digits }),
      });
      const data = await res.json();

      if (!data?.verified) {
        setBvnError("BVN could not be verified. Please check and try again.");
        setBvnVerified(false);
        localStorage.setItem("craftid_bvn_verified", "false");
        return;
      }

      const name = [data.firstName, data.lastName].filter(Boolean).join(" ").trim();
      setBvnName(name);
      setBvnVerified(true);
      localStorage.setItem("craftid_bvn_verified", "true");

      // Persist on the saved profile (and best-effort to DB)
      const savedUser = localStorage.getItem("craftid_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const nextUser = { ...parsed, bvn: digits, bvnVerified: true, bvnName: name };
        localStorage.setItem("craftid_user", JSON.stringify(nextUser));

        try {
          await fetch("/api/users/upsert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nextUser),
          });
        } catch (err) {
          console.warn("[CraftID] Could not persist BVN status to DB:", err);
        }
      }
    } catch (err) {
      console.error("BVN verification error:", err);
      setBvnError("Verification failed. Please try again.");
      setBvnVerified(false);
      localStorage.setItem("craftid_bvn_verified", "false");
    } finally {
      setBvnVerifying(false);
    }
  };

  // Calculate CraftScore
  useEffect(() => {
    const calculateScore = async () => {
      try {
        const localScore = computeCraftScore(bvnVerified, stats.count, stats.volume, accountAgeDays);
        setCraftScore(localScore);

        // Still call API so level/unlocks stay in sync server-side
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
      } catch (err) {
        console.error("Error calculating score:", err);
      } finally {
        setLoading(false);
      }
    };

    void calculateScore();
  }, [accountAgeDays, bvnVerified, stats.count, stats.volume]);

  const scoreHistory = (() => {
    if (!user?.createdAt) return [] as { day: number; score: number }[];
    const created = new Date(user.createdAt);
    if (Number.isNaN(created.getTime())) return [] as { day: number; score: number }[];

    const daysToShow = Math.min(Math.max(accountAgeDays, 0), 60);
    if (daysToShow <= 1) return [] as { day: number; score: number }[];

    const msPerDay = 1000 * 60 * 60 * 24;
    const countByDay = new Map<number, { count: number; volume: number }>();

    for (const t of transactions) {
      const dt = new Date(t.timestamp);
      if (Number.isNaN(dt.getTime())) continue;
      const idx = Math.floor((dt.getTime() - created.getTime()) / msPerDay) + 1;
      if (idx < 1 || idx > daysToShow) continue;
      const existing = countByDay.get(idx) ?? { count: 0, volume: 0 };
      countByDay.set(idx, { count: existing.count + 1, volume: existing.volume + t.amount });
    }

    const result: { day: number; score: number }[] = [];
    let runningCount = 0;
    let runningVolume = 0;
    for (let day = 1; day <= daysToShow; day += 1) {
      const bucket = countByDay.get(day);
      if (bucket) {
        runningCount += bucket.count;
        runningVolume += bucket.volume;
      }
      result.push({ day, score: computeCraftScore(bvnVerified, runningCount, runningVolume, day) });
    }

    return result;
  })();

  // Calculate score factors
  const accountConsistencyPoints = (() => {
    let points = 0;
    if (accountAgeDays >= 30) points += 50;
    if (accountAgeDays >= 90) points += 50;
    if (accountAgeDays >= 180) points += 50;
    if (accountAgeDays >= 365) points += 50;
    return points;
  })();

  const scoreFactors = [
    {
      name: "Identity Verification",
      score: bvnVerified ? 150 : 0,
      max: 150,
      description: bvnVerified ? "✓ BVN verified" : "Verify your BVN anytime (required for loans)",
    },
    {
      name: "Transaction Frequency",
      score: hasPayments ? Math.min(stats.count * 5, 200) : 0,
      max: 200,
      description: hasPayments ? `${stats.count} transactions completed` : "Unlocks after your first payment",
    },
    {
      name: "Payment Volume",
      score: hasPayments ? Math.min(Math.floor(stats.volume / 1000), 300) : 0,
      max: 300,
      description: hasPayments ? `${formatNaira(stats.volume)} total processed` : "Unlocks after your first payment",
    },
    {
      name: "Account Tenure",
      score: hasPayments ? accountConsistencyPoints : 0,
      max: 200,
      description: hasPayments ? `Account age: ${accountAgeDays} days` : "Unlocks after your first payment",
    },
  ];

  const statusMessage = (() => {
    if (!hasPayments) {
      return bvnVerified
        ? "Identity verified · receive your first payment to start building your CraftScore."
        : "Receive your first payment (or verify BVN) to start building your CraftScore.";
    }

    if (craftScore >= 350) {
      return bvnVerified
        ? "Eligible · Generate your income verification PDF and view your loan offer."
        : "Verify BVN to unlock loans and income verification PDF.";
    }

    return `${Math.max(0, 350 - craftScore)} more points to reach loan eligibility.`;
  })();

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

      {!bvnVerified ? (
        <section className="rounded-xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 style={{ fontFamily: "var(--font-syne)", fontSize: 18, fontWeight: 700 }}>Verify BVN</h3>
              <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>BVN is not required during onboarding. Verify anytime here — it’s required to take a loan.</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              className="w-full rounded-xl px-4 py-3.5 sm:flex-1"
              placeholder="Enter 11-digit BVN"
              maxLength={11}
              value={bvn}
              onChange={(e) => {
                setBvn(e.target.value.replace(/\D/g, ""));
                setBvnError(null);
              }}
            />
            <button
              onClick={handleVerifyBVN}
              disabled={bvnVerifying || bvn.replace(/\D/g, "").length !== 11}
              className="rounded-xl px-6 py-3.5"
              style={{
                background: bvn.replace(/\D/g, "").length === 11 && !bvnVerifying ? "var(--orange)" : "var(--surface)",
                color: bvn.replace(/\D/g, "").length === 11 && !bvnVerifying ? "white" : "var(--text-3)",
                border: `1px solid var(--border)`,
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
              }}
            >
              {bvnVerifying ? "Verifying…" : "Verify"}
            </button>
          </div>
          {bvnError ? <p className="mt-2 text-sm" style={{ color: "var(--red)" }}>{bvnError}</p> : null}
        </section>
      ) : (
        <section className="rounded-xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 style={{ fontFamily: "var(--font-syne)", fontSize: 18, fontWeight: 700 }}>BVN verified</h3>
              <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>{bvnName ? `Verified as ${bvnName}` : "Identity points unlocked"}</p>
            </div>
            <CheckCircle2 size={18} style={{ color: "var(--green)" }} />
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-5 rounded-2xl border p-8 lg:grid-cols-2" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.06) 0%, var(--surface) 100%)", borderColor: "rgba(124,58,237,0.2)" }}>
        <div>
          <CraftScoreGauge size="lg" score={craftScore} />
          <p className="mt-3 text-center" style={{ color: "var(--text-2)", fontSize: 12 }}>
            {statusMessage}
          </p>
          <div className="mx-auto mt-2 max-w-65 rounded-full px-3 py-2 text-center text-xs" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
            Day {Math.min(accountAgeDays, 60)} of 60
          </div>
          <div className="mx-auto mt-2 h-2 max-w-65 rounded-full" style={{ background: "var(--border)" }}>
            <div className="h-2 rounded-full" style={{ width: `${(Math.min(accountAgeDays, 60) / 60) * 100}%`, background: "var(--orange)" }} />
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

      {/* <section className="rounded-xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="mb-3 flex items-center justify-between">
          <h3 style={{ fontFamily: "var(--font-syne)", fontSize: 20, fontWeight: 700 }}>Score Journey</h3>
          <span className="rounded-full px-3 py-1 text-xs" style={{ background: "var(--green-dim)", color: "var(--green)" }}>
            +{craftScore} points
          </span>
        </div>
        {scoreHistory.length > 0 ? (
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scoreHistory}>
                <defs>
                  <linearGradient id="scoreStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--orange)" />
                    <stop offset="100%" stopColor="var(--purple)" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "var(--text-2)", fontSize: 11 }} interval={9} />
                <YAxis domain={[0, MAX_CRAFT_SCORE]} tick={{ fill: "var(--text-2)", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}
                  formatter={(value) => [`Score ${value ?? "-"}`, ""]}
                  labelFormatter={(day) => `Day ${day}`}
                />
                <Line type="monotone" dataKey="score" stroke="url(#scoreStroke)" strokeWidth={3} dot={false} activeDot={{ fill: "var(--orange)", stroke: "var(--surface)", strokeWidth: 2, r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--text-2)" }}>
            Your score journey will appear here after you’ve been active for a bit.
          </p>
        )}
      </section> */}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {["Verify BVN when you’re ready (boosts your score)", "Ask clients to pay through your CraftID link", "Keep receiving payments consistently to grow your score"].map((tip) => (
          <motion.div key={tip} whileHover={{ y: -3 }} className="rounded-lg border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <p className="mb-1" style={{ color: "var(--orange)" }}><Zap size={15} /></p>
            <p style={{ color: "var(--text-2)", fontSize: 13 }}>{tip}</p>
          </motion.div>
        ))}
      </section>

      <section className="flex flex-wrap gap-3">
        <a href="/report" className="inline-flex rounded-xl px-5 py-3" style={{ background: "var(--orange)", color: "white" }}>Income Verification PDF →</a>
      </section>
    </motion.div>
  );
}