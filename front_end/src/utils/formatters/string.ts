export function truncateLabel(label: string, maxLength: number): string {
  if (label.length <= maxLength) {
    return label;
  }
  return label.slice(0, maxLength).trim() + "...";
}

export function getValidString(
  str: string | null | undefined
): string | undefined {
  return str && str.trim() !== "" ? str : undefined;
}
