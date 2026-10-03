import { z } from "zod";

export const createLevelSchema = z.object({
  name: z.string().min(1, "Level name is required."),
  sortOrder: z.number().int().optional(),
});

export const updateLevelSchema = createLevelSchema.partial();