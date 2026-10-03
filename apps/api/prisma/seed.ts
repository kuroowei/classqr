import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Demo@12345", 10);

  const ndu = await prisma.institution.create({
    data: {
      name: "Niger Delta University",
      shortName: "NDU",
      country: "Nigeria",
      region: "Bayelsa State",
    },
  });

  const faculty = await prisma.faculty.create({
    data: {
      institutionId: ndu.id,
      name: "Faculty of Computing",
      code: "COMP",
    },
  });

  const department = await prisma.department.create({
    data: {
      institutionId: ndu.id,
      facultyId: faculty.id,
      name: "Computer Science",
      code: "CSC",
    },
  });

  const programme = await prisma.programme.create({
    data: {
      institutionId: ndu.id,
      departmentId: department.id,
      name: "B.Sc. Computer Science",
      code: "BSC-CSC",
      degreeType: "BSc",
      durationYears: 4,
    },
  });

  const level = await prisma.level.create({
    data: { institutionId: ndu.id, name: "300 Level", sortOrder: 3 },
  });

  const session2025 = await prisma.academicSession.create({
    data: {
      institutionId: ndu.id,
      name: "2025/2026",
      startDate: new Date("2025-09-01"),
      endDate: new Date("2026-07-31"),
    },
  });

  const firstSemester = await prisma.semester.create({
    data: { institutionId: ndu.id, name: "First Semester", sortOrder: 1 },
  });

  const course = await prisma.course.create({
    data: {
      institutionId: ndu.id,
      facultyId: faculty.id,
      programmeId: programme.id,
      levelId: level.id,
      academicSessionId: session2025.id,
      semesterId: firstSemester.id,
      code: "CSC301",
      title: "Database Systems",
      creditUnit: 3,
    },
  });

  const lecturerUser = await prisma.user.create({
    data: {
      institutionId: ndu.id,
      email: "lecturer.demo@ndu.edu.ng",
      passwordHash,
      role: UserRole.LECTURER,
    },
  });

  const lecturer = await prisma.lecturer.create({
    data: {
      institutionId: ndu.id,
      userId: lecturerUser.id,
      staffId: "NDU-STAFF-001",
      firstName: "Demo",
      lastName: "Lecturer",
      departmentId: department.id,
    },
  });

  await prisma.lecturerCourse.create({
    data: { institutionId: ndu.id, lecturerId: lecturer.id, courseId: course.id },
  });

  const demoStudents = [
    { matric: "NDU/CSC/2023/001", first: "Demo", last: "Student1" },
    { matric: "NDU/CSC/2023/002", first: "Demo", last: "Student2" },
    { matric: "NDU/CSC/2023/003", first: "Demo", last: "Student3" },
  ];

  for (const s of demoStudents) {
    const studentUser = await prisma.user.create({
      data: {
        institutionId: ndu.id,
        email: `${s.matric.replace(/\//g, "-").toLowerCase()}@ndu.edu.ng`,
        passwordHash,
        role: UserRole.STUDENT,
      },
    });

    const student = await prisma.student.create({
      data: {
        institutionId: ndu.id,
        userId: studentUser.id,
        matricNumber: s.matric,
        firstName: s.first,
        lastName: s.last,
        programmeId: programme.id,
        levelId: level.id,
      },
    });

    await prisma.courseRegistration.create({
      data: {
        institutionId: ndu.id,
        studentId: student.id,
        courseId: course.id,
        academicSessionId: session2025.id,
        semesterId: firstSemester.id,
      },
    });
  }

  await prisma.user.create({
    data: {
      email: "platform.admin@classqr.io",
      passwordHash,
      role: UserRole.PLATFORM_SUPER_ADMIN,
    },
  });

  console.log("Seed complete. Demo password for all accounts: Demo@12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });