import { Request, Response } from "express";
import {
  createSemester,
  listSemesters,
  getSemesterById,
  updateSemester,
  deleteSemester,
  ServiceError,
} from "../services/semester.service";
import { createSemesterSchema, updateSemesterSchema } from "../validators/semester.validator";
import { successResponse, errorResponse } from "../utils/apiResponse";

export async function create(req: Request, res: Response) {
  try {
    const parsed = createSemesterSchema.safeParse(req.body);

    if (!parsed.success) {
      return errorResponse(res, "Invalid input.", 400, parsed.error.flatten());
    }

    const institutionId = req.user!.institutionId as string;
    const semester = await createSemester(institutionId, parsed.data);
    return successResponse(res, "Semester created successfully.", semester, 201);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Create semester error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function list(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const semesters = await listSemesters(institutionId);
    return successResponse(res, "Semesters retrieved successfully.", semesters);
  } catch (err) {
    console.error("List semesters error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function getOne(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const semester = await getSemesterById(institutionId, req.params.id as string);
    return successResponse(res, "Semester retrieved successfully.", semester);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Get semester error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function update(req: Request, res: Response) {
  try {
    const parsed = updateSemesterSchema.safeParse(req.body);

    if (!parsed.success) {
      return errorResponse(res, "Invalid input.", 400, parsed.error.flatten());
    }

    const institutionId = req.user!.institutionId as string;
    const semester = await updateSemester(institutionId, req.params.id as string, parsed.data);
    return successResponse(res, "Semester updated successfully.", semester);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Update semester error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    await deleteSemester(institutionId, req.params.id as string);
    return successResponse(res, "Semester deleted successfully.", null);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Delete semester error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}