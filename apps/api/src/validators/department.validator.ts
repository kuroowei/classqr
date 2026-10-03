import { z } from "zod";

export const createDepartmentSchema = z.object({
  facultyId: z.string().min(1, "Faculty is required."),
  name: z.string().min(2, "Department name is required."),
  code: z.string().min(2, "Department code is required.").max(20),
  headOfDept: z.string().optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();