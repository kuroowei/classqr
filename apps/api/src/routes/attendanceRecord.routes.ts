import { Router } from "express";
import { create, listMine, dashboard } from "../controllers/attendanceRecord.controller";
import { authenticate } from "../middleware/auth.middleware";
import { enforceTenantScope } from "../middleware/tenantScope.middleware";
import { requireRole } from "../middleware/rbac.middleware";

const router = Router();

router.use(authenticate, enforceTenantScope, requireRole("STUDENT"));

router.post("/check-in", create);
router.get("/mine", listMine);
router.get("/dashboard", dashboard);

export default router;