import { z } from "zod";

export const createLecturerSchema = z.object({
  staffId: z.string().min(3, "Staff ID is required."),
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().email("A valid email is required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  phone: z.string().optional(),
  departmentId: z.string().min(1, "Department is required."),
});

export const updateLecturerSchema = z.object({
  staffId: z.string().min(3).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  departmentId: z.string().min(1).optional(),
});