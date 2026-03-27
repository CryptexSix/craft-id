import Link from "next/link";

export default async function VerifyReportPage({
    params,
}: {
    params: { craftIdNumber: string };
}) {
    const { craftIdNumber } = params;

    return (
        <main className="min-h-screen px-4 py-10" style={{ background: "var(--bg)", color: "var(--text-1)" }}>
            <div className="mx-auto w-full max-w-2xl">
                <div className="mb-4">
                    <Link href="/" className="text-sm" style={{ color: "var(--text-2)" }}>
                        CraftID
                    </Link>
                </div>

                <div className="rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                    <h1 style={{ fontFamily: "var(--font-syne)", fontSize: 28, fontWeight: 800 }}>Report verification</h1>
                    <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
                        Verification portal for a CraftID income verification report.
                    </p>

                    <div className="mt-4 rounded-xl border px-4 py-3" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                        <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--text-3)" }}>
                            CraftID number
                        </p>
                        <p className="mt-1 text-sm" style={{ fontFamily: "var(--font-dm-mono)", fontWeight: 700 }}>
                            {craftIdNumber}
                        </p>
                    </div>

                    <div className="mt-4 rounded-xl border px-4 py-3" style={{ background: "var(--orange-dim)", borderColor: "rgba(249,115,22,0.2)" }}>
                        <p className="text-sm" style={{ color: "var(--orange)", fontWeight: 700 }}>
                            Verification details coming next
                        </p>
                        <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
                            This link is included in PDFs so banks can verify the claim. The QR code is a placeholder for now.
                        </p>
                    </div>

                    <p className="mt-4 text-xs" style={{ color: "var(--text-3)" }}>
                        CraftID is not a licensed lender. This page is for income verification only.
                    </p>
                </div>
            </div>
        </main>
    );
}
