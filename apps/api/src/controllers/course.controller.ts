import { Request, Response } from "express";
import {
  createCourse,
  listCourses,
  getCourseById,
  updateCourse,
  deactivateCourse,
  ServiceError,
} from "../services/course.service";
import {
  createCourseSchema,
  updateCourseSchema,
} from "../validators/course.validator";
import { successResponse, errorResponse } from "../utils/apiResponse";

export async function create(req: Request, res: Response) {
  try {
    const parsed = createCourseSchema.safeParse(req.body);

    if (!parsed.success) {
      return errorResponse(res, "Invalid input.", 400, parsed.error.flatten());
    }

    const institutionId = req.user!.institutionId as string;
    const course = await createCourse(institutionId, parsed.data);
    return successResponse(res, "Course created successfully.", course, 201);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Create course error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function list(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const courses = await listCourses(institutionId);
    return successResponse(res, "Courses retrieved successfully.", courses);
  } catch (err) {
    console.error("List courses error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function getOne(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const course = await getCourseById(institutionId, req.params.id as string);
    return successResponse(res, "Course retrieved successfully.", course);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Get course error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function update(req: Request, res: Response) {
  try {
    const parsed = updateCourseSchema.safeParse(req.body);

    if (!parsed.success) {
      return errorResponse(res, "Invalid input.", 400, parsed.error.flatten());
    }

    const institutionId = req.user!.institutionId as string;
    const course = await updateCourse(
      institutionId,
      req.params.id as string,
      parsed.data
    );
    return successResponse(res, "Course updated successfully.", course);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Update course error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function deactivate(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const course = await deactivateCourse(
      institutionId,
      req.params.id as string
    );
    return successResponse(res, "Course deactivated successfully.", course);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Deactivate course error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}