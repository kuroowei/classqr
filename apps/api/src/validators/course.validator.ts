import { z } from "zod";

export const createCourseSchema = z.object({
  facultyId: z.string().min(1, "Faculty is required."),
  programmeId: z.string().min(1, "Programme is required."),
  levelId: z.string().min(1, "Level is required."),
  academicSessionId: z.string().min(1, "Academic session is required."),
  semesterId: z.string().min(1, "Semester is required."),
  code: z.string().min(3, "Course code is required.").max(20),
  title: z.string().min(2, "Course title is required."),
  description: z.string().optional(),
  creditUnit: z.number().int().positive().optional(),
});

export const updateCourseSchema = createCourseSchema.partial();