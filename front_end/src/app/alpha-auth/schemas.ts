import { z } from "zod";

export const devLoginSchema = z.object({
  token: z.string(),
});

export type DevLoginSchema = z.infer<typeof devLoginSchema>;
