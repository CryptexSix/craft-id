"use client";

import { motion } from "framer-motion";
import { QrCode, Scissors, TrendingUp } from "lucide-react";

const steps = [
  {
    no: "01",
    icon: Scissors,
    title: "Create Your Profile",
    description: "Tell us your craft, set your rates. Get your unique payment link and QR code in under 3 minutes.",
  },
  {
    no: "02",
    icon: QrCode,
    title: "Collect Client Payments",
    description: "Share your link or QR code. Every payment builds your transaction history automatically — no manual tracking needed.",
  },
  {
    no: "03",
    icon: TrendingUp,
    title: "Generate Proof of Income",
    description: "As payments come in, your CraftScore grows and you can generate an income verification PDF for loans, rentals, and supplier credit.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="w-full py-15 xl:py-20">
      <h2 className="text-center max-xl:leading-13 text-[44px] max-sm:text-[30px] max-sm:leading-10" style={{ fontFamily: "var(--font-syne)", fontSize: "", fontWeight: 800 }}>
        From invisible to bankable
      </h2>
      <p className="mb-14 text-center font-light" style={{ color: "var(--text-2)", marginTop: 10 }}>
        Three steps that change everything
      </p>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {steps.map((step, i) => (
          <motion.div key={step.no} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.08 }} viewport={{ once: true }} whileHover={{ y: -4 }} className="relative rounded-xl border p-8" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}>
            <span className="absolute right-5 top-2" style={{ fontFamily: "var(--font-syne)", fontSize: 70, opacity: 0.06, fontWeight: 900 }}>{step.no}</span>
            <div className="mb-5 grid h-12 w-12 place-items-center rounded-md border" style={{ background: "var(--orange-dim)", borderColor: "rgba(249,115,22,0.2)", color: "var(--orange)" }}>
              <step.icon size={22} />
            </div>
            <h3 className="text-[16px] xl:text-[20px]" style={{ fontFamily: "var(--font-syne)", fontWeight: 700 }}>{step.title}</h3>
            <p className="mt-3 font-light text-[13px] xl:text-[15px]" style={{ color: "var(--text-2)", lineHeight: 1.7 }}>{step.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
