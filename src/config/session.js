import session from "express-session";
import MySQLStoreFactory from "express-mysql-session";
import { env } from "./env.js";

const MySQLStore = MySQLStoreFactory(session);

const sessionStore = new MySQLStore({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,

  clearExpired: true,
  checkExpirationInterval: 15 * 60 * 1000,
  expiration: 24 * 60 * 60 * 1000,

  createDatabaseTable: true,
  schema: {
    tableName: "express_sessions",
  },
  connectionLimit: 5,
});

export const sessionMiddleware = session({
  name: "studysprint.sid",
  secret: env.SESSION_SECRET,
  store: sessionStore,

  resave: false,
  saveUninitialized: false,

  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000,
  },
});

export { sessionStore };