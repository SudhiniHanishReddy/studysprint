import express from "express";
import helmet from "helmet";

import { env } from "./config/env.js";
import { sessionMiddleware } from "./config/session.js";

import apiRoutes from "./routes/index.js";

import {
  notFoundHandler,
  errorHandler,
} from "./middleware/error.middleware.js";

const app = express();

if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.disable("x-powered-by");

app.use(helmet());

app.use(express.json({
  limit: "10kb",
}));

app.use(express.urlencoded({
  extended: false,
  limit: "10kb",
}));

app.use(sessionMiddleware);

app.get("/", (req, res) => {
  res.redirect(req.session?.userId ? "/dashboard.html" : "/login.html");
});

app.use(express.static("public"));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "StudySprint API is running",
    environment: env.NODE_ENV,
  });
});

// All API routes
app.use("/api", apiRoutes);

// 404 must come after all valid routes
app.use(notFoundHandler);

// Global error handler must be last
app.use(errorHandler);

export { app };