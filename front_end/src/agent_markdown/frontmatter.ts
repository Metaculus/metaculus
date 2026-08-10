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
  // The API returns "" for unset text fields; emitting `key: ""` reads as a
  // real but empty value, so treat blank as absent.
  if (typeof value === "string") return value.trim() !== "";
  return true;
}

/**
 * Render frontmatter as a fenced YAML block. Key order is the caller's
 * insertion order, and absent values are dropped so builders can pass optional
 * fields through unconditionally.
 */
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
