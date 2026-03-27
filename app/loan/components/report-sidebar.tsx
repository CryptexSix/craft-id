"use client";

import { Shield } from "lucide-react";

export function ReportSidebar({ craftIdNumber }: { craftIdNumber: string }) {
    const verifyUrl = craftIdNumber ? `https://craftid.ng/verify/${encodeURIComponent(craftIdNumber)}` : "https://craftid.ng";

    return (
        <aside className="space-y-3">
            <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="mb-2 flex items-center gap-2">
                    <Shield size={16} style={{ color: "var(--orange)" }} />
                    <p style={{ fontFamily: "var(--font-syne)", fontWeight: 800, fontSize: 14, color: "var(--text-1)" }}>Claim verification</p>
                </div>

                <p className="text-sm" style={{ color: "var(--text-2)" }}>
                    Banks can verify this report by scanning the QR code on the PDF or visiting the verification URL.
                </p>

                <div className="mt-3 rounded-lg border px-3 py-2" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                    <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--text-3)" }}>Verify</p>
                    <a
                        href={verifyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate text-sm"
                        style={{ color: "var(--orange)", fontFamily: "var(--font-dm-mono)" }}
                    >
                        {verifyUrl}
                    </a>
                </div>

                <div
                    className="mt-3 grid place-items-center rounded-lg border"
                    style={{ borderColor: "var(--border)", background: "var(--surface-2)", height: 120 }}
                >
                    <p style={{ fontFamily: "var(--font-dm-mono)", fontSize: 12, color: "var(--text-2)" }}>[QR CODE]</p>
                </div>

                <p className="mt-3 text-xs" style={{ color: "var(--text-3)" }}>
                    QR generation will be enabled next.
                </p>
            </div>
        </aside>
    );
}
