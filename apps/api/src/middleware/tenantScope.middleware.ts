import { Request, Response, NextFunction } from "express";
import { errorResponse } from "../utils/apiResponse";

export function enforceTenantScope(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return errorResponse(res, "Authentication required.", 401);
  }

  // Platform Super Admin has no institution — it operates across all tenants.
  // Every other role MUST belong to exactly one institution.
  if (req.user.role !== "PLATFORM_SUPER_ADMIN" && !req.user.institutionId) {
    return errorResponse(
      res,
      "This account is not linked to an institution.",
      403
    );
  }

  next();
}