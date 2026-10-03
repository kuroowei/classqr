import { Router } from "express";
import { getAuditLogs } from "../controllers/audit.controller";
import { authenticate } from "../middleware/auth.middleware";
import { enforceTenantScope } from "../middleware/tenantScope.middleware";
import { requireRole } from "../middleware/rbac.middleware";

const router = Router();

router.use(authenticate, enforceTenantScope, requireRole("UNIVERSITY_SUPER_ADMIN"));

router.get("/", getAuditLogs);

export default router;