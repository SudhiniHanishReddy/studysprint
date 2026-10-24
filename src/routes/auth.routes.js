import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  register,
  login,
  logout,
  me,
} from "../controllers/auth.controller.js";

import { validate } from "../middleware/validation.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";

import {
  registerSchema,
  loginSchema,
} from "../validators/auth.validator.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Try again later.",
  },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many registration attempts. Try again later.",
  },
});

router.post(
  "/register",
  registerLimiter,
  validate(registerSchema),
  register
);

router.post(
  "/login",
  loginLimiter,
  validate(loginSchema),
  login
);

router.post(
  "/logout",
  requireAuth,
  logout
);

router.get(
  "/me",
  requireAuth,
  me
);

export default router;