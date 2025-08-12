export const toUtcMs = (s?: string | null) => {
  if (!s) return 0;
  const v = s.trim();
  return Date.parse(/Z|[+-]\d\d:?\d\d$/.test(v) ? v : v + "Z") || 0;
};
