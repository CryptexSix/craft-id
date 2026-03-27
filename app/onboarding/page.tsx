"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, Info, UserCircle2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useMemo, useState } from "react";
import { getAppOrigin } from "@/lib/utils";

const states = ["Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"];
const skills = ["✂️ Tailor", "🔧 Mechanic", "🪑 Carpenter", "⚡ Welder", "💇 Hairdresser", "🪠 Plumber", "🧱 Tiler", "🎨 Painter", "➕ Other"];

function getRateHints(skill: string) {
  const normalized = (skill || "").toLowerCase();

  if (normalized.includes("mechanic")) {
    return {
      min: "Minimum: small fixes (e.g., replace spark plugs)",
      avg: "Average: routine work (e.g., service an engine)",
      premium: "Premium: major work (e.g., replace an engine)",
    };
  }

  if (normalized.includes("tailor")) {
    return {
      min: "Minimum: adjustments (e.g., shorten trousers)",
      avg: "Average: regular sewing (e.g., sew a native outfit)",
      premium: "Premium: complex jobs (e.g., wedding/bridal outfit)",
    };
  }

  if (normalized.includes("carpenter")) {
    return {
      min: "Minimum: simple jobs (e.g., shelf installation)",
      avg: "Average: standard jobs (e.g., kitchen cabinet)",
      premium: "Premium: major jobs (e.g., full wardrobe/doors)",
    };
  }

  if (normalized.includes("hair")) {
    return {
      min: "Minimum: quick styling (e.g., simple braid)",
      avg: "Average: regular styling (e.g., weave installation)",
      premium: "Premium: special styling (e.g., bridal styling)",
    };
  }

  if (normalized.includes("plumber")) {
    return {
      min: "Minimum: quick repairs (e.g., fix a leak)",
      avg: "Average: standard jobs (e.g., install a sink/toilet)",
      premium: "Premium: major work (e.g., full re-piping)",
    };
  }

  if (normalized.includes("welder")) {
    return {
      min: "Minimum: small welding (e.g., gate handle fix)",
      avg: "Average: standard welding (e.g., window burglary bars)",
      premium: "Premium: heavy fabrication (e.g., full gate/railing)",
    };
  }

  if (normalized.includes("painter")) {
    return {
      min: "Minimum: touch-up work (e.g., small wall patch)",
      avg: "Average: standard painting (e.g., 1 room)",
      premium: "Premium: major painting (e.g., whole apartment)",
    };
  }

  if (normalized.includes("tiler")) {
    return {
      min: "Minimum: small fixes (e.g., replace a broken tile)",
      avg: "Average: standard tiling (e.g., bathroom floor)",
      premium: "Premium: major tiling (e.g., full kitchen + living room)",
    };
  }

  return {
    min: "Minimum: small job",
    avg: "Average: normal job",
    premium: "Premium: big job",
  };
}

function Hint({ text }: { text: string }) {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const open = pinned || hovered;

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        aria-label="Hint"
        onClick={() => setPinned((v) => !v)}
        className="grid h-6 w-6 place-items-center rounded-full border"
        style={{ borderColor: "var(--border)", color: "var(--text-2)", background: "var(--surface)" }}
      >
        <Info size={14} />
      </button>
      {open ? (
        <div
          className="absolute right-0 top-7 z-10 w-64 rounded-xl border px-3 py-2 text-xs"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-2)" }}
        >
          {text}
        </div>
      ) : null}
    </div>
  );
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [fullPaymentUrl, setFullPaymentUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", state: "", skill: "✂️ Tailor", otherSkill: "", experience: 6, minJob: "", avgJob: "", premiumJob: "", bio: "" });

  const valid = useMemo(() => {
    if (step === 1) return !!(form.fullName && form.email && form.state);
    if (step === 2) return !!form.skill && (form.skill !== "➕ Other" || !!form.otherSkill.trim());
    if (step === 3) return !!(form.minJob && form.avgJob);
    return false;
  }, [form, step]);

  const progress = (step / 3) * 100;
  const firstName = form.fullName.split(" ")[0] || "Emeka";
  const slug = (form.fullName || "artisan").toLowerCase().replace(/\s+/g, "-");
  const resolvedPaymentUrl =
    fullPaymentUrl ||
    (() => {
      const origin = getAppOrigin();
      return origin ? `${origin}/pay/${slug}` : `/pay/${slug}`;
    })();

  const formatMoney = (v: string) => v.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  const handleCopyPaymentUrl = async () => {
    try {
      await navigator.clipboard.writeText(resolvedPaymentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Clipboard copy failed:", error);
      try {
        const textarea = document.createElement("textarea");
        textarea.value = resolvedPaymentUrl;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackError) {
        console.error("Fallback copy failed:", fallbackError);
        alert("Unable to copy automatically. Please copy the link manually.");
      }
    }
  };

  const handleContinue = async () => {
    if (!valid) return;
    if (step < 3) return setStep((s) => s + 1);
    setLoading(true);
    setCreateError(null);
    await new Promise((r) => setTimeout(r, 800));

    const generatedSlug = (form.fullName || "artisan").toLowerCase().replace(/\s+/g, "-");
    const generatedPaymentLink = `/pay/${generatedSlug}`;
    const origin = getAppOrigin();
    const generatedFullPaymentUrl = origin ? `${origin}${generatedPaymentLink}` : generatedPaymentLink;

    const resolvedSkill = form.skill === "➕ Other" ? form.otherSkill.trim() : form.skill;

    const userProfile = {
      firstName: form.fullName.split(" ")[0],
      fullName: form.fullName,
      email: form.email.trim().toLowerCase(),
      phone: "",
      state: form.state,
      skill: resolvedSkill,
      experience: form.experience,
      minJob: form.minJob,
      avgJob: form.avgJob,
      premiumJob: form.premiumJob,
      bio: form.bio,
      bvn: "",
      nin: "",
      bvnVerified: false,
      bvnName: "",
      slug: generatedSlug,
      paymentLink: generatedPaymentLink,
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/users/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userProfile),
      });

      if (!res.ok) {
        let msg = "Could not create your CraftID right now. Please try again.";
        try {
          const body = (await res.json()) as { error?: string };
          if (body?.error) msg = body.error;
        } catch {
          // ignore
        }
        setCreateError(msg);
        setLoading(false);
        return;
      }

      localStorage.setItem("craftid_user", JSON.stringify(userProfile));
      localStorage.setItem("craftid_bvn_verified", "false");
    } catch (err) {
      console.error("[CraftID] Failed to persist profile to DB:", err);
      setCreateError("Network/DB error: could not create your CraftID. Please try again.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setFullPaymentUrl(generatedFullPaymentUrl);
    setSuccess(true);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }} className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text-1)" }}>
      <div className="h-0.75" style={{ background: "var(--border)" }}><div style={{ width: `${progress}%`, height: 3, background: "var(--orange)", transition: "width .35s ease" }} /></div>
      <div className="mx-auto max-w-140 px-5 py-8">
        {!success ? (
          <>
            <div className="mb-8 flex items-center justify-between">
              {step > 1 ? <button onClick={() => setStep((s) => Math.max(1, s - 1))} className="grid h-9 w-9 place-items-center rounded-full border" style={{ borderColor: "var(--border)", color: "var(--text-2)" }}><ChevronLeft size={18} /></button> : <span />}
              <span style={{ color: "var(--text-2)", fontSize: 13 }}>{step} of 3</span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }}>
                {step === 1 && <div><UserCircle2 size={48} style={{ color: "var(--orange)", marginBottom: 14 }} /><h1 style={{ fontFamily: "var(--font-syne)", fontSize: 32, fontWeight: 700 }}>Who are you?</h1><p style={{ color: "var(--text-2)", marginTop: 6 }}>Let&apos;s set up your professional identity</p><div className="mt-7 space-y-4">{[["Full name", "fullName", "Emeka Okafor"], ["Email", "email", "emeka@example.com"]].map(([label, key, placeholder]) => <div key={key}><label className="mb-1 block text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--text-2)" }}>{label}</label><input className="w-full rounded-xl px-4 py-3.5" value={form[key as keyof typeof form] as string} placeholder={placeholder} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} /></div>)}<div><label className="mb-1 block text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--text-2)" }}>State</label><select className="w-full rounded-xl px-4 py-3.5" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}><option value="">Select your state</option>{states.map((s) => <option key={s}>{s}</option>)}</select></div></div></div>}

                {step === 2 && <div><h1 style={{ fontFamily: "var(--font-syne)", fontSize: 32, fontWeight: 700 }}>What&apos;s your craft?</h1><p style={{ color: "var(--text-2)", marginTop: 6 }}>Choose your primary skill</p><div className="mt-7 grid grid-cols-3 gap-3">{skills.map((skill) => { const active = form.skill === skill; const [emoji, ...rest] = skill.split(" "); return <button key={skill} onClick={() => setForm((f) => ({ ...f, skill }))} className="flex flex-col items-center gap-2 rounded-2xl px-2 py-4" style={{ background: active ? "var(--orange-dim)" : "var(--surface)", border: `1px solid ${active ? "var(--orange)" : "var(--border)"}`, boxShadow: active ? "0 0 0 3px var(--orange-dim)" : "none" }}><span style={{ fontSize: 28 }}>{emoji}</span><span style={{ color: active ? "var(--orange)" : "var(--text-2)", fontSize: 12 }}>{rest.join(" ")}</span>{active ? <span className="h-2 w-2 rounded-full" style={{ background: "var(--orange)" }} /> : null}</button>; })}</div>{form.skill === "➕ Other" ? (<div className="mt-5"><label className="mb-1 block text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--text-2)" }}>Your craft</label><input className="w-full rounded-xl px-4 py-3.5" value={form.otherSkill} placeholder="e.g. Electrician" onChange={(e) => setForm((f) => ({ ...f, otherSkill: e.target.value }))} /></div>) : null}<div className="mt-6"><label style={{ color: "var(--text-2)", fontSize: 14 }}>Years of experience</label><div className="mt-2 grid grid-cols-2 gap-3"><select className="w-full rounded-xl px-4 py-3.5" value={String(form.experience)} onChange={(e) => setForm((f) => ({ ...f, experience: Number(e.target.value) }))}><option value="">Select</option>{Array.from({ length: 25 }, (_, i) => i + 1).map((y) => <option key={y} value={y}>{y} year{y === 1 ? "" : "s"}</option>)}</select><input type="number" min={0} max={60} className="w-full rounded-xl px-4 py-3.5" value={String(form.experience)} onChange={(e) => { const next = Number(e.target.value); setForm((f) => ({ ...f, experience: Number.isFinite(next) ? next : 0 })); }} /></div><p className="mt-2 text-xs" style={{ color: "var(--text-2)" }}>Use the dropdown or type a number.</p></div></div>}

                {step === 3 && <div><h1 style={{ fontFamily: "var(--font-syne)", fontSize: 32, fontWeight: 700 }}>Set your rates</h1><p style={{ color: "var(--text-2)", marginTop: 6 }}>Help clients understand your pricing</p><div className="mt-7 space-y-4">{(() => { const resolvedSkill = form.skill === "➕ Other" ? form.otherSkill.trim() : form.skill; const hints = getRateHints(resolvedSkill); const fields: Array<{ key: "minJob" | "avgJob" | "premiumJob"; label: string; hint: string; optional?: boolean; }> = [{ key: "minJob", label: "Minimum job", hint: hints.min }, { key: "avgJob", label: "Average job", hint: hints.avg }, { key: "premiumJob", label: "Premium job (optional)", hint: hints.premium, optional: true },]; return fields.map(({ key, label, hint }) => (<div key={key}><div className="mb-1 flex items-center justify-between"><label className="block text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--text-2)" }}>{label}</label><Hint text={hint} /></div><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--orange)" }}>₦</span><input className="w-full rounded-xl py-3.5 pl-9 pr-4" value={form[key as keyof typeof form] as string} onChange={(e) => setForm((f) => ({ ...f, [key]: formatMoney(e.target.value) }))} /></div></div>)); })()}<div><label className="mb-1 block text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--text-2)" }}>Bio</label><textarea rows={3} className="w-full resize-none rounded-xl px-4 py-3.5" placeholder="Master artisan with years of experience..." value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} /></div></div></div>}
              </motion.div>
            </AnimatePresence>

            <button onClick={handleContinue} disabled={!valid || loading} className="mt-8 w-full rounded-3xl px-4 py-4" style={{ background: valid ? "var(--orange)" : "var(--surface)", color: valid ? "white" : "var(--text-3)", border: valid ? "none" : "1px solid var(--border)", fontFamily: "var(--font-syne)", fontSize: 16, fontWeight: 700 }}>{loading ? "Creating your CraftID..." : "Continue"}</button>
            {createError ? (
              <p className="mt-3 text-sm" style={{ color: "var(--red)" }}>
                {createError}
              </p>
            ) : null}
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-10 text-center">
            <motion.div initial={{ scale: 0.3 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 220, damping: 15 }} className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full border" style={{ borderColor: "var(--green)", background: "var(--green-dim)", color: "var(--green)" }}>
              <Check size={36} />
            </motion.div>
            <h1 style={{ fontFamily: "var(--font-syne)", fontSize: 32, fontWeight: 700 }}>You&apos;re all set, {firstName}!</h1>
            <p className="mt-2" style={{ color: "var(--text-2)" }}>Your CraftID is live. Start sharing your link.</p>
            <div className="mt-7 rounded-3xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="mx-auto w-max rounded-xl bg-white p-2">
                <QRCodeSVG size={120} value={resolvedPaymentUrl} />
              </div>
              <p className="mt-4 truncate" style={{ color: "var(--orange)", fontFamily: "var(--font-dm-mono)", fontSize: 13 }}>{resolvedPaymentUrl}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button onClick={handleCopyPaymentUrl} className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "var(--border-light)", color: "var(--text-1)" }}>
                  {copied ? "Copied" : "Copy"}
                </button>
                <a href={`https://wa.me/?text=${encodeURIComponent(`Pay me securely: ${resolvedPaymentUrl}`)}`} target="_blank" rel="noreferrer" className="rounded-xl px-3 py-2 text-sm" style={{ background: "var(--green)", color: "white" }}>
                  WhatsApp
                </a>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => window.open(resolvedPaymentUrl, '_blank')}
                className="inline-flex items-center justify-center gap-2 rounded-3xl px-6 py-4"
                style={{ background: "var(--orange)", color: "white", fontFamily: "var(--font-syne)", fontWeight: 700 }}
              >
                <span>🔗</span> Open Payment Page
              </button>
              <a href="/dashboard" className="inline-flex rounded-3xl px-6 py-4 text-center" style={{ background: "var(--surface)", color: "var(--text-2)", fontFamily: "var(--font-syne)", fontWeight: 700, border: "1px solid var(--border)" }}>
                Go to Dashboard →
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}