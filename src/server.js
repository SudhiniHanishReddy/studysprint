import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { sessionStore } from "./config/session.js";

const server = app.listen(env.PORT, () => {
  console.log(`StudySprint running at http://localhost:${env.PORT}`);
});

async function gracefulShutdown(signal) {
  console.log(`${signal} received. Shutting down...`);

  server.close(async () => {
    try {
      await prisma.$disconnect();
      await sessionStore.close();

      console.log("Database connections closed.");
      process.exit(0);
    } catch (error) {
      console.error("Shutdown error:", error);
      process.exit(1);
    }
  });
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));