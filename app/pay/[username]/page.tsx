"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, MapPin, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { formatNaira } from "@/lib/utils";
import { useUser, type UserProfile } from "@/lib/useUser";

declare global {
  interface Window {
    webpayCheckout?: (config: Record<string, unknown>) => void;
  }
}

type StoredTransaction = {
  id: string;
  amount: number;
  clientName: string;
  artisanName: string;
  timestamp: string;
  status?: string;
  purpose?: string | null;
};

const parseJsonSafe = <T,>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export default function PublicPayPage() {
  const params = useParams();
  const username = params?.username as string;
  const { user } = useUser();

  const fallbackName = (username || "artisan")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  const [expanded, setExpanded] = useState(false);
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [artisanProfile, setArtisanProfile] = useState<UserProfile | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<StoredTransaction[]>([]);

  const parsedAmount = useMemo(() => Number(amount.replace(/,/g, "") || 0), [amount]);

  useEffect(() => {
    let matchedLocalProfile: UserProfile | null = null;

    type PaymentRow = {
      id?: string;
      txn_ref?: string;
      amount_kobo?: number;
      client_name?: string;
      artisan_slug?: string;
      paid_at?: string;
      status?: string;
      purpose?: string | null;
    };

    const fetchFromDb = async () => {
      try {
        const [profileRes, paymentsRes] = await Promise.all([
          fetch(`/api/users/${encodeURIComponent(username)}`),
          fetch(`/api/payments?slug=${encodeURIComponent(username)}&limit=3`),
        ]);

        if (profileRes.ok) {
          const profileJson = await profileRes.json();
          const profile = profileJson?.artisan?.profile;
          if (profile && typeof profile === "object") {
            setArtisanProfile(profile as UserProfile);
          }
        }

        if (paymentsRes.ok) {
          const paymentsJson = await paymentsRes.json();
          const txs = Array.isArray(paymentsJson?.payments) ? paymentsJson.payments : [];
          const mapped = (txs as PaymentRow[])
            .slice(0, 3)
            .map((tx, index) => ({
              id: tx.txn_ref || tx.id || `tx-${index}`,
              clientName: tx.client_name || "Client",
              amount: Number(tx.amount_kobo || 0) / 100,
              artisanName: matchedLocalProfile?.fullName || fallbackName || "Artisan",
              timestamp: tx.paid_at || new Date().toISOString(),
              status: tx.status || "completed",
              purpose: tx.purpose || null,
            }));
          setRecentTransactions(mapped);
        }
      } catch (err) {
        console.error("[CraftID] Failed to fetch public profile/payments:", err);
      }
    };

    try {
      const profileCandidates: UserProfile[] = [];
      const parsedUser = parseJsonSafe<UserProfile>(localStorage.getItem("craftid_user"));

      if (parsedUser && typeof parsedUser === "object") {
        profileCandidates.push(parsedUser);
      }

      if (user && typeof user === "object") {
        profileCandidates.push(user);
      }

      const slugToFind = (username || "").toLowerCase();
      matchedLocalProfile = profileCandidates.find((candidate) => candidate.slug === slugToFind) || null;
      setArtisanProfile(matchedLocalProfile);

      const parsedTransactions = parseJsonSafe<StoredTransaction[]>(localStorage.getItem("craftid_transactions"));
      if (Array.isArray(parsedTransactions)) {
        const artisanNames = new Set(
          profileCandidates
            .map((candidate) => candidate.fullName)
            .filter((candidateName) => typeof candidateName === "string" && candidateName.length > 0),
        );

        const filteredTransactions = parsedTransactions
          .filter((tx) => {
            if (!tx || typeof tx !== "object") return false;
            if (artisanNames.size > 0) {
              return artisanNames.has(tx.artisanName);
            }
            return true;
          })
          .slice(-3)
          .reverse()
          .map((tx, index) => ({
            id: tx.id || `tx-${index}`,
            clientName: tx.clientName || "Client",
            amount: Number(tx.amount) || 0,
            artisanName: tx.artisanName || "Artisan",
            timestamp: tx.timestamp || "Just now",
          }));

        setRecentTransactions(filteredTransactions);
      }
    } catch (error) {
      console.error("Failed to load artisan profile:", error);
    } finally {
      if (!matchedLocalProfile && username) {
        void fetchFromDb().finally(() => setProfileLoading(false));
      } else {
        setProfileLoading(false);
      }
    }
  }, [username, user, fallbackName]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (typeof window.webpayCheckout === "function") {
      setCheckoutReady(true);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-craftid="interswitch-checkout"]',
    );

    const setReady = () => {
      if (typeof window.webpayCheckout === "function") {
        setCheckoutReady(true);
        setPaymentError(null);
      }
    };

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://newwebpay.qa.interswitchng.com/inline-checkout.js";
      script.async = true;
      script.setAttribute("data-craftid", "interswitch-checkout");
      script.onload = setReady;
      script.onerror = () => {
        setCheckoutReady(false);
        setPaymentError("Could not load payment checkout. Please refresh and try again.");
      };
      document.head.appendChild(script);
    }

    const timer = window.setInterval(() => {
      if (typeof window.webpayCheckout === "function") {
        setReady();
        window.clearInterval(timer);
      }
    }, 250);

    return () => window.clearInterval(timer);
  }, []);

  const resolvedUser = artisanProfile || user;
  const artisanName = resolvedUser?.fullName || fallbackName || "Artisan";
  const artisanInitials =
    artisanName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "AR";
  const artisanSkill = resolvedUser?.skill || "Artisan";
  const artisanState = resolvedUser?.state || "Nigeria";
  const artisanBio = resolvedUser?.bio || "Trusted artisan on CraftID. Pay securely with Interswitch.";

  const artisanRateCard = [
    { service: "Minimum job", price: Number((resolvedUser?.minJob || "0").replace(/,/g, "")) || 0 },
    { service: "Average job", price: Number((resolvedUser?.avgJob || "0").replace(/,/g, "")) || 0 },
    { service: "Premium job", price: Number((resolvedUser?.premiumJob || "0").replace(/,/g, "")) || 0 },
  ].filter((item) => item.price > 0);

  const handlePay = async () => {
    if (!parsedAmount) return;
    setPaymentError(null);

    if (
      !process.env.NEXT_PUBLIC_ISW_MERCHANT_CODE ||
      !process.env.NEXT_PUBLIC_ISW_PAY_ITEM_ID ||
      !process.env.NEXT_PUBLIC_ISW_MODE
    ) {
      setPaymentError("Payment configuration is missing. Please contact support.");
      return;
    }

    if (typeof window === "undefined" || typeof window.webpayCheckout !== "function") {
      setPaymentError("Payment checkout is still loading. Please wait a moment and try again.");
      return;
    }

    setLoading(true);

    const amountInKobo = parsedAmount * 100;
    const txnRef = `craftid_${username}_${Date.now()}`;

    try {
      window.webpayCheckout({
        merchant_code: process.env.NEXT_PUBLIC_ISW_MERCHANT_CODE,
        pay_item_id: process.env.NEXT_PUBLIC_ISW_PAY_ITEM_ID,
        txn_ref: txnRef,
        amount: amountInKobo,
        currency: 566,
        site_redirect_url: window.location.href,
        cust_email: "client@craftid.ng",
        cust_name: name || "Client",
        pay_item_name: purpose || `Payment to ${artisanName}`,
        mode: process.env.NEXT_PUBLIC_ISW_MODE,
        onComplete: async (response: unknown) => {
          setLoading(false);
          try {
            const r = response as { resp?: unknown; ResponseCode?: unknown } | null;
            if (r?.resp === "00" || r?.ResponseCode === "00") {
              const verify = await fetch("/api/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  txnRef,
                  amount: amountInKobo,
                  username,
                  clientName: name || "Client",
                  artisanName,
                  purpose: purpose || null,
                }),
              });

              const result = await verify.json();
              if (result.success && result.transaction) {
                const existingTransactions = parseJsonSafe<StoredTransaction[]>(localStorage.getItem("craftid_transactions")) || [];
                existingTransactions.push(result.transaction);
                localStorage.setItem("craftid_transactions", JSON.stringify(existingTransactions));

                const stats = parseJsonSafe<{ count: number; volume: number }>(localStorage.getItem("craftid_stats")) || {
                  count: 0,
                  volume: 0,
                };
                stats.count += 1;
                stats.volume += result.transaction.amount;
                localStorage.setItem("craftid_stats", JSON.stringify(stats));

                setPaidAmount(parsedAmount);
                setSuccess(true);
              } else {
                setPaymentError("Payment could not be verified. Please contact support.");
              }
            } else {
              setPaymentError("Payment was not completed. Please try again.");
            }
          } catch (error) {
            console.error("Payment verification failed:", error);
            setPaymentError("Payment verification failed. Please try again.");
          }
        },
      });
    } catch (error) {
      console.error("Checkout launch failed:", error);
      setLoading(false);
      setPaymentError("Unable to start checkout. Please refresh and try again.");
    }
  };

  if (profileLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: "#F97316", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={{ minHeight: "100vh", background: "#F8FAFC", color: "#0F172A" }}
    >
      <header className="border-b bg-white px-6 py-3" style={{ borderColor: "#E2E8F0" }}>
        <div className="mx-auto flex w-full max-w-330 items-center justify-between">
          <p style={{ fontFamily: "var(--font-syne)", fontWeight: 800, fontSize: 18, background: "linear-gradient(135deg,#F97316,#7C3AED)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            CraftID
          </p>
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs" style={{ borderColor: "#E2E8F0", color: "#64748B" }}>
            <Shield size={12} />Powered by Interswitch
          </span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-130 px-4 py-8">
        {!success ? (
          <>
            <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "#E2E8F0", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-16 w-16 place-items-center rounded-2xl" style={{ background: "linear-gradient(135deg,#F97316,#7C3AED)", color: "white", fontWeight: 700 }}>
                  {artisanInitials}
                </div>
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs" style={{ background: "#DBEAFE", color: "#1D4ED8" }}>
                  <CheckCircle2 size={12} />Verified
                </span>
              </div>
              <h1 className="mt-3" style={{ fontFamily: "var(--font-syne)", fontSize: 22, fontWeight: 700 }}>
                {artisanName}
              </h1>
              <p className="mt-1 flex items-center gap-2" style={{ color: "#64748B", fontSize: 13 }}>
                🔧 {artisanSkill} <MapPin size={13} /> {artisanState}
              </p>
              <p className="mt-1" style={{ color: "#F97316", fontSize: 13 }}>
                ★★★★☆ 4.8
              </p>
              <p className="mt-4 border-t pt-4" style={{ borderColor: "#F1F5F9", color: "#64748B", fontSize: 14 }}>
                {artisanBio}
              </p>
              <button onClick={() => setExpanded((prev) => !prev)} className="mt-4 flex w-full items-center justify-between border-t pt-3 text-sm" style={{ borderColor: "#F1F5F9", color: "#64748B" }}>
                View rate card {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {expanded ? (
                <div className="mt-2 space-y-2">
                  {artisanRateCard.length > 0 ? (
                    artisanRateCard.map((rate) => (
                      <div key={rate.service} className="flex justify-between text-sm">
                        <span>{rate.service}</span>
                        <span style={{ fontFamily: "var(--font-dm-mono)", fontWeight: 700 }}>{formatNaira(rate.price)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm" style={{ color: "#64748B" }}>
                      No rate card provided yet.
                    </p>
                  )}
                </div>
              ) : null}
            </div>

            <div className="mt-3 rounded-2xl border bg-white p-6" style={{ borderColor: "#E2E8F0" }}>
              <h2 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 18 }}>Make a payment</h2>
              <div className="mt-4 rounded-xl border-2 px-4 py-4" style={{ borderColor: "#E2E8F0" }}>
                <div className="flex items-center">
                  <span style={{ color: "#F97316", fontFamily: "var(--font-dm-mono)", fontSize: 28, fontWeight: 700 }}>₦</span>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ","))}
                    placeholder="0"
                    className="w-full bg-transparent px-2 outline-none"
                    style={{ fontFamily: "var(--font-dm-mono)", fontSize: 28, fontWeight: 700, color: "#0F172A", background: "transparent", WebkitTextFillColor: "#0F172A" }}
                  />
                </div>
              </div>
              <input
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="What's this for?"
                className="mt-3 w-full rounded-xl border px-4 py-3"
                style={{ background: "white", borderColor: "#E2E8F0", color: "#0F172A" }}
              />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
                className="mt-3 w-full rounded-xl border px-4 py-3"
                style={{ background: "white", borderColor: "#E2E8F0", color: "#0F172A" }}
              />
              <button
                onClick={handlePay}
                disabled={!parsedAmount || loading || !checkoutReady}
                className="mt-4 w-full rounded-2xl px-4 py-4.5"
                style={{ background: parsedAmount && checkoutReady ? "#F97316" : "#F1F5F9", color: parsedAmount && checkoutReady ? "white" : "#94A3B8", fontFamily: "var(--font-syne)", fontSize: 18, fontWeight: 700 }}
              >
                {loading ? "Processing..." : `Pay ${formatNaira(parsedAmount || 0)} →`}
              </button>
              {paymentError ? <p className="mt-3 text-sm" style={{ color: "#DC2626" }}>{paymentError}</p> : null}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs" style={{ color: "#64748B" }}>
                <Shield size={12} />Secured by Interswitch · VERVE VISA
              </div>
            </div>

            <div className="mt-3 rounded-xl border bg-white p-4" style={{ borderColor: "#F1F5F9" }}>
              <p className="mb-2 text-[11px] uppercase tracking-[0.15em]" style={{ color: "#94A3B8" }}>
                Recent activity
              </p>
              {recentTransactions.length > 0 ? (
                recentTransactions.map((tx) => (
                  <p key={tx.id} className="text-sm" style={{ color: "#64748B" }}>
                    {(tx.clientName || "Client").split(" ")[0]} paid {formatNaira(tx.amount || 0)} · {tx.timestamp || "Just now"}
                  </p>
                ))
              ) : (
                <p className="text-sm" style={{ color: "#64748B" }}>No recent activity yet.</p>
              )}
            </div>
          </>
        ) : (
          <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
            <motion.div initial={{ scale: 0.3 }} animate={{ scale: 1 }} className="mb-4 grid h-20 w-20 place-items-center rounded-full" style={{ background: "#DCFCE7", color: "#16A34A" }}>
              <CheckCircle2 size={42} />
            </motion.div>
            <h2 style={{ fontFamily: "var(--font-syne)", fontSize: 34, fontWeight: 800 }}>Payment Sent!</h2>
            <p style={{ color: "#64748B", marginTop: 6 }}>
              You paid {formatNaira(paidAmount)} to {artisanName}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-xs" style={{ color: "#64748B" }}>
              <Shield size={12} />Secured by Interswitch
            </span>
            <button
              onClick={() => {
                setSuccess(false);
                setAmount("");
                setPurpose("");
                setName("");
              }}
              className="mt-6 rounded-xl border px-4 py-3"
              style={{ borderColor: "#E2E8F0", color: "#0F172A" }}
            >
              Make Another Payment
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
