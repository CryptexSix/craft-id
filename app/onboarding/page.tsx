"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, Loader2, Shield, UserCircle2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useMemo, useState } from "react";

const states = ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"];
const skills = ["✂️ Tailor", "🔧 Mechanic", "🪑 Carpenter", "⚡ Welder", "💇 Hairdresser", "🪠 Plumber", "🧱 Tiler", "🎨 Painter", "➕ Other"];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fullPaymentUrl, setFullPaymentUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [bvnVerifying, setBvnVerifying] = useState(false);
  const [bvnVerified, setBvnVerified] = useState(false);
  const [bvnError, setBvnError] = useState<string | null>(null);
  const [verifiedName, setVerifiedName] = useState<string>("");
  const [form, setForm] = useState({ fullName: "", phone: "", state: "", skill: "✂️ Tailor", experience: 6, minJob: "", avgJob: "", premiumJob: "", bio: "", bvn: "", nin: "", agree: false });

  const valid = useMemo(() => {
    if (step === 1) return !!(form.fullName && form.phone && form.state);
    if (step === 2) return !!form.skill;
    if (step === 3) return !!(form.minJob && form.avgJob);
    return form.bvn.length === 11 && form.agree && bvnVerified;
  }, [form, step, bvnVerified]);

  const progress = (step / 4) * 100;
  const firstName = form.fullName.split(" ")[0] || "Emeka";
  const slug = (form.fullName || "artisan").toLowerCase().replace(/\s+/g, "-");
  const resolvedPaymentUrl =
    fullPaymentUrl ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/pay/${slug}`
      : `https://craftid.ng/pay/${slug}`);

  const formatMoney = (v: string) => v.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  type RateKey = "minJob" | "avgJob" | "premiumJob";
  const RATE_MIN = 5000;
  const RATE_MAX = 500000;
  const RATE_STEP = 1000;

  const parseRate = (value: string) => {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const getDefaultRate = (key: RateKey) => {
    if (key === "minJob") return 15000;
    if (key === "avgJob") return 50000;
    return 120000;
  };

  const getRateValue = (key: RateKey) => {
    const parsed = parseRate(form[key]);
    return parsed >= RATE_MIN ? parsed : getDefaultRate(key);
  };

  const setRateValue = (key: RateKey, value: number) => {
    setForm((f) => ({ ...f, [key]: formatMoney(String(value)) }));
  };

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

  const handleVerifyBVN = async () => {
    if (form.bvn.length !== 11) {
      setBvnError("BVN must be 11 digits");
      return;
    }
    
    setBvnVerifying(true);
    setBvnError(null);
    
    try {
      const res = await fetch("/api/verify-bvn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bvn: form.bvn }),
      });
      
      const data = await res.json();
      
      if (data.verified) {
        setBvnVerified(true);
        setVerifiedName(data.firstName || "");
        if (!form.fullName && data.firstName) {
          setForm(f => ({ ...f, fullName: `${data.firstName} ${data.lastName || ""}`.trim() }));
        }
      } else {
        setBvnError("BVN could not be verified. Please check and try again.");
        setBvnVerified(false);
      }
    } catch (err) {
      console.error("BVN verification error:", err);
      setBvnError("Verification failed. Please try again.");
      setBvnVerified(false);
    } finally {
      setBvnVerifying(false);
    }
  };

  const handleContinue = async () => {
    if (!valid) return;
    if (step < 4) return setStep((s) => s + 1);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));

    const generatedSlug = (form.fullName || "artisan").toLowerCase().replace(/\s+/g, "-");
    const generatedPaymentLink = `/pay/${generatedSlug}`;
    const generatedFullPaymentUrl = `${window.location.origin}${generatedPaymentLink}`;

    const userProfile = {
      firstName: form.fullName.split(" ")[0],
      fullName: form.fullName,
      phone: form.phone,
      state: form.state,
      skill: form.skill,
      experience: form.experience,
      minJob: form.minJob,
      avgJob: form.avgJob,
      premiumJob: form.premiumJob,
      bio: form.bio,
      bvn: form.bvn,
      nin: form.nin,
      bvnVerified: bvnVerified,
      bvnName: verifiedName,
      slug: generatedSlug,
      paymentLink: generatedPaymentLink,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem("craftid_user", JSON.stringify(userProfile));
    localStorage.setItem("craftid_bvn_verified", String(bvnVerified));

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
              <span style={{ color: "var(--text-2)", fontSize: 13 }}>{step} of 4</span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }}>
                {step === 1 && <div><UserCircle2 size={48} style={{ color: "var(--orange)", marginBottom: 14 }} /><h1 style={{ fontFamily: "var(--font-syne)", fontSize: 32, fontWeight: 700 }}>Who are you?</h1><p style={{ color: "var(--text-2)", marginTop: 6 }}>Let&apos;s set up your professional identity</p><div className="mt-7 space-y-4">{[["Full name", "fullName", "Emeka Okafor"], ["Phone", "phone", "0812 345 6789"]].map(([label, key, placeholder]) => <div key={key}><label className="mb-1 block text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--text-2)" }}>{label}</label><input className="w-full rounded-xl px-4 py-3.5" value={form[key as keyof typeof form] as string} placeholder={placeholder} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} /></div>)}<div><label className="mb-1 block text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--text-2)" }}>State</label><select className="w-full rounded-xl px-4 py-3.5" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}><option value="">Select your state</option>{states.map((s) => <option key={s}>{s}</option>)}</select></div></div></div>}

                {step === 2 && <div><h1 style={{ fontFamily: "var(--font-syne)", fontSize: 32, fontWeight: 700 }}>What&apos;s your craft?</h1><p style={{ color: "var(--text-2)", marginTop: 6 }}>Choose your primary skill</p><div className="mt-7 grid grid-cols-3 gap-3">{skills.map((skill) => {const active = form.skill === skill; const [emoji, ...rest] = skill.split(" "); return <button key={skill} onClick={() => setForm((f) => ({ ...f, skill }))} className="flex flex-col items-center gap-2 rounded-2xl px-2 py-4" style={{ background: active ? "var(--orange-dim)" : "var(--surface)", border: `1px solid ${active ? "var(--orange)" : "var(--border)"}`, boxShadow: active ? "0 0 0 3px var(--orange-dim)" : "none" }}><span style={{ fontSize: 28 }}>{emoji}</span><span style={{ color: active ? "var(--orange)" : "var(--text-2)", fontSize: 12 }}>{rest.join(" ")}</span>{active ? <span className="h-2 w-2 rounded-full" style={{ background: "var(--orange)" }} /> : null}</button>;})}</div><div className="mt-6"><label style={{ color: "var(--text-2)", fontSize: 14 }}>Years of experience: <span style={{ color: "var(--orange)", fontWeight: 600 }}>{form.experience} years</span></label><input type="range" min={1} max={25} className="mt-3 w-full" style={{ accentColor: "var(--orange)" }} value={form.experience} onChange={(e) => setForm((f) => ({ ...f, experience: Number(e.target.value) }))} /></div></div>}

                {step === 3 && <div><h1 style={{ fontFamily: "var(--font-syne)", fontSize: 32, fontWeight: 700 }}>Set your rates</h1><p style={{ color: "var(--text-2)", marginTop: 6 }}>Help clients understand your pricing</p><div className="mt-7 space-y-5">{[["Minimum job (small repair or alteration)", "minJob"], ["Average job", "avgJob"], ["Premium job (optional)", "premiumJob"]].map(([label, key]) => { const rateKey = key as RateKey; const currentValue = getRateValue(rateKey); return <div key={key}><div className="mb-2 flex items-center justify-between"><label className="block text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--text-2)" }}>{label}</label><span style={{ color: "var(--orange)", fontFamily: "var(--font-dm-mono)", fontSize: 13, fontWeight: 700 }}>₦{formatMoney(String(currentValue))}</span></div><input type="range" min={RATE_MIN} max={RATE_MAX} step={RATE_STEP} className="w-full" style={{ accentColor: "var(--orange)" }} value={currentValue} onChange={(e) => setRateValue(rateKey, Number(e.target.value))} /></div>;})}<div><label className="mb-1 block text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--text-2)" }}>Bio</label><textarea rows={3} className="w-full resize-none rounded-xl px-4 py-3.5" placeholder="Master tailor with 12 years experience..." value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} /></div></div></div>}

                {step === 4 && <div><h1 style={{ fontFamily: "var(--font-syne)", fontSize: 32, fontWeight: 700 }}>Verify your identity</h1><div className="mt-5 flex items-center gap-2 rounded-xl border px-4 py-3" style={{ background: "var(--orange-dim)", borderColor: "rgba(249,115,22,0.2)" }}><Shield size={16} style={{ color: "var(--orange)" }} /><p style={{ fontSize: 13 }}>Your data is encrypted and secured by Interswitch</p></div><div className="mt-5 space-y-4"><div><label className="mb-1 block text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--text-2)" }}>BVN</label><div className="flex gap-2"><input className="flex-1 rounded-xl px-4 py-3.5" maxLength={11} value={form.bvn} placeholder="Enter 11-digit BVN" onChange={(e) => { setForm((f) => ({ ...f, bvn: e.target.value.replace(/\D/g, "") })); setBvnVerified(false); setBvnError(null); }} /><button onClick={handleVerifyBVN} disabled={bvnVerifying || form.bvn.length !== 11} className="inline-flex items-center gap-2 rounded-xl px-4 py-2" style={{ background: form.bvn.length === 11 && !bvnVerifying ? "var(--orange)" : "var(--surface)", color: form.bvn.length === 11 && !bvnVerifying ? "white" : "var(--text-3)" }}>{bvnVerifying ? <><Loader2 size={14} className="animate-spin" /><span>Verifying...</span></> : "Verify"}</button></div>{bvnVerified && <p className="text-sm" style={{ color: "var(--green)" }}>✓ Verified: {verifiedName}</p>}{bvnError && <p className="text-sm" style={{ color: "var(--red)" }}>{bvnError}</p>}</div><div><label className="mb-1 block text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--text-2)" }}>NIN (optional)</label><input className="w-full rounded-xl px-4 py-3.5" value={form.nin} onChange={(e) => setForm((f) => ({ ...f, nin: e.target.value.replace(/\D/g, "") }))} /></div><button onClick={() => setForm((f) => ({ ...f, agree: !f.agree }))} className="flex items-center gap-3"><span className="grid h-5 w-5 place-items-center rounded border" style={{ borderColor: form.agree ? "var(--orange)" : "var(--border)", background: form.agree ? "var(--orange)" : "transparent" }}>{form.agree ? <Check size={13} style={{ color: "white" }} /> : null}</span><span style={{ color: "var(--text-2)", fontSize: 13 }}>I agree to the <a href="#" style={{ color: "var(--orange)", textDecoration: "underline" }}>Terms</a> and <a href="#" style={{ color: "var(--orange)", textDecoration: "underline" }}>Privacy</a>.</span></button></div></div>}
              </motion.div>
            </AnimatePresence>

            <button onClick={handleContinue} disabled={!valid || loading} className="mt-8 w-full rounded-3xl px-4 py-4" style={{ background: valid ? "var(--orange)" : "var(--surface)", color: valid ? "white" : "var(--text-3)", border: valid ? "none" : "1px solid var(--border)", fontFamily: "var(--font-syne)", fontSize: 16, fontWeight: 700 }}>{loading ? "Creating your CraftID..." : "Continue"}</button>
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