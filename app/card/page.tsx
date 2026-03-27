"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, FileText, KeyRound, Snowflake, Wallet, AlertCircle, CheckCircle2 } from "lucide-react";
import { VirtualCard } from "@/components/virtual-card";
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

export default function CardPage() {
  const { user, loading: userLoading } = useUser();
  const [frozen, setFrozen] = useState(false);
  const [craftScore, setCraftScore] = useState(0);
  const [bvnVerified, setBvnVerified] = useState(false);
  const [stats, setStats] = useState({ count: 0, volume: 0 });
  const [loading, setLoading] = useState(true);
  const [cardTransactions, setCardTransactions] = useState<Transaction[]>([]);

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
          // Card transactions would come from card usage, but for demo we'll show recent payments
          setCardTransactions(txns.slice(0, 5));
        }

        // Load BVN verification status
        const bvnStatus = localStorage.getItem("craftid_bvn_verified");
        setBvnVerified(bvnStatus === "true");
      } catch (err) {
        console.error("Error loading card data:", err);
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

  // Calculate card limits based on score
  const cardLimit = craftScore >= 500 ? 500000 : craftScore >= 350 ? 200000 : craftScore >= 200 ? 50000 : 0;
  const cardAvailable = cardLimit > 0 ? Math.min(cardLimit, stats.volume * 2) : 0;
  const isEligible = craftScore >= 200;

  // Card expiry (3 years from now)
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 3);
  const expiryFormatted = `${expiry.getMonth() + 1}/${expiry.getFullYear().toString().slice(-2)}`;

  const actions = [
    { label: "Freeze Card", icon: Snowflake, action: () => setFrozen(!frozen) },
    { label: "Change PIN", icon: KeyRound, action: () => alert("PIN change would be sent to your phone via SMS") },
    { label: "View Statements", icon: FileText, action: () => alert("Statements will be available in the full version") },
    { label: "Add to Wallet", icon: Wallet, action: () => alert("Add to Google Pay/Apple Pay coming soon") },
  ];

  if (loading || userLoading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--orange)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!isEligible) {
    const pointsNeeded = 200 - craftScore;
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }} className="space-y-4">
        <header>
          <h1 style={{ fontFamily: "var(--font-syne)", fontSize: 28, fontWeight: 700 }}>My Card</h1>
          <p style={{ color: "var(--text-2)" }}>Virtual Verve Business Card for {user?.firstName || "Artisan"}</p>
        </header>

        <div className="rounded-xl border p-8 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <AlertCircle size={48} style={{ color: "var(--orange)", margin: "0 auto 16px auto" }} />
          <h2 style={{ fontFamily: "var(--font-syne)", fontSize: 20, fontWeight: 700 }}>Card Unavailable</h2>
          <p style={{ color: "var(--text-2)", marginTop: 8 }}>
            Your CraftScore is <strong>{craftScore}</strong>. You need <strong>{pointsNeeded}</strong> more points to unlock the Virtual Verve Card.
          </p>
          <div className="mt-6 rounded-lg border p-4" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--text-2)" }}>Ways to increase your score:</p>
            <ul className="mt-2 text-left text-sm space-y-1" style={{ color: "var(--text-2)" }}>
              <li>✓ Make {Math.ceil(pointsNeeded / 5)} more transactions</li>
              <li>✓ Process at least ₦{Math.ceil((200 - craftScore) * 1000)} in payments</li>
              <li>✓ Verify your identity with BVN</li>
            </ul>
          </div>
          <a
            href="/score"
            className="mt-6 inline-block rounded-xl px-6 py-3"
            style={{ background: "var(--orange)", color: "white" }}
          >
            View Score Details →
          </a>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }} className="space-y-4">
      <header>
        <h1 style={{ fontFamily: "var(--font-syne)", fontSize: 28, fontWeight: 700 }}>My Card</h1>
        <p style={{ color: "var(--text-2)" }}>Virtual Verve Business Card for {user?.firstName || "Artisan"}</p>
      </header>

      <section className="mx-auto max-w-115" style={frozen ? { filter: "grayscale(100%)", opacity: 0.5 } : {}}>
        <VirtualCard
          last4={stats.count > 0 ? String(stats.count).slice(-4).padStart(4, '0') : "0000"}
          expiry={expiryFormatted}
          name="CraftID Business"
          limit={cardLimit}
          available={cardAvailable}
        />
      </section>

      <div className="rounded-xl border px-4 py-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between">
          <span>Virtual Verve · Business · {frozen ? "Frozen" : "Active"}</span>
          <span className="inline-flex items-center gap-1 text-sm" style={{ color: frozen ? "var(--red)" : "var(--green)" }}>
            <span className="h-2 w-2 rounded-full" style={{ background: frozen ? "var(--red)" : "var(--green)" }} />
            {frozen ? "Frozen" : "Active"}
          </span>
        </div>
      </div>

      {frozen ? (
        <div className="rounded-xl border p-3" style={{ background: "rgba(234,179,8,0.1)", borderColor: "var(--yellow)", color: "var(--yellow)" }}>
          Card is frozen. Tap &quot;Unfreeze Card&quot; to reactivate.
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        {actions.map(({ label, icon: Icon, action }) => {
          const isFreeze = label === "Freeze Card";
          return (
            <motion.button
              whileHover={{ y: -3 }}
              key={label}
              onClick={action}
              className="rounded-xl border p-4 text-left"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="mb-2 inline-flex rounded-[10px] p-2" style={{ background: "var(--surface-2)" }}>
                <Icon size={20} />
              </div>
              <p>{isFreeze && frozen ? "Unfreeze Card" : label}</p>
            </motion.button>
          );
        })}
      </div>

      <section className="rounded-xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <h3 style={{ fontFamily: "var(--font-syne)", fontWeight: 700 }}>Recent Activity</h3>
        {cardTransactions.length > 0 ? (
          <div className="mt-3 space-y-2">
            {cardTransactions.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center border-b pb-2" style={{ borderColor: "var(--border)" }}>
                <div>
                  <p style={{ color: "var(--text-1)", fontSize: 14 }}>Payment from {tx.clientName}</p>
                  <p style={{ color: "var(--text-2)", fontSize: 12 }}>{new Date(tx.timestamp).toLocaleDateString()}</p>
                </div>
                <p style={{ fontFamily: "var(--font-dm-mono)", fontWeight: 700, color: "var(--green)" }}>
                  +{formatNaira(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid h-40 place-items-center text-center">
            <CreditCard size={36} style={{ color: "var(--text-3)" }} />
            <p style={{ color: "var(--text-1)", fontSize: 14 }}>No card transactions yet</p>
            <p style={{ color: "var(--text-2)", fontSize: 12 }}>Use your card to buy tools, materials, or supplies.</p>
          </div>
        )}
      </section>

      <section className="flex flex-col items-start justify-between gap-3 rounded-xl border p-5 md:flex-row md:items-center" style={{ background: "linear-gradient(135deg, var(--purple-dim), var(--surface))", borderColor: "rgba(124,58,237,0.2)" }}>
        <div>
          <p style={{ fontWeight: 600 }}>
            {craftScore >= 500 ? (
              <span className="inline-flex items-center gap-1"><CheckCircle2 size={16} style={{ color: "var(--green)" }} /> Maximum Limit Reached!</span>
            ) : (
              `Increase your limit to ${formatNaira(craftScore >= 350 ? 500000 : 200000)}`
            )}
          </p>
          <p style={{ color: "var(--text-2)", fontSize: 13 }}>
            {craftScore >= 500
              ? "You've unlocked the maximum card limit"
              : `${craftScore >= 350 ? "Reach CraftScore 500" : "Reach CraftScore 350 for ₦200,000, then 500 for ₦500,000"}`
            }
          </p>
        </div>
        <a href="/score" className="rounded-xl px-4 py-2" style={{ background: "var(--purple)", color: "white" }}>
          View Score →
        </a>
      </section>
    </motion.div>
  );
}