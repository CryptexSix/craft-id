import { NavSidebar } from "@/components/nav-sidebar";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <NavSidebar />
      <main className="px-4 py-6 md:ml-60 md:px-8 md:pb-0" style={{ paddingBottom: "84px" }}>
        {children}
      </main>
    </div>
  );
}