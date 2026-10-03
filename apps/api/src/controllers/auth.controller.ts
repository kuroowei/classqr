import { Request, Response } from "express";
import { loginUser, AuthError } from "../services/auth.service";
import { logAudit } from "../services/audit.service";
import { successResponse, errorResponse } from "../utils/apiResponse";

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, "Email and password are required.", 400);
    }

    const result = await loginUser(email, password);

    await logAudit({
      institutionId: result.user.institutionId,
      userId: result.user.id,
      action: "LOGIN_SUCCESS",
      resource: "User",
      resourceId: result.user.id,
      ipAddress: req.ip,
    });

    return successResponse(res, "Login successful.", result);
  } catch (err) {
    if (err instanceof AuthError) {
      await logAudit({
        institutionId: err.institutionId,
        userId: err.userId,
        action: "LOGIN_FAILED",
        resource: "User",
        resourceId: err.userId,
        ipAddress: req.ip,
      });

      return errorResponse(res, err.message, err.statusCode);
    }

    console.error("Login error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}