"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, LucideIcon, Minus } from "lucide-react";

type StatsCardProps = {
  label: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon?: LucideIcon;
  accentColor?: string;
};

export function StatsCard({
  label,
  value,
  prefix,
  suffix,
  sub,
  trend = "neutral",
  trendValue,
  icon: Icon,
  accentColor = "var(--orange)",
}: StatsCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(cardRef, { once: true, margin: "-40px" });

  const trendMeta =
    trend === "up"
      ? { icon: ArrowUpRight, color: "var(--green)" }
      : trend === "down"
      ? { icon: ArrowDownRight, color: "var(--red)" }
      : { icon: Minus, color: "var(--text-2)" };

  const TrendIcon = trendMeta.icon;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileHover={{ y: -1 }}
      className="rounded-lg border p-5"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        boxShadow: "0 0 0 rgba(0,0,0,0)",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.borderColor = "var(--border-light)";
        event.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.24)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.borderColor = "var(--border)";
        event.currentTarget.style.boxShadow = "0 0 0 rgba(0,0,0,0)";
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <p
          className="text-[11px] uppercase tracking-[0.18em]"
          style={{ color: "var(--text-2)", fontFamily: "var(--font-dm-sans)" }}
        >
          {label}
        </p>
        {Icon ? (
          <div
            className="grid h-8 w-8 place-items-center rounded-[10px]"
            style={{ background: "var(--orange-dim)", color: accentColor }}
          >
            <Icon size={16} />
          </div>
        ) : null}
      </div>

      <div className="mb-3 flex items-baseline gap-1">
        {prefix ? (
          <span style={{ color: "var(--orange)", fontFamily: "var(--font-dm-mono)", fontSize: "28px" }}>
            {prefix}
          </span>
        ) : null}
        <span style={{ color: "var(--text-1)", fontFamily: "var(--font-dm-mono)", fontSize: "28px" }}>
          {typeof value === "number" ? value.toLocaleString("en-NG") : value}
        </span>
        {suffix ? <span style={{ color: "var(--text-2)", fontFamily: "var(--font-dm-sans)" }}>{suffix}</span> : null}
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1" style={{ color: trendMeta.color }}>
          <TrendIcon size={14} />
          <span>{trendValue ?? ""}</span>
        </div>
        <span style={{ color: "var(--text-2)", fontFamily: "var(--font-dm-sans)" }}>{sub}</span>
      </div>
    </motion.div>
  );
}
