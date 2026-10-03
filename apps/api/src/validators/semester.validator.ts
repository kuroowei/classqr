import { z } from "zod";

export const createSemesterSchema = z.object({
  name: z.string().min(1, "Semester name is required."),
  sortOrder: z.number().int().optional(),
});

export const updateSemesterSchema = createSemesterSchema.partial();