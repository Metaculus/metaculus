import { z } from "zod";

import { ProjectPermissions } from "@/types/post";
import { ProjectVisibility } from "@/types/projects";

export const communitySettingsSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .regex(/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/)
    .min(3)
    .max(50),
  description: z.string(),
  default_permission: z.nativeEnum(ProjectPermissions).nullable(),
  visibility: z.nativeEnum(ProjectVisibility),
});

export type CommunitySettingsSchema = z.infer<typeof communitySettingsSchema>;
