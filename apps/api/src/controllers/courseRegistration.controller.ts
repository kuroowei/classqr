import { Request, Response } from "express";
import {
  registerStudentForCourse,
  listCourseRegistrations,
  listRegistrationsForStudent,
  listRegistrationsForCourse,
  removeCourseRegistration,
  ServiceError,
} from "../services/courseRegistration.service";
import { createCourseRegistrationSchema } from "../validators/courseRegistration.validator";
import { successResponse, errorResponse } from "../utils/apiResponse";

export async function create(req: Request, res: Response) {
  try {
    const parsed = createCourseRegistrationSchema.safeParse(req.body);

    if (!parsed.success) {
      return errorResponse(res, "Invalid input.", 400, parsed.error.flatten());
    }

    const institutionId = req.user!.institutionId as string;
    const registration = await registerStudentForCourse(institutionId, parsed.data);
    return successResponse(res, "Student registered for course successfully.", registration, 201);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Create course registration error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function list(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const registrations = await listCourseRegistrations(institutionId);
    return successResponse(res, "Registrations retrieved successfully.", registrations);
  } catch (err) {
    console.error("List course registrations error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function listForStudent(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const registrations = await listRegistrationsForStudent(
      institutionId,
      req.params.studentId as string
    );
    return successResponse(res, "Registrations retrieved successfully.", registrations);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("List registrations for student error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function listForCourse(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const registrations = await listRegistrationsForCourse(
      institutionId,
      req.params.courseId as string
    );
    return successResponse(res, "Registrations retrieved successfully.", registrations);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("List registrations for course error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    await removeCourseRegistration(institutionId, req.params.id as string);
    return successResponse(res, "Registration removed successfully.", null);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Remove course registration error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}