import { Router } from "express";
import {
  start,
  close,
  getOne,
  listMine,
  dashboard,
} from "../controllers/attendanceSession.controller";
import { authenticate } from "../middleware/auth.middleware";
import { enforceTenantScope } from "../middleware/tenantScope.middleware";
import { requireRole } from "../middleware/rbac.middleware";

const router = Router();

router.use(authenticate, enforceTenantScope, requireRole("LECTURER"));

router.post("/", start);
router.get("/mine", listMine);
router.get("/:id", getOne);
router.get("/:id/dashboard", dashboard);
router.patch("/:id/close", close);

export default router;