export type FieldErrorMap = Record<string, string[]>;
const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;
export const isFieldErrorMap = (e: unknown): e is FieldErrorMap =>
  isObject(e) &&
  Object.values(e).every((v) => Array.isArray(v) || v === undefined);

export function firstErrorFor(
  errors: unknown,
  field: string
): string | undefined {
  if (!errors) return;
  if (isFieldErrorMap(errors)) {
    const v = errors[field];
    if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  }

  if (isObject(errors)) {
    const root = errors[field];
    if (Array.isArray(root) && typeof root[0] === "string") return root[0];
    if (typeof root === "string") return root;
    const fe = errors["fieldErrors"];
    if (isFieldErrorMap(fe)) {
      const v = fe[field];
      if (Array.isArray(v) && typeof v[0] === "string") return v[0];
    }
  }
}
