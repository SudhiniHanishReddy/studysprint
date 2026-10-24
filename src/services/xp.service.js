export async function awardSessionXp(tx, session) {
  if (
    !session.endedAt ||
    !Number.isInteger(session.durationSeconds) ||
    session.durationSeconds <= 0
  ) {
    return 0;
  }

  const dedupeKey = `session:${session.id}`;

  // Prevent duplicate XP for the same session.
  const existing = await tx.xpTransaction.findUnique({
    where: {
      dedupeKey,
    },
  });

  if (existing) {
    return existing.amount;
  }

  // 1 XP per completed minute.
  const rawXp = Math.floor(
    (session.durationSeconds ?? 0) / 60
  );

  // Per-session safety cap.
  const amount = Math.min(rawXp, 120);

  if (amount <= 0) {
    return 0;
  }

  await tx.xpTransaction.create({
    data: {
      userId: session.userId,
      amount,
      reason: "SESSION",
      dedupeKey,
      sessionId: session.id,
    },
  });

  await tx.user.update({
    where: {
      id: session.userId,
    },
    data: {
      points: {
        increment: amount,
      },
    },
  });

  return amount;
}