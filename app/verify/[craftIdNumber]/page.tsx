import Link from "next/link";
import { CheckCircle, XCircle } from "lucide-react";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatNaira, MAX_CRAFT_SCORE, getScoreLabel, getScoreColor } from "@/lib/utils";

type Payment = {
    id: string;
    txn_ref: string;
    amount_kobo: number;
    client_name: string | null;
    purpose: string | null;
    status: string;
    paid_at: string;
};

function toISODate(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function computeCraftScore(
    bvnVerified: boolean,
    transactionCount: number,
    totalVolume: number,
    accountAgeDays: number,
): number {
    const hasPayments = transactionCount > 0 || totalVolume > 0;
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

function scoreBar(score: number, max: number) {
    const blocks = 12;
    const filled = Math.round((Math.min(Math.max(score, 0), max) / max) * blocks);
    return filled;
}

export default async function VerifyReportPage({
    params,
}: {
    params: Promise<{ craftIdNumber: string }>;
}) {
    const { craftIdNumber } = await params;
    const slug = craftIdNumber.toLowerCase();

    const supabase = getSupabaseAdminClient();

    const [{ data: artisan }, { data: rawPayments }] = await Promise.all([
        supabase
            .from("artisans")
            .select("slug, full_name, profile, created_at")
            .eq("slug", slug)
            .maybeSingle(),
        supabase
            .from("payments")
            .select("id, txn_ref, amount_kobo, client_name, purpose, status, paid_at")
            .eq("artisan_slug", slug)
            .order("paid_at", { ascending: false })
            .limit(200),
    ]);

    if (!artisan) {
        return (
            <main className="min-h-screen px-4 py-10" style={{ background: "var(--bg)", color: "var(--text-1)" }}>
                <div className="mx-auto w-full max-w-2xl">
                    <div className="mb-4">
                        <Link href="/" className="text-sm" style={{ color: "var(--text-2)" }}>
                            CraftID
                        </Link>
                    </div>
                    <div className="rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                        <div className="flex items-center gap-2">
                            <XCircle size={22} style={{ color: "var(--red)" }} />
                            <h1 style={{ fontFamily: "var(--font-syne)", fontSize: 24, fontWeight: 800 }}>
                                Report not found
                            </h1>
                        </div>
                        <p className="mt-2 text-sm" style={{ color: "var(--text-2)" }}>
                            No CraftID record exists for <span style={{ fontFamily: "var(--font-dm-mono)", fontWeight: 700 }}>{craftIdNumber}</span>.
                        </p>
                        <p className="mt-4 text-xs" style={{ color: "var(--text-3)" }}>
                            CraftID is not a licensed lender. This page is for income verification only.
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    const profile = (artisan.profile as Record<string, unknown>) ?? {};
    const fullName = (artisan.full_name as string) || String(profile.fullName || "");
    const skill = String(profile.skill || "");
    const state = String(profile.state || "");
    const phone = String(profile.phone || "");
    const bvnVerified = Boolean(profile.bvnVerified);

    const createdAt = artisan.created_at ? new Date(artisan.created_at as string) : null;
    const memberSince = createdAt ? toISODate(createdAt) : "-";
    const accountAgeDays = createdAt
        ? Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)) + 1)
        : 0;

    const payments: Payment[] = (rawPayments ?? []).filter(
        (p) => p.status === "completed" || p.status === "success",
    );
    const sortedAsc = [...payments].sort(
        (a, b) => new Date(a.paid_at).getTime() - new Date(b.paid_at).getTime(),
    );

    const totalRevenue = payments.reduce((sum, p) => sum + (Number(p.amount_kobo) / 100), 0);
    const totalTransactions = payments.length;
    const uniqueClients = new Set(
        payments.map((p) => (p.client_name || "").trim().toLowerCase()).filter(Boolean),
    ).size;
    const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const highestTransaction = payments.reduce(
        (max, p) => Math.max(max, Number(p.amount_kobo) / 100),
        0,
    );

    const periodFrom = sortedAsc[0]
        ? toISODate(new Date(sortedAsc[0].paid_at))
        : toISODate(new Date());
    const periodTo = sortedAsc[sortedAsc.length - 1]
        ? toISODate(new Date(sortedAsc[sortedAsc.length - 1].paid_at))
        : toISODate(new Date());

    const craftScore850 = computeCraftScore(bvnVerified, totalTransactions, totalRevenue, accountAgeDays);
    const filledBlocks = scoreBar(craftScore850, MAX_CRAFT_SCORE);
    const scoreLabel = getScoreLabel(craftScore850);

    const recentTxs = [...payments].slice(0, 10);

    const generatedOn = toISODate(new Date());

    return (
        <main className="min-h-screen px-4 py-10" style={{ background: "var(--bg)", color: "var(--text-1)" }}>
            <div className="mx-auto w-full max-w-2xl space-y-4">
                <div className="flex items-center justify-between">
                    <Link href="/" className="text-sm" style={{ color: "var(--text-2)" }}>
                        CraftID
                    </Link>
                    <span className="text-xs" style={{ color: "var(--text-3)" }}>
                        Verified on {generatedOn}
                    </span>
                </div>

                {/* Header */}
                <div className="rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                    <div className="flex items-start gap-3">
                        <CheckCircle size={24} style={{ color: "var(--green)", flexShrink: 0, marginTop: 2 }} />
                        <div>
                            <h1 style={{ fontFamily: "var(--font-syne)", fontSize: 26, fontWeight: 800, lineHeight: 1.1 }}>
                                Income Verification Report
                            </h1>
                            <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
                                This report is backed by transaction data processed through Interswitch Payment Infrastructure.
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 rounded-xl border px-4 py-3" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                        <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--text-3)" }}>
                            CraftID number
                        </p>
                        <p className="mt-1 text-sm" style={{ fontFamily: "var(--font-dm-mono)", fontWeight: 700 }}>
                            {craftIdNumber}
                        </p>
                    </div>
                </div>

                {/* Identity */}
                <div className="rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                    <h2 className="text-xs uppercase tracking-[0.18em] mb-3" style={{ color: "var(--text-3)" }}>
                        Artisan Identity
                    </h2>
                    <div className="space-y-2">
                        {[
                            ["Full Name", fullName],
                            ["Craft / Skill", skill],
                            ["Location", state],
                            ["Phone", phone],
                            ["Member Since", memberSince],
                        ].map(([label, value]) => (
                            <div key={label} className="flex items-center justify-between gap-4">
                                <span className="text-xs" style={{ color: "var(--text-3)" }}>{label}</span>
                                <span className="text-sm text-right" style={{ color: "var(--text-1)", fontWeight: 600 }}>
                                    {value || "—"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Income Summary */}
                <div className="rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                    <h2 className="text-xs uppercase tracking-[0.18em] mb-3" style={{ color: "var(--text-3)" }}>
                        Income Summary
                    </h2>

                    {totalTransactions === 0 ? (
                        <p className="text-sm" style={{ color: "var(--text-2)" }}>No completed transactions on record.</p>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="rounded-xl border px-4 py-3" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                                    <p className="text-[11px] uppercase tracking-[0.15em]" style={{ color: "var(--text-3)" }}>Total Revenue</p>
                                    <p className="mt-1" style={{ fontFamily: "var(--font-dm-mono)", fontWeight: 800, fontSize: 18, color: "var(--text-1)" }}>
                                        {formatNaira(totalRevenue)}
                                    </p>
                                </div>
                                <div className="rounded-xl border px-4 py-3" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                                    <p className="text-[11px] uppercase tracking-[0.15em]" style={{ color: "var(--text-3)" }}>Transactions</p>
                                    <p className="mt-1" style={{ fontFamily: "var(--font-dm-mono)", fontWeight: 800, fontSize: 18, color: "var(--text-1)" }}>
                                        {totalTransactions}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {[
                                    ["Report Period", `${periodFrom} → ${periodTo}`],
                                    ["Unique Clients", String(uniqueClients)],
                                    ["Avg Transaction", formatNaira(averageTransaction)],
                                    ["Highest Transaction", formatNaira(highestTransaction)],
                                ].map(([label, value]) => (
                                    <div key={label} className="flex items-center justify-between gap-4">
                                        <span className="text-xs" style={{ color: "var(--text-3)" }}>{label}</span>
                                        <span className="text-sm" style={{ color: "var(--text-1)", fontWeight: 600, fontFamily: label !== "Report Period" ? "var(--font-dm-mono)" : undefined }}>
                                            {value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* CraftScore */}
                <div className="rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                    <h2 className="text-xs uppercase tracking-[0.18em] mb-3" style={{ color: "var(--text-3)" }}>
                        CraftScore
                    </h2>
                    <div className="flex items-end gap-3 mb-2">
                        <span style={{ fontFamily: "var(--font-dm-mono)", fontWeight: 800, fontSize: 36, color: "var(--text-1)", lineHeight: 1 }}>
                            {craftScore850}
                        </span>
                        <span className="mb-1 text-sm" style={{ color: "var(--text-3)" }}>/ {MAX_CRAFT_SCORE}</span>
                        <span className="mb-1 text-sm font-bold" style={{ color: getScoreColor(craftScore850) }}>
                            {scoreLabel}
                        </span>
                    </div>
                    {/* Score bar */}
                    <div className="flex gap-1 my-2">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-2 flex-1 rounded-sm"
                                style={{
                                    background: i < filledBlocks ? getScoreColor(craftScore850) : "var(--border)",
                                }}
                            />
                        ))}
                    </div>
                    <p className="text-xs mt-2" style={{ color: "var(--text-2)" }}>
                        This individual has demonstrated consistent, verifiable digital income. Transaction records are authenticated via the Interswitch payment network.
                    </p>
                </div>

                {/* Recent Transactions */}
                {recentTxs.length > 0 && (
                    <div className="rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                        <h2 className="text-xs uppercase tracking-[0.18em] mb-3" style={{ color: "var(--text-3)" }}>
                            Recent Transactions {payments.length > 10 ? `(showing 10 of ${payments.length})` : ""}
                        </h2>
                        <div className="space-y-2">
                            {recentTxs.map((p) => {
                                const date = toISODate(new Date(p.paid_at));
                                const amount = Number(p.amount_kobo) / 100;
                                return (
                                    <div key={p.id} className="flex items-center justify-between gap-4 rounded-xl border px-4 py-3" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                                        <div className="min-w-0">
                                            <p className="text-xs" style={{ color: "var(--text-3)" }}>{date}</p>
                                            <p className="text-sm truncate" style={{ color: "var(--text-1)" }}>
                                                {p.purpose || "Payment"}{p.client_name ? ` · ${p.client_name}` : ""}
                                            </p>
                                        </div>
                                        <span style={{ fontFamily: "var(--font-dm-mono)", fontWeight: 700, fontSize: 14, color: "var(--text-1)", whiteSpace: "nowrap" }}>
                                            {formatNaira(amount)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <p className="text-xs text-center pb-4" style={{ color: "var(--text-3)" }}>
                    CraftID is not a licensed lender. This page is for income verification only.
                </p>
            </div>
        </main>
    );
}
