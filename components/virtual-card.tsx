"use client";

import { useState } from "react";
import { Wifi } from "lucide-react";
import { formatNaira } from "@/lib/utils";

type VirtualCardProps = {
  last4: string;
  expiry: string;
  name: string;
  limit: number;
  available: number;
};

export function VirtualCard({ last4, expiry, name, limit, available }: VirtualCardProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="mx-auto w-full max-w-100">
      <div
        onClick={() => setRevealed((prev) => !prev)}
        className="relative w-full max-w-95 cursor-pointer overflow-hidden rounded-2xl border p-5"
        style={{
          aspectRatio: "1.586",
          background: "linear-gradient(135deg, #1C1C2E 0%, #16162A 40%, #1A1A3E 100%)",
          borderColor: "rgba(255,255,255,0.08)",
          boxShadow: "0 25px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
          animation: "cardFloat 3s ease-in-out infinite",
        }}
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p style={{ color: "var(--orange)", fontFamily: "var(--font-syne)", fontSize: "12px", fontWeight: 900, letterSpacing: "0.2em" }}>
              CRAFT
            </p>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "9px", letterSpacing: "0.1em" }}>BUSINESS</p>
          </div>
          <Wifi size={22} style={{ color: "rgba(255,255,255,0.3)", transform: "rotate(90deg)" }} />
        </div>

        <div className="mb-8">
          <p className="mb-1" style={{ fontFamily: "var(--font-dm-mono)", fontSize: "16px", letterSpacing: "0.15em" }}>
            <span style={{ color: "rgba(255,255,255,0.35)" }}>•••• •••• •••• </span>
            <span style={{ color: revealed ? "white" : "rgba(255,255,255,0.35)", transition: "color 0.2s ease" }}>{last4}</span>
          </p>
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "9px" }}>Tap to reveal</p>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "8px", textTransform: "uppercase" }}>Card Holder</p>
            <p style={{ color: "white", fontSize: "12px", fontWeight: 600 }}>{name}</p>
          </div>
          <div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "8px", textTransform: "uppercase" }}>Expires</p>
            <p style={{ color: "white", fontSize: "12px", fontFamily: "var(--font-dm-mono)" }}>{expiry}</p>
          </div>
          <p style={{ color: "var(--orange)", fontFamily: "var(--font-syne)", fontSize: "18px", fontWeight: 900 }}>VERVE</p>
        </div>

        <div
          className="absolute bottom-0 left-0 h-0.5 w-full"
          style={{ background: "linear-gradient(90deg, var(--orange), var(--purple))" }}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-full border px-4 py-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <p className="text-[11px]" style={{ color: "var(--text-2)" }}>
            Credit Limit
          </p>
          <p style={{ color: "var(--text-1)", fontFamily: "var(--font-dm-mono)", fontWeight: 600 }}>{formatNaira(limit)}</p>
        </div>
        <div className="rounded-full border px-4 py-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <p className="text-[11px]" style={{ color: "var(--text-2)" }}>
            Available
          </p>
          <p style={{ color: "var(--green)", fontFamily: "var(--font-dm-mono)", fontWeight: 600 }}>{formatNaira(available)}</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes cardFloat {
          0%, 100% { transform: translateY(-6px); }
          50% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
}
