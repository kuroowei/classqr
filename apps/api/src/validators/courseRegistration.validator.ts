import { z } from "zod";

export const createCourseRegistrationSchema = z.object({
  studentId: z.string().min(1, "Student is required."),
  courseId: z.string().min(1, "Course is required."),
});