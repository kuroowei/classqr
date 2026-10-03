import { Router } from "express";
import {
  create,
  list,
  getOne,
  update,
  deactivate,
} from "../controllers/faculty.controller";
import { authenticate } from "../middleware/auth.middleware";
import { enforceTenantScope } from "../middleware/tenantScope.middleware";
import { requireRole } from "../middleware/rbac.middleware";

const router = Router();

// Faculty management belongs to a specific institution's admin.
router.use(authenticate, enforceTenantScope, requireRole("UNIVERSITY_SUPER_ADMIN"));

router.post("/", create);
router.get("/", list);
router.get("/:id", getOne);
router.put("/:id", update);
router.patch("/:id/deactivate", deactivate);

export default router;