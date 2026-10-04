import mongoose from 'mongoose';
import { Booking, Slot, User } from '../models/index.js';
import { ApiError, asyncHandler, requireFields } from '../utils/ApiError.js';

const PEOPLE = 'name email avatarColor subjects isDemo';

/** Tutor: their upcoming slots (booked and open) with who booked them. */
export const mySlots = asyncHandler(async (req, res) => {
  const slots = await Slot.find({ tutor: req.user._id, startsAt: { $gte: new Date(Date.now() - 864e5) } })
    .populate({ path: 'booking', select: 'student status', populate: { path: 'student', select: 'name avatarColor' } })
    .sort('startsAt');
  res.json(slots);
});

/** Tutor: offer one or more times (same subject/duration/price) in one go. */
export const createSlots = asyncHandler(async (req, res) => {
  requireFields(req.body, ['subject']);
  const { subject, durationMinutes = 60, price = 0, note = '' } = req.body;
  const times = (Array.isArray(req.body.startsAt) ? req.body.startsAt : [req.body.startsAt]).filter(Boolean).map((t) => new Date(t));
  if (!times.length) throw ApiError.badRequest('Pick at least one date and time');
  if (times.some((t) => Number.isNaN(t.getTime()) || t < new Date())) throw ApiError.badRequest('Slots must be in the future');
  if (times.length > 20) throw ApiError.badRequest('Add at most 20 slots at a time');

  const slots = await Slot.insertMany(times.map((startsAt) => ({ tutor: req.user._id, subject, startsAt, durationMinutes, price, note })));
  res.status(201).json(slots);
});

/** Tutor: remove an open slot (booked slots must be cancelled from Bookings instead). */
export const deleteSlot = asyncHandler(async (req, res) => {
  const slot = await Slot.findOne({ _id: req.params.id, tutor: req.user._id });
  if (!slot) throw ApiError.notFound('Slot not found');
  if (slot.booking) throw ApiError.badRequest('This slot is already booked. Cancel the booking from 1-on-1 Requests instead.');
  await slot.deleteOne();
  res.status(204).end();
});

/** Anyone signed in: a tutor's open future slots. */
export const tutorSlots = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound('Tutor not found');
  const slots = await Slot.find({ tutor: req.params.id, booking: null, startsAt: { $gt: new Date() } }).sort('startsAt').limit(50);
  res.json(slots);
});

/** Student: book an open slot. Confirmed immediately since the tutor offered that time. */
export const bookSlot = asyncHandler(async (req, res) => {
  const placeholder = new mongoose.Types.ObjectId();
  // Atomically claim the slot so two students can't book the same time.
  const slot = await Slot.findOneAndUpdate(
    { _id: req.params.id, booking: null, startsAt: { $gt: new Date() } },
    { $set: { booking: placeholder } },
    { new: true }
  );
  if (!slot) throw ApiError.badRequest('Sorry, this slot was just booked or is no longer available');

  try {
    const tutor = await User.findById(slot.tutor).select('name isActive');
    if (!tutor?.isActive) throw ApiError.badRequest('This tutor is not available');
    const booking = await Booking.create({
      _id: placeholder,
      tutor: slot.tutor,
      student: req.user._id,
      subject: slot.subject,
      startsAt: slot.startsAt,
      durationMinutes: slot.durationMinutes,
      note: req.body.note ?? '',
      status: 'confirmed',
      slot: slot._id,
    });
    req.app.get('io')?.to(`user:${slot.tutor}`).emit('notify', {
      title: 'Slot booked',
      body: `${req.user.name} booked your ${slot.subject} slot`,
      link: '/bookings',
    });
    res.status(201).json(await booking.populate([{ path: 'tutor', select: PEOPLE }, { path: 'student', select: PEOPLE }]));
  } catch (err) {
    await Slot.updateOne({ _id: slot._id, booking: placeholder }, { $set: { booking: null } }); // release on failure
    throw err;
  }
});
