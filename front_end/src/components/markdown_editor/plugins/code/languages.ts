import type { Language } from "prism-react-renderer";

export const CANONICAL_TO_LABEL = {
  text: "Plain text",
  ts: "TypeScript",
  tsx: "TSX",
  js: "JavaScript",
  jsx: "JSX",
  bash: "Bash",
  python: "Python",
  json: "JSON",
  sql: "SQL",
} as const;

export type CanonicalLang = keyof typeof CANONICAL_TO_LABEL;

const ALIAS_TO_CANONICAL: Record<string, CanonicalLang> = {
  text: "text",
  plaintext: "text",
  plain: "text",

  typescript: "ts",
  ts: "ts",
  tsx: "tsx",
  javascript: "js",
  js: "js",
  jsx: "jsx",

  bash: "bash",
  sh: "bash",
  shell: "bash",
  zsh: "bash",

  py: "python",
  python: "python",
  json: "json",
  sql: "sql",
};

export function normalizeLang(
  raw?: string,
  fallback: CanonicalLang = "ts"
): CanonicalLang {
  if (!raw) return fallback;
  const key = raw.toLowerCase();
  return (ALIAS_TO_CANONICAL[key] as CanonicalLang) ?? fallback;
}

export const CANONICAL_TO_PRISM: Record<CanonicalLang, Language> = {
  text: "text" as Language,
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  bash: "bash",
  python: "python",
  json: "json",
  sql: "sql",
};
