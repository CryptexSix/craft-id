"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FileDown, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { useUser } from "@/lib/useUser";
import { formatNaira } from "@/lib/utils";
import { generateCraftIDReport, type CraftData } from "@/lib/reports/craftid-report";
import { ReportSidebar } from "@/app/report/components/report-sidebar";

type DbPayment = {
    txn_ref: string;
    amount_kobo: number;
    paid_at: string;
    client_name: string | null;
    purpose: string | null;
    status: string;
};

function daysBetweenInclusive(fromISO: string, toISO: string) {
    const from = new Date(fromISO);
    const to = new Date(toISO);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;
    const diffMs = to.getTime() - from.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
}

function toISODate(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

export default function ReportPage() {
    const router = useRouter();
    const { user, loading: userLoading } = useUser();
    const slug = (user?.slug ?? "").toLowerCase();

    const [bvnVerified, setBvnVerified] = useState(false);

    const [payments, setPayments] = useState<DbPayment[]>([]);
    const [loadingPayments, setLoadingPayments] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [craftScore850, setCraftScore850] = useState<number>(0);
    const [loadingScore, setLoadingScore] = useState(true);

    useEffect(() => {
        if (userLoading) return;
        const localBVN = (() => {
            try {
                return localStorage.getItem("craftid_bvn_verified") === "true";
            } catch {
                return false;
            }
        })();
        setBvnVerified(Boolean(user?.bvnVerified) || localBVN);
    }, [user?.bvnVerified, userLoading]);

    useEffect(() => {
        const load = async () => {
            if (!slug) {
                setPayments([]);
                setLoadingPayments(false);
                setError("Missing user profile (slug).");
                return;
            }
            setLoadingPayments(true);
            setError(null);

            try {
                const res = await fetch(`/api/payments?slug=${encodeURIComponent(slug)}&limit=100`);
                const json = await res.json();
                if (!res.ok) throw new Error(json?.error ?? "Failed to load payments");

                const all: DbPayment[] = Array.isArray(json?.payments) ? json.payments : [];
                setPayments(all.filter((p) => p?.status === "completed" || p?.status === "success"));
            } catch (e: any) {
                setError(e?.message ?? "Failed to load payments");
                setPayments([]);
            } finally {
                setLoadingPayments(false);
            }
        };

        if (!userLoading) void load();
    }, [slug, userLoading]);

    useEffect(() => {
        const loadScore = async () => {
            setLoadingScore(true);
            try {
                if (!user?.createdAt) return;
                if (loadingPayments) return;
                const created = new Date(user.createdAt);
                const accountAgeDays = Number.isNaN(created.getTime())
                    ? 0
                    : Math.max(0, Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)) + 1);

                const txCount = payments.length;
                const totalVolume = payments.reduce((sum, p) => sum + (Number(p?.amount_kobo || 0) / 100), 0);

                const bvnStatus = user?.bvnVerified === true || localStorage.getItem("craftid_bvn_verified") === "true";

                const scoreRes = await fetch("/api/craft-score", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        bvnVerified: bvnStatus,
                        transactionCount: txCount,
                        totalVolume,
                        accountAgeDays,
                    }),
                });
                const scoreJson = await scoreRes.json();
                setCraftScore850(Number(scoreJson?.score) || 0);
            } catch {
                setCraftScore850(0);
            } finally {
                setLoadingScore(false);
            }
        };

        if (!userLoading) void loadScore();
    }, [loadingPayments, payments, userLoading, user?.createdAt, user?.bvnVerified]);

    useEffect(() => {
        if (userLoading) return;
        if (!user) {
            router.replace("/dashboard");
        }
    }, [router, user, userLoading]);

    const craftData: CraftData | null = useMemo(() => {
        if (!user) return null;

        const txs = payments
            .slice()
            .sort((a, b) => {
                const ad = new Date(a.paid_at).getTime();
                const bd = new Date(b.paid_at).getTime();
                return ad - bd;
            })
            .map((p) => {
                const date = (() => {
                    const d = new Date(p.paid_at);
                    return Number.isNaN(d.getTime()) ? "-" : toISODate(d);
                })();

                const clientRef = (p.client_name || "CLIENT").toUpperCase().slice(0, 14);
                const description = p.purpose || "Payment";
                const amount = Number(p.amount_kobo || 0) / 100;
                return { date, clientRef, description, amount };
            });

        const totalRevenue = txs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const totalTransactions = txs.length;

        const uniqueClients = (() => {
            const s = new Set<string>();
            for (const p of payments) {
                const v = (p.client_name || "").trim().toLowerCase();
                if (v) s.add(v);
            }
            return s.size;
        })();

        const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
        const highestTransaction = txs.reduce((max, t) => Math.max(max, Number(t.amount) || 0), 0);

        const periodFrom = txs[0]?.date || toISODate(new Date());
        const periodTo = txs[txs.length - 1]?.date || toISODate(new Date());

        const craftScore = craftScore850;

        return {
            name: user.fullName,
            skill: user.skill,
            craftIdNumber: user.slug,
            location: user.state,
            phone: user.phone,
            memberSince: user.createdAt ? toISODate(new Date(user.createdAt)) : "-",
            reportPeriod: {
                from: periodFrom,
                to: periodTo,
                days: daysBetweenInclusive(periodFrom, periodTo),
            },
            totalRevenue,
            totalTransactions,
            uniqueClients,
            averageTransaction,
            highestTransaction,
            craftScore,
            transactions: txs,
        };
    }, [payments, user, craftScore850]);

    const canDownload = Boolean(craftData) && !loadingPayments && !loadingScore && bvnVerified;

    return (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="mx-auto w-full max-w-5xl">
                <a href="/dashboard" className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--text-2)" }}>
                    <ArrowLeft size={16} /> Back to dashboard
                </a>

                <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 style={{ fontFamily: "var(--font-syne)", fontSize: 30, fontWeight: 800 }}>Income Verification PDF</h1>
                        <p className="text-sm" style={{ color: "var(--text-2)" }}>
                            Generate a bank-grade report you can submit as proof of income.
                        </p>
                    </div>

                    <button
                        type="button"
                        disabled={!canDownload}
                        onClick={async () => {
                            if (!craftData) return;
                            if (!bvnVerified) {
                                setError("BVN must be verified before generating this report.");
                                return;
                            }
                            try {
                                await generateCraftIDReport(craftData);
                            } catch (e: any) {
                                setError(e?.message ?? "Failed to generate PDF");
                            }
                        }}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm ${canDownload ? "" : "opacity-50 cursor-not-allowed"}`}
                        style={{ background: "var(--orange)", color: "white", fontFamily: "var(--font-syne)", fontWeight: 700 }}
                    >
                        <FileDown size={16} /> Download PDF
                    </button>
                </div>

                {!bvnVerified ? (
                    <div className="mt-3 rounded-xl border px-4 py-3 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                        <p style={{ color: "var(--text-2)" }}>
                            BVN verification is required before you can generate or download this report.
                        </p>
                        <a href="/score" className="mt-2 inline-flex" style={{ color: "var(--orange)", fontWeight: 700 }}>
                            Verify BVN on Score Page →
                        </a>
                    </div>
                ) : null}

                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
                    <div className="rounded-xl border p-6 lg:col-span-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                        <h2 style={{ fontFamily: "var(--font-syne)", fontWeight: 800, fontSize: 18 }}>Report preview</h2>

                        {userLoading || loadingPayments ? (
                            <p className="mt-2 text-sm" style={{ color: "var(--text-2)" }}>
                                Loading report data…
                            </p>
                        ) : error ? (
                            <p className="mt-2 text-sm" style={{ color: "var(--red)" }}>
                                {error}
                            </p>
                        ) : !craftData ? (
                            <p className="mt-2 text-sm" style={{ color: "var(--text-2)" }}>
                                Missing artisan data.
                            </p>
                        ) : (
                            <div className="mt-3 space-y-2">
                                <div className="rounded-lg border px-4 py-3" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                                    <p className="text-xs" style={{ color: "var(--text-3)" }}>Artisan</p>
                                    <p className="text-sm" style={{ color: "var(--text-1)" }}>
                                        {craftData.name} · {craftData.skill}
                                    </p>
                                </div>

                                <div className="grid gap-2 md:grid-cols-2">
                                    <div className="rounded-lg border px-4 py-3" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                                        <p className="text-xs" style={{ color: "var(--text-3)" }}>Total revenue</p>
                                        <p style={{ fontFamily: "var(--font-dm-mono)", fontWeight: 800, color: "var(--text-1)" }}>{formatNaira(craftData.totalRevenue)}</p>
                                    </div>
                                    <div className="rounded-lg border px-4 py-3" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                                        <p className="text-xs" style={{ color: "var(--text-3)" }}>Transactions</p>
                                        <p style={{ fontFamily: "var(--font-dm-mono)", fontWeight: 800, color: "var(--text-1)" }}>{craftData.totalTransactions}</p>
                                    </div>
                                </div>

                                <p className="text-xs" style={{ color: "var(--text-2)" }}>
                                    The PDF contains identity, income summary, a transaction ledger, and your CraftScore assessment.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-2">
                        <ReportSidebar craftIdNumber={user?.slug || ""} />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
