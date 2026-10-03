import { Request, Response } from "express";
import { listAuditLogs } from "../services/audit.service";
import { auditLogQuerySchema } from "../validators/audit.validator";
import { successResponse, errorResponse } from "../utils/apiResponse";

export async function getAuditLogs(req: Request, res: Response) {
  try {
    const parsed = auditLogQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid audit log filters.";
      return errorResponse(res, message, 400);
    }

    const institutionId = req.user!.institutionId as string;
    const data = await listAuditLogs(institutionId, parsed.data);

    return successResponse(res, "Audit logs retrieved successfully.", data);
  } catch (err) {
    console.error("Get audit logs error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}