"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Shield, AlertCircle } from "lucide-react";
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

export default function LoanPage() {
  const { user, loading: userLoading } = useUser();
  const [amount, setAmount] = useState(50000);
  const [accepted, setAccepted] = useState(false);
  const [craftScore, setCraftScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ count: 0, volume: 0 });
  const [bvnVerified, setBvnVerified] = useState(false);

  // Load data from localStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load transactions
        const savedTransactions = localStorage.getItem("craftid_transactions");
        if (savedTransactions) {
          const txns = JSON.parse(savedTransactions);
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
        console.error("Error loading loan data:", err);
      }
    };

    loadData();
  }, []);

  // Calculate CraftScore
  useEffect(() => {
    const calculateScore = async () => {
      try {
        const accountAgeDays = (() => {
          if (!user?.createdAt) return 0;
          const created = new Date(user.createdAt);
          if (Number.isNaN(created.getTime())) return 0;
          const diffMs = new Date().getTime() - created.getTime();
          return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
        })();
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

    calculateScore();
  }, [bvnVerified, stats.count, stats.volume, user?.createdAt]);

  // Calculate loan eligibility based on score
  const loanEligibility = useMemo(() => {
    if (craftScore >= 650) return { maxAmount: 1000000, rate: 2.5, term: 12, purpose: "Premium Growth" };
    if (craftScore >= 500) return { maxAmount: 500000, rate: 3.0, term: 9, purpose: "Business Expansion" };
    if (craftScore >= 350) return { maxAmount: 150000, rate: 3.5, term: 6, purpose: "Equipment" };
    return { maxAmount: 0, rate: 0, term: 0, purpose: "Locked" };
  }, [craftScore]);

  const minAmount = loanEligibility.maxAmount > 0 ? 50000 : 0;
  const maxAmount = loanEligibility.maxAmount;
  const isEligible = craftScore >= 350;
  const needsBVN = !bvnVerified;

  // Set initial amount when eligibility loads
  useEffect(() => {
    if (maxAmount > 0 && amount === 50000) {
      setAmount(Math.min(150000, maxAmount));
    }
  }, [maxAmount, amount]);

  const breakdown = useMemo(() => {
    if (!isEligible) return { totalInterest: 0, totalRepayment: 0, monthly: 0 };
    const rate = loanEligibility.rate / 100;
    const term = loanEligibility.term;
    const totalInterest = amount * rate * term;
    const totalRepayment = amount + totalInterest;
    const monthly = totalRepayment / term;
    return { totalInterest, totalRepayment, monthly };
  }, [amount, isEligible, loanEligibility]);

  const repaymentSteps = ["💳 Client pays you", "⚡ CraftID receives", "✓ Auto-deducted"];

  if (loading || userLoading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--orange)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!isEligible) {
    const pointsNeeded = 350 - craftScore;
    return (
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center"
      >
        <div className="mx-auto flex w-full max-w-105 flex-col gap-5">
          <AlertCircle size={48} style={{ color: "var(--orange)", margin: "0 auto" }} />
          <h1 style={{ fontFamily: "var(--font-syne)", fontSize: 28, fontWeight: 800 }}>Loan Unavailable</h1>
          <p style={{ color: "var(--text-2)" }}>
            Your CraftScore is <strong>{craftScore}</strong>. You need <strong>{pointsNeeded}</strong> more points to unlock loans.
          </p>
          <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--text-2)" }}>Ways to increase your score:</p>
            <ul className="mt-2 text-left text-sm space-y-1" style={{ color: "var(--text-2)" }}>
              <li>✓ Make more payments through your CraftID link</li>
              <li>✓ Complete {pointsNeeded > 100 ? "more transactions" : `${Math.ceil(pointsNeeded / 5)} more transactions`}</li>
              <li>✓ Reach higher payment volumes</li>
            </ul>
          </div>
          <a
            href="/score"
            className="rounded-xl px-6 py-3"
            style={{ background: "var(--orange)", color: "white" }}
          >
            View Score Details →
          </a>
        </div>
      </motion.main>
    );
  }

  if (needsBVN) {
    return (
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center"
      >
        <div className="mx-auto flex w-full max-w-105 flex-col gap-5">
          <Shield size={48} style={{ color: "var(--orange)", margin: "0 auto" }} />
          <h1 style={{ fontFamily: "var(--font-syne)", fontSize: 28, fontWeight: 800 }}>BVN Required</h1>
          <p style={{ color: "var(--text-2)" }}>
            You’re eligible based on your CraftScore (<strong>{craftScore}</strong>), but you must verify your BVN before taking a loan.
          </p>
          <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--text-2)" }}>Verify BVN to unlock loans:</p>
            <ul className="mt-2 text-left text-sm space-y-1" style={{ color: "var(--text-2)" }}>
              <li>✓ Adds identity points to your CraftScore</li>
              <li>✓ Required for compliance and disbursement</li>
            </ul>
          </div>
          <a
            href="/score"
            className="rounded-xl px-6 py-3"
            style={{ background: "var(--orange)", color: "white" }}
          >
            Verify BVN on Score Page →
          </a>
        </div>
      </motion.main>
    );
  }

  if (accepted) {
    return (
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center"
      >
        <div className="mx-auto flex w-full max-w-105 flex-col gap-5">
          <motion.p animate={{ y: [0, -8, 0] }} transition={{ duration: 1.2, repeat: Infinity }} style={{ fontSize: 60 }}>
            💸
          </motion.p>
          <h1 style={{ fontFamily: "var(--font-syne)", fontSize: 32, fontWeight: 800 }}>{formatNaira(amount)} is on its way!</h1>
          <p style={{ color: "var(--green)", fontFamily: "var(--font-dm-mono)", marginTop: 8 }}>Expected arrival: within 2 hours</p>
          <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex justify-between text-sm" style={{ color: "var(--text-2)" }}>
              <span>Monthly repayment</span>
              <span style={{ fontFamily: "var(--font-dm-mono)" }}>{formatNaira(Math.round(breakdown.monthly))}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm" style={{ color: "var(--text-2)" }}>
              <span>Total repayment</span>
              <span style={{ fontFamily: "var(--font-dm-mono)", color: "var(--orange)" }}>{formatNaira(Math.round(breakdown.totalRepayment))}</span>
            </div>
            <div className="mt-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              <p className="text-xs" style={{ color: "var(--text-2)" }}>Interest rate: {loanEligibility.rate}% monthly</p>
              <p className="text-xs" style={{ color: "var(--text-2)" }}>Term: {loanEligibility.term} months</p>
            </div>
          </div>
          <a
            href="/dashboard"
            className="rounded-xl px-6 py-3"
            style={{ background: "var(--orange)", color: "white" }}
          >
            Back to Dashboard →
          </a>
        </div>
      </motion.main>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-4"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <a href="/dashboard" className="inline-flex items-center gap-2" style={{ color: "var(--text-2)" }}>
          <ArrowLeft size={16} />Dashboard
        </a>
        <header className="space-y-1">
          <h1 style={{ fontFamily: "var(--font-syne)", fontSize: 32, fontWeight: 700 }}>Loan Offer</h1>
          <p style={{ color: "var(--text-2)" }}>Pre-approved for {user?.firstName || "you"} based on your CraftScore of {craftScore}</p>
        </header>

        <section
          className="relative overflow-hidden rounded-2xl border p-6"
          style={{
            background: "linear-gradient(135deg, rgba(249,115,22,0.07) 0%, var(--surface) 100%)",
            borderColor: "rgba(249,115,22,0.3)",
          }}
        >
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-45 w-45 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(249,115,22,0.4), transparent 70%)", opacity: 0.1 }}
          />
          <span
            className="inline-flex rounded-full border px-3 py-1 text-sm"
            style={{
              background: "var(--orange-dim)",
              borderColor: "rgba(249,115,22,0.3)",
              color: "var(--orange)",
              fontFamily: "var(--font-syne)",
              fontWeight: 700,
            }}
          >
            ⚡ Pre-Approved — No Application Needed
          </span>
          <p
            className="mt-3 wrap-break-word"
            style={{ fontFamily: "var(--font-syne)", fontSize: "clamp(42px, 8vw, 64px)", fontWeight: 900 }}
          >
            {formatNaira(amount)}
          </p>
          <p style={{ color: "var(--text-2)", fontSize: 16 }}>{loanEligibility.purpose} Loan</p>
          <p className="mt-1 flex items-center gap-2 text-xs" style={{ color: "var(--text-2)" }}>
            <Clock size={14} />2 hour disbursement · {loanEligibility.term} months
          </p>
          <p className="mt-2 text-xs" style={{ color: "var(--yellow)" }}>
            ⏳ Offer expires in 30 days
          </p>
        </section>

        <section
          className="rounded-xl border p-6"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <h3 style={{ fontFamily: "var(--font-syne)", fontWeight: 700 }}>Choose your amount</h3>
            <span style={{ color: "var(--orange)", fontFamily: "var(--font-dm-mono)", fontWeight: 700 }}>{formatNaira(amount)}</span>
          </div>
          <input
            type="range"
            min={minAmount}
            max={maxAmount}
            step={5000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-4 w-full"
            style={{ accentColor: "var(--orange)" }}
            aria-label="Adjust loan amount"
          />
          <div className="mt-2 flex justify-between text-xs" style={{ color: "var(--text-2)" }}>
            <span>{formatNaira(minAmount)}</span>
            <span>{formatNaira(maxAmount)}</span>
          </div>
        </section>

        <section
          className="rounded-xl border p-6"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <h3 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, marginBottom: 10 }}>Loan breakdown</h3>
          {[
            ["Loan amount", formatNaira(amount)],
            ["Interest rate", `${loanEligibility.rate}% per month`],
            ["Loan term", `${loanEligibility.term} months`],
            ["Monthly repayment", formatNaira(Math.round(breakdown.monthly))],
            ["Total interest", formatNaira(Math.round(breakdown.totalInterest))],
            ["Total repayment", formatNaira(Math.round(breakdown.totalRepayment))],
          ].map((row, i) => (
            <div
              key={row[0]}
              className="flex flex-col gap-1 border-t pt-2 md:flex-row md:items-center md:justify-between md:gap-0"
              style={{ borderColor: i === 3 || i === 5 ? "var(--border)" : "transparent", borderTopStyle: i === 3 || i === 5 ? "solid" : "none" }}
            >
              <span style={{ color: "var(--text-2)" }}>{row[0]}</span>
              <span
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  fontWeight: i >= 3 ? 700 : 500,
                  color: i === 5 ? "var(--orange)" : "var(--text-1)",
                  fontSize: i === 5 ? 20 : 14,
                }}
                className="whitespace-nowrap"
              >
                {row[1]}
              </span>
            </div>
          ))}
        </section>

        <section
          className="rounded-xl border p-6"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <h3 style={{ fontFamily: "var(--font-syne)", fontWeight: 700 }}>How repayment works</h3>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            {repaymentSteps.map((step) => (
              <div
                key={step}
                className="flex flex-col items-center justify-center rounded-full px-3 py-2"
                style={{ background: "var(--surface-2)" }}
              >
                <span className="text-center text-xs sm:text-sm" style={{ color: "var(--text-2)" }}>
                  {step}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center italic" style={{ color: "var(--text-2)", fontSize: 13 }}>
            No bank visits. No manual transfers. Your income IS your repayment.
          </p>
        </section>

        <motion.button
          whileHover={{ scale: 1.01 }}
          onClick={() => setAccepted(true)}
          className="w-full rounded-xl px-5 py-4.5"
          style={{ background: "var(--orange)", color: "white", fontFamily: "var(--font-syne)", fontSize: 18, fontWeight: 700 }}
        >
          Accept {formatNaira(amount)} Loan
        </motion.button>
        <p className="text-center text-xs" style={{ color: "var(--text-2)" }}>
          <Shield size={12} className="inline" /> By accepting you agree to loan terms. Money arrives in 2 hours.
        </p>
        <p className="text-center text-xs" style={{ color: "var(--yellow)" }}>
          Offer expires in 30 days.
        </p>
      </div>
    </motion.main>
  );
}