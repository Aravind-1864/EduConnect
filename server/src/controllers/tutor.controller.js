import mongoose from 'mongoose';
import { User, Booking, Review, Slot } from '../models/index.js';
import { ApiError, asyncHandler, requireFields } from '../utils/ApiError.js';
import { resolveMeetUrl } from '../utils/googleMeet.js';
import { educationLabel, groupFor } from '../utils/catalog.js';

const PEOPLE = 'name email avatarColor subjects isDemo';
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function ratingsFor(tutorIds) {
  const rows = await Review.aggregate([
    { $match: { tutor: { $in: tutorIds } } },
    { $group: { _id: '$tutor', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map((r) => [String(r._id), { rating: Math.round(r.avg * 10) / 10, reviewCount: r.count }]));
}

export const listTutors = asyncHandler(async (req, res) => {
  const filter = { role: 'tutor', isActive: true };
  const q = req.query.q?.trim();
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { subjects: rx }, { bio: rx }];
  }
  const tutors = await User.find(filter).sort({ isDemo: 1, name: 1 }).lean();
  res.json(await withRatings(tutors));
});

async function withRatings(tutors) {
  const ratings = await ratingsFor(tutors.filter((t) => !t.isDemo).map((t) => t._id));
  // eslint-disable-next-line no-unused-vars
  return tutors.map(({ password, __v, audiences, ...t }) => ({ ...t, ...(ratings[t._id] ?? { rating: null, reviewCount: 0 }) }));
}

/**
 * Tutors suggested for the signed-in student's class or branch: demo tutors for that group
 * plus real tutors who teach one of its subjects.
 */
export const tutorsForMe = asyncHandler(async (req, res) => {
  const group = groupFor(req.user.education);
  if (!group) return res.json({ needsEducation: req.user.role === 'student', label: null, subjects: [], tutors: [] });

  const subjectRx = group.subjects.map((s) => new RegExp(`^${escapeRegex(s)}$`, 'i'));
  const tutors = await User.find({
    role: 'tutor',
    isActive: true,
    $or: [{ audiences: group.key }, { isDemo: { $ne: true }, subjects: { $in: subjectRx } }],
  }).lean();

  // Real tutors first, then demo tutors in the group's subject order.
  const order = (t) => (t.isDemo ? group.subjects.findIndex((s) => t.subjects.includes(s)) : -1);
  tutors.sort((a, b) => order(a) - order(b) || a.name.localeCompare(b.name));

  res.json({
    needsEducation: false,
    label: educationLabel(req.user.education),
    groupLabel: group.label,
    subjects: group.subjects,
    tutors: await withRatings(tutors),
  });
});

export const getTutor = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound('Tutor not found');
  const tutor = await User.findOne({ _id: req.params.id, role: 'tutor' });
  if (!tutor) throw ApiError.notFound('Tutor not found');
  const [reviews, ratings] = await Promise.all([
    Review.find({ tutor: tutor._id }).populate('student', 'name avatarColor').sort('-createdAt').limit(30),
    ratingsFor([tutor._id]),
  ]);
  res.json({ tutor, reviews, ...(ratings[tutor._id] ?? { rating: null, reviewCount: 0 }) });
});

export const reviewTutor = asyncHandler(async (req, res) => {
  const rating = Number(req.body.rating);
  if (!(rating >= 1 && rating <= 5)) throw ApiError.badRequest('Rating must be between 1 and 5');
  if (await User.exists({ _id: req.params.id, isDemo: true })) throw ApiError.badRequest('Demo tutors cannot be reviewed');
  // Only students who completed a session with this tutor may review.
  const hadSession = await Booking.exists({ tutor: req.params.id, student: req.user._id, status: { $in: ['confirmed', 'completed'] } });
  if (!hadSession) throw ApiError.forbidden('You can review a tutor after a confirmed session with them');

  const review = await Review.findOneAndUpdate(
    { tutor: req.params.id, student: req.user._id },
    { rating, comment: req.body.comment ?? '' },
    { new: true, upsert: true }
  );
  res.status(201).json(review);
});

/* ------------------------------ Bookings ----------------------------- */

export const listBookings = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'tutor' ? { tutor: req.user._id } : { student: req.user._id };
  const bookings = await Booking.find(filter).populate('tutor', PEOPLE).populate('student', PEOPLE).sort('-startsAt');
  res.json(bookings);
});

export const createBooking = asyncHandler(async (req, res) => {
  requireFields(req.body, ['tutorId', 'subject', 'startsAt']);
  const { tutorId, subject, startsAt, durationMinutes, note } = req.body;
  if (new Date(startsAt) < new Date()) throw ApiError.badRequest('Pick a time in the future');
  const tutor = await User.findOne({ _id: tutorId, role: 'tutor', isActive: true });
  if (!tutor) throw ApiError.notFound('Tutor not found');

  // Demo tutors confirm instantly so students can try the whole flow.
  const booking = await Booking.create({
    tutor: tutor._id,
    student: req.user._id,
    subject,
    startsAt,
    durationMinutes,
    note,
    status: tutor.isDemo ? 'confirmed' : 'pending',
  });
  if (!tutor.isDemo) {
    req.app.get('io')?.to(`user:${tutor._id}`).emit('notify', {
      title: 'New booking request',
      body: `${req.user.name} requested a ${subject} session`,
      link: '/bookings',
    });
  }
  res.status(201).json(await booking.populate([{ path: 'tutor', select: PEOPLE }, { path: 'student', select: PEOPLE }]));
});

/** Google Meet details for a confirmed 1-on-1 booking (tutor or student only). */
export const joinBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate([{ path: 'tutor', select: PEOPLE }, { path: 'student', select: PEOPLE }]);
  if (!booking) throw ApiError.notFound('Booking not found');
  const isTutor = String(booking.tutor._id) === String(req.user._id);
  if (!isTutor && String(booking.student._id) !== String(req.user._id)) throw ApiError.forbidden();
  if (booking.status !== 'confirmed') throw ApiError.badRequest('Only confirmed bookings can be joined');
  res.json({ booking, isTutor });
});

/** Tutor sets or replaces the Meet link of a confirmed booking (pasted, or auto-created). */
export const setBookingMeet = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (String(booking.tutor) !== String(req.user._id)) throw ApiError.forbidden('Only the tutor can set the meeting link');
  const { meetUrl } = await resolveMeetUrl(req.body, req.user._id);
  if (!meetUrl) throw ApiError.badRequest('Paste a Google Meet link or create one automatically');
  booking.meetUrl = meetUrl;
  await booking.save();
  req.app.get('io')?.to(`user:${booking.student}`).emit('notify', {
    title: 'Meeting link ready',
    body: `Your ${booking.subject} session now has a Google Meet link`,
    link: '/bookings',
  });
  res.json(await booking.populate([{ path: 'tutor', select: PEOPLE }, { path: 'student', select: PEOPLE }]));
});

const TRANSITIONS = {
  tutor: { pending: ['confirmed', 'declined'], confirmed: ['completed', 'cancelled'] },
  student: { pending: ['cancelled'], confirmed: ['cancelled'] },
};

export const updateBookingStatus = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Booking not found');

  const isTutor = String(booking.tutor) === String(req.user._id);
  const isStudent = String(booking.student) === String(req.user._id);
  if (!isTutor && !isStudent) throw ApiError.forbidden();

  const allowed = TRANSITIONS[isTutor ? 'tutor' : 'student'][booking.status] ?? [];
  if (!allowed.includes(req.body.status)) throw ApiError.badRequest(`Cannot change a ${booking.status} booking to ${req.body.status}`);

  booking.status = req.body.status;
  if (booking.status === 'confirmed') {
    // Accepting may include a Meet link (pasted or auto-created); it can also be added later.
    const { meetUrl } = await resolveMeetUrl(req.body, req.user._id);
    if (meetUrl) booking.meetUrl = meetUrl;
  }
  await booking.save();
  // A cancelled/declined slot booking frees the slot for other students (if it is still in the future).
  if (booking.slot && ['cancelled', 'declined'].includes(booking.status)) {
    await Slot.updateOne({ _id: booking.slot, booking: booking._id, startsAt: { $gt: new Date() } }, { $set: { booking: null } });
  }

  const otherParty = isTutor ? booking.student : booking.tutor;
  req.app.get('io')?.to(`user:${otherParty}`).emit('notify', {
    title: 'Booking updated',
    body: `Your ${booking.subject} session is now ${booking.status}`,
    link: '/bookings',
  });
  res.json(await booking.populate([{ path: 'tutor', select: PEOPLE }, { path: 'student', select: PEOPLE }]));
});
