import { Request, Response } from "express";
import { getAttendanceReport } from "../services/report.service";
import { logAudit } from "../services/audit.service";
import { attendanceReportQuerySchema } from "../validators/report.validator";
import { successResponse, errorResponse } from "../utils/apiResponse";

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text = value instanceof Date ? value.toISOString() : String(value);

  // Stop spreadsheet apps from treating text as a formula
  if (/^[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  if (/[",\r\n]/.test(text)) {
    text = `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export async function attendanceReport(req: Request, res: Response) {
  try {
    const parsed = attendanceReportQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid report filters.";
      return errorResponse(res, message, 400);
    }

    const institutionId = req.user!.institutionId as string;
    const data = await getAttendanceReport(institutionId, parsed.data);

    return successResponse(res, "Attendance report retrieved successfully.", data);
  } catch (err) {
    console.error("Get attendance report error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}

export async function exportAttendanceReportCsv(req: Request, res: Response) {
  try {
    const parsed = attendanceReportQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid report filters.";
      return errorResponse(res, message, 400);
    }

    const institutionId = req.user!.institutionId as string;
    const data = await getAttendanceReport(institutionId, parsed.data);

    const header = [
      "Matric Number",
      "Student Name",
      "Course Code",
      "Course Title",
      "Session Date",
      "Lecturer Staff ID",
      "Lecturer Name",
      "Check-in Time",
      "Status",
    ];

    const rows = data.records.map((r) => [
      r.student?.matricNumber,
      `${r.student?.firstName ?? ""} ${r.student?.lastName ?? ""}`.trim(),
      r.course?.code,
      r.course?.title,
      r.attendanceSession?.date,
      r.attendanceSession?.lecturer?.staffId,
      `${r.attendanceSession?.lecturer?.firstName ?? ""} ${r.attendanceSession?.lecturer?.lastName ?? ""}`.trim(),
      r.checkInTime,
      r.status,
    ]);

    const csv =
      "\uFEFF" +
      [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");

    const stamp = new Date().toISOString().slice(0, 10);

    await logAudit({
      institutionId,
      userId: req.user!.userId,
      action: "REPORT_EXPORT",
      resource: "AttendanceReport",
      ipAddress: req.ip,
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="attendance-report-${stamp}.csv"`
    );

    return res.status(200).send(csv);
  } catch (err) {
    console.error("Export attendance report error:", err);
    return errorResponse(res, "Something went wrong. Please try again.", 500);
  }
}