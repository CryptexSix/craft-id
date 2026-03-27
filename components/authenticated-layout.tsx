"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { NavSidebar } from "@/components/nav-sidebar";
import { useUser } from "@/lib/useUser";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useUser();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: "var(--orange)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div>
      <NavSidebar />
      <main className="px-4 py-6 md:ml-60 md:px-8 md:pb-0" style={{ paddingBottom: "84px" }}>
        {children}
      </main>
    </div>
  );
}