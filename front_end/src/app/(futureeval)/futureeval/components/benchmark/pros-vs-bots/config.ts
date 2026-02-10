export type DiffDatum = { x: string; mean: number; lo: number; hi: number };

export const BINARY_ONLY_EXAMPLE: DiffDatum[] = [
  { x: "2024 Q3", mean: 11.3, lo: 0.7, hi: 21.8 },
  { x: "2024 Q4", mean: 8.9, lo: -1.0, hi: 18.8 },
  { x: "2025 Q1", mean: 9.81, lo: -2.25, hi: 21.87 },
  { x: "2025 Q2", mean: 14.84, lo: 2.47, hi: 27.2 },
];

export const ALL_TYPES: DiffDatum[] = [
  { x: "2025 Q1", mean: 17.7, lo: 7.0, hi: 28.3 },
  { x: "2025 Q2", mean: 20.03, lo: 11.41, hi: 28.63 },
];
