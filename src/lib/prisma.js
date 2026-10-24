import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.ts";
import { dbConnectionOptions } from "../config/database.js";

const adapter = new PrismaMariaDb({
  ...dbConnectionOptions,
  connectionLimit: 5,
  acquireTimeout: 10000,
});

export const prisma = new PrismaClient({ adapter });