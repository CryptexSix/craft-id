"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function CTA() {
  return (
    <section className="py-4.5 xl:py-24">
      <div className="mx-auto max-w-175 text-center">
        <h2 className="text-[40px] xl:text-[52px] max-sm:text-[30px]" style={{ fontFamily: "var(--font-syne)", fontWeight: 800 }}>
          Start building your <span style={{ background: "linear-gradient(135deg,#F97316,#7C3AED)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>financial identity.</span>
        </h2>
        <p className="mt-4 font-light" style={{ color: "var(--text-2)" }}>
          Join the waitlist. Be among the first artisans in Nigeria to turn their craft into credit.
        </p>
        <motion.div whileHover={{ scale: 1.02 }} className="mt-7">
          <Link href="/onboarding" className="inline-flex  items-center justify-items-center rounded-full px-8 py-4 font-semibold w-auto" style={{ background: "var(--orange)", color: "white" }}>
            Get Your CraftID Free →
          </Link>
        </motion.div>
        <p className="my-3 text-xs font-light" style={{ color: "var(--text-2)" }}>
          No credit check · No payslip · No bank statement
        </p>
      </div>
    </section>
  );
}
