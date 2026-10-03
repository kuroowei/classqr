import prisma from "../config/prisma";
import { z } from "zod";
import { createSemesterSchema, updateSemesterSchema } from "../validators/semester.validator";

export class ServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

type CreateSemesterInput = z.infer<typeof createSemesterSchema>;
type UpdateSemesterInput = z.infer<typeof updateSemesterSchema>;

export async function createSemester(institutionId: string, input: CreateSemesterInput) {
  const existing = await prisma.semester.findFirst({
    where: { institutionId, name: input.name },
  });

  if (existing) {
    throw new ServiceError(
      `A semester named "${input.name}" already exists in this institution.`,
      409
    );
  }

  return prisma.semester.create({
    data: { ...input, institutionId },
  });
}

export async function listSemesters(institutionId: string) {
  return prisma.semester.findMany({
    where: { institutionId },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getSemesterById(institutionId: string, id: string) {
  const semester = await prisma.semester.findFirst({
    where: { id, institutionId },
  });

  if (!semester) {
    throw new ServiceError("Semester not found.", 404);
  }

  return semester;
}

export async function updateSemester(
  institutionId: string,
  id: string,
  input: UpdateSemesterInput
) {
  await getSemesterById(institutionId, id);

  return prisma.semester.update({
    where: { id },
    data: input,
  });
}

export async function deleteSemester(institutionId: string, id: string) {
  await getSemesterById(institutionId, id);

  return prisma.semester.delete({ where: { id } });
}