import { Request, Response } from "express";
import {
  startAttendanceSession,
  closeAttendanceSession,
  getAttendanceSessionById,
  listSessionsForLecturer,
  getSessionDashboard,
  ServiceError,
} from "../services/attendanceSession.service";
import { logAudit } from "../services/audit.service";
import { startAttendanceSessionSchema } from "../validators/attendanceSession.validator";
import { successResponse, errorResponse } from "../utils/apiResponse";

export async function start(req: Request, res: Response) {
  try {
    const parsed = startAttendanceSessionSchema.safeParse(req.body);

    if (!parsed.success) {
      return errorResponse(res, "Invalid input.", 400, parsed.error.flatten());
    }

    const institutionId = req.user!.institutionId as string;
    const userId = req.user!.userId;
    const session = await startAttendanceSession(institutionId, userId, parsed.data);

    await logAudit({
      institutionId,
      userId,
      action: "SESSION_START",
      resource: "AttendanceSession",
      resourceId: session.id,
      ipAddress: req.ip,
    });

    return successResponse(res, "Attendance session started successfully.", session, 201);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Start attendance session error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function close(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const userId = req.user!.userId;
    const sessionId = req.params.id as string;
    const session = await closeAttendanceSession(institutionId, userId, sessionId);

    await logAudit({
      institutionId,
      userId,
      action: "SESSION_CLOSE",
      resource: "AttendanceSession",
      resourceId: sessionId,
      ipAddress: req.ip,
    });

    return successResponse(res, "Attendance session closed successfully.", session);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Close attendance session error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function getOne(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const session = await getAttendanceSessionById(
      institutionId,
      req.params.id as string
    );
    return successResponse(res, "Attendance session retrieved successfully.", session);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Get attendance session error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function listMine(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const userId = req.user!.userId;
    const sessions = await listSessionsForLecturer(institutionId, userId);
    return successResponse(res, "Attendance sessions retrieved successfully.", sessions);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("List attendance sessions error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function dashboard(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const userId = req.user!.userId;
    const data = await getSessionDashboard(
      institutionId,
      userId,
      req.params.id as string
    );
    return successResponse(res, "Dashboard data retrieved successfully.", data);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Get session dashboard error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}