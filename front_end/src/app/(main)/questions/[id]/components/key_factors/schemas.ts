import { z } from "zod";

// Allow empty (no error shown until user types), or 20–120 trimmed characters
export const driverTextSchema = z
  .string()
  .trim()
  .refine((value) => value.length === 0 || value.length >= 20, {
    message: "String must contain at least 20 character(s)",
  })
  .refine((value) => value.length <= 120, {
    message: "String must contain at most 120 character(s)",
  });
