import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { z } from "zod";
import { createCourseRegistrationSchema } from "../validators/courseRegistration.validator";

export class ServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

type CreateCourseRegistrationInput = z.infer<typeof createCourseRegistrationSchema>;

const registrationInclude = {
  student: { select: { id: true, matricNumber: true, firstName: true, lastName: true } },
  course: { select: { id: true, code: true, title: true } },
} satisfies Prisma.CourseRegistrationInclude;

async function getStudentInInstitution(institutionId: string, studentId: string) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, institutionId },
  });

  if (!student) {
    throw new ServiceError(
      "The specified student does not exist in your institution.",
      404
    );
  }

  return student;
}

async function getCourseInInstitution(institutionId: string, courseId: string) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, institutionId },
  });

  if (!course) {
    throw new ServiceError(
      "The specified course does not exist in your institution.",
      404
    );
  }

  return course;
}

export async function registerStudentForCourse(
  institutionId: string,
  input: CreateCourseRegistrationInput
) {
  await getStudentInInstitution(institutionId, input.studentId);
  const course = await getCourseInInstitution(institutionId, input.courseId);

  const existing = await prisma.courseRegistration.findFirst({
    where: {
      studentId: input.studentId,
      courseId: input.courseId,
      academicSessionId: course.academicSessionId,
      semesterId: course.semesterId,
    },
  });

  if (existing) {
    throw new ServiceError("This student is already registered for this course.", 409);
  }

  try {
    return await prisma.courseRegistration.create({
      data: {
        institutionId,
        studentId: input.studentId,
        courseId: input.courseId,
        academicSessionId: course.academicSessionId,
        semesterId: course.semesterId,
      },
      include: registrationInclude,
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new ServiceError("This student is already registered for this course.", 409);
    }
    throw err;
  }
}

export async function listCourseRegistrations(institutionId: string) {
  return prisma.courseRegistration.findMany({
    where: { institutionId },
    include: registrationInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function listRegistrationsForStudent(
  institutionId: string,
  studentId: string
) {
  await getStudentInInstitution(institutionId, studentId);

  return prisma.courseRegistration.findMany({
    where: { institutionId, studentId },
    include: registrationInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function listRegistrationsForCourse(
  institutionId: string,
  courseId: string
) {
  await getCourseInInstitution(institutionId, courseId);

  return prisma.courseRegistration.findMany({
    where: { institutionId, courseId },
    include: registrationInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function removeCourseRegistration(institutionId: string, id: string) {
  const registration = await prisma.courseRegistration.findFirst({
    where: { id, institutionId },
  });

  if (!registration) {
    throw new ServiceError("Registration not found.", 404);
  }

  return prisma.courseRegistration.delete({ where: { id } });
}