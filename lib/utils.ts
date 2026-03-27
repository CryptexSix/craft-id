type ClassValue = string | false | null | undefined;
export const cn = (...i: ClassValue[]) => i.filter(Boolean).join(" ");
export const formatNaira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

// CraftScore: base score removed. Max achievable now:
// BVN 150 + frequency 200 + volume 300 + consistency 200 = 850.
export const MAX_CRAFT_SCORE = 850;

export function getAppOrigin() {
  const envUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    ""
  ).trim();

  if (envUrl) return envUrl.replace(/\/$/, "");

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  const vercelUrl = (
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    process.env.VERCEL_URL ||
    ""
  ).trim();
  if (vercelUrl) {
    const normalized = vercelUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${normalized}`;
  }

  return "";
}

export const getScoreColor = (s: number) =>
  s >= 650
    ? "var(--green)"
    : s >= 500
      ? "var(--orange)"
      : s >= 350
        ? "var(--yellow)"
        : "var(--red)";
export const getScoreLabel = (s: number) =>
  s >= 650
    ? "Excellent"
    : s >= 500
      ? "Good Standing"
      : s >= 350
        ? "Fair"
        : "Building";
