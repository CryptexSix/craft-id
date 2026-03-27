"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Amaka Okonkwo",
    meta: "Tailor · Surulere",
    score: "789",
    quote: "My clients pay me through my link now, and my CraftScore finally reflects the work I do. The income verification PDF makes me look bank-ready.",
    avatar: "https://i.pravatar.cc/150?u=amaka-okonkwo",
  },
  {
    name: "Emeka Daniel",
    meta: "Carpenter · Aba",
    score: "812",
    quote: "My CraftScore is 812. I didn’t fill any form — it built itself as I worked. Now I can show a clean payment history anytime.",
    avatar: "https://i.pravatar.cc/150?u=chukwuemeka-duru",
  },
  {
    name: "Blessing Achike",
    meta: "Hairdresser · Imo",
    score: "698",
    quote: "My clients pay me through my link now. I look professional. I feel like a real business owner because I am one.",
    avatar: "https://i.pravatar.cc/150?u=blessing-achike",
  },
];

export function Testimonials() {
  return (
    <section id="for-artisans" className="relative w-full max-sm:py-14 py-18 xl:py-24 ">
      <div className="absolute inset-0 w-screen left-1/2 -translate-x-1/2 -z-10" style={{ background: "var(--surface)" }} />
      <div className="mx-auto w-full max-w-350">
        <h2 className="text-center max-xl:leading-13 text-[44px] max-sm:text-[30px] max-sm:leading-10" style={{ fontFamily: "var(--font-syne)", fontWeight: 800 }}>
          Real artisans. <br className="hidden max-xl:flex" /> <span style={{ background: "linear-gradient(135deg,#F97316,#7C3AED)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Real results.</span>
        </h2>
        <div className="mt-10 xl:mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.article key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.08 }} viewport={{ once: true }} className="rounded-xl border p-7" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="h-12 w-12 rounded-full" />
                  <div>
                    <p className="text-[15px]" style={{ color: "var(--text-1)", fontWeight: 600 }}>{t.name}</p>
                    <p style={{ color: "var(--text-2)", }}>{t.meta}</p>
                  </div>
                </div>
                <span className="rounded-full px-1.5 xl:px-3 py-1 text-xs" style={{ background: "var(--orange-dim)", border: "1px solid rgba(249,115,22,0.2)", color: "var(--orange)", fontFamily: "var(--font-dm-mono)" }}>
                  {t.score}
                </span>
              </div>
              <p className="mt-5 text-[14px] xl:text-[16px]" style={{ color: "var(--text-2)", lineHeight: 1.8, fontStyle: "italic" }}>
                “{t.quote}”
              </p>
              <p className="mt-4 font-extralight" style={{ color: "var(--orange)" }}>★★★★★</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
