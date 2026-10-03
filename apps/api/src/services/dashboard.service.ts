import prisma from "../config/prisma";

export async function getAdminDashboard(institutionId: string) {
  const [
    facultyCount,
    departmentCount,
    programmeCount,
    studentCount,
    lecturerCount,
    courseCount,
    activeAttendanceSessions,
  ] = await Promise.all([
    prisma.faculty.count({ where: { institutionId, status: "ACTIVE" } }),
    prisma.department.count({ where: { institutionId, status: "ACTIVE" } }),
    prisma.programme.count({ where: { institutionId, status: "ACTIVE" } }),
    prisma.student.count({ where: { institutionId, status: "ACTIVE" } }),
    prisma.lecturer.count({ where: { institutionId, status: "ACTIVE" } }),
    prisma.course.count({ where: { institutionId, status: "ACTIVE" } }),
    prisma.attendanceSession.count({ where: { institutionId, status: "ACTIVE" } }),
  ]);

  const courses = await prisma.course.findMany({
    where: { institutionId, status: "ACTIVE" },
    select: { id: true },
  });

  let expectedCheckIns = 0;

  for (const course of courses) {
    const [registeredCount, sessionsHeld] = await Promise.all([
      prisma.courseRegistration.count({ where: { courseId: course.id } }),
      prisma.attendanceSession.count({ where: { courseId: course.id } }),
    ]);

    expectedCheckIns += registeredCount * sessionsHeld;
  }

  const actualCheckIns = await prisma.attendanceRecord.count({
    where: { institutionId },
  });

  const overallAttendancePercentage =
    expectedCheckIns === 0
      ? 0
      : Math.round((actualCheckIns / expectedCheckIns) * 100);

  return {
    facultyCount,
    departmentCount,
    programmeCount,
    studentCount,
    lecturerCount,
    courseCount,
    activeAttendanceSessions,
    overallAttendancePercentage,
  };
}

async function assertFacultyInInstitution(institutionId: string, facultyId: string) {
  const faculty = await prisma.faculty.findFirst({
    where: { id: facultyId, institutionId },
  });

  if (!faculty) {
    return null;
  }

  return faculty;
}

export async function getFacultyDashboard(institutionId: string, facultyId: string) {
  const faculty = await assertFacultyInInstitution(institutionId, facultyId);

  if (!faculty) {
    return null;
  }

  const [departmentCount, studentCount, courseCount] = await Promise.all([
    prisma.department.count({
      where: { institutionId, facultyId, status: "ACTIVE" },
    }),
    prisma.student.count({
      where: {
        institutionId,
        status: "ACTIVE",
        programme: { department: { facultyId } },
      },
    }),
    prisma.course.count({ where: { institutionId, facultyId, status: "ACTIVE" } }),
  ]);

  const courses = await prisma.course.findMany({
    where: { institutionId, facultyId, status: "ACTIVE" },
    select: { id: true },
  });

  let expectedCheckIns = 0;

  for (const course of courses) {
    const [registeredCount, sessionsHeld] = await Promise.all([
      prisma.courseRegistration.count({ where: { courseId: course.id } }),
      prisma.attendanceSession.count({ where: { courseId: course.id } }),
    ]);

    expectedCheckIns += registeredCount * sessionsHeld;
  }

  const courseIds = courses.map((c) => c.id);
  const actualCheckIns = await prisma.attendanceRecord.count({
    where: { courseId: { in: courseIds } },
  });

  const attendancePercentage =
    expectedCheckIns === 0
      ? 0
      : Math.round((actualCheckIns / expectedCheckIns) * 100);

  return {
    faculty: { id: faculty.id, name: faculty.name, code: faculty.code },
    departmentCount,
    studentCount,
    courseCount,
    attendancePercentage,
  };
}

async function assertDepartmentInInstitution(
  institutionId: string,
  departmentId: string
) {
  const department = await prisma.department.findFirst({
    where: { id: departmentId, institutionId },
  });

  if (!department) {
    return null;
  }

  return department;
}

export async function getDepartmentDashboard(
  institutionId: string,
  departmentId: string
) {
  const department = await assertDepartmentInInstitution(institutionId, departmentId);

  if (!department) {
    return null;
  }

  const [studentCount, lecturerCount, courseCount] = await Promise.all([
    prisma.student.count({
      where: {
        institutionId,
        status: "ACTIVE",
        programme: { departmentId },
      },
    }),
    prisma.lecturer.count({ where: { institutionId, departmentId, status: "ACTIVE" } }),
    prisma.course.count({
      where: {
        institutionId,
        status: "ACTIVE",
        programme: { departmentId },
      },
    }),
  ]);

  const courses = await prisma.course.findMany({
    where: { institutionId, status: "ACTIVE", programme: { departmentId } },
    select: { id: true },
  });

  let expectedCheckIns = 0;

  for (const course of courses) {
    const [registeredCount, sessionsHeld] = await Promise.all([
      prisma.courseRegistration.count({ where: { courseId: course.id } }),
      prisma.attendanceSession.count({ where: { courseId: course.id } }),
    ]);

    expectedCheckIns += registeredCount * sessionsHeld;
  }

  const courseIds = courses.map((c) => c.id);
  const actualCheckIns = await prisma.attendanceRecord.count({
    where: { courseId: { in: courseIds } },
  });

  const attendancePercentage =
    expectedCheckIns === 0
      ? 0
      : Math.round((actualCheckIns / expectedCheckIns) * 100);

  return {
    department: { id: department.id, name: department.name, code: department.code },
    studentCount,
    lecturerCount,
    courseCount,
    attendancePercentage,
  };
}