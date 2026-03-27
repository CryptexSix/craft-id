"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const existing = localStorage.getItem("craftid_user");
            if (existing) router.replace("/dashboard");
        } catch {
            // ignore
        }
    }, [router]);

    const emailTrimmed = email.trim().toLowerCase();
    const canSubmit = useMemo(() => isValidEmail(emailTrimmed) && !loading, [emailTrimmed, loading]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!canSubmit) return;

        setLoading(true);
        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailTrimmed }),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json?.error || "Login failed");

            const profile = json?.profile as unknown;
            if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
                throw new Error("Login failed: invalid profile");
            }

            const profileRecord = profile as Record<string, unknown>;

            localStorage.setItem("craftid_user", JSON.stringify(profile));
            if (typeof profileRecord.bvnVerified === "boolean") {
                localStorage.setItem("craftid_bvn_verified", String(profileRecord.bvnVerified));
            }

            router.replace("/dashboard");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen px-5 py-10" style={{ background: "var(--bg)", color: "var(--text-1)" }}>
            <div className="mx-auto w-full max-w-md">
                <div className="mb-6">
                    <h1 style={{ fontFamily: "var(--font-syne)", fontSize: 30, fontWeight: 800 }}>Login</h1>
                    <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
                        Demo access: enter the email used during onboarding.
                    </p>
                </div>

                <form onSubmit={onSubmit} className="rounded-2xl border p-6 space-y-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                    <div>
                        <label className="mb-1 block text-xs" style={{ color: "var(--text-2)" }}>
                            Email
                        </label>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            inputMode="email"
                            className="h-11 w-full rounded-xl border px-3 text-sm"
                            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-1)" }}
                            placeholder="e.g. favour@craftid.ng"
                        />
                    </div>

                    {error ? (
                        <p className="text-sm" style={{ color: "var(--red)" }}>
                            {error}
                        </p>
                    ) : null}

                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className={`inline-flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm ${canSubmit ? "" : "opacity-50 cursor-not-allowed"}`}
                        style={{ background: "var(--orange)", color: "white", fontFamily: "var(--font-syne)", fontWeight: 700 }}
                    >
                        {loading ? "Signing in…" : "Sign in"}
                    </button>

                    <p className="text-xs" style={{ color: "var(--text-2)" }}>
                        New here? <Link href="/onboarding" style={{ color: "var(--orange)" }}>Create a CraftID</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
