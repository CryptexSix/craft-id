"use client";

import { motion } from "framer-motion";
import { mockTransactions } from "@/lib/mock-data";
import { formatNaira } from "@/lib/utils";

type TransactionFeedProps = {
  limit?: number;
  showHeader?: boolean;
};

export function TransactionFeed({ limit = 8, showHeader = false }: TransactionFeedProps) {
  const data = mockTransactions.slice(0, limit);

  return (
    <div className="w-full">
      {showHeader ? (
        <div className="mb-3 flex items-center justify-between">
          <h3 style={{ fontFamily: "var(--font-syne)", color: "var(--text-1)", fontSize: "18px", fontWeight: 700 }}>
            Recent Payments
          </h3>
          <button style={{ color: "var(--orange)", fontSize: "13px" }}>View All →</button>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        {data.map((tx, i) => (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: i * 0.05, ease: "easeOut" }}
            className="flex items-center justify-between rounded-md px-3 py-2.5"
            style={{ background: "transparent", transition: "background 0.2s ease" }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = "var(--surface-2)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = "transparent";
            }}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="grid h-10 w-10 place-items-center rounded-full border text-sm font-semibold"
                style={{
                  background: `${tx.color}33`,
                  borderColor: `${tx.color}66`,
                  color: tx.color,
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                {tx.initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium" style={{ color: "var(--text-1)" }}>
                  {tx.clientName}
                </p>
                <p className="truncate text-xs" style={{ color: "var(--text-2)" }}>
                  {tx.description}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm font-semibold" style={{ color: "var(--green)", fontFamily: "var(--font-dm-mono)" }}>
                +{formatNaira(tx.amount)}
              </p>
              <p className="text-[11px]" style={{ color: "var(--text-2)" }}>
                {tx.timestamp}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
