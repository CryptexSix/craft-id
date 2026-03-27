"use client";

import { useMemo, useState, useEffect } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Bell, Calendar, Repeat2, Share2, TrendingUp, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { CraftScoreGauge } from "@/components/craft-score-gauge";
import { PaymentLinkCard } from "@/components/payment-link-card";
import { StatsCard } from "@/components/stats-card";
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

interface Stats {
  count: number;
  volume: number;
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

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({ count: 0, volume: 0 });
  const [bvnVerified, setBvnVerified] = useState(false);
  const [craftScore, setCraftScore] = useState(0);
  const [scoreLevel, setScoreLevel] = useState("Building");
  const [loading, setLoading] = useState(true);
  const [invoiceClientName, setInvoiceClientName] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceEmail, setInvoiceEmail] = useState("");
  const [invoiceDescription, setInvoiceDescription] = useState("");
  const [invoiceEmailTouched, setInvoiceEmailTouched] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [invoiceCreating, setInvoiceCreating] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<{
    id: string;
    clientName: string;
    amount: number;
    email: string;
    description?: string;
    createdAt: string;
    payLink: string;
  } | null>(null);

  const hasPayments = stats.count > 0 || stats.volume > 0;

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    return "evening";
  }, []);

  const accountAgeDays = useMemo(() => {
    if (!user?.createdAt) return 0;
    const created = new Date(user.createdAt);
    if (Number.isNaN(created.getTime())) return 0;
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
  }, [user?.createdAt]);

  const accountConsistencyPoints = useMemo(() => {
    let points = 0;
    if (accountAgeDays >= 30) points += 50;
    if (accountAgeDays >= 90) points += 50;
    if (accountAgeDays >= 180) points += 50;
    if (accountAgeDays >= 365) points += 50;
    return points;
  }, [accountAgeDays]);

  // Calculate derived values AFTER state is defined
  const monthTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter((t) => {
      const tDate = new Date(t.timestamp);
      if (Number.isNaN(tDate.getTime())) return false;
      return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
    });
  }, [transactions]);

  const thisMonthEarnings = useMemo(() => {
    return monthTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  const thisMonthCount = useMemo(() => {
    return monthTransactions.length;
  }, [monthTransactions]);

  const avgJobValue = useMemo(() => {
    if (monthTransactions.length === 0) return 0;
    return thisMonthEarnings / monthTransactions.length;
  }, [monthTransactions.length, thisMonthEarnings]);

  const uniqueClients = useMemo(() => {
    const clients = new Set(monthTransactions.map((t) => t.clientName));
    return clients.size;
  }, [monthTransactions]);

  const weeklyIncome = useMemo(() => {
    const now = new Date();
    const days: { key: string; label: string; amount: number }[] = [];

    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString(undefined, { weekday: "short" });
      days.push({ key, label, amount: 0 });
    }

    const amountByDay = new Map<string, number>();
    for (const t of transactions) {
      const dt = new Date(t.timestamp);
      if (Number.isNaN(dt.getTime())) continue;
      dt.setHours(0, 0, 0, 0);
      const key = dt.toISOString().slice(0, 10);
      amountByDay.set(key, (amountByDay.get(key) ?? 0) + t.amount);
    }

    return days.map((d) => ({ day: d.label, amount: amountByDay.get(d.key) ?? 0 }));
  }, [transactions]);

  // Load data (prefer DB when available; fallback to localStorage)
  useEffect(() => {
    const loadData = async () => {
      try {
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
                data?.stats?.volume || mapped.reduce((sum: number, t: Transaction) => sum + t.amount, 0),
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

        const bvnStatus = localStorage.getItem("craftid_bvn_verified");
        setBvnVerified(bvnStatus === "true");
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      }
    };

    void loadData();
  }, [user?.slug, user?.fullName]);

  // Calculate CraftScore after transactions and bvn status are loaded
  useEffect(() => {
    const calculateScore = async () => {
      try {
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

  const onGenerateInvoice = async () => {
    setInvoiceError(null);

    const amount = Number(invoiceAmount);
    const email = invoiceEmail.trim();
    const description = invoiceDescription.trim();
    setInvoiceEmailTouched(true);

    if (!invoiceClientName.trim()) {
      setInvoiceError("Enter the client's name.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setInvoiceError("Enter a valid amount.");
      return;
    }
    if (!email) {
      setInvoiceError("Enter the client's email.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setInvoiceError("Enter a valid email address.");
      return;
    }

    if (!user?.slug) {
      setInvoiceError("Missing artisan profile. Please re-onboard and try again.");
      return;
    }

    setInvoiceCreating(true);

    try {
      const amountKobo = Math.trunc(amount * 100);
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: user.slug,
          amountKobo,
          customerName: invoiceClientName.trim(),
          customerEmail: email,
          description: description || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to create invoice");

      const ref = String(json?.invoice?.reference || "");
      if (!ref) throw new Error("Invoice created but missing reference");

      const payPath = `/pay/${encodeURIComponent(user.slug.toLowerCase())}/${encodeURIComponent(ref)}`;
      const payLink = typeof window !== "undefined" ? `${window.location.origin}${payPath}` : `https://craftid.ng${payPath}`;

      setGeneratedInvoice({
        id: ref,
        clientName: invoiceClientName.trim(),
        amount,
        email,
        description: description || undefined,
        createdAt: String(json?.invoice?.created_at || new Date().toISOString()),
        payLink,
      });
    } catch (e: any) {
      setInvoiceError(e?.message ?? "Failed to create invoice");
      setGeneratedInvoice(null);
    } finally {
      setInvoiceCreating(false);
    }
  };

  const invoiceAmountNumber = Number(invoiceAmount);
  const invoiceEmailTrimmed = invoiceEmail.trim();
  const invoiceEmailValid = /^\S+@\S+\.\S+$/.test(invoiceEmailTrimmed);
  const canGenerateInvoice =
    Boolean(invoiceClientName.trim()) &&
    Number.isFinite(invoiceAmountNumber) &&
    invoiceAmountNumber > 0 &&
    Boolean(invoiceEmailTrimmed) &&
    invoiceEmailValid &&
    !invoiceCreating;

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
            <p style={{ color: "var(--green)", fontSize: 14 }}>{stats.count > 0 ? `${formatNaira(stats.volume)} total processed` : "Receive your first payment to start tracking"}</p>
          </div>
          <div className="h-20 w-full lg:ml-auto lg:max-w-55"><ResponsiveContainer width="100%" height="100%"><AreaChart data={weeklyIncome}><defs><linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--orange)" stopOpacity={0.3} /><stop offset="100%" stopColor="var(--orange)" stopOpacity={0} /></linearGradient></defs><Area type="monotone" dataKey="amount" stroke="var(--orange)" strokeWidth={2} fill="url(#incomeFill)" /></AreaChart></ResponsiveContainer></div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Transactions" value={thisMonthCount} icon={TrendingUp} trend={thisMonthCount > 0 ? "up" : "neutral"} trendValue={thisMonthCount > 0 ? `${thisMonthCount} this month` : "No transactions yet"} sub="this month" />
        <StatsCard label="Avg Job Value" value={Math.round(avgJobValue)} prefix="₦" icon={Zap} sub="per transaction" />
        <StatsCard label="Unique Clients" value={uniqueClients} icon={Repeat2} trend={uniqueClients > 0 ? "up" : "neutral"} trendValue={uniqueClients > 0 ? `${uniqueClients} this month` : "None yet"} sub="this month" />
        <StatsCard label="Days Active" value={accountAgeDays} icon={Calendar} sub="of 60 for score" trendValue={`${Math.max(0, 60 - accountAgeDays)} left`} trend="neutral" />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="rounded-xl border p-6 lg:col-span-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="mb-4 flex items-center justify-between"><h3 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 20 }}>CraftScore</h3><a href="/score" style={{ color: "var(--orange)", fontSize: 13 }}>Full Report →</a></div>
          <p style={{ color: "var(--text-2)", fontSize: 12 }}>
            {stats.count === 0
              ? bvnVerified
                ? `BVN verified · ${craftScore} points (receive your first payment to unlock more)`
                : "Receive your first payment (or verify BVN) to start building your CraftScore."
              : `${scoreLevel} · ${craftScore} points`}
          </p>
          <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-start">
            <CraftScoreGauge score={craftScore} size="md" />
            <div className="w-full space-y-4">
              <div className="mb-1 flex justify-between text-xs"><span style={{ color: "var(--text-1)" }}>Identity</span><span style={{ color: "var(--text-2)" }}>{bvnVerified ? "150" : "0"}/150</span></div>
              <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "var(--border)" }}><div className="h-full rounded-full" style={{ width: `${bvnVerified ? 100 : 0}%`, background: "linear-gradient(90deg,var(--orange),var(--purple))" }} /></div>

              <div className="mb-1 flex justify-between text-xs"><span style={{ color: "var(--text-1)" }}>Transaction Count</span><span style={{ color: "var(--text-2)" }}>{hasPayments ? `${Math.min(stats.count * 5, 200)}` : "0"}/200</span></div>
              <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "var(--border)" }}><div className="h-full rounded-full" style={{ width: `${hasPayments ? (Math.min(stats.count * 5, 200) / 200) * 100 : 0}%`, background: "linear-gradient(90deg,var(--orange),var(--purple))" }} /></div>

              <div className="mb-1 flex justify-between text-xs"><span style={{ color: "var(--text-1)" }}>Volume</span><span style={{ color: "var(--text-2)" }}>{hasPayments ? `${Math.min(Math.floor(stats.volume / 1000), 300)}` : "0"}/300</span></div>
              <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "var(--border)" }}><div className="h-full rounded-full" style={{ width: `${hasPayments ? (Math.min(Math.floor(stats.volume / 1000), 300) / 300) * 100 : 0}%`, background: "linear-gradient(90deg,var(--orange),var(--purple))" }} /></div>

              <div className="mb-1 flex justify-between text-xs"><span style={{ color: "var(--text-1)" }}>Account Tenure</span><span style={{ color: "var(--text-2)" }}>{hasPayments ? accountConsistencyPoints : 0}/200</span></div>
              <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "var(--border)" }}><div className="h-full rounded-full" style={{ width: `${hasPayments ? (accountConsistencyPoints / 200) * 100 : 0}%`, background: "linear-gradient(90deg,var(--orange),var(--purple))" }} /></div>
            </div>
          </div>
        </div>

        <div className="relative rounded-xl border p-6 lg:col-span-2" style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.06), var(--surface))", borderColor: "rgba(249,115,22,0.25)" }}>
          <div className="pointer-events-none absolute -right-8 -top-6 h-28 w-28 rounded-full" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.25), transparent 70%)" }} />
          <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs" style={{ background: "var(--orange-dim)", borderColor: "rgba(249,115,22,0.2)", color: "var(--orange)" }}>{craftScore >= 350 ? "✓ Pre-Approved" : "🔒 Locked"}</span>
          <p className="mt-3" style={{ fontFamily: "var(--font-syne)", fontSize: "clamp(32px,9vw,44px)", fontWeight: 800 }}>{formatNaira(craftScore >= 350 ? (craftScore >= 650 ? 1000000 : craftScore >= 500 ? 500000 : 150000) : 0)}</p>
          <p style={{ color: "var(--text-2)", fontSize: 14 }}>Equipment Loan</p>
          <p className="mt-1" style={{ color: "var(--text-2)", fontSize: 13 }}>{craftScore >= 350 ? "6 months · 3.5%/month" : "Reach 350+ score to unlock"}</p>
          {craftScore >= 350 && <p className="mt-2" style={{ color: "var(--yellow)", fontSize: 12 }}>⏳ Offer expires in 30 days</p>}
          <a href="/loan" className={`mt-6 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 ${craftScore >= 350 ? "" : "opacity-50 cursor-not-allowed"}`} style={{ background: craftScore >= 350 ? "var(--orange)" : "var(--surface)", color: craftScore >= 350 ? "white" : "var(--text-3)", fontFamily: "var(--font-syne)", fontWeight: 700 }}>
            {craftScore >= 350 ? "Claim Offer →" : "Build Score to Unlock"}
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="rounded-xl border p-6 lg:col-span-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="mb-3 flex items-center justify-between"><h3 style={{ fontFamily: "var(--font-syne)", fontSize: 20, fontWeight: 700 }}>Recent Payments</h3><a href="/dashboard/payments-invoices" style={{ color: "var(--orange)", fontSize: 13 }}>View All →</a></div>
          {transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.slice(0, 6).map((tx) => (
                <div key={tx.id} className="flex justify-between items-center border-b pb-2" style={{ borderColor: "var(--border)" }}>
                  <div>
                    <p style={{ color: "var(--text-1)", fontSize: 14 }}>{tx.clientName} paid you</p>
                    <p style={{ color: "var(--text-2)", fontSize: 12 }}>{Number.isNaN(new Date(tx.timestamp).getTime()) ? "-" : new Date(tx.timestamp).toLocaleDateString()}</p>
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
          {/* <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="mb-3 flex items-center justify-between">
              <h3 style={{ fontFamily: "var(--font-syne)", fontSize: 18, fontWeight: 700 }}>Generate Invoice</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs" style={{ color: "var(--text-2)" }}>Client name</label>
                <input
                  value={invoiceClientName}
                  onChange={(e) => setInvoiceClientName(e.target.value)}
                  className="h-10 w-full rounded-xl border px-3 text-sm"
                  style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-1)" }}
                  placeholder="e.g. Tolu A."
                />
              </div>

              <div>
                <label className="mb-1 block text-xs" style={{ color: "var(--text-2)" }}>Amount (₦)</label>
                <input
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  inputMode="numeric"
                  className="h-10 w-full rounded-xl border px-3 text-sm"
                  style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-1)" }}
                  placeholder="e.g. 15000"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs" style={{ color: "var(--text-2)" }}>Client email</label>
                <input
                  value={invoiceEmail}
                  onChange={(e) => setInvoiceEmail(e.target.value)}
                  onBlur={() => setInvoiceEmailTouched(true)}
                  inputMode="email"
                  className="h-10 w-full rounded-xl border px-3 text-sm"
                  style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-1)" }}
                  placeholder="e.g. tolu@gmail.com"
                />
                {invoiceEmailTouched && !invoiceEmailTrimmed ? (
                  <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>Email is required.</p>
                ) : invoiceEmailTouched && !invoiceEmailValid ? (
                  <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>Enter a valid email address.</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-xs" style={{ color: "var(--text-2)" }}>Description (optional)</label>
                <textarea
                  value={invoiceDescription}
                  onChange={(e) => setInvoiceDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-1)" }}
                  placeholder="e.g. Kitchen cabinet installation (materials included)"
                />
              </div>

              {invoiceError ? (
                <p className="text-xs" style={{ color: "var(--red)" }}>{invoiceError}</p>
              ) : null}

              <button
                onClick={onGenerateInvoice}
                disabled={!canGenerateInvoice}
                className={`inline-flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm ${canGenerateInvoice ? "" : "opacity-50 cursor-not-allowed"}`}
                style={{ background: "var(--orange)", color: "white", fontFamily: "var(--font-syne)", fontWeight: 700 }}
              >
                {invoiceCreating ? "Generating…" : "Generate"}
              </button>

              {generatedInvoice ? (
                <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                  <p className="text-xs" style={{ color: "var(--text-2)" }}>Invoice ID</p>
                  <p style={{ color: "var(--text-1)", fontFamily: "var(--font-dm-mono)", fontWeight: 700 }}>{generatedInvoice.id}</p>
                  <p className="mt-2 text-sm" style={{ color: "var(--text-2)" }}>
                    {generatedInvoice.clientName} · {formatNaira(generatedInvoice.amount)}
                  </p>
                  {generatedInvoice.email ? (
                    <p className="mt-1 text-xs" style={{ color: "var(--text-2)" }}>
                      {generatedInvoice.email}
                    </p>
                  ) : null}
                  {generatedInvoice.description ? (
                    <p className="mt-2 text-xs" style={{ color: "var(--text-2)" }}>
                      {generatedInvoice.description}
                    </p>
                  ) : null}

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <a
                      href={generatedInvoice.payLink}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-0 truncate text-xs"
                      style={{ color: "var(--orange)", fontFamily: "var(--font-dm-mono)" }}
                    >
                      {generatedInvoice.payLink}
                    </a>
                    <div className="rounded-md p-2" style={{ background: "white" }}>
                      <QRCodeSVG value={generatedInvoice.payLink} size={72} fgColor="#09090E" bgColor="#FFFFFF" />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div> */}
        </div>
      </div>
    </motion.div>
  );
}