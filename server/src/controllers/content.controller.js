import fs from 'node:fs/promises';
import path from 'node:path';
import { Material, Session, Assignment, Submission } from '../models/index.js';
import { ApiError, asyncHandler, requireFields } from '../utils/ApiError.js';
import { publicUrl, UPLOAD_DIR } from '../middleware/upload.js';
import { resolveMeetUrl } from '../utils/googleMeet.js';

const PEOPLE = 'name email avatarColor';

async function removeLocalFile(url) {
  if (!url?.startsWith('/uploads/')) return;
  await fs.unlink(path.join(UPLOAD_DIR, path.basename(url))).catch(() => {});
}

/* ----------------------------- Materials ----------------------------- */

export const listMaterials = asyncHandler(async (req, res) => {
  res.json(await Material.find({ classroom: req.classroom._id }).populate('uploadedBy', PEOPLE).sort('-createdAt'));
});

export const createMaterial = asyncHandler(async (req, res) => {
  requireFields(req.body, ['title']);
  const { title, description, link } = req.body;
  if (!req.file && !link) throw ApiError.badRequest('Attach a file or provide a link');

  const material = await Material.create({
    classroom: req.classroom._id,
    title,
    description,
    uploadedBy: req.user._id,
    ...(req.file
      ? { type: 'file', url: publicUrl(req.file), fileName: req.file.originalname, fileSize: req.file.size }
      : { type: 'link', url: link }),
  });
  res.status(201).json(material);
});

export const deleteMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findOneAndDelete({ _id: req.params.id, classroom: req.classroom._id });
  if (!material) throw ApiError.notFound('Material not found');
  await removeLocalFile(material.url);
  res.status(204).end();
});

/* ----------------------------- Sessions ------------------------------ */

export const listSessions = asyncHandler(async (req, res) => {
  res.json(await Session.find({ classroom: req.classroom._id }).sort('startsAt'));
});

export const createSession = asyncHandler(async (req, res) => {
  requireFields(req.body, ['title', 'startsAt']);
  const { title, description, startsAt, durationMinutes } = req.body;
  // The Meet link is optional when scheduling; the tutor can add it before going live.
  const { meetUrl, byApi } = await resolveMeetUrl(req.body, req.user._id);
  const session = await Session.create({
    classroom: req.classroom._id,
    title,
    description,
    startsAt,
    durationMinutes,
    meetUrl: meetUrl || undefined,
    meetCreatedByApi: byApi,
    createdBy: req.user._id,
  });
  req.app.get('io')?.to(`class:${req.classroom._id}`).emit('session:new', session);
  res.status(201).json(session);
});

export const updateSession = asyncHandler(async (req, res) => {
  const session = await Session.findOne({ _id: req.params.id, classroom: req.classroom._id });
  if (!session) throw ApiError.notFound('Session not found');
  for (const key of ['title', 'description', 'startsAt', 'durationMinutes', 'status']) {
    if (req.body[key] !== undefined) session[key] = req.body[key];
  }
  if (req.body.meetUrl !== undefined || req.body.autoMeet) {
    const { meetUrl, byApi } = await resolveMeetUrl(req.body, req.user._id);
    session.meetUrl = meetUrl || undefined;
    session.meetCreatedByApi = byApi;
  }
  if (session.status === 'live' && !session.meetUrl) throw ApiError.badRequest('Add a Google Meet link before going live');
  await session.save();
  req.app.get('io')?.to(`class:${req.classroom._id}`).emit('session:updated', session);
  res.json(session);
});

export const deleteSession = asyncHandler(async (req, res) => {
  await Session.deleteOne({ _id: req.params.id, classroom: req.classroom._id });
  res.status(204).end();
});

/**
 * Returns the session (with its Google Meet link) and records attendance.
 * The tutor opening a scheduled session that has a link starts it; students can only join live sessions.
 */
export const joinSession = asyncHandler(async (req, res) => {
  const session = await Session.findOne({ _id: req.params.id, classroom: req.classroom._id }).populate('classroom', 'title subject');
  if (!session) throw ApiError.notFound('Session not found');
  if (['ended', 'cancelled'].includes(session.status)) throw ApiError.badRequest(`This session has ${session.status}`);

  if (req.isClassTutor && session.status === 'scheduled' && session.meetUrl) {
    session.status = 'live';
    req.app.get('io')?.to(`class:${req.classroom._id}`).emit('session:updated', session);
  } else if (!req.isClassTutor && session.status !== 'live') {
    throw ApiError.badRequest('The tutor has not started this session yet');
  }

  if (!session.attendees.some((a) => String(a) === String(req.user._id))) session.attendees.push(req.user._id);
  await session.save();
  res.json({ session, isTutor: req.isClassTutor });
});

/* ---------------------------- Assignments ---------------------------- */

export const listAssignments = asyncHandler(async (req, res) => {
  const assignments = await Assignment.find({ classroom: req.classroom._id }).sort('dueDate').lean();
  const ids = assignments.map((a) => a._id);

  if (req.isClassTutor) {
    const counts = await Submission.aggregate([
      { $match: { assignment: { $in: ids } } },
      { $group: { _id: '$assignment', submitted: { $sum: 1 }, graded: { $sum: { $cond: [{ $ifNull: ['$grade', false] }, 1, 0] } } } },
    ]);
    const byId = Object.fromEntries(counts.map((c) => [String(c._id), c]));
    return res.json(
      assignments.map((a) => ({
        ...a,
        submittedCount: byId[a._id]?.submitted ?? 0,
        gradedCount: byId[a._id]?.graded ?? 0,
        studentCount: req.classroom.students.length,
      }))
    );
  }

  const mine = await Submission.find({ assignment: { $in: ids }, student: req.user._id }).lean();
  const byAssignment = Object.fromEntries(mine.map((s) => [String(s.assignment), s]));
  res.json(assignments.map((a) => ({ ...a, mySubmission: byAssignment[a._id] ?? null })));
});

export const createAssignment = asyncHandler(async (req, res) => {
  requireFields(req.body, ['title', 'dueDate']);
  const { title, description, dueDate, maxMarks } = req.body;
  const assignment = await Assignment.create({
    classroom: req.classroom._id,
    title,
    description,
    dueDate,
    maxMarks,
    attachmentUrl: req.file ? publicUrl(req.file) : undefined,
    createdBy: req.user._id,
  });
  req.app.get('io')?.to(`class:${req.classroom._id}`).emit('assignment:new', assignment);
  res.status(201).json(assignment);
});

export const getAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findOne({ _id: req.params.id, classroom: req.classroom._id }).lean();
  if (!assignment) throw ApiError.notFound('Assignment not found');

  if (req.isClassTutor) {
    await req.classroom.populate('students', PEOPLE);
    const submissions = await Submission.find({ assignment: assignment._id }).populate('student', PEOPLE).lean();
    const byStudent = Object.fromEntries(submissions.map((s) => [String(s.student._id), s]));
    // One row per enrolled student so the tutor can see who hasn't submitted.
    const roster = req.classroom.students.map((student) => ({ student, submission: byStudent[student._id] ?? null }));
    return res.json({ assignment, roster, isTutor: true });
  }

  const mySubmission = await Submission.findOne({ assignment: assignment._id, student: req.user._id }).lean();
  res.json({ assignment, mySubmission, isTutor: false });
});

export const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findOneAndDelete({ _id: req.params.id, classroom: req.classroom._id });
  if (!assignment) throw ApiError.notFound('Assignment not found');
  const subs = await Submission.find({ assignment: assignment._id });
  await Promise.all(subs.map((s) => removeLocalFile(s.fileUrl)));
  await Submission.deleteMany({ assignment: assignment._id });
  await removeLocalFile(assignment.attachmentUrl);
  res.status(204).end();
});

export const submitAssignment = asyncHandler(async (req, res) => {
  if (req.isClassTutor) throw ApiError.forbidden('Tutors cannot submit assignments');
  const assignment = await Assignment.findOne({ _id: req.params.id, classroom: req.classroom._id });
  if (!assignment) throw ApiError.notFound('Assignment not found');
  if (!req.file && !req.body.text?.trim()) throw ApiError.badRequest('Add an answer or attach a file');

  const existing = await Submission.findOne({ assignment: assignment._id, student: req.user._id });
  if (existing?.grade !== undefined && existing?.grade !== null) throw ApiError.badRequest('This submission has already been graded');

  const update = {
    text: req.body.text ?? '',
    submittedAt: new Date(),
    isLate: Date.now() > assignment.dueDate.getTime(),
  };
  if (req.file) {
    if (existing?.fileUrl) await removeLocalFile(existing.fileUrl);
    Object.assign(update, { fileUrl: publicUrl(req.file), fileName: req.file.originalname });
  }

  const submission = await Submission.findOneAndUpdate(
    { assignment: assignment._id, student: req.user._id },
    { $set: update },
    { new: true, upsert: true, runValidators: true }
  );
  res.status(existing ? 200 : 201).json(submission);
});

export const gradeSubmission = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findOne({ _id: req.params.id, classroom: req.classroom._id });
  if (!assignment) throw ApiError.notFound('Assignment not found');

  const grade = Number(req.body.grade);
  if (Number.isNaN(grade) || grade < 0 || grade > assignment.maxMarks) {
    throw ApiError.badRequest(`Grade must be between 0 and ${assignment.maxMarks}`);
  }

  const submission = await Submission.findOneAndUpdate(
    { _id: req.params.submissionId, assignment: assignment._id },
    { grade, feedback: req.body.feedback ?? '', gradedAt: new Date() },
    { new: true }
  ).populate('student', PEOPLE);
  if (!submission) throw ApiError.notFound('Submission not found');

  req.app.get('io')?.to(`user:${submission.student._id}`).emit('notify', {
    title: 'Assignment graded',
    body: `${assignment.title}: ${grade}/${assignment.maxMarks}`,
    link: `/classes/${req.classroom._id}/assignments/${assignment._id}`,
  });
  res.json(submission);
});
