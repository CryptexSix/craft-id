"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Scissors, Sparkles, Wallet, CreditCard } from "lucide-react";
import { useUser } from "@/lib/useUser";

function NairaIcon({ size = 16 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        fontSize: size,
        lineHeight: 1,
        fontWeight: 800,
      }}
    >
      ₦
    </span>
  );
}

export const navItems = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Payments/Invoices", href: "/dashboard/payments-invoices", icon: NairaIcon },
  { label: "CraftScore", href: "/score", icon: Sparkles },
  { label: "Loans", href: "/loan", icon: Wallet },
  { label: "My Card", href: "/card", icon: CreditCard },
];

export function NavSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const initials =
    user?.fullName
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((name) => name[0]?.toUpperCase())
      .join("") || "CU";

  return (
    <>
      <aside
        className="fixed left-0 top-0 z-40 hidden h-screen w-60 flex-col md:flex"
        style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}
      >
        <div className="border-b p-6" style={{ borderColor: "var(--border)" }}>
          <Link href="/" className="flex items-center gap-3">
            <div
              className="grid h-8 w-8 place-items-center rounded-[10px]"
              style={{ background: "linear-gradient(135deg, var(--orange), var(--orange-light))" }}
            >
              <Scissors size={16} style={{ color: "white" }} />
            </div>
            <span style={{ color: "var(--text-1)", fontFamily: "var(--font-syne)", fontSize: "18px", fontWeight: 700 }}>
              CraftID
            </span>
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="relative flex items-center gap-3 rounded-md px-3.5 py-2.5"
                style={{
                  color: active ? "var(--orange)" : "var(--text-2)",
                  background: active ? "var(--orange-dim)" : "transparent",
                  border: active ? "1px solid rgba(249,115,22,0.2)" : "1px solid transparent",
                }}
              >
                {active ? (
                  <span className="absolute left-0 top-1/2 h-6 w-0.75 -translate-y-1/2 rounded-r" style={{ background: "var(--orange)" }} />
                ) : null}
                <Icon size={16} />
                <span className="text-sm">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div
              className="grid h-9 w-9 place-items-center rounded-full"
              style={{ background: "linear-gradient(135deg, var(--orange), var(--purple))", color: "white", fontWeight: 700 }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium" style={{ color: "var(--text-1)" }}>
                {user?.fullName || "Craft User"}
              </p>
              <p className="truncate text-xs" style={{ color: "var(--text-2)" }}>
                {user?.skill || "Artisan"} · {user?.state || "Nigeria"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t px-2 py-2 md:hidden"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="grid grid-cols-5 gap-1">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center justify-center gap-1 rounded-[10px] px-2 py-2"
                style={{
                  color: active ? "var(--orange)" : "var(--text-2)",
                  background: active ? "var(--orange-dim)" : "transparent",
                  border: active ? "1px solid rgba(249,115,22,0.2)" : "1px solid transparent",
                }}
              >
                <Icon size={15} />
                <span className="text-[10px] leading-none">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

    </>
  );
}
