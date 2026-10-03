import prisma from "../config/prisma";
import { z } from "zod";
import {
  createInstitutionSchema,
  updateInstitutionSchema,
} from "../validators/institution.validator";

export class ServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

type CreateInstitutionInput = z.infer<typeof createInstitutionSchema>;
type UpdateInstitutionInput = z.infer<typeof updateInstitutionSchema>;

export async function createInstitution(input: CreateInstitutionInput) {
  const existing = await prisma.institution.findUnique({
    where: { shortName: input.shortName },
  });

  if (existing) {
    throw new ServiceError(
      `An institution with short name "${input.shortName}" already exists.`,
      409
    );
  }

  return prisma.institution.create({ data: input });
}

export async function listInstitutions() {
  return prisma.institution.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getInstitutionById(id: string) {
  const institution = await prisma.institution.findUnique({ where: { id } });

  if (!institution) {
    throw new ServiceError("Institution not found.", 404);
  }

  return institution;
}

export async function updateInstitution(
  id: string,
  input: UpdateInstitutionInput
) {
  await getInstitutionById(id);

  return prisma.institution.update({
    where: { id },
    data: input,
  });
}

export async function deactivateInstitution(id: string) {
  await getInstitutionById(id);

  return prisma.institution.update({
    where: { id },
    data: { status: "INACTIVE" },
  });
}