"use client";

import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

import { StatsCard } from "@/components/stats-card";
import { useUser } from "@/lib/useUser";
import { formatNaira } from "@/lib/utils";

type DbInvoice = {
    id: string;
    reference: string;
    amount_kobo: number;
    customer_name: string;
    customer_email: string;
    description: string | null;
    address: string | null;
    due_at: string | null;
    status: string;
    provider: string;
    created_at: string;
};

type DbPayment = {
    id: string;
    artisan_slug: string;
    txn_ref: string;
    amount_kobo: number;
    status: string;
    paid_at: string;
    client_name: string | null;
    purpose: string | null;
    payment_reference: string | null;
};

function isValidEmail(value: string) {
    // Basic client-side check; server validates required fields.
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

type TabKey = "invoices" | "payments";

export default function PaymentsInvoicesPage() {
    const { user, loading: userLoading } = useUser();
    const artisanSlug = (user?.slug ?? "").toLowerCase();

    const [tab, setTab] = useState<TabKey>("invoices");

    const [invoices, setInvoices] = useState<DbInvoice[]>([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [invoiceError, setInvoiceError] = useState<string | null>(null);

    const [payments, setPayments] = useState<DbPayment[]>([]);
    const [loadingPayments, setLoadingPayments] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);

    const [amountNgn, setAmountNgn] = useState<string>("");
    const [customerName, setCustomerName] = useState<string>("");
    const [customerEmail, setCustomerEmail] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    const amountKobo = useMemo(() => {
        const num = Number(amountNgn);
        if (!Number.isFinite(num) || num <= 0) return 0;
        return Math.trunc(num * 100);
    }, [amountNgn]);

    const canCreate =
        !!artisanSlug &&
        amountKobo > 0 &&
        customerName.trim().length > 0 &&
        isValidEmail(customerEmail.trim()) &&
        !creating;

    async function loadInvoices() {
        if (!artisanSlug) return;
        setLoadingInvoices(true);
        setInvoiceError(null);
        try {
            const res = await fetch(`/api/invoices?slug=${encodeURIComponent(artisanSlug)}`);
            const json = await res.json();
            if (!res.ok) throw new Error(json?.error ?? "Failed to load invoices");
            setInvoices(json?.invoices ?? []);
        } catch (e: any) {
            setInvoiceError(e?.message ?? "Failed to load invoices");
        } finally {
            setLoadingInvoices(false);
        }
    }

    async function loadPayments() {
        if (!artisanSlug) return;
        setLoadingPayments(true);
        setPaymentError(null);
        try {
            const res = await fetch(`/api/payments?slug=${encodeURIComponent(artisanSlug)}`);
            const json = await res.json();
            if (!res.ok) throw new Error(json?.error ?? "Failed to load payments");

            const all: DbPayment[] = json?.payments ?? [];
            setPayments(all.filter((p) => p.status === "completed"));
        } catch (e: any) {
            setPaymentError(e?.message ?? "Failed to load payments");
        } finally {
            setLoadingPayments(false);
        }
    }

    useEffect(() => {
        if (userLoading) return;
        if (!artisanSlug) return;
        loadInvoices();
        loadPayments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [artisanSlug, userLoading]);

    async function onCreateInvoice() {
        setCreateError(null);
        if (!canCreate) return;

        setCreating(true);
        try {
            const res = await fetch("/api/invoices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    slug: artisanSlug,
                    amountKobo,
                    customerName: customerName.trim(),
                    customerEmail: customerEmail.trim(),
                    description: description.trim() || undefined,
                }),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json?.error ?? "Failed to create invoice");

            setAmountNgn("");
            setCustomerName("");
            setCustomerEmail("");
            setDescription("");

            await loadInvoices();
        } catch (e: any) {
            setCreateError(e?.message ?? "Failed to create invoice");
        } finally {
            setCreating(false);
        }
    }

    const invoicesTotal = useMemo(() => invoices.reduce((sum, inv) => sum + (inv.amount_kobo || 0), 0), [invoices]);
    const paymentsTotal = useMemo(() => payments.reduce((sum, p) => sum + (p.amount_kobo || 0), 0), [payments]);

    const origin = useMemo(() => {
        if (typeof window === "undefined") return "";
        return window.location.origin;
    }, []);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Payments/Invoices</h1>
                <p className="mt-1 text-sm text-muted-foreground">Track invoices and confirmed payments.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <StatsCard label="Invoices" value={formatNaira(invoicesTotal / 100)} sub="Total invoice amount" />
                <StatsCard label="Completed Payments" value={formatNaira(paymentsTotal / 100)} sub="Total received" />
            </div>

            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => setTab("invoices")}
                    className={
                        tab === "invoices"
                            ? "rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                            : "rounded-md bg-muted px-3 py-2 text-sm font-medium text-foreground"
                    }
                >
                    Invoices
                </button>
                <button
                    type="button"
                    onClick={() => setTab("payments")}
                    className={
                        tab === "payments"
                            ? "rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                            : "rounded-md bg-muted px-3 py-2 text-sm font-medium text-foreground"
                    }
                >
                    Payments
                </button>
            </div>

            {tab === "invoices" ? (
                <div className="space-y-6">
                    <div className="rounded-lg border bg-card p-6" style={{ borderColor: "var(--border)" }}>
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-lg font-semibold">Invoices</h2>
                            <button
                                type="button"
                                onClick={loadInvoices}
                                disabled={loadingInvoices}
                                className="rounded-md bg-muted px-3 py-2 text-sm font-medium text-foreground"
                            >
                                {loadingInvoices ? "Refreshing…" : "Refresh"}
                            </button>
                        </div>

                        {invoiceError ? <p className="mt-3 text-sm text-destructive">{invoiceError}</p> : null}

                        <div className="mt-4 space-y-3">
                            {loadingInvoices && invoices.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Loading…</p>
                            ) : invoices.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No invoices yet.</p>
                            ) : (
                                invoices.map((inv) => (
                                    <div
                                        key={inv.id}
                                        className="rounded-md border bg-background p-4"
                                        style={{ borderColor: "var(--border)" }}
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className="text-sm font-medium text-foreground">{inv.customer_name}</p>
                                            <p className="text-sm font-semibold text-foreground">{formatNaira(inv.amount_kobo / 100)}</p>
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">Ref: {inv.reference}</p>
                                        <div className="mt-2 flex items-center justify-between gap-3">
                                            <a
                                                className="text-xs"
                                                style={{ color: "var(--orange)", fontFamily: "var(--font-dm-mono)" }}
                                                href={`/pay/${encodeURIComponent(artisanSlug)}/${encodeURIComponent(inv.reference)}`}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                {origin ? `${origin}/pay/${artisanSlug}/${inv.reference}` : `/pay/${artisanSlug}/${inv.reference}`}
                                            </a>
                                            <div
                                                className="rounded-md border bg-background p-2"
                                                style={{ borderColor: "var(--border)" }}
                                            >
                                                <QRCodeSVG
                                                    value={origin ? `${origin}/pay/${artisanSlug}/${inv.reference}` : `https://craftid.ng/pay/${artisanSlug}/${inv.reference}`}
                                                    size={72}
                                                    fgColor="#09090E"
                                                    bgColor="#FFFFFF"
                                                />
                                            </div>
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">Email: {inv.customer_email}</p>
                                        {inv.description ? <p className="mt-1 text-xs text-muted-foreground">{inv.description}</p> : null}
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            Status: {inv.status} • Created: {new Date(inv.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="rounded-lg border bg-card p-6" style={{ borderColor: "var(--border)" }}>
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold">Completed payments</h2>
                        <button
                            type="button"
                            onClick={loadPayments}
                            disabled={loadingPayments}
                            className="rounded-md bg-muted px-3 py-2 text-sm font-medium text-foreground"
                        >
                            {loadingPayments ? "Refreshing…" : "Refresh"}
                        </button>
                    </div>

                    {paymentError ? <p className="mt-3 text-sm text-destructive">{paymentError}</p> : null}

                    <div className="mt-4 space-y-3">
                        {loadingPayments && payments.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Loading…</p>
                        ) : payments.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No completed payments yet.</p>
                        ) : (
                            payments.map((p) => (
                                <div
                                    key={p.id}
                                    className="rounded-md border bg-background p-4"
                                    style={{ borderColor: "var(--border)" }}
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-sm font-medium text-foreground">{p.txn_ref}</p>
                                        <p className="text-sm font-semibold text-foreground">{formatNaira(p.amount_kobo / 100)}</p>
                                    </div>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        Paid: {new Date(p.paid_at).toLocaleString()} {p.client_name ? `• ${p.client_name}` : ""}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
