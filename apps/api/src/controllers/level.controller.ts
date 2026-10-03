import { Request, Response } from "express";
import {
  createLevel,
  listLevels,
  getLevelById,
  updateLevel,
  deleteLevel,
  ServiceError,
} from "../services/level.service";
import { createLevelSchema, updateLevelSchema } from "../validators/level.validator";
import { successResponse, errorResponse } from "../utils/apiResponse";

export async function create(req: Request, res: Response) {
  try {
    const parsed = createLevelSchema.safeParse(req.body);

    if (!parsed.success) {
      return errorResponse(res, "Invalid input.", 400, parsed.error.flatten());
    }

    const institutionId = req.user!.institutionId as string;
    const level = await createLevel(institutionId, parsed.data);
    return successResponse(res, "Level created successfully.", level, 201);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Create level error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function list(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const levels = await listLevels(institutionId);
    return successResponse(res, "Levels retrieved successfully.", levels);
  } catch (err) {
    console.error("List levels error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function getOne(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const level = await getLevelById(institutionId, req.params.id as string);
    return successResponse(res, "Level retrieved successfully.", level);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Get level error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function update(req: Request, res: Response) {
  try {
    const parsed = updateLevelSchema.safeParse(req.body);

    if (!parsed.success) {
      return errorResponse(res, "Invalid input.", 400, parsed.error.flatten());
    }

    const institutionId = req.user!.institutionId as string;
    const level = await updateLevel(institutionId, req.params.id as string, parsed.data);
    return successResponse(res, "Level updated successfully.", level);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Update level error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    await deleteLevel(institutionId, req.params.id as string);
    return successResponse(res, "Level deleted successfully.", null);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Delete level error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}