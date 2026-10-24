import { Router } from "express";

import { requireAuth } from "../middleware/auth.middleware.js";

import { validate } from "../middleware/validation.middleware.js";

import {
  startSessionSchema,
  completeSessionSchema,
  manualSessionSchema,
} from "../validators/session.validator.js";

import {
  start,
  complete,
  manual,
  options,
  active,
  history,
  stats,
} from "../controllers/session.controller.js";

const router = Router();

/*
 * Every session endpoint requires login.
 */
router.use(requireAuth);

/*
 * Available study selections and the current active timer.
 */
router.get(
  "/options",
  options
);

router.get(
  "/active",
  active
);

/*
 * Recent completed sessions.
 */
router.get(
  "/history",
  history
);

/*
 * Study-time statistics for the current user.
 */
router.get(
  "/stats",
  stats
);

/*
 * Start timer.
 */
router.post(
  "/start",
  validate(startSessionSchema),
  start
);

/*
 * Complete timer.
 */
router.post(
  "/complete",
  validate(completeSessionSchema),
  complete
);

/*
 * Record old/external study time manually.
 */
router.post(
  "/manual",
  validate(manualSessionSchema),
  manual
);

export default router;