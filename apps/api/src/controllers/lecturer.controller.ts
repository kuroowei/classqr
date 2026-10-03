import { Request, Response } from "express";
import {
  createLecturer,
  listLecturers,
  getLecturerById,
  updateLecturer,
  deactivateLecturer,
  ServiceError,
} from "../services/lecturer.service";
import { logAudit } from "../services/audit.service";
import {
  createLecturerSchema,
  updateLecturerSchema,
} from "../validators/lecturer.validator";
import { successResponse, errorResponse } from "../utils/apiResponse";

export async function create(req: Request, res: Response) {
  try {
    const parsed = createLecturerSchema.safeParse(req.body);

    if (!parsed.success) {
      return errorResponse(res, "Invalid input.", 400, parsed.error.flatten());
    }

    const institutionId = req.user!.institutionId as string;
    const lecturer = await createLecturer(institutionId, parsed.data);

    await logAudit({
      institutionId,
      userId: req.user!.userId,
      action: "LECTURER_CREATE",
      resource: "Lecturer",
      resourceId: lecturer.id,
      ipAddress: req.ip,
    });

    return successResponse(res, "Lecturer created successfully.", lecturer, 201);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Create lecturer error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function list(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const lecturers = await listLecturers(institutionId);
    return successResponse(res, "Lecturers retrieved successfully.", lecturers);
  } catch (err) {
    console.error("List lecturers error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function getOne(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const lecturer = await getLecturerById(institutionId, req.params.id as string);
    return successResponse(res, "Lecturer retrieved successfully.", lecturer);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Get lecturer error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function update(req: Request, res: Response) {
  try {
    const parsed = updateLecturerSchema.safeParse(req.body);

    if (!parsed.success) {
      return errorResponse(res, "Invalid input.", 400, parsed.error.flatten());
    }

    const institutionId = req.user!.institutionId as string;
    const lecturerId = req.params.id as string;
    const lecturer = await updateLecturer(institutionId, lecturerId, parsed.data);

    await logAudit({
      institutionId,
      userId: req.user!.userId,
      action: "LECTURER_UPDATE",
      resource: "Lecturer",
      resourceId: lecturerId,
      ipAddress: req.ip,
    });

    return successResponse(res, "Lecturer updated successfully.", lecturer);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Update lecturer error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function deactivate(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const lecturerId = req.params.id as string;
    const lecturer = await deactivateLecturer(institutionId, lecturerId);

    await logAudit({
      institutionId,
      userId: req.user!.userId,
      action: "LECTURER_DEACTIVATE",
      resource: "Lecturer",
      resourceId: lecturerId,
      ipAddress: req.ip,
    });

    return successResponse(res, "Lecturer deactivated successfully.", lecturer);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Deactivate lecturer error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}