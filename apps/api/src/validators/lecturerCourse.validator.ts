import { z } from "zod";

export const assignLecturerCourseSchema = z.object({
  lecturerId: z.string().min(1, "Lecturer is required."),
  courseId: z.string().min(1, "Course is required."),
});