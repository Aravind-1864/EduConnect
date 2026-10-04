import { Classroom, Announcement, Assignment, Material, Session, Submission, Message } from '../models/index.js';
import { ApiError, asyncHandler, requireFields } from '../utils/ApiError.js';
import { resolveMeetUrl } from '../utils/googleMeet.js';
import { meetLinkMessage, postClassMessage } from '../utils/chat.js';
import { CLASS_CODE_RE, cleanClassCode } from '../utils/codes.js';
import { publicUrl } from '../middleware/upload.js';

const PEOPLE = 'name email role avatarColor';

export const listMyClasses = asyncHandler(async (req, res) => {
  const filter =
    req.user.role === 'admin' ? {} : req.user.role === 'tutor' ? { tutor: req.user._id } : { students: req.user._id };
  const classes = await Classroom.find({ ...filter, archived: false }).populate('tutor', PEOPLE).sort('-createdAt').lean();
  const isStudent = req.user.role === 'student';
  res.json(classes.map((c) => ({ ...c, studentCount: c.students.length, students: undefined, code: isStudent ? undefined : c.code })));
});

export const createClass = asyncHandler(async (req, res) => {
  requireFields(req.body, ['title']);
  const { title, subject, description } = req.body;
  const { meetUrl } = await resolveMeetUrl(req.body, req.user._id);
  const classroom = await Classroom.create({ title, subject, description, meetUrl: meetUrl || undefined, tutor: req.user._id });
  if (meetUrl) await postClassMessage(req.app, classroom._id, req.user._id, meetLinkMessage(meetUrl));
  res.status(201).json(classroom);
});

export const joinClass = asyncHandler(async (req, res) => {
  const code = cleanClassCode(req.body.code);
  if (!CLASS_CODE_RE.test(code)) throw ApiError.badRequest('Enter the 5-digit classroom code');
  const classroom = await Classroom.findOne({ code, archived: false });
  if (!classroom) throw ApiError.notFound('No classroom found with that code');
  if (classroom.hasMember(req.user._id)) throw ApiError.conflict('You are already in this class');
  classroom.students.push(req.user._id);
  await classroom.save();
  res.json(classroom);
});

export const getClass = asyncHandler(async (req, res) => {
  await req.classroom.populate([
    { path: 'tutor', select: PEOPLE },
    { path: 'students', select: PEOPLE },
  ]);
  const data = req.classroom.toObject();
  // Only the tutor needs to see/share the join code.
  if (!req.isClassTutor) delete data.code;
  res.json({ ...data, isTutor: req.isClassTutor });
});

export const updateClass = asyncHandler(async (req, res) => {
  for (const key of ['title', 'subject', 'description', 'archived']) {
    if (req.body[key] !== undefined) req.classroom[key] = req.body[key];
  }
  let newLink = '';
  if (req.body.meetUrl !== undefined || req.body.autoMeet) {
    const { meetUrl } = await resolveMeetUrl(req.body, req.user._id);
    if (meetUrl && meetUrl !== req.classroom.meetUrl) newLink = meetUrl;
    req.classroom.meetUrl = meetUrl || undefined;
  }
  await req.classroom.save();
  // Share a new/changed link with the class in chat.
  if (newLink) await postClassMessage(req.app, req.classroom._id, req.user._id, meetLinkMessage(newLink));
  res.json(req.classroom);
});

export const deleteClass = asyncHandler(async (req, res) => {
  const id = req.classroom._id;
  const assignments = await Assignment.find({ classroom: id }).distinct('_id');
  await Promise.all([
    Submission.deleteMany({ assignment: { $in: assignments } }),
    Assignment.deleteMany({ classroom: id }),
    Material.deleteMany({ classroom: id }),
    Session.deleteMany({ classroom: id }),
    Message.deleteMany({ classroom: id }),
    Announcement.deleteMany({ classroom: id }),
  ]);
  await req.classroom.deleteOne();
  res.status(204).end();
});

/** Tutor removes a student, or a student leaves the class themselves. */
export const removeStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  if (!req.isClassTutor && String(req.user._id) !== studentId) throw ApiError.forbidden();
  req.classroom.students = req.classroom.students.filter((s) => String(s) !== studentId);
  await req.classroom.save();
  res.status(204).end();
});

export const regenerateCode = asyncHandler(async (req, res) => {
  req.classroom.code = undefined;
  await req.classroom.save();
  res.json({ code: req.classroom.code });
});

export const listAnnouncements = asyncHandler(async (req, res) => {
  const items = await Announcement.find({ classroom: req.classroom._id }).populate('author', PEOPLE).sort('-createdAt').limit(50);
  res.json(items);
});

export const createAnnouncement = asyncHandler(async (req, res) => {
  requireFields(req.body, ['text']);
  const item = await Announcement.create({ classroom: req.classroom._id, author: req.user._id, text: req.body.text });
  await item.populate('author', PEOPLE);
  req.app.get('io')?.to(`class:${req.classroom._id}`).emit('announcement:new', item);
  res.status(201).json(item);
});

export const deleteAnnouncement = asyncHandler(async (req, res) => {
  await Announcement.deleteOne({ _id: req.params.id, classroom: req.classroom._id });
  res.status(204).end();
});

export const listMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find({ classroom: req.classroom._id }).populate('sender', PEOPLE).sort({ createdAt: -1, _id: -1 }).limit(100);
  res.json(messages.reverse());
});

/** Sends a chat message with a file attachment (text optional). Text-only messages go through Socket.io. */
export const sendAttachment = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('Choose a file to send');
  const message = await Message.create({
    classroom: req.classroom._id,
    sender: req.user._id,
    text: String(req.body.text ?? '').trim().slice(0, 2000),
    fileUrl: publicUrl(req.file),
    fileName: req.file.originalname,
    fileSize: req.file.size,
  });
  await message.populate('sender', PEOPLE);
  req.app.get('io')?.to(`class:${req.classroom._id}`).emit('chat:message', message);
  res.status(201).json(message);
});
