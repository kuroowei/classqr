import { z } from "zod";

export const createFacultySchema = z.object({
  name: z.string().min(2, "Faculty name is required."),
  code: z.string().min(2, "Faculty code is required.").max(20),
  description: z.string().optional(),
  headOfFaculty: z.string().optional(),
});

export const updateFacultySchema = createFacultySchema.partial();