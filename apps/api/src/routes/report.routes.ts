import { Router } from "express";
import {
  attendanceReport,
  exportAttendanceReportCsv,
} from "../controllers/report.controller";
import { authenticate } from "../middleware/auth.middleware";
import { enforceTenantScope } from "../middleware/tenantScope.middleware";
import { requireRole } from "../middleware/rbac.middleware";

const router = Router();

router.use(authenticate, enforceTenantScope, requireRole("UNIVERSITY_SUPER_ADMIN"));

router.get("/attendance", attendanceReport);
router.get("/attendance/export", exportAttendanceReportCsv);

export default router;