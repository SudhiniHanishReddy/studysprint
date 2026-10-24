import { z } from "zod";

const id = z.coerce.number().int().positive();

export const startSessionSchema = z.object({
  trackId: id,
  subjectId: id.optional(),
  topicId: id.optional(),
  goalId: id.optional(),
  kind: z.enum(["STUDY", "PRACTICE"]).default("STUDY"),
  title: z.string().trim().min(1).max(180).optional(),
  resourceUrl: z.string().url().max(2048).optional(),
});

export const completeSessionSchema = z.object({
  sessionId: id,
});

export const manualSessionSchema = z.object({
  trackId: id,
  subjectId: id.optional(),
  topicId: id.optional(),
  goalId: id.optional(),
  kind: z.enum(["STUDY", "PRACTICE"]).default("STUDY"),
  title: z.string().trim().min(1).max(180).optional(),
  resourceUrl: z.string().url().max(2048).optional(),
  durationMinutes: z.coerce.number().int().min(1).max(720),
});