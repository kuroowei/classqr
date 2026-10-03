import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { validateEnv } from "./config/env";
import { errorResponse } from "./utils/apiResponse";
import authRoutes from "./routes/auth.routes";
import institutionRoutes from "./routes/institution.routes";
import facultyRoutes from "./routes/faculty.routes";
import departmentRoutes from "./routes/department.routes";
import programmeRoutes from "./routes/programme.routes";
import levelRoutes from "./routes/level.routes";
import academicSessionRoutes from "./routes/academicSession.routes";
import semesterRoutes from "./routes/semester.routes";
import studentRoutes from "./routes/student.routes";
import lecturerRoutes from "./routes/lecturer.routes";
import courseRoutes from "./routes/course.routes";
import lecturerCourseRoutes from "./routes/lecturerCourse.routes";
import courseRegistrationRoutes from "./routes/courseRegistration.routes";
import attendanceSessionRoutes from "./routes/attendanceSession.routes";
import attendanceRecordRoutes from "./routes/attendanceRecord.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import reportRoutes from "./routes/report.routes";
import auditRoutes from "./routes/audit.routes";

dotenv.config({ quiet: true });
validateEnv();

const app = express();

// Behind Render/Railway there is one proxy in front of the app, so trust it
// to get the real client IP (used by the audit log and the rate limiter).
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "100kb" }));

// Only failed login attempts count towards the limit.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many failed login attempts. Please try again in 15 minutes.",
  },
});

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "ClassQR API is running.",
    data: { status: "ok", timestamp: new Date().toISOString() },
  });
});

app.use("/api/auth/login", loginLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/institutions", institutionRoutes);
app.use("/api/faculties", facultyRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/programmes", programmeRoutes);
app.use("/api/levels", levelRoutes);
app.use("/api/academic-sessions", academicSessionRoutes);
app.use("/api/semesters", semesterRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/lecturers", lecturerRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/lecturer-courses", lecturerCourseRoutes);
app.use("/api/course-registrations", courseRegistrationRoutes);
app.use("/api/attendance/sessions", attendanceSessionRoutes);
app.use("/api/attendance", attendanceRecordRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/audit-logs", auditRoutes);

app.use((_req: Request, res: Response) => {
  return errorResponse(res, "Route not found.", 404);
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const status =
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    typeof (err as { status: unknown }).status === "number"
      ? (err as { status: number }).status
      : 500;

  if (status >= 500) {
    console.error("Unhandled error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }

  const message = status === 413 ? "Request body is too large." : "Invalid request.";
  return errorResponse(res, message, status);
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(PORT, () => {
  console.log(`ClassQR API listening on http://localhost:${PORT}`);
});