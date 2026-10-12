import prisma from "../config/prisma";
import { z } from "zod";
import {
  createInstitutionSchema,
  updateInstitutionSchema,
  createInstitutionAdminSchema,
} from "../validators/institution.validator";
import { hashPassword } from "../utils/password";

export class ServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

type CreateInstitutionInput = z.infer<typeof createInstitutionSchema>;
type UpdateInstitutionInput = z.infer<typeof updateInstitutionSchema>;
type CreateInstitutionAdminInput = z.infer<typeof createInstitutionAdminSchema>;

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

export async function createInstitutionAdmin(
  institutionId: string,
  input: CreateInstitutionAdminInput
) {
  const institution = await getInstitutionById(institutionId);

  if (institution.status !== "ACTIVE") {
    throw new ServiceError(
      "Cannot add an admin to an inactive institution.",
      400
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new ServiceError("A user with this email already exists.", 409);
  }

  const passwordHash = await hashPassword(input.password);

  return prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      role: "UNIVERSITY_SUPER_ADMIN",
      institutionId: institution.id,
    },
    select: {
      id: true,
      email: true,
      role: true,
      institutionId: true,
      status: true,
      createdAt: true,
    },
  });
}