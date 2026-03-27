type ClassValue = string | false | null | undefined;
export const cn = (...i: ClassValue[]) => i.filter(Boolean).join(" ");
export const formatNaira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

// CraftScore: base score removed. Max achievable now:
// BVN 150 + frequency 200 + volume 300 + consistency 200 = 850.
export const MAX_CRAFT_SCORE = 850;

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
