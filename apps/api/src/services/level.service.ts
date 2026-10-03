import prisma from "../config/prisma";
import { z } from "zod";
import { createLevelSchema, updateLevelSchema } from "../validators/level.validator";

export class ServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

type CreateLevelInput = z.infer<typeof createLevelSchema>;
type UpdateLevelInput = z.infer<typeof updateLevelSchema>;

export async function createLevel(institutionId: string, input: CreateLevelInput) {
  const existing = await prisma.level.findFirst({
    where: { institutionId, name: input.name },
  });

  if (existing) {
    throw new ServiceError(
      `A level named "${input.name}" already exists in this institution.`,
      409
    );
  }

  return prisma.level.create({
    data: { ...input, institutionId },
  });
}

export async function listLevels(institutionId: string) {
  return prisma.level.findMany({
    where: { institutionId },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getLevelById(institutionId: string, id: string) {
  const level = await prisma.level.findFirst({
    where: { id, institutionId },
  });

  if (!level) {
    throw new ServiceError("Level not found.", 404);
  }

  return level;
}

export async function updateLevel(
  institutionId: string,
  id: string,
  input: UpdateLevelInput
) {
  await getLevelById(institutionId, id);

  return prisma.level.update({
    where: { id },
    data: input,
  });
}

export async function deleteLevel(institutionId: string, id: string) {
  await getLevelById(institutionId, id);

  return prisma.level.delete({ where: { id } });
}