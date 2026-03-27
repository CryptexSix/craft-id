"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3, Home, Repeat2, Sparkles, Users, Wallet } from "lucide-react";

const dashboardMenu = [
  {
    label: "Overview",
    href: "/dashboard",
    description: "Daily summary",
    icon: Home,
  },
  {
    label: "Stats",
    href: "/dashboard#stats",
    description: "Trend alerts",
    icon: BarChart3,
  },
  {
    label: "CraftScore",
    href: "/score",
    description: "Score breakdown",
    icon: Sparkles,
  },
  {
    label: "Report",
    href: "/report",
    description: "Income report",
    icon: Wallet,
  },
  {
    label: "Transactions",
    href: "/dashboard#transactions",
    description: "Recent flows",
    icon: Repeat2,
  },
  {
    label: "Nearby",
    href: "/dashboard#clients",
    description: "Local leads",
    icon: Users,
  },
];

export function DashboardNav() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateHash = () => setHash(window.location.hash ?? "");
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, [pathname]);

  const resolveActive = (href: string) => {
    const [targetPath, targetHash] = href.split("#");
    const normalizedPath = targetPath || "/";
    if (normalizedPath !== pathname) return false;
    if (!targetHash) return true;
    return hash === `#${targetHash}`;
  };

  return (
    <div
      className="mb-6 overflow-hidden rounded-xl border bg-[var(--surface)]"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="border-b px-4 py-3 text-xs uppercase tracking-[0.3em]" style={{ borderColor: "var(--border)" }}>
        Dashboard menu
      </div>
      <div className="flex max-w-full gap-3 overflow-x-auto px-4 py-3">
        {dashboardMenu.map(({ label, href, icon: Icon, description }) => {
          const active = resolveActive(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex min-w-35 flex-col gap-1 rounded-md border px-4 py-3 transition-colors"
              style={{
                borderColor: active ? "rgba(249,115,22,0.2)" : "transparent",
                background: active ? "var(--orange-dim)" : "var(--surface-2)",
                color: active ? "var(--orange)" : "var(--text-1)",
              }}
              aria-current={active ? "page" : undefined}
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Icon size={16} />
                <span>{label}</span>
              </div>
              <p className="text-[11px] leading-snug" style={{ color: "var(--text-2)" }}>
                {description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
