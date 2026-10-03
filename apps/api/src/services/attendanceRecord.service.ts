import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { z } from "zod";
import { checkInSchema } from "../validators/attendanceRecord.validator";

export class ServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

type CheckInInput = z.infer<typeof checkInSchema>;

async function getStudentProfileForUser(institutionId: string, userId: string) {
  const student = await prisma.student.findFirst({
    where: { userId, institutionId },
  });

  if (!student) {
    throw new ServiceError("No student profile is linked to this account.", 403);
  }

  return student;
}

export async function checkIn(
  institutionId: string,
  userId: string,
  input: CheckInInput
) {
  const student = await getStudentProfileForUser(institutionId, userId);

  // 1. Token must exist.
  const session = await prisma.attendanceSession.findUnique({
    where: { qrToken: input.qrToken },
  });

  if (!session) {
    throw new ServiceError("Invalid attendance QR code.", 404);
  }

  // 2. Session must be active.
  if (session.status !== "ACTIVE") {
    throw new ServiceError("This attendance session is no longer active.", 400);
  }

  // 3. QR must not be expired.
  if (session.qrExpiresAt.getTime() < Date.now()) {
    throw new ServiceError("This QR code has expired.", 400);
  }

  // 4. Student and session must belong to the same institution.
  if (session.institutionId !== institutionId) {
    throw new ServiceError("Invalid attendance QR code.", 404);
  }

  // 5. Student must be registered for this course.
  const registration = await prisma.courseRegistration.findFirst({
    where: { studentId: student.id, courseId: session.courseId },
  });

  if (!registration) {
    throw new ServiceError("You are not registered for this course.", 403);
  }

  // 6. Student must not already be checked in to this session.
  const existingRecord = await prisma.attendanceRecord.findFirst({
    where: { studentId: student.id, attendanceSessionId: session.id },
  });

  if (existingRecord) {
    throw new ServiceError("You have already checked in to this session.", 409);
  }

  try {
    return await prisma.attendanceRecord.create({
      data: {
        institutionId,
        attendanceSessionId: session.id,
        studentId: student.id,
        courseId: session.courseId,
        status: "PRESENT",
      },
      include: {
        attendanceSession: {
          select: { course: { select: { code: true, title: true } } },
        },
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new ServiceError("You have already checked in to this session.", 409);
    }
    throw err;
  }
}

export async function listMyAttendanceHistory(
  institutionId: string,
  userId: string
) {
  const student = await getStudentProfileForUser(institutionId, userId);

  return prisma.attendanceRecord.findMany({
    where: { institutionId, studentId: student.id },
    include: {
      attendanceSession: {
        select: { course: { select: { code: true, title: true } }, date: true },
      },
    },
    orderBy: { checkInTime: "desc" },
  });
}

export async function getStudentDashboard(institutionId: string, userId: string) {
  const student = await getStudentProfileForUser(institutionId, userId);

  const registrations = await prisma.courseRegistration.findMany({
    where: { institutionId, studentId: student.id },
    include: {
      course: { select: { id: true, code: true, title: true } },
    },
  });

  const courses = await Promise.all(
    registrations.map(async (reg) => {
      const sessionsHeld = await prisma.attendanceSession.count({
        where: { courseId: reg.courseId },
      });

      const sessionsAttended = await prisma.attendanceRecord.count({
        where: { studentId: student.id, courseId: reg.courseId },
      });

      const attendancePercentage =
        sessionsHeld === 0 ? 0 : Math.round((sessionsAttended / sessionsHeld) * 100);

      return {
        course: reg.course,
        sessionsHeld,
        sessionsAttended,
        attendancePercentage,
      };
    })
  );

  const totalSessionsHeld = courses.reduce((sum, c) => sum + c.sessionsHeld, 0);
  const totalSessionsAttended = courses.reduce((sum, c) => sum + c.sessionsAttended, 0);
  const overallAttendancePercentage =
    totalSessionsHeld === 0
      ? 0
      : Math.round((totalSessionsAttended / totalSessionsHeld) * 100);

  return {
    registeredCourseCount: registrations.length,
    overallAttendancePercentage,
    courses,
  };
}