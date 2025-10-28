export type DiffDatum = { x: string; mean: number; lo: number; hi: number };

export const BINARY_ONLY_EXAMPLE: DiffDatum[] = [
  { x: "2024 Q3", mean: 10.9, lo: 0.9, hi: 20.7 },
  { x: "2024 Q4", mean: 13.2, lo: 4.2, hi: 27.4 },
  { x: "2025 Q1", mean: 17.1, lo: 7.8, hi: 26.7 },
  { x: "2025 Q2", mean: 17.4, lo: 11.4, hi: 26.2 },
];

export const ALL_TYPES: DiffDatum[] = [
  { x: "2025 Q1", mean: 17.0, lo: 12.9, hi: 25.5 },
  { x: "2025 Q2", mean: 17.1, lo: 12.3, hi: 22.0 },
];
