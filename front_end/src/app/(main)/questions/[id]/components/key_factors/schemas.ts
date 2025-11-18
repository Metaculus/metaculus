import { z } from "zod";

// Allow empty (no error shown until user types), or 20–120 trimmed characters
export const driverTextSchema = z
  .string()
  .trim()
  .min(20)
  .max(120)
  .or(z.string().trim().length(0));
