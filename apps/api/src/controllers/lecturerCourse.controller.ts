import { Request, Response } from "express";
import {
  assignLecturerToCourse,
  listLecturerCourses,
  listCoursesForLecturer,
  removeLecturerCourse,
  ServiceError,
} from "../services/lecturerCourse.service";
import { assignLecturerCourseSchema } from "../validators/lecturerCourse.validator";
import { successResponse, errorResponse } from "../utils/apiResponse";

export async function assign(req: Request, res: Response) {
  try {
    const parsed = assignLecturerCourseSchema.safeParse(req.body);

    if (!parsed.success) {
      return errorResponse(res, "Invalid input.", 400, parsed.error.flatten());
    }

    const institutionId = req.user!.institutionId as string;
    const assignment = await assignLecturerToCourse(institutionId, parsed.data);
    return successResponse(res, "Lecturer assigned to course successfully.", assignment, 201);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Assign lecturer to course error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function list(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const assignments = await listLecturerCourses(institutionId);
    return successResponse(res, "Assignments retrieved successfully.", assignments);
  } catch (err) {
    console.error("List lecturer-course assignments error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function listForLecturer(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const assignments = await listCoursesForLecturer(
      institutionId,
      req.params.lecturerId as string
    );
    return successResponse(res, "Assigned courses retrieved successfully.", assignments);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("List courses for lecturer error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    await removeLecturerCourse(institutionId, req.params.id as string);
    return successResponse(res, "Assignment removed successfully.", null);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Remove lecturer-course assignment error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}