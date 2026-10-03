import { z } from "zod";

export const checkInSchema = z.object({
  qrToken: z.string().min(1, "QR token is required."),
});