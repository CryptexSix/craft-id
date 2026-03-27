"use client";

const stats = [
  ["15M+", "Artisans in Nigeria"],
  ["₦100M+", "Monthly Opportunity"],
  ["2 Hours", "To First Loan"],
  ["0", "Payslips Required"],
];

export function Stats() {
  return (
    <section className="relative w-full py-8">
      <div className="mx-auto grid w-full max-w-330 grid-cols-2 gap-5 px-4 md:grid-cols-4 md:px-8">
        {stats.map(([v, l], i) => (
          <div key={v} className="text-center m md:pl-5" style={{ borderLeft: i === 0 ? "none" : "1px solid var(--border)" }}>
            <p style={{ fontFamily: "var(--font-syne)", fontWeight: 800, background: "linear-gradient(135deg,#F97316,#7C3AED)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }} className=" text-[18px] lg:text-[27px] xl:text-[36px]">{v}</p>
            <p style={{ color: "var(--text-2)", fontSize: 14 }}>{l}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
