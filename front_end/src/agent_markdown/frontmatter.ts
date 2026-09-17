import { stringify } from "yaml";

export type FrontmatterValue =
  | string
  | number
  | boolean
  | readonly string[]
  | null
  | undefined;

function isPresent(value: FrontmatterValue): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  // The API returns "" for unset text fields; `key: ""` reads as a real value
  if (typeof value === "string") return value.trim() !== "";
  return true;
}

/** Fenced YAML block in insertion order; absent values are dropped. */
export function serializeFrontmatter(
  entries: Record<string, FrontmatterValue>
): string {
  const present = Object.entries(entries).filter(([, value]) =>
    isPresent(value)
  );

  if (present.length === 0) return "";

  const body = stringify(Object.fromEntries(present)).trimEnd();

  return ["---", body, "---"].join("\n");
}
