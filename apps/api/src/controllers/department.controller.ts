import { Request, Response } from "express";
import {
  createDepartment,
  listDepartments,
  getDepartmentById,
  updateDepartment,
  deactivateDepartment,
  ServiceError,
} from "../services/department.service";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
} from "../validators/department.validator";
import { successResponse, errorResponse } from "../utils/apiResponse";

export async function create(req: Request, res: Response) {
  try {
    const parsed = createDepartmentSchema.safeParse(req.body);

    if (!parsed.success) {
      return errorResponse(res, "Invalid input.", 400, parsed.error.flatten());
    }

    const institutionId = req.user!.institutionId as string;
    const department = await createDepartment(institutionId, parsed.data);
    return successResponse(res, "Department created successfully.", department, 201);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Create department error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function list(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const departments = await listDepartments(institutionId);
    return successResponse(res, "Departments retrieved successfully.", departments);
  } catch (err) {
    console.error("List departments error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function getOne(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const department = await getDepartmentById(institutionId, req.params.id as string);
    return successResponse(res, "Department retrieved successfully.", department);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Get department error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function update(req: Request, res: Response) {
  try {
    const parsed = updateDepartmentSchema.safeParse(req.body);

    if (!parsed.success) {
      return errorResponse(res, "Invalid input.", 400, parsed.error.flatten());
    }

    const institutionId = req.user!.institutionId as string;
    const department = await updateDepartment(institutionId, req.params.id as string, parsed.data);
    return successResponse(res, "Department updated successfully.", department);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Update department error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function deactivate(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const department = await deactivateDepartment(institutionId, req.params.id as string);
    return successResponse(res, "Department deactivated successfully.", department);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Deactivate department error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}