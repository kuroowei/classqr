import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { z } from "zod";
import {
  createStudentSchema,
  updateStudentSchema,
} from "../validators/student.validator";
import { hashPassword } from "../utils/password";

export class ServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

type CreateStudentInput = z.infer<typeof createStudentSchema>;
type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

// Only these fields are ever returned to the client.
// passwordHash is deliberately never selected.
const studentSelect = {
  id: true,
  institutionId: true,
  matricNumber: true,
  firstName: true,
  middleName: true,
  lastName: true,
  phone: true,
  gender: true,
  programmeId: true,
  levelId: true,
  admissionSessionId: true,
  profilePhotoUrl: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, email: true, status: true } },
} satisfies Prisma.StudentSelect;

async function assertProgrammeInInstitution(
  institutionId: string,
  programmeId: string
) {
  const programme = await prisma.programme.findFirst({
    where: { id: programmeId, institutionId },
  });

  if (!programme) {
    throw new ServiceError(
      "The specified programme does not exist in your institution.",
      404
    );
  }
}

async function assertLevelInInstitution(institutionId: string, levelId: string) {
  const level = await prisma.level.findFirst({
    where: { id: levelId, institutionId },
  });

  if (!level) {
    throw new ServiceError(
      "The specified level does not exist in your institution.",
      404
    );
  }
}

async function assertSessionInInstitution(
  institutionId: string,
  sessionId: string
) {
  const session = await prisma.academicSession.findFirst({
    where: { id: sessionId, institutionId },
  });

  if (!session) {
    throw new ServiceError(
      "The specified academic session does not exist in your institution.",
      404
    );
  }
}

export async function createStudent(
  institutionId: string,
  input: CreateStudentInput
) {
  const { email, password, ...profile } = input;

  await assertProgrammeInInstitution(institutionId, profile.programmeId);
  await assertLevelInInstitution(institutionId, profile.levelId);

  if (profile.admissionSessionId) {
    await assertSessionInInstitution(institutionId, profile.admissionSessionId);
  }

  const existingMatric = await prisma.student.findFirst({
    where: { institutionId, matricNumber: profile.matricNumber },
  });

  if (existingMatric) {
    throw new ServiceError(
      `A student with matriculation number "${profile.matricNumber}" already exists in this institution.`,
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
        data: { institutionId, email, passwordHash, role: "STUDENT" },
      });

      return tx.student.create({
        data: { ...profile, institutionId, userId: user.id },
        select: studentSelect,
      });
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new ServiceError(
        "A student or account with these details already exists.",
        409
      );
    }
    throw err;
  }
}

export async function listStudents(institutionId: string) {
  return prisma.student.findMany({
    where: { institutionId },
    select: studentSelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function getStudentById(institutionId: string, id: string) {
  const student = await prisma.student.findFirst({
    where: { id, institutionId },
    select: studentSelect,
  });

  if (!student) {
    throw new ServiceError("Student not found.", 404);
  }

  return student;
}

export async function updateStudent(
  institutionId: string,
  id: string,
  input: UpdateStudentInput
) {
  await getStudentById(institutionId, id);

  if (input.programmeId) {
    await assertProgrammeInInstitution(institutionId, input.programmeId);
  }

  if (input.levelId) {
    await assertLevelInInstitution(institutionId, input.levelId);
  }

  if (input.admissionSessionId) {
    await assertSessionInInstitution(institutionId, input.admissionSessionId);
  }

  if (input.matricNumber) {
    const clash = await prisma.student.findFirst({
      where: {
        institutionId,
        matricNumber: input.matricNumber,
        NOT: { id },
      },
    });

    if (clash) {
      throw new ServiceError(
        `A student with matriculation number "${input.matricNumber}" already exists in this institution.`,
        409
      );
    }
  }

  return prisma.student.update({
    where: { id },
    data: input,
    select: studentSelect,
  });
}

export async function deactivateStudent(institutionId: string, id: string) {
  const student = await getStudentById(institutionId, id);

  return prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: student.user.id },
      data: { status: "INACTIVE" },
    });

    return tx.student.update({
      where: { id },
      data: { status: "INACTIVE" },
      select: studentSelect,
    });
  });
}