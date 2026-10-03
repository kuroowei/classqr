import { Router } from "express";
import {
  create,
  list,
  getOne,
  update,
  deactivate,
} from "../controllers/institution.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/rbac.middleware";

const router = Router();

// Only the Platform Super Admin manages institutions.
router.use(authenticate, requireRole("PLATFORM_SUPER_ADMIN"));

router.post("/", create);
router.get("/", list);
router.get("/:id", getOne);
router.put("/:id", update);
router.patch("/:id/deactivate", deactivate);

export default router;