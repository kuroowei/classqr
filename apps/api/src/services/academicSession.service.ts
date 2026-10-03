import prisma from "../config/prisma";
import { z } from "zod";
import {
  createAcademicSessionSchema,
  updateAcademicSessionSchema,
} from "../validators/academicSession.validator";

export class ServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

type CreateAcademicSessionInput = z.infer<typeof createAcademicSessionSchema>;
type UpdateAcademicSessionInput = z.infer<typeof updateAcademicSessionSchema>;

export async function createAcademicSession(
  institutionId: string,
  input: CreateAcademicSessionInput
) {
  const existing = await prisma.academicSession.findFirst({
    where: { institutionId, name: input.name },
  });

  if (existing) {
    throw new ServiceError(
      `An academic session named "${input.name}" already exists in this institution.`,
      409
    );
  }

  return prisma.academicSession.create({
    data: { ...input, institutionId },
  });
}

export async function listAcademicSessions(institutionId: string) {
  return prisma.academicSession.findMany({
    where: { institutionId },
    orderBy: { startDate: "desc" },
  });
}

export async function getAcademicSessionById(institutionId: string, id: string) {
  const session = await prisma.academicSession.findFirst({
    where: { id, institutionId },
  });

  if (!session) {
    throw new ServiceError("Academic session not found.", 404);
  }

  return session;
}

export async function updateAcademicSession(
  institutionId: string,
  id: string,
  input: UpdateAcademicSessionInput
) {
  await getAcademicSessionById(institutionId, id);

  return prisma.academicSession.update({
    where: { id },
    data: input,
  });
}

export async function deactivateAcademicSession(institutionId: string, id: string) {
  await getAcademicSessionById(institutionId, id);

  return prisma.academicSession.update({
    where: { id },
    data: { status: "INACTIVE" },
  });
}