import { z } from "zod";

export const createProgrammeSchema = z.object({
  departmentId: z.string().min(1, "Department is required."),
  name: z.string().min(2, "Programme name is required."),
  code: z.string().min(2, "Programme code is required.").max(20),
  degreeType: z.string().optional(),
  durationYears: z.number().int().positive().optional(),
});

export const updateProgrammeSchema = createProgrammeSchema.partial();