import { Request, Response } from "express";
import {
  createAcademicSession,
  listAcademicSessions,
  getAcademicSessionById,
  updateAcademicSession,
  deactivateAcademicSession,
  ServiceError,
} from "../services/academicSession.service";
import {
  createAcademicSessionSchema,
  updateAcademicSessionSchema,
} from "../validators/academicSession.validator";
import { successResponse, errorResponse } from "../utils/apiResponse";

export async function create(req: Request, res: Response) {
  try {
    const parsed = createAcademicSessionSchema.safeParse(req.body);

    if (!parsed.success) {
      return errorResponse(res, "Invalid input.", 400, parsed.error.flatten());
    }

    const institutionId = req.user!.institutionId as string;
    const session = await createAcademicSession(institutionId, parsed.data);
    return successResponse(res, "Academic session created successfully.", session, 201);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Create academic session error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function list(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const sessions = await listAcademicSessions(institutionId);
    return successResponse(res, "Academic sessions retrieved successfully.", sessions);
  } catch (err) {
    console.error("List academic sessions error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function getOne(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const session = await getAcademicSessionById(institutionId, req.params.id as string);
    return successResponse(res, "Academic session retrieved successfully.", session);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Get academic session error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function update(req: Request, res: Response) {
  try {
    const parsed = updateAcademicSessionSchema.safeParse(req.body);

    if (!parsed.success) {
      return errorResponse(res, "Invalid input.", 400, parsed.error.flatten());
    }

    const institutionId = req.user!.institutionId as string;
    const session = await updateAcademicSession(institutionId, req.params.id as string, parsed.data);
    return successResponse(res, "Academic session updated successfully.", session);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Update academic session error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function deactivate(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const session = await deactivateAcademicSession(institutionId, req.params.id as string);
    return successResponse(res, "Academic session deactivated successfully.", session);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Deactivate academic session error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}