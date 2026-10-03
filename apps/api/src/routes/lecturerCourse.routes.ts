import { Router } from "express";
import {
  assign,
  list,
  listForLecturer,
  remove,
} from "../controllers/lecturerCourse.controller";
import { authenticate } from "../middleware/auth.middleware";
import { enforceTenantScope } from "../middleware/tenantScope.middleware";
import { requireRole } from "../middleware/rbac.middleware";

const router = Router();

router.use(authenticate, enforceTenantScope, requireRole("UNIVERSITY_SUPER_ADMIN"));

router.post("/", assign);
router.get("/", list);
router.get("/lecturer/:lecturerId", listForLecturer);
router.delete("/:id", remove);

export default router;