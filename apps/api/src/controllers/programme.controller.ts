import { Request, Response } from "express";
import {
  createProgramme,
  listProgrammes,
  getProgrammeById,
  updateProgramme,
  deactivateProgramme,
  ServiceError,
} from "../services/programme.service";
import {
  createProgrammeSchema,
  updateProgrammeSchema,
} from "../validators/programme.validator";
import { successResponse, errorResponse } from "../utils/apiResponse";

export async function create(req: Request, res: Response) {
  try {
    const parsed = createProgrammeSchema.safeParse(req.body);

    if (!parsed.success) {
      return errorResponse(res, "Invalid input.", 400, parsed.error.flatten());
    }

    const institutionId = req.user!.institutionId as string;
    const programme = await createProgramme(institutionId, parsed.data);
    return successResponse(res, "Programme created successfully.", programme, 201);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Create programme error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function list(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const programmes = await listProgrammes(institutionId);
    return successResponse(res, "Programmes retrieved successfully.", programmes);
  } catch (err) {
    console.error("List programmes error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function getOne(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const programme = await getProgrammeById(institutionId, req.params.id as string);
    return successResponse(res, "Programme retrieved successfully.", programme);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Get programme error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function update(req: Request, res: Response) {
  try {
    const parsed = updateProgrammeSchema.safeParse(req.body);

    if (!parsed.success) {
      return errorResponse(res, "Invalid input.", 400, parsed.error.flatten());
    }

    const institutionId = req.user!.institutionId as string;
    const programme = await updateProgramme(institutionId, req.params.id as string, parsed.data);
    return successResponse(res, "Programme updated successfully.", programme);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Update programme error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function deactivate(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const programme = await deactivateProgramme(institutionId, req.params.id as string);
    return successResponse(res, "Programme deactivated successfully.", programme);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Deactivate programme error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}