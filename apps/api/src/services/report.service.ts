import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { z } from "zod";
import { attendanceReportQuerySchema } from "../validators/report.validator";

type AttendanceReportQuery = z.infer<typeof attendanceReportQuerySchema>;

function buildCourseWhere(
  institutionId: string,
  filters: AttendanceReportQuery
): Prisma.CourseWhereInput {
  return {
    institutionId,
    ...(filters.facultyId && { facultyId: filters.facultyId }),
    ...(filters.departmentId && { programme: { departmentId: filters.departmentId } }),
    ...(filters.programmeId && { programmeId: filters.programmeId }),
    ...(filters.levelId && { levelId: filters.levelId }),
    ...(filters.courseId && { id: filters.courseId }),
    ...(filters.academicSessionId && { academicSessionId: filters.academicSessionId }),
    ...(filters.semesterId && { semesterId: filters.semesterId }),
  };
}

function buildSessionWhere(
  courseIds: string[],
  filters: AttendanceReportQuery
): Prisma.AttendanceSessionWhereInput {
  return {
    courseId: { in: courseIds },
    ...(filters.lecturerId && { lecturerId: filters.lecturerId }),
    ...((filters.dateFrom || filters.dateTo) && {
      date: {
        ...(filters.dateFrom && { gte: filters.dateFrom }),
        ...(filters.dateTo && { lte: filters.dateTo }),
      },
    }),
  };
}

function buildRecordWhere(
  institutionId: string,
  courseIds: string[],
  filters: AttendanceReportQuery
): Prisma.AttendanceRecordWhereInput {
  return {
    institutionId,
    courseId: { in: courseIds },
    ...(filters.studentId && { studentId: filters.studentId }),
    ...(filters.status && { status: filters.status }),
    ...(filters.lecturerId && {
      attendanceSession: { lecturerId: filters.lecturerId },
    }),
    ...((filters.dateFrom || filters.dateTo) && {
      checkInTime: {
        ...(filters.dateFrom && { gte: filters.dateFrom }),
        ...(filters.dateTo && { lte: filters.dateTo }),
      },
    }),
  };
}

export async function getAttendanceReport(
  institutionId: string,
  filters: AttendanceReportQuery
) {
  const matchingCourses = await prisma.course.findMany({
    where: buildCourseWhere(institutionId, filters),
    select: { id: true, code: true, title: true },
  });

  const courseIds = matchingCourses.map((c) => c.id);
  const courseMap = new Map(matchingCourses.map((c) => [c.id, c]));

  const recordWhere = buildRecordWhere(institutionId, courseIds, filters);

  // Registered students per course (narrowed to one student if filtered)
  const registrationGroups = await prisma.courseRegistration.groupBy({
    by: ["courseId"],
    where: {
      institutionId,
      courseId: { in: courseIds },
      ...(filters.studentId && { studentId: filters.studentId }),
    },
    _count: { _all: true },
  });

  // Sessions held per course (narrowed by lecturer and date range)
  const sessionGroups = await prisma.attendanceSession.groupBy({
    by: ["courseId"],
    where: buildSessionWhere(courseIds, filters),
    _count: { _all: true },
  });

  const registeredByCourse = new Map(
    registrationGroups.map((g) => [g.courseId, g._count._all])
  );
  const sessionsByCourse = new Map(
    sessionGroups.map((g) => [g.courseId, g._count._all])
  );

  const totalRegistered = registrationGroups.reduce((sum, g) => sum + g._count._all, 0);
  const totalSessions = sessionGroups.reduce((sum, g) => sum + g._count._all, 0);

  // Every registered student is expected at every session of their course
  let expectedAttendances = 0;
  for (const [courseId, sessionCount] of sessionsByCourse) {
    expectedAttendances += sessionCount * (registeredByCourse.get(courseId) ?? 0);
  }

  const totalPresent = await prisma.attendanceRecord.count({
    where: { ...recordWhere, status: filters.status ?? "PRESENT" },
  });

  const totalRecords = await prisma.attendanceRecord.count({ where: recordWhere });

  const totalAbsent = Math.max(expectedAttendances - totalPresent, 0);

  const attendancePercentage =
    expectedAttendances === 0
      ? 0
      : Math.round((totalPresent / expectedAttendances) * 100);

  const rawRecords = await prisma.attendanceRecord.findMany({
    where: recordWhere,
    include: {
      student: {
        select: { matricNumber: true, firstName: true, lastName: true },
      },
      attendanceSession: {
        select: {
          date: true,
          lecturer: { select: { staffId: true, firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { checkInTime: "desc" },
  });

  const records = rawRecords.map((r) => ({
    ...r,
    course: courseMap.get(r.courseId) ?? null,
  }));

  return {
    totalRegistered,
    totalSessions,
    expectedAttendances,
    totalPresent,
    totalAbsent,
    totalRecords,
    attendancePercentage,
    records,
  };
}