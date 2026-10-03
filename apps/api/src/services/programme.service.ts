import prisma from "../config/prisma";
import { z } from "zod";
import {
  createProgrammeSchema,
  updateProgrammeSchema,
} from "../validators/programme.validator";

export class ServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

type CreateProgrammeInput = z.infer<typeof createProgrammeSchema>;
type UpdateProgrammeInput = z.infer<typeof updateProgrammeSchema>;

async function assertDepartmentBelongsToInstitution(
  institutionId: string,
  departmentId: string
) {
  const department = await prisma.department.findFirst({
    where: { id: departmentId, institutionId },
  });

  if (!department) {
    throw new ServiceError(
      "The specified department does not exist in your institution.",
      404
    );
  }
}

export async function createProgramme(
  institutionId: string,
  input: CreateProgrammeInput
) {
  await assertDepartmentBelongsToInstitution(institutionId, input.departmentId);

  const existing = await prisma.programme.findFirst({
    where: { institutionId, code: input.code },
  });

  if (existing) {
    throw new ServiceError(
      `A programme with code "${input.code}" already exists in this institution.`,
      409
    );
  }

  return prisma.programme.create({
    data: { ...input, institutionId },
  });
}

export async function listProgrammes(institutionId: string) {
  return prisma.programme.findMany({
    where: { institutionId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProgrammeById(institutionId: string, id: string) {
  const programme = await prisma.programme.findFirst({
    where: { id, institutionId },
  });

  if (!programme) {
    throw new ServiceError("Programme not found.", 404);
  }

  return programme;
}

export async function updateProgramme(
  institutionId: string,
  id: string,
  input: UpdateProgrammeInput
) {
  await getProgrammeById(institutionId, id);

  if (input.departmentId) {
    await assertDepartmentBelongsToInstitution(institutionId, input.departmentId);
  }

  return prisma.programme.update({
    where: { id },
    data: input,
  });
}

export async function deactivateProgramme(institutionId: string, id: string) {
  await getProgrammeById(institutionId, id);

  return prisma.programme.update({
    where: { id },
    data: { status: "INACTIVE" },
  });
}