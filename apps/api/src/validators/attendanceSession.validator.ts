import { z } from "zod";

export const startAttendanceSessionSchema = z.object({
  courseId: z.string().min(1, "Course is required."),
});