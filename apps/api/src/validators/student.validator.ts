import { z } from "zod";

export const createStudentSchema = z.object({
  matricNumber: z.string().min(3, "Matriculation number is required."),
  firstName: z.string().min(1, "First name is required."),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().email("A valid email is required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  phone: z.string().optional(),
  gender: z.string().optional(),
  programmeId: z.string().min(1, "Programme is required."),
  levelId: z.string().min(1, "Level is required."),
  admissionSessionId: z.string().optional(),
});

export const updateStudentSchema = z.object({
  matricNumber: z.string().min(3).optional(),
  firstName: z.string().min(1).optional(),
  middleName: z.string().optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  gender: z.string().optional(),
  programmeId: z.string().min(1).optional(),
  levelId: z.string().min(1).optional(),
  admissionSessionId: z.string().optional(),
});