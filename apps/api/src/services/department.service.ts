import prisma from "../config/prisma";
import { z } from "zod";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
} from "../validators/department.validator";

export class ServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;

async function assertFacultyBelongsToInstitution(
  institutionId: string,
  facultyId: string
) {
  const faculty = await prisma.faculty.findFirst({
    where: { id: facultyId, institutionId },
  });

  if (!faculty) {
    throw new ServiceError(
      "The specified faculty does not exist in your institution.",
      404
    );
  }
}

export async function createDepartment(
  institutionId: string,
  input: CreateDepartmentInput
) {
  await assertFacultyBelongsToInstitution(institutionId, input.facultyId);

  const existing = await prisma.department.findFirst({
    where: { institutionId, code: input.code },
  });

  if (existing) {
    throw new ServiceError(
      `A department with code "${input.code}" already exists in this institution.`,
      409
    );
  }

  return prisma.department.create({
    data: { ...input, institutionId },
  });
}

export async function listDepartments(institutionId: string) {
  return prisma.department.findMany({
    where: { institutionId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDepartmentById(institutionId: string, id: string) {
  const department = await prisma.department.findFirst({
    where: { id, institutionId },
  });

  if (!department) {
    throw new ServiceError("Department not found.", 404);
  }

  return department;
}

export async function updateDepartment(
  institutionId: string,
  id: string,
  input: UpdateDepartmentInput
) {
  await getDepartmentById(institutionId, id);

  if (input.facultyId) {
    await assertFacultyBelongsToInstitution(institutionId, input.facultyId);
  }

  return prisma.department.update({
    where: { id },
    data: input,
  });
}

export async function deactivateDepartment(institutionId: string, id: string) {
  await getDepartmentById(institutionId, id);

  return prisma.department.update({
    where: { id },
    data: { status: "INACTIVE" },
  });
}