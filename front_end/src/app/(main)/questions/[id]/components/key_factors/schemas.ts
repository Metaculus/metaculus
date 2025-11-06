import { z } from "zod";

// Allow empty (no error shown until user types), or 20–120 trimmed characters
export const driverTextSchema = z
  .string()
  .trim()
  .min(20)
  .max(120)
  .or(z.string().trim().length(0));

const baseRateCommonSchema = z.object({
  reference_class: z.string().trim().min(3),
  unit: z.string().trim().min(1),
  extrapolation: z.enum(["", "linear", "exponential", "other"]).optional(),
  based_on: z.string().trim().optional(),
  source: z.string().trim().min(3),
});

export const baseRateFrequencySchema = z
  .object({
    type: z.literal("frequency"),
    rate_numerator: z.number().int().min(0),
    rate_denominator: z.number().int().min(1),
  })
  .refine(
    (v) =>
      typeof v.rate_numerator === "number" &&
      typeof v.rate_denominator === "number" &&
      v.rate_numerator <= v.rate_denominator
  )
  .and(baseRateCommonSchema);

export const baseRateTrendSchema = z
  .object({
    type: z.literal("trend"),
    projected_value: z.number(),
    projected_by_year: z.number().int().min(1900).max(2100),
  })
  .and(baseRateCommonSchema);

export const baseRateSchema = z.union([
  baseRateFrequencySchema,
  baseRateTrendSchema,
]);

export const baseRateDraftSchema = z.object({
  question_id: z.number().optional(),
  question_option: z.string().optional(),
  base_rate: baseRateSchema,
});
