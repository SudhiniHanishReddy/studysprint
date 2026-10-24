import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";

const BCRYPT_ROUNDS = 12;

export async function registerUser({ username, email, password }) {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { username },
        { email },
      ],
    },
    select: {
      id: true,
      username: true,
      email: true,
    },
  });

  if (existingUser) {
    const field =
      existingUser.email === email
        ? "Email"
        : "Username";

    const error = new Error(`${field} is already in use`);
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(
    password,
    BCRYPT_ROUNDS
  );

  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
    },
    select: {
      id: true,
      username: true,
      email: true,
      points: true,
      timezone: true,
      createdAt: true,
    },
  });

  return user;
}

export async function authenticateUser({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return null;
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordMatches) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    points: user.points,
    timezone: user.timezone,
  };
}

export async function getCurrentUser(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      points: true,
      timezone: true,
      createdAt: true,
    },
  });
}