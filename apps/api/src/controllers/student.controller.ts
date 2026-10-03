import { Request, Response } from "express";
import {
  createStudent,
  listStudents,
  getStudentById,
  updateStudent,
  deactivateStudent,
  ServiceError,
} from "../services/student.service";
import { logAudit } from "../services/audit.service";
import {
  createStudentSchema,
  updateStudentSchema,
} from "../validators/student.validator";
import { successResponse, errorResponse } from "../utils/apiResponse";

export async function create(req: Request, res: Response) {
  try {
    const parsed = createStudentSchema.safeParse(req.body);

    if (!parsed.success) {
      return errorResponse(res, "Invalid input.", 400, parsed.error.flatten());
    }

    const institutionId = req.user!.institutionId as string;
    const student = await createStudent(institutionId, parsed.data);

    await logAudit({
      institutionId,
      userId: req.user!.userId,
      action: "STUDENT_CREATE",
      resource: "Student",
      resourceId: student.id,
      ipAddress: req.ip,
    });

    return successResponse(res, "Student created successfully.", student, 201);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Create student error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function list(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const students = await listStudents(institutionId);
    return successResponse(res, "Students retrieved successfully.", students);
  } catch (err) {
    console.error("List students error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function getOne(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const student = await getStudentById(institutionId, req.params.id as string);
    return successResponse(res, "Student retrieved successfully.", student);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Get student error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function update(req: Request, res: Response) {
  try {
    const parsed = updateStudentSchema.safeParse(req.body);

    if (!parsed.success) {
      return errorResponse(res, "Invalid input.", 400, parsed.error.flatten());
    }

    const institutionId = req.user!.institutionId as string;
    const studentId = req.params.id as string;
    const student = await updateStudent(institutionId, studentId, parsed.data);

    await logAudit({
      institutionId,
      userId: req.user!.userId,
      action: "STUDENT_UPDATE",
      resource: "Student",
      resourceId: studentId,
      ipAddress: req.ip,
    });

    return successResponse(res, "Student updated successfully.", student);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Update student error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function deactivate(req: Request, res: Response) {
  try {
    const institutionId = req.user!.institutionId as string;
    const studentId = req.params.id as string;
    const student = await deactivateStudent(institutionId, studentId);

    await logAudit({
      institutionId,
      userId: req.user!.userId,
      action: "STUDENT_DEACTIVATE",
      resource: "Student",
      resourceId: studentId,
      ipAddress: req.ip,
    });

    return successResponse(res, "Student deactivated successfully.", student);
  } catch (err) {
    if (err instanceof ServiceError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("Deactivate student error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}