import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { z } from "zod";
import { assignLecturerCourseSchema } from "../validators/lecturerCourse.validator";

export class ServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

type AssignLecturerCourseInput = z.infer<typeof assignLecturerCourseSchema>;

const assignmentInclude = {
  lecturer: { select: { id: true, staffId: true, firstName: true, lastName: true } },
  course: { select: { id: true, code: true, title: true } },
} satisfies Prisma.LecturerCourseInclude;

async function assertLecturerInInstitution(
  institutionId: string,
  lecturerId: string
) {
  const lecturer = await prisma.lecturer.findFirst({
    where: { id: lecturerId, institutionId },
  });

  if (!lecturer) {
    throw new ServiceError(
      "The specified lecturer does not exist in your institution.",
      404
    );
  }
}

async function assertCourseInInstitution(institutionId: string, courseId: string) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, institutionId },
  });

  if (!course) {
    throw new ServiceError(
      "The specified course does not exist in your institution.",
      404
    );
  }
}

export async function assignLecturerToCourse(
  institutionId: string,
  input: AssignLecturerCourseInput
) {
  await assertLecturerInInstitution(institutionId, input.lecturerId);
  await assertCourseInInstitution(institutionId, input.courseId);

  const existing = await prisma.lecturerCourse.findFirst({
    where: { lecturerId: input.lecturerId, courseId: input.courseId },
  });

  if (existing) {
    throw new ServiceError("This lecturer is already assigned to this course.", 409);
  }

  try {
    return await prisma.lecturerCourse.create({
      data: { ...input, institutionId },
      include: assignmentInclude,
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new ServiceError("This lecturer is already assigned to this course.", 409);
    }
    throw err;
  }
}

export async function listLecturerCourses(institutionId: string) {
  return prisma.lecturerCourse.findMany({
    where: { institutionId },
    include: assignmentInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function listCoursesForLecturer(
  institutionId: string,
  lecturerId: string
) {
  await assertLecturerInInstitution(institutionId, lecturerId);

  return prisma.lecturerCourse.findMany({
    where: { institutionId, lecturerId },
    include: assignmentInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function removeLecturerCourse(institutionId: string, id: string) {
  const assignment = await prisma.lecturerCourse.findFirst({
    where: { id, institutionId },
  });

  if (!assignment) {
    throw new ServiceError("Assignment not found.", 404);
  }

  return prisma.lecturerCourse.delete({ where: { id } });
}