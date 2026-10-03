import { z } from "zod";

export const createAcademicSessionSchema = z.object({
  name: z.string().min(1, "Session name is required."),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export const updateAcademicSessionSchema = createAcademicSessionSchema.partial();