import { prisma } from "../lib/prisma.js";
import { awardSessionXp } from "./xp.service.js";

export async function getSessionOptions(userId) {
  return prisma.track.findMany({
    where: {
      archivedAt: null,
      OR: [
        { ownerId: null },
        { ownerId: userId },
      ],
    },
    orderBy: [
      { ownerId: "asc" },
      { name: "asc" },
    ],
    select: {
      id: true,
      name: true,
      subjects: {
        orderBy: [
          { sortOrder: "asc" },
          { name: "asc" },
        ],
        select: {
          id: true,
          name: true,
          topics: {
            where: {
              isActive: true,
            },
            orderBy: [
              { sortOrder: "asc" },
              { name: "asc" },
            ],
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
}

export async function getActiveSession(userId) {
  return prisma.session.findFirst({
    where: {
      userId,
      activeFlag: true,
    },
    select: {
      id: true,
      trackId: true,
      subjectId: true,
      topicId: true,
      kind: true,
      title: true,
      startedAt: true,
    },
  });
}

export async function getSessionHistory(userId) {
  return prisma.session.findMany({
    where: {
      userId,
      endedAt: {
        not: null,
      },
      durationSeconds: {
        not: null,
      },
    },
    orderBy: [
      { endedAt: "desc" },
      { id: "desc" },
    ],
    take: 50,
    select: {
      id: true,
      endedAt: true,
      localDate: true,
      durationSeconds: true,
      kind: true,
      source: true,
      track: {
        select: {
          name: true,
        },
      },
      subject: {
        select: {
          name: true,
        },
      },
      topic: {
        select: {
          name: true,
        },
      },
    },
  });
}

function getDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function getDateInTimezone(date, timezone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  );

  return new Date(Date.UTC(values.year, values.month - 1, values.day));
}

export async function getStudyStats(userId, filters = {}) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });
  if (!user) throw new Error("User not found");

  for (const key of ["trackId", "subjectId"]) {
    if (filters[key] != null &&
        !/^[1-9]\d*$/.test(String(filters[key]))) {
      throw new Error("Invalid " + key);
    }
  }

  const period = ["daily", "weekly", "monthly"].includes(filters.period)
    ? filters.period : "weekly";
  const today = getDateInTimezone(new Date(), user.timezone);
  const start = new Date(today);

  if (period === "daily") {
    // Current local calendar day.
  } else if (period === "monthly") {
    start.setUTCDate(1);
  } else {
    start.setUTCDate(start.getUTCDate() - 6);
  }

  const where = {
    userId,
    endedAt: { not: null },
    durationSeconds: { gt: 0 },
    localDate: { gte: start, lte: today },
    ...(filters.trackId ? { trackId: Number(filters.trackId) } : {}),
    ...(filters.subjectId ? { subjectId: Number(filters.subjectId) } : {}),
  };

  const sessions = await prisma.session.findMany({
    where,
    select: {
      durationSeconds: true, localDate: true, trackId: true,
      subjectId: true, topicId: true,
      track: { select: { name: true } },
      subject: { select: { name: true } },
      topic: { select: { name: true } },
    },
  });

  const subjects = new Map();
  const topics = new Map();
  const dayTotals = new Map();
  const todayKey = getDateKey(today);
  let todayCount = 0;

  for (const s of sessions) {
    const seconds = s.durationSeconds ?? 0;
    const date = getDateKey(s.localDate);
    dayTotals.set(date, (dayTotals.get(date) ?? 0) + seconds);
    if (date === todayKey) todayCount++;

    const sk = `${s.trackId}:${s.subjectId ?? "none"}`;
    const sub = subjects.get(sk) ?? {
      trackId: s.trackId, trackName: s.track.name,
      subjectId: s.subjectId,
      subjectName: s.subject?.name ?? "Unassigned",
      totalSeconds: 0,
    };
    sub.totalSeconds += seconds;
    subjects.set(sk, sub);

    const tk = `${sk}:${s.topicId ?? "none"}`;
    const topic = topics.get(tk) ?? {
      trackId: s.trackId, trackName: s.track.name,
      subjectId: s.subjectId,
      subjectName: s.subject?.name ?? "Unassigned",
      topicId: s.topicId,
      topicName: s.topic?.name ?? "No topic selected",
      totalSeconds: 0, sessions: 0,
    };
    topic.totalSeconds += seconds;
    topic.sessions++;
    topics.set(tk, topic);
  }

  const dailyTotals = [];
  for (const d = new Date(start); d <= today; d.setUTCDate(d.getUTCDate() + 1)) {
    const date = getDateKey(d);
    dailyTotals.push({ date, totalSeconds: dayTotals.get(date) ?? 0 });
  }

  const totalSeconds = dailyTotals.reduce((sum, d) => sum + d.totalSeconds, 0);
  return {
    timezone: user.timezone,
    period,
    startDate: getDateKey(start),
    endDate: todayKey,
    today: {
      date: todayKey,
      totalSeconds: dayTotals.get(todayKey) ?? 0,
      completedSessions: todayCount,
    },
    lastSevenDays: {
      startDate: getDateKey(start),
      endDate: todayKey,
      totalSeconds,
    },
    bySubject: [...subjects.values()].sort((a, b) => b.totalSeconds - a.totalSeconds),
    byTopic: [...topics.values()].sort((a, b) => b.totalSeconds - a.totalSeconds),
    dailyTotals,
  };
}

/*
 * Converts the current instant into the user's local calendar date.
 *
 * The database stores localDate as a DATE value.
 * Example:
 * 2026-10-08
 */
function getLocalDate(timezone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(new Date())
    .filter((part) => part.type !== "literal")
    .reduce((result, part) => {
      result[part.type] = part.value;
      return result;
    }, {});

  return new Date(
    `${parts.year}-${parts.month}-${parts.day}T00:00:00.000Z`
  );
}

/*
 * Makes sure the selected hierarchy is valid:
 *
 * Track
 *   â†“
 * Subject
 *   â†“
 * Topic
 *
 * Also validates that the goal belongs to the logged-in user
 * and selected track.
 */
async function validateHierarchy(tx, userId, data) {
  const track = await tx.track.findFirst({
    where: {
      id: data.trackId,

      archivedAt: null,

      OR: [
        {
          ownerId: null,
        },
        {
          ownerId: userId,
        },
      ],
    },
  });

  if (!track) {
    throw new Error("Invalid track");
  }

  /*
   * Subject is optional because custom activities
   * do not necessarily have academic subjects.
   */
  if (data.subjectId) {
    const subject = await tx.subject.findFirst({
      where: {
        id: data.subjectId,
        trackId: track.id,
      },
    });

    if (!subject) {
      throw new Error(
        "Subject does not belong to selected track"
      );
    }
  }

  /*
   * Topic requires a valid subject.
   */
  if (data.topicId) {
    if (!data.subjectId) {
      throw new Error(
        "Topic requires a subject"
      );
    }

    const topic = await tx.topic.findFirst({
      where: {
        id: data.topicId,
        subjectId: data.subjectId,
        isActive: true,
      },
    });

    if (!topic) {
      throw new Error(
        "Topic does not belong to selected subject"
      );
    }
  }

  /*
   * Goal must belong to this user and the selected track.
   */
  if (data.goalId) {
    const goal = await tx.goal.findFirst({
      where: {
        id: data.goalId,
        userId,
        trackId: track.id,
      },
    });

    if (!goal) {
      throw new Error(
        "Goal does not belong to this user or track"
      );
    }
  }

  return track;
}

/*
 * Start a timer-based session.
 */
export async function startSession(userId, data) {
  return prisma.$transaction(async (tx) => {
    /*
     * Only one active session per user.
     */
    const activeSession = await tx.session.findFirst({
      where: {
        userId,
        activeFlag: true,
      },
    });

    if (activeSession) {
      throw new Error(
        "You already have an active session"
      );
    }

    /*
     * Validate track â†’ subject â†’ topic â†’ goal.
     */
    await validateHierarchy(tx, userId, data);

    /*
     * Server controls startedAt.
     */
    const startedAt = new Date();

    const session = await tx.session.create({
      data: {
        userId,

        trackId: data.trackId,

        subjectId: data.subjectId ?? null,

        topicId: data.topicId ?? null,

        goalId: data.goalId ?? null,

        kind: data.kind,

        source: "TIMER",

        title: data.title ?? null,

        resourceUrl: data.resourceUrl ?? null,

        startedAt,

        endedAt: null,

        durationSeconds: null,

        isCapped: false,

        localDate: null,

        activeFlag: true,
      },
    });

    return session;
  });
}

/*
 * Complete an active timer session.
 */
export async function completeSession(
  userId,
  sessionId
) {
  return prisma.$transaction(async (tx) => {
    /*
     * Only the owner can complete the session.
     */
    const session = await tx.session.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      throw new Error(
        "Session not found"
      );
    }

    if (session.activeFlag !== true) {
      if (
        session.endedAt &&
        Number.isInteger(session.durationSeconds) &&
        session.durationSeconds > 0
      ) {
        return {
          session,
          xp: 0,
          alreadyCompleted: true,
        };
      }

      throw new Error("Active session not found");
    }

    /*
     * Get user's timezone for analytics.
     */
    const user = await tx.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        timezone: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    /*
     * Server controls end time.
     */
    const endedAt = new Date();

    /*
     * Calculate elapsed seconds from server timestamps.
     */
    const durationSeconds = Math.floor(
      (
        endedAt.getTime() -
        session.startedAt.getTime()
      ) / 1000
    );

    /*
     * Prevent meaningless sessions.
     */
    if (durationSeconds < 60) {
      throw new Error(
        "Session must be at least 1 minute"
      );
    }

    /*
     * Store the user's local calendar day.
     */
    const localDate = getLocalDate(
      user.timezone
    );

    /*
     * Mark session complete.
     */
    const updatedSession =
      await tx.session.update({
        where: {
          id: session.id,
        },

        data: {
          endedAt,

          durationSeconds,

          localDate,

          activeFlag: null,
        },
      });

    /*
     * Award XP inside the same database transaction.
     */
    const xp = await awardSessionXp(
      tx,
      updatedSession
    );

    return {
      session: updatedSession,
      xp,
    };
  });
}

/*
 * Create a manually recorded session.
 *
 * Used when the user studied outside the timer
 * and wants to record the time afterwards.
 */
export async function createManualSession(
  userId,
  data
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        timezone: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    /*
     * Validate hierarchy before inserting.
     */
    await validateHierarchy(
      tx,
      userId,
      data
    );

    const endedAt = new Date();

    const durationSeconds =
      data.durationMinutes * 60;

    const startedAt = new Date(
      endedAt.getTime() -
      durationSeconds * 1000
    );

    const session = await tx.session.create({
      data: {
        userId,

        trackId: data.trackId,

        subjectId:
          data.subjectId ?? null,

        topicId:
          data.topicId ?? null,

        goalId:
          data.goalId ?? null,

        kind: data.kind,

        source: "MANUAL",

        title:
          data.title ?? null,

        resourceUrl:
          data.resourceUrl ?? null,

        startedAt,

        endedAt,

        durationSeconds,

        isCapped: false,

        localDate:
          getLocalDate(user.timezone),

        activeFlag: null,
      },
    });

    /*
     * Manual sessions receive the same XP logic.
     */
    const xp = await awardSessionXp(
      tx,
      session
    );

    return {
      session,
      xp,
    };
  });
}
