import { Request, Response, NextFunction } from "express";
import { errorResponse } from "../utils/apiResponse";

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return errorResponse(res, "Authentication required.", 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        "You do not have permission to perform this action.",
        403
      );
    }

    next();
  };
}