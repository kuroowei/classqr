import { Request, Response } from "express";
import {
  getAdminDashboard,
  getFacultyDashboard,
  getDepartmentDashboard,
} from "../services/dashboard.service";
import { successResponse, errorResponse } from "../utils/apiResponse";

export async function adminDashboard(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const data = await getAdminDashboard(institutionId);
    return successResponse(res, "Dashboard data retrieved successfully.", data);
  } catch (err) {
    console.error("Get admin dashboard error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function facultyDashboard(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const data = await getFacultyDashboard(institutionId, req.params.facultyId as string);

    if (!data) {
      return errorResponse(res, "Faculty not found.", 404);
    }

    return successResponse(res, "Dashboard data retrieved successfully.", data);
  } catch (err) {
    console.error("Get faculty dashboard error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function departmentDashboard(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const data = await getDepartmentDashboard(institutionId, req.params.departmentId as string);

    if (!data) {
      return errorResponse(res, "Department not found.", 404);
    }

    return successResponse(res, "Dashboard data retrieved successfully.", data);
  } catch (err) {
    console.error("Get department dashboard error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}