import { Request, Response } from "express";
import {
  createFaculty,
  listFaculties,
  getFacultyById,
  updateFaculty,
  deactivateFaculty,
  ServiceError,
} from "../services/faculty.service";
import {
  createFacultySchema,
  updateFacultySchema,
} from "../validators/faculty.validator";
import { successResponse, errorResponse } from "../utils/apiResponse";

export async function create(req: Request, res: Response) {
  try {
    const parsed = createFacultySchema.safeParse(req.body);

    if (!parsed.success) {
      return errorResponse(res, "Invalid input.", 400, parsed.error.flatten());
    }

    const institutionId = req.user!.institutionId as string;
    const faculty = await createFaculty(institutionId, parsed.data);
    return successResponse(res, "Faculty created successfully.", faculty, 201);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Create faculty error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function list(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const faculties = await listFaculties(institutionId);
    return successResponse(res, "Faculties retrieved successfully.", faculties);
  } catch (err) {
    console.error("List faculties error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function getOne(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const faculty = await getFacultyById(institutionId, req.params.id as string);
    return successResponse(res, "Faculty retrieved successfully.", faculty);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Get faculty error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function update(req: Request, res: Response) {
  try {
    const parsed = updateFacultySchema.safeParse(req.body);

    if (!parsed.success) {
      return errorResponse(res, "Invalid input.", 400, parsed.error.flatten());
    }

    const institutionId = req.user!.institutionId as string;
    const faculty = await updateFaculty(institutionId, req.params.id as string, parsed.data);
    return successResponse(res, "Faculty updated successfully.", faculty);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Update faculty error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function deactivate(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const faculty = await deactivateFaculty(institutionId, req.params.id as string);
    return successResponse(res, "Faculty deactivated successfully.", faculty);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Deactivate faculty error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}