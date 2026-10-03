import { Request, Response } from "express";
import {
  createInstitution,
  listInstitutions,
  getInstitutionById,
  updateInstitution,
  deactivateInstitution,
  ServiceError,
} from "../services/institution.service";
import {
  createInstitutionSchema,
  updateInstitutionSchema,
} from "../validators/institution.validator";
import { successResponse, errorResponse } from "../utils/apiResponse";

export async function create(req: Request, res: Response) {
  try {
    const parsed = createInstitutionSchema.safeParse(req.body);

    if (!parsed.success) {
      return errorResponse(res, "Invalid input.", 400, parsed.error.flatten());
    }

    const institution = await createInstitution(parsed.data);
    return successResponse(res, "Institution created successfully.", institution, 201);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Create institution error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function list(_req: Request, res: Response) {
  try {
    const institutions = await listInstitutions();
    return successResponse(res, "Institutions retrieved successfully.", institutions);
  } catch (err) {
    console.error("List institutions error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function getOne(req: Request, res: Response) {
  try {
    const institution = await getInstitutionById(req.params.id as string);
    return successResponse(res, "Institution retrieved successfully.", institution);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Get institution error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function update(req: Request, res: Response) {
  try {
    const parsed = updateInstitutionSchema.safeParse(req.body);

    if (!parsed.success) {
      return errorResponse(res, "Invalid input.", 400, parsed.error.flatten());
    }

    const institution = await updateInstitution(req.params.id as string, parsed.data);
    return successResponse(res, "Institution updated successfully.", institution);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Update institution error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function deactivate(req: Request, res: Response) {
  try {
    const institution = await deactivateInstitution(req.params.id as string);
    return successResponse(res, "Institution deactivated successfully.", institution);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Deactivate institution error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}