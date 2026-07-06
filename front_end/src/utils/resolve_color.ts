import { ThemeColor } from "@/types/theme";

export type ThemeOrCssColor = ThemeColor | string;

export const isCssColorString = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;

export const isThemeColor = (v: unknown): v is ThemeColor => {
  if (!v || typeof v !== "object") return false;
  const obj = v as { DEFAULT?: unknown; dark?: unknown };
  return typeof obj.DEFAULT === "string" && typeof obj.dark === "string";
};

export const resolveToCssColor = (
  getThemeColor: (c: ThemeColor) => string,
  v?: ThemeOrCssColor
): string | undefined => {
  if (isCssColorString(v)) return v;
  if (isThemeColor(v)) return getThemeColor(v);
  return undefined;
};
