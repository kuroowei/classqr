import { Request, Response } from "express";
import {
  checkIn,
  listMyAttendanceHistory,
  getStudentDashboard,
  ServiceError,
} from "../services/attendanceRecord.service";
import { checkInSchema } from "../validators/attendanceRecord.validator";
import { successResponse, errorResponse } from "../utils/apiResponse";

export async function create(req: Request, res: Response) {
  try {
    const parsed = checkInSchema.safeParse(req.body);

    if (!parsed.success) {
      return errorResponse(res, "Invalid input.", 400, parsed.error.flatten());
    }

    const institutionId = req.user!.institutionId as string;
    const userId = req.user!.userId;
    const record = await checkIn(institutionId, userId, parsed.data);
    return successResponse(res, "Attendance recorded successfully.", record, 201);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Check-in error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function listMine(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const userId = req.user!.userId;
    const history = await listMyAttendanceHistory(institutionId, userId);
    return successResponse(res, "Attendance history retrieved successfully.", history);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("List attendance history error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function dashboard(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const userId = req.user!.userId;
    const data = await getStudentDashboard(institutionId, userId);
    return successResponse(res, "Dashboard data retrieved successfully.", data);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Get student dashboard error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}