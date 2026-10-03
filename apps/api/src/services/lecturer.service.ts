import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { z } from "zod";
import {
  createLecturerSchema,
  updateLecturerSchema,
} from "../validators/lecturer.validator";
import { hashPassword } from "../utils/password";

export class ServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

type CreateLecturerInput = z.infer<typeof createLecturerSchema>;
type UpdateLecturerInput = z.infer<typeof updateLecturerSchema>;

// Only these fields are ever returned to the client.
// passwordHash is deliberately never selected.
const lecturerSelect = {
  id: true,
  institutionId: true,
  staffId: true,
  firstName: true,
  lastName: true,
  phone: true,
  departmentId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, email: true, status: true } },
} satisfies Prisma.LecturerSelect;

async function assertDepartmentInInstitution(
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

export async function createLecturer(
  institutionId: string,
  input: CreateLecturerInput
) {
  const { email, password, ...profile } = input;

  await assertDepartmentInInstitution(institutionId, profile.departmentId);

  const existingStaffId = await prisma.lecturer.findFirst({
    where: { institutionId, staffId: profile.staffId },
  });

  if (existingStaffId) {
    throw new ServiceError(
      `A lecturer with staff ID "${profile.staffId}" already exists in this institution.`,
      409
    );
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw new ServiceError("An account with this email already exists.", 409);
  }

  const passwordHash = await hashPassword(password);

  try {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { institutionId, email, passwordHash, role: "LECTURER" },
      });

      return tx.lecturer.create({
        data: { ...profile, institutionId, userId: user.id },
        select: lecturerSelect,
      });
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new ServiceError(
        "A lecturer or account with these details already exists.",
        409
      );
    }
    throw err;
  }
}

export async function listLecturers(institutionId: string) {
  return prisma.lecturer.findMany({
    where: { institutionId },
    select: lecturerSelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function getLecturerById(institutionId: string, id: string) {
  const lecturer = await prisma.lecturer.findFirst({
    where: { id, institutionId },
    select: lecturerSelect,
  });

  if (!lecturer) {
    throw new ServiceError("Lecturer not found.", 404);
  }

  return lecturer;
}

export async function updateLecturer(
  institutionId: string,
  id: string,
  input: UpdateLecturerInput
) {
  await getLecturerById(institutionId, id);

  if (input.departmentId) {
    await assertDepartmentInInstitution(institutionId, input.departmentId);
  }

  if (input.staffId) {
    const clash = await prisma.lecturer.findFirst({
      where: {
        institutionId,
        staffId: input.staffId,
        NOT: { id },
      },
    });

    if (clash) {
      throw new ServiceError(
        `A lecturer with staff ID "${input.staffId}" already exists in this institution.`,
        409
      );
    }
  }

  return prisma.lecturer.update({
    where: { id },
    data: input,
    select: lecturerSelect,
  });
}

export async function deactivateLecturer(institutionId: string, id: string) {
  const lecturer = await getLecturerById(institutionId, id);

  return prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: lecturer.user.id },
      data: { status: "INACTIVE" },
    });

    return tx.lecturer.update({
      where: { id },
      data: { status: "INACTIVE" },
      select: lecturerSelect,
    });
  });
}