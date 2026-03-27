"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Shield } from "lucide-react";
import { motion } from "framer-motion";

import { formatNaira } from "@/lib/utils";
import { type UserProfile } from "@/lib/useUser";

declare global {
    interface Window {
        webpayCheckout?: (config: Record<string, unknown>) => void;
    }
}

type InvoiceRow = {
    id: string;
    artisan_slug: string;
    reference: string;
    amount_kobo: number;
    customer_name: string | null;
    customer_email: string | null;
    description: string | null;
    status: string;
    created_at: string;
};

export default function InvoicePayPage() {
    const params = useParams();
    const username = (params?.username as string) || "";
    const invoiceId = (params?.invoiceId as string) || "";

    const slug = useMemo(() => username.toLowerCase(), [username]);

    const [profileLoading, setProfileLoading] = useState(true);
    const [artisanProfile, setArtisanProfile] = useState<UserProfile | null>(null);

    const [invoiceLoading, setInvoiceLoading] = useState(true);
    const [invoice, setInvoice] = useState<InvoiceRow | null>(null);
    const [invoiceError, setInvoiceError] = useState<string | null>(null);

    const [checkoutReady, setCheckoutReady] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);

    const amountNaira = useMemo(() => {
        const kobo = Number(invoice?.amount_kobo || 0);
        return Math.max(0, kobo / 100);
    }, [invoice?.amount_kobo]);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const res = await fetch(`/api/users/${encodeURIComponent(slug)}`);
                if (!res.ok) return;
                const json = await res.json();
                const profile = json?.artisan?.profile;
                if (profile && typeof profile === "object") {
                    setArtisanProfile(profile as UserProfile);
                }
            } catch (e) {
                console.error("[CraftID] Failed to load artisan profile:", e);
            } finally {
                setProfileLoading(false);
            }
        };

        if (!slug) {
            setProfileLoading(false);
            return;
        }

        void loadProfile();
    }, [slug]);

    useEffect(() => {
        const loadInvoice = async () => {
            setInvoiceLoading(true);
            setInvoiceError(null);
            try {
                const res = await fetch(`/api/invoices/${encodeURIComponent(invoiceId)}?refresh=1`);
                const json = await res.json();
                if (!res.ok) throw new Error(json?.error ?? "Invoice not found");

                const inv = json?.invoice as InvoiceRow;
                if (!inv?.reference) throw new Error("Invalid invoice response");

                if ((inv.artisan_slug || "").toLowerCase() !== slug) {
                    throw new Error("Invoice does not belong to this artisan");
                }

                setInvoice(inv);
            } catch (e: any) {
                setInvoiceError(e?.message ?? "Failed to load invoice");
                setInvoice(null);
            } finally {
                setInvoiceLoading(false);
            }
        };

        if (!slug || !invoiceId) {
            setInvoiceLoading(false);
            return;
        }

        void loadInvoice();
    }, [slug, invoiceId]);

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

    const artisanName = artisanProfile?.fullName || username || "Artisan";

    const handlePay = async () => {
        if (!invoice) return;
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

        const amountInKobo = Number(invoice.amount_kobo || 0);
        const txnRef = `craftid_${slug}_${invoice.reference}_${Date.now()}`;

        try {
            window.webpayCheckout({
                merchant_code: process.env.NEXT_PUBLIC_ISW_MERCHANT_CODE,
                pay_item_id: process.env.NEXT_PUBLIC_ISW_PAY_ITEM_ID,
                txn_ref: txnRef,
                amount: amountInKobo,
                currency: 566,
                site_redirect_url: window.location.href,
                cust_email: "client@craftid.ng",
                cust_name: invoice.customer_name || "Client",
                pay_item_name: invoice.description || `Invoice ${invoice.reference}`,
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
                                    username: slug,
                                    clientName: invoice.customer_name || "Client",
                                    artisanName,
                                    purpose: invoice.description || `Invoice ${invoice.reference}`,
                                    invoiceRef: invoice.reference,
                                }),
                            });

                            const result = await verify.json();
                            if (result.success) {
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

    const loadingScreen = profileLoading || invoiceLoading;

    if (loadingScreen) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center">
                <div
                    className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
                    style={{ borderColor: "#F97316", borderTopColor: "transparent" }}
                />
            </div>
        );
    }

    if (invoiceError || !invoice) {
        return (
            <div className="mx-auto max-w-130 px-4 py-10">
                <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "#E2E8F0" }}>
                    <p className="text-sm" style={{ color: "#DC2626" }}>
                        {invoiceError || "Invoice not found"}
                    </p>
                </div>
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
                    <p
                        style={{
                            fontFamily: "var(--font-syne)",
                            fontWeight: 800,
                            fontSize: 18,
                            background: "linear-gradient(135deg,#F97316,#7C3AED)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        CraftID
                    </p>
                    <span
                        className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs"
                        style={{ borderColor: "#E2E8F0", color: "#64748B" }}
                    >
                        <Shield size={12} />Powered by Interswitch
                    </span>
                </div>
            </header>

            <div className="mx-auto w-full max-w-130 px-4 py-8">
                {!success ? (
                    <>
                        <div
                            className="rounded-2xl border bg-white p-6"
                            style={{ borderColor: "#E2E8F0", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
                        >
                            <h1 className="mt-1" style={{ fontFamily: "var(--font-syne)", fontSize: 22, fontWeight: 700 }}>
                                Invoice for {artisanName}
                            </h1>
                            <p className="mt-1 text-sm" style={{ color: "#64748B" }}>
                                Ref: <span style={{ fontFamily: "var(--font-dm-mono)", fontWeight: 700 }}>{invoice.reference}</span>
                            </p>
                            {invoice.description ? (
                                <p className="mt-2 text-sm" style={{ color: "#64748B" }}>
                                    {invoice.description}
                                </p>
                            ) : null}
                            <p className="mt-4" style={{ fontFamily: "var(--font-dm-mono)", fontSize: 34, fontWeight: 800 }}>
                                {formatNaira(amountNaira)}
                            </p>
                            <p className="mt-1 text-xs" style={{ color: "#94A3B8" }}>
                                Status: {invoice.status}
                            </p>
                        </div>

                        <div className="mt-3 rounded-2xl border bg-white p-6" style={{ borderColor: "#E2E8F0" }}>
                            <h2 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 18 }}>Pay this invoice</h2>

                            <button
                                onClick={handlePay}
                                disabled={loading || !checkoutReady}
                                className="mt-4 w-full rounded-2xl px-4 py-4.5"
                                style={{
                                    background: checkoutReady ? "#F97316" : "#F1F5F9",
                                    color: checkoutReady ? "white" : "#94A3B8",
                                    fontFamily: "var(--font-syne)",
                                    fontSize: 18,
                                    fontWeight: 700,
                                }}
                            >
                                {loading ? "Processing..." : `Pay ${formatNaira(amountNaira)} →`}
                            </button>

                            {paymentError ? (
                                <p className="mt-3 text-sm" style={{ color: "#DC2626" }}>
                                    {paymentError}
                                </p>
                            ) : null}

                            <div className="mt-4 flex items-center justify-center gap-2 text-xs" style={{ color: "#64748B" }}>
                                <Shield size={12} />Secured by Interswitch · VERVE VISA
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
                        <motion.div
                            initial={{ scale: 0.3 }}
                            animate={{ scale: 1 }}
                            className="mb-4 grid h-20 w-20 place-items-center rounded-full"
                            style={{ background: "#DCFCE7", color: "#16A34A" }}
                        >
                            <CheckCircle2 size={42} />
                        </motion.div>
                        <h2 style={{ fontFamily: "var(--font-syne)", fontSize: 34, fontWeight: 800 }}>Payment Sent!</h2>
                        <p style={{ color: "#64748B", marginTop: 6 }}>You paid {formatNaira(amountNaira)} to {artisanName}</p>
                        <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-xs" style={{ color: "#64748B" }}>
                            <Shield size={12} />Secured by Interswitch
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
