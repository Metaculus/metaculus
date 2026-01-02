/**
 * Truncates a string to a maximum length with ellipsis.
 */
export function truncateLabel(label: string, maxLength: number): string {
  if (!label || label.length <= maxLength) {
    return label;
  }

  // Reserve space for ellipsis (2 characters)
  const truncateAt = Math.max(1, maxLength - 2); // min 1 character

  return label.slice(0, truncateAt).trimEnd() + "…";
}

export function getValidString(
  str: string | null | undefined
): string | undefined {
  return str && str.trim() !== "" ? str : undefined;
}
