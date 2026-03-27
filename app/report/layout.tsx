import AuthenticatedLayout from "@/components/authenticated-layout";

export default function ReportLayout({ children }: { children: React.ReactNode }) {
    return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
