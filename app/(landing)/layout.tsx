"use client";

import Link from "next/link";
import { Scissors, ShieldCheck, Menu, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <header ref={menuRef} className="fixed justify-center left-0 right-0 top-0 z-50 border-b" style={{ background: "rgba(9,9,14,0.85)", borderColor: "var(--border)", backdropFilter: "blur(20px)" }}>
        <div className=" mx-auto flex h-16 max-w-350   items-center justify-between px-5 md:px-10">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-[10px]" style={{ background: "linear-gradient(135deg, var(--orange), var(--orange-light))" }}>
              <Scissors size={15} style={{ color: "white" }} />
            </div>
            <span style={{ fontFamily: "var(--font-syne)", fontSize: 20, fontWeight: 700 }}>CraftID</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-8 lg:flex" style={{ color: "var(--text-2)", fontSize: 14 }}>
            <a href="#product">Product</a>
            <a href="#how">How it works</a>
            <a href="#for-artisans">For artisans</a>
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center justify-end gap-2">
            <Link href="/dashboard" className="inline-flex rounded-xl border px-4 py-2 text-sm" style={{ borderColor: "var(--border-light)", color: "var(--text-1)" }}>
              Sign In
            </Link>
            <Link href="/onboarding" className="inline-flex rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: "var(--orange)", color: "white" }}>
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white p-1"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden absolute top-16 left-0 right-0 border-b flex flex-col p-5 gap-6 shadow-xl" 
              style={{ background: "rgba(9,9,14,0.98)", borderColor: "var(--border)" }}
            >
              <nav className="flex flex-col gap-4" style={{ color: "var(--text-2)", fontSize: 16 }}>
                <a href="#product" onClick={() => setMobileMenuOpen(false)}>Product</a>
                <a href="#how" onClick={() => setMobileMenuOpen(false)}>How it works</a>
                <a href="#for-artisans" onClick={() => setMobileMenuOpen(false)}>For artisans</a>
              </nav>
              <div className="flex flex-col gap-3 pt-4 border-t" style={{ borderColor: "var(--border-light)" }}>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="inline-flex justify-center rounded-xl border px-4 py-3 text-sm" style={{ borderColor: "var(--border-light)", color: "var(--text-1)" }}>
                  Sign In
                </Link>
                <Link href="/onboarding" onClick={() => setMobileMenuOpen(false)} className="inline-flex justify-center rounded-xl px-4 py-3 text-sm font-semibold" style={{ background: "var(--orange)", color: "white" }}>
                  Get Started
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="mx-auto max-w-360  px-5 md:px-15 pt-20">
        {children}
      </main>

      <footer className="border-t py-3  md:py-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="mx-auto flex w-full max-w-330 flex-col items-start justify-between gap-4 px-4 md:flex-row md:items-center md:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: "linear-gradient(135deg, var(--orange), var(--orange-light))" }}>
              <Scissors size={13} style={{ color: "white" }} />
            </div>
            <p>
              <span style={{ fontFamily: "var(--font-syne)", fontWeight: 700 }} className="max-sm:text-[16px]" >CraftID</span>
              <span style={{ color: "var(--text-2)", marginLeft: 8 }} className="font-light max-sm:text-[14px]">Your craft is your credit</span>
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs" style={{ background: "var(--orange-dim)", borderColor: "rgba(249,115,22,0.2)", color: "var(--orange)" }}>
            <ShieldCheck size={14} /> Built with Interswitch APIs
          </span>
        </div>
      </footer>
    </>
  );
}
