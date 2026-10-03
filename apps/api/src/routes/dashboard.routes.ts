import { Router } from "express";
import {
  adminDashboard,
  facultyDashboard,
  departmentDashboard,
} from "../controllers/dashboard.controller";
import { authenticate } from "../middleware/auth.middleware";
import { enforceTenantScope } from "../middleware/tenantScope.middleware";
import { requireRole } from "../middleware/rbac.middleware";

const router = Router();

router.use(authenticate, enforceTenantScope, requireRole("UNIVERSITY_SUPER_ADMIN"));

router.get("/admin", adminDashboard);
router.get("/faculty/:facultyId", facultyDashboard);
router.get("/department/:departmentId", departmentDashboard);

export default router;