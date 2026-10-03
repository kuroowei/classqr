import prisma from "../config/prisma";
import { z } from "zod";
import {
  createFacultySchema,
  updateFacultySchema,
} from "../validators/faculty.validator";

export class ServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

type CreateFacultyInput = z.infer<typeof createFacultySchema>;
type UpdateFacultyInput = z.infer<typeof updateFacultySchema>;

export async function createFaculty(
  institutionId: string,
  input: CreateFacultyInput
) {
  const existing = await prisma.faculty.findFirst({
    where: { institutionId, code: input.code },
  });

  if (existing) {
    throw new ServiceError(
      `A faculty with code "${input.code}" already exists in this institution.`,
      409
    );
  }

  return prisma.faculty.create({
    data: { ...input, institutionId },
  });
}

export async function listFaculties(institutionId: string) {
  return prisma.faculty.findMany({
    where: { institutionId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getFacultyById(institutionId: string, id: string) {
  const faculty = await prisma.faculty.findFirst({
    where: { id, institutionId },
  });

  if (!faculty) {
    throw new ServiceError("Faculty not found.", 404);
  }

  return faculty;
}

export async function updateFaculty(
  institutionId: string,
  id: string,
  input: UpdateFacultyInput
) {
  await getFacultyById(institutionId, id);

  return prisma.faculty.update({
    where: { id },
    data: input,
  });
}

export async function deactivateFaculty(institutionId: string, id: string) {
  await getFacultyById(institutionId, id);

  return prisma.faculty.update({
    where: { id },
    data: { status: "INACTIVE" },
  });
}