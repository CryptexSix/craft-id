import AuthenticatedLayout from "@/components/authenticated-layout";

export default function LoanLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}