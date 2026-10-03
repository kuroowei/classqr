import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { z } from "zod";
import {
  createCourseSchema,
  updateCourseSchema,
} from "../validators/course.validator";

export class ServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

type CreateCourseInput = z.infer<typeof createCourseSchema>;
type UpdateCourseInput = z.infer<typeof updateCourseSchema>;

async function assertFacultyInInstitution(
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

async function getProgrammeInInstitution(
  institutionId: string,
  programmeId: string
) {
  const programme = await prisma.programme.findFirst({
    where: { id: programmeId, institutionId },
    include: { department: { select: { facultyId: true } } },
  });

  if (!programme) {
    throw new ServiceError(
      "The specified programme does not exist in your institution.",
      404
    );
  }

  return programme;
}

function assertProgrammeMatchesFaculty(
  programmeFacultyId: string,
  facultyId: string
) {
  if (programmeFacultyId !== facultyId) {
    throw new ServiceError(
      "The specified programme does not belong to the specified faculty.",
      400
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

async function assertSemesterInInstitution(
  institutionId: string,
  semesterId: string
) {
  const semester = await prisma.semester.findFirst({
    where: { id: semesterId, institutionId },
  });

  if (!semester) {
    throw new ServiceError(
      "The specified semester does not exist in your institution.",
      404
    );
  }
}

export async function createCourse(
  institutionId: string,
  input: CreateCourseInput
) {
  await assertFacultyInInstitution(institutionId, input.facultyId);

  const programme = await getProgrammeInInstitution(
    institutionId,
    input.programmeId
  );
  assertProgrammeMatchesFaculty(programme.department.facultyId, input.facultyId);

  await assertLevelInInstitution(institutionId, input.levelId);
  await assertSessionInInstitution(institutionId, input.academicSessionId);
  await assertSemesterInInstitution(institutionId, input.semesterId);

  const existing = await prisma.course.findFirst({
    where: {
      institutionId,
      code: input.code,
      academicSessionId: input.academicSessionId,
      semesterId: input.semesterId,
    },
  });

  if (existing) {
    throw new ServiceError(
      `Course "${input.code}" already exists for this academic session and semester.`,
      409
    );
  }

  try {
    return await prisma.course.create({
      data: { ...input, institutionId },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new ServiceError(
        `Course "${input.code}" already exists for this academic session and semester.`,
        409
      );
    }
    throw err;
  }
}

export async function listCourses(institutionId: string) {
  return prisma.course.findMany({
    where: { institutionId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCourseById(institutionId: string, id: string) {
  const course = await prisma.course.findFirst({
    where: { id, institutionId },
  });

  if (!course) {
    throw new ServiceError("Course not found.", 404);
  }

  return course;
}

export async function updateCourse(
  institutionId: string,
  id: string,
  input: UpdateCourseInput
) {
  const existing = await getCourseById(institutionId, id);

  if (input.facultyId) {
    await assertFacultyInInstitution(institutionId, input.facultyId);
  }

  if (input.levelId) {
    await assertLevelInInstitution(institutionId, input.levelId);
  }

  if (input.academicSessionId) {
    await assertSessionInInstitution(institutionId, input.academicSessionId);
  }

  if (input.semesterId) {
    await assertSemesterInInstitution(institutionId, input.semesterId);
  }

  // If either the faculty or the programme is changing, re-check that
  // the final combination still matches.
  if (input.facultyId || input.programmeId) {
    const programme = await getProgrammeInInstitution(
      institutionId,
      input.programmeId ?? existing.programmeId
    );
    assertProgrammeMatchesFaculty(
      programme.department.facultyId,
      input.facultyId ?? existing.facultyId
    );
  }

  if (input.code || input.academicSessionId || input.semesterId) {
    const clash = await prisma.course.findFirst({
      where: {
        institutionId,
        code: input.code ?? existing.code,
        academicSessionId: input.academicSessionId ?? existing.academicSessionId,
        semesterId: input.semesterId ?? existing.semesterId,
        NOT: { id },
      },
    });

    if (clash) {
      throw new ServiceError(
        "A course with this code already exists for that academic session and semester.",
        409
      );
    }
  }

  return prisma.course.update({
    where: { id },
    data: input,
  });
}

export async function deactivateCourse(institutionId: string, id: string) {
  await getCourseById(institutionId, id);

  return prisma.course.update({
    where: { id },
    data: { status: "INACTIVE" },
  });
}