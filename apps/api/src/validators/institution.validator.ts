import { z } from "zod";

export const createInstitutionSchema = z.object({
  name: z.string().min(2, "Institution name is required."),
  shortName: z.string().min(2, "Short name is required.").max(20),
  type: z.enum(["UNIVERSITY", "POLYTECHNIC", "COLLEGE", "OTHER"]).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
});

export const updateInstitutionSchema = createInstitutionSchema.partial();