type ClassValue = string | false | null | undefined;
export const cn = (...i: ClassValue[]) => i.filter(Boolean).join(" ");
export const formatNaira = (n: number) => `₦${n.toLocaleString("en-NG")}`;
export const getScoreColor = (s: number) =>
  s >= 800 ? "var(--green)" : s >= 650 ? "var(--orange)" : s >= 500 ? "var(--yellow)" : "var(--red)";
export const getScoreLabel = (s: number) =>
  s >= 800 ? "Excellent" : s >= 650 ? "Good Standing" : s >= 500 ? "Fair" : "Building";
