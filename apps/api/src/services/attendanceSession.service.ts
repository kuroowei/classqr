import prisma from "../config/prisma";
import { z } from "zod";
import { startAttendanceSessionSchema } from "../validators/attendanceSession.validator";
import { generateQrToken } from "../utils/qrToken";

export class ServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

type StartAttendanceSessionInput = z.infer<typeof startAttendanceSessionSchema>;

const QR_EXPIRY_MINUTES = 5;

const sessionInclude = {
  course: { select: { id: true, code: true, title: true } },
} as const;

async function getLecturerProfileForUser(institutionId: string, userId: string) {
  const lecturer = await prisma.lecturer.findFirst({
    where: { userId, institutionId },
  });

  if (!lecturer) {
    throw new ServiceError("No lecturer profile is linked to this account.", 403);
  }

  return lecturer;
}

async function assertLecturerAssignedToCourse(
  lecturerId: string,
  courseId: string
) {
  const assignment = await prisma.lecturerCourse.findFirst({
    where: { lecturerId, courseId },
  });

  if (!assignment) {
    throw new ServiceError("You are not assigned to this course.", 403);
  }
}

export async function startAttendanceSession(
  institutionId: string,
  userId: string,
  input: StartAttendanceSessionInput
) {
  const lecturer = await getLecturerProfileForUser(institutionId, userId);

  const course = await prisma.course.findFirst({
    where: { id: input.courseId, institutionId },
  });

  if (!course) {
    throw new ServiceError("The specified course does not exist in your institution.", 404);
  }

  await assertLecturerAssignedToCourse(lecturer.id, course.id);

  const alreadyActive = await prisma.attendanceSession.findFirst({
    where: { courseId: course.id, status: "ACTIVE" },
  });

  if (alreadyActive) {
    throw new ServiceError(
      "There is already an active attendance session for this course.",
      409
    );
  }

  const now = new Date();
  const qrExpiresAt = new Date(now.getTime() + QR_EXPIRY_MINUTES * 60 * 1000);

  return prisma.attendanceSession.create({
    data: {
      institutionId,
      courseId: course.id,
      lecturerId: lecturer.id,
      academicSessionId: course.academicSessionId,
      semesterId: course.semesterId,
      date: now,
      startTime: now,
      status: "ACTIVE",
      qrToken: generateQrToken(),
      qrExpiresAt,
    },
    include: sessionInclude,
  });
}

export async function closeAttendanceSession(
  institutionId: string,
  userId: string,
  sessionId: string
) {
  const lecturer = await getLecturerProfileForUser(institutionId, userId);

  const session = await prisma.attendanceSession.findFirst({
    where: { id: sessionId, institutionId, lecturerId: lecturer.id },
  });

  if (!session) {
    throw new ServiceError("Attendance session not found.", 404);
  }

  if (session.status !== "ACTIVE") {
    throw new ServiceError("This session is not currently active.", 400);
  }

  return prisma.attendanceSession.update({
    where: { id: sessionId },
    data: { status: "CLOSED", closedAt: new Date() },
    include: sessionInclude,
  });
}

export async function getAttendanceSessionById(
  institutionId: string,
  sessionId: string
) {
  const session = await prisma.attendanceSession.findFirst({
    where: { id: sessionId, institutionId },
    include: sessionInclude,
  });

  if (!session) {
    throw new ServiceError("Attendance session not found.", 404);
  }

  return session;
}

export async function listSessionsForLecturer(
  institutionId: string,
  userId: string
) {
  const lecturer = await getLecturerProfileForUser(institutionId, userId);

  return prisma.attendanceSession.findMany({
    where: { institutionId, lecturerId: lecturer.id },
    include: sessionInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getSessionDashboard(
  institutionId: string,
  userId: string,
  sessionId: string
) {
  const lecturer = await getLecturerProfileForUser(institutionId, userId);

  const session = await prisma.attendanceSession.findFirst({
    where: { id: sessionId, institutionId, lecturerId: lecturer.id },
    include: sessionInclude,
  });

  if (!session) {
    throw new ServiceError("Attendance session not found.", 404);
  }

  const registrations = await prisma.courseRegistration.findMany({
    where: { courseId: session.courseId },
    include: {
      student: {
        select: { id: true, matricNumber: true, firstName: true, lastName: true },
      },
    },
  });

  const records = await prisma.attendanceRecord.findMany({
    where: { attendanceSessionId: session.id },
  });

  const checkInTimeByStudentId = new Map(
    records.map((r) => [r.studentId, r.checkInTime])
  );

  const present = registrations
    .filter((reg) => checkInTimeByStudentId.has(reg.student.id))
    .map((reg) => ({
      ...reg.student,
      checkInTime: checkInTimeByStudentId.get(reg.student.id),
    }));

  const absent = registrations
    .filter((reg) => !checkInTimeByStudentId.has(reg.student.id))
    .map((reg) => reg.student);

  const registeredCount = registrations.length;
  const presentCount = present.length;
  const absentCount = absent.length;
  const attendancePercentage =
    registeredCount === 0 ? 0 : Math.round((presentCount / registeredCount) * 100);

  return {
    session,
    registeredCount,
    presentCount,
    absentCount,
    attendancePercentage,
    present,
    absent,
  };
}