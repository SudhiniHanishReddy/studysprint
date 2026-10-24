import {
  startSession,
  completeSession,
  createManualSession,
  getSessionOptions,
  getActiveSession,
  getSessionHistory,
  getStudyStats,
} from "../services/session.service.js";

/*
 * GET /api/sessions/options
 */
export async function options(req, res) {
  const tracks = await getSessionOptions(
    req.session.userId
  );

  res.json({
    success: true,
    tracks,
  });
}

/*
 * GET /api/sessions/active
 */
export async function active(req, res) {
  const session = await getActiveSession(
    req.session.userId
  );

  res.json({
    success: true,
    session,
  });
}

/*
 * GET /api/sessions/history
 */
export async function history(req, res) {
  const sessions = await getSessionHistory(
    req.session.userId
  );

  res.json({
    success: true,
    sessions,
  });
}

/*
 * GET /api/sessions/stats
 */
export async function stats(req, res) {
  const statistics = await getStudyStats(req.session.userId, {
    period: req.query.period,
    trackId: req.query.trackId,
    subjectId: req.query.subjectId,
  });

  res.json({
    success: true,
    stats: statistics,
  });
}

/*
 * POST /api/sessions/start
 */
export async function start(req, res) {
  const session = await startSession(
    req.session.userId,
    req.body
  );

  res.status(201).json({
    success: true,
    session,
  });
}

/*
 * POST /api/sessions/complete
 */
export async function complete(req, res) {
  const result = await completeSession(
    req.session.userId,
    req.body.sessionId
  );

  res.json({
    success: true,
    ...result,
  });
}

/*
 * POST /api/sessions/manual
 */
export async function manual(req, res) {
  const result =
    await createManualSession(
      req.session.userId,
      req.body
    );

  res.status(201).json({
    success: true,
    ...result,
  });
}
