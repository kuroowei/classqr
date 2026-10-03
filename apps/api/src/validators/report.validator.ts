import { z } from "zod";

export const attendanceReportQuerySchema = z.object({
  facultyId: z.string().optional(),
  departmentId: z.string().optional(),
  programmeId: z.string().optional(),
  levelId: z.string().optional(),
  courseId: z.string().optional(),
  lecturerId: z.string().optional(),
  studentId: z.string().optional(),
  academicSessionId: z.string().optional(),
  semesterId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  status: z.enum(["PRESENT", "LATE", "ABSENT"]).optional(),
});