"use client";

import { motion } from "framer-motion";
import { Hero } from "./components/hero";
import { Stats } from "./components/stats";
import { HowItWorks } from "./components/how-it-works";
import { Testimonials } from "./components/testimonials";
import { CTA } from "./components/cta";

export default function LandingPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative"
      style={{ background: "var(--bg)", color: "var(--text-1)" }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)", backgroundSize: "42px 42px" }} />
      <div className="pointer-events-none absolute -right-40 top-0 h-150 w-150 rounded-full" style={{ background: "radial-gradient(circle, var(--orange) 0%, transparent 70%)", opacity: 0.04 }} />
      <div className="pointer-events-none absolute -left-20 bottom-20 h-125 w-125 rounded-full" style={{ background: "radial-gradient(circle, var(--purple) 0%, transparent 70%)", opacity: 0.04 }} />
      
      <Hero />
      <Stats />
      <HowItWorks />
      <Testimonials />
      <CTA />

      <style jsx>{`
        @keyframes phoneFloat {
          0%, 100% { transform: translateY(-8px); }
          50% { transform: translateY(0px); }
        }
      `}</style>
    </motion.div>
  );
}
