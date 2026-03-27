import AuthenticatedLayout from "@/components/authenticated-layout";

export default function CardLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}