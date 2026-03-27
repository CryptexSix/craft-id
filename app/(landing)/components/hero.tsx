"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section id="product" className="relative flex min-h-[calc(100vh-80px)] w-full flex-col items-start xl:items-center  justify-center gap-7 pb-10 pt-16 lg:flex-row">
      <div className="flex-1 z-10 relative">
        <div className="mb-4 xl:mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs" style={{ borderColor: "rgba(249,115,22,0.25)", background: "var(--orange-dim)", color: "var(--orange)" }}>
          <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--orange)" }} />
          Now in Beta · Lagos, Nigeria
        </div>
        <h1 style={{ fontFamily: "var(--font-syne)", lineHeight: 1.02, fontWeight: 800 }} className="2xl:text-[67px] max-2xl:text-[59px] max-xl:text-[45px] max-lg:text-[58px] max-md:text-[54px] max-sm:text-[35px]   ">Your craft is</h1>
        <h1 style={{ fontFamily: "var(--font-syne)", lineHeight: 1.02, fontWeight: 800, background: "linear-gradient(135deg, #F97316 0%, #7C3AED 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }} className="[1440px]:text-[72px] text-[52px] max-xl:text-[45px] max-lg:text-[58px] max-md:text-[54px] max-sm:text-[35px]">your credit.</h1>
        <p className="mt-4 xl:mt-6 max-w-[560px] font-light text-[15px] xl:text-[18px] " style={{ color: "var(--text-2)", lineHeight: 1.7 }}>
          CraftID turns every client payment into a financial identity. No payslip. No salary letter. No bank visits. Just your work.
        </p>
        <div className="mt-6 xl:mt-8 flex flex-wrap gap-2 sm:gap-3">
          <motion.div whileHover={{ scale: 1.02 }}>
            <Link href="/onboarding" className="inline-flex rounded-full px-4 sm:px-7 py-[11px] sm:py-[13px] max-sm:text-[14px] sm:font-medium" style={{ background: "var(--orange)", color: "white", boxShadow: "0 0 30px rgba(249,115,22,0.3)" }}>
              Get Your CraftID Free
            </Link>
          </motion.div>
          <Link href="#how" className="inline-flex rounded-full border px-4 sm:px-7 max-sm:text-[14px] py-[11px] sm:py-[13px]" style={{ borderColor: "var(--border-light)", color: "var(--text-1)", background: "transparent" }}>
            Watch Demo
          </Link>
        </div>
        <p className="mt-4 text-xs" style={{ color: "var(--text-2)" }}>🔒 Secured by Interswitch · ✓ CBN Compliant · Free to start</p>
      </div>

      <div className="relative flex flex-1 justify-center md:justify-end z-10 max-sm:mt-7">
        <div className="pointer-events-none absolute -z-10 h-64 w-64 rounded-full" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.14) 0%, transparent 70%)" }} />
        <div className="w-80 sm:w-100 sm:h-[350px] rounded-[40px] border-2 py-5 px-3" style={{ borderColor: "var(--border-light)", background: "var(--surface)", boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03), 0 0 80px rgba(249,115,22,0.08)", animation: "phoneFloat 3s ease-in-out infinite" }}>
          <div className="mx-auto mb-2 h-5 w-15 rounded-full" style={{ background: "var(--bg)" }} />
          <div className="rounded-[32px] p-4" style={{ background: "var(--bg)" }}>
            <p style={{ color: "var(--text-2)", fontSize: 10 }}>Good morning, Emeka 👋</p>
            <p style={{ fontFamily: "var(--font-syne)", fontSize: 20, fontWeight: 800, marginTop: 6 }}>₦284,500</p>
            <p style={{ color: "var(--green)", fontSize: 9, marginTop: 2 }}>+₦45,000 this month</p>
            <div className="mt-4 flex items-center justify-between">
              <div className="grid h-16 w-16 place-items-center rounded-full border-4" style={{ borderColor: "var(--orange)", color: "var(--orange)", fontFamily: "var(--font-dm-mono)", fontSize: 18, fontWeight: 600 }}>
                741
              </div>
              <div className="rounded-xl px-3 py-2" style={{ background: "var(--orange-dim)", color: "var(--orange)", fontSize: 10 }}>
                Pre-Approved · ₦150,000
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {[
                ["Ngozi Adeleke", "₦5,000"],
                ["Taiwo Babatunde", "₦4,000"],
              ].map((r) => (
                <div key={r[0]} className="flex items-center justify-between rounded-lg px-2 py-2" style={{ background: "var(--surface)" }}>
                  <span style={{ color: "var(--text-2)", fontSize: 10 }}>{r[0]}</span>
                  <span style={{ color: "var(--green)", fontSize: 10, fontFamily: "var(--font-dm-mono)" }}>{r[1]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
