import { Classroom, Session, Assignment, Submission, Booking, User, Material } from '../models/index.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';

const now = () => new Date();

export const dashboard = asyncHandler(async (req, res) => {
  const { user } = req;
  const classFilter = user.role === 'tutor' ? { tutor: user._id } : { students: user._id };
  const classes = await Classroom.find({ ...classFilter, archived: false }).populate('tutor', 'name').lean();
  const classIds = classes.map((c) => c._id);

  const upcomingSessions = await Session.find({
    classroom: { $in: classIds },
    status: { $in: ['scheduled', 'live'] },
    startsAt: { $gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
  })
    .populate('classroom', 'title subject color')
    .sort('startsAt')
    .limit(6);

  const bookings = await Booking.find({
    [user.role === 'tutor' ? 'tutor' : 'student']: user._id,
    status: { $in: ['pending', 'confirmed'] },
    startsAt: { $gte: now() },
  })
    .populate('tutor student', 'name avatarColor')
    .sort('startsAt')
    .limit(5);

  const classCards = classes.map((c) => ({
    ...c,
    studentCount: c.students.length,
    students: undefined,
    code: user.role === 'tutor' ? c.code : undefined,
  }));

  if (user.role === 'tutor') {
    const assignments = await Assignment.find({ classroom: { $in: classIds } }).select('_id').lean();
    const toGrade = await Submission.find({ assignment: { $in: assignments.map((a) => a._id) }, grade: { $exists: false } })
      .populate('student', 'name avatarColor')
      .populate({ path: 'assignment', select: 'title classroom', populate: { path: 'classroom', select: 'title' } })
      .sort('submittedAt')
      .limit(8);
    const totalStudents = new Set(classes.flatMap((c) => c.students.map(String))).size;
    return res.json({
      stats: {
        classes: classes.length,
        students: totalStudents,
        toGrade: toGrade.length,
        pendingBookings: bookings.filter((b) => b.status === 'pending').length,
      },
      classes: classCards,
      upcomingSessions,
      bookings,
      toGrade,
    });
  }

  const assignments = await Assignment.find({ classroom: { $in: classIds } }).populate('classroom', 'title color').sort('dueDate').lean();
  const mySubs = await Submission.find({ student: user._id, assignment: { $in: assignments.map((a) => a._id) } }).lean();
  const subByAssignment = Object.fromEntries(mySubs.map((s) => [String(s.assignment), s]));

  const pending = assignments.filter((a) => !subByAssignment[a._id]);
  const graded = mySubs.filter((s) => s.grade !== undefined && s.grade !== null);
  const maxByAssignment = Object.fromEntries(assignments.map((a) => [String(a._id), a.maxMarks]));
  const avg = graded.length
    ? Math.round((graded.reduce((sum, s) => sum + s.grade / maxByAssignment[s.assignment], 0) / graded.length) * 100)
    : null;

  const recentGrades = graded
    .sort((a, b) => b.gradedAt - a.gradedAt)
    .slice(0, 5)
    .map((s) => {
      const a = assignments.find((x) => String(x._id) === String(s.assignment));
      return { ...s, assignment: { _id: a._id, title: a.title, maxMarks: a.maxMarks, classroom: a.classroom } };
    });

  res.json({
    stats: { classes: classes.length, pendingAssignments: pending.length, upcomingSessions: upcomingSessions.length, averageGrade: avg },
    classes: classCards,
    upcomingSessions,
    pendingAssignments: pending.slice(0, 6),
    recentGrades,
    bookings,
  });
});

/* -------------------------------- Admin ------------------------------- */

export const adminStats = asyncHandler(async (_req, res) => {
  const [students, tutors, classes, sessions, assignments, submissions, materials, bookings] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'tutor' }),
    Classroom.countDocuments(),
    Session.countDocuments(),
    Assignment.countDocuments(),
    Submission.countDocuments(),
    Material.countDocuments(),
    Booking.countDocuments(),
  ]);
  const recentClasses = await Classroom.find().populate('tutor', 'name').sort('-createdAt').limit(8).lean();
  res.json({
    counts: { students, tutors, classes, sessions, assignments, submissions, materials, bookings },
    recentClasses: recentClasses.map((c) => ({ ...c, studentCount: c.students.length, students: undefined })),
  });
});

export const adminListUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.q) {
    const rx = new RegExp(req.query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }
  res.json(await User.find(filter).sort('-createdAt').limit(200));
});

export const adminUpdateUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) throw ApiError.badRequest('You cannot change your own admin account here');
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  if (req.body.isActive !== undefined) user.isActive = Boolean(req.body.isActive);
  if (req.body.role && ['student', 'tutor', 'admin'].includes(req.body.role)) user.role = req.body.role;
  await user.save();
  res.json(user);
});

/* ------------------------------ Calendar ------------------------------ */

/** Sessions, assignment due dates and 1-on-1 bookings for the user, within ±90 days. */
export const calendar = asyncHandler(async (req, res) => {
  const { user } = req;
  const from = new Date(Date.now() - 90 * 864e5);
  const to = new Date(Date.now() + 90 * 864e5);
  const classFilter =
    user.role === 'admin' ? {} : user.role === 'tutor' ? { tutor: user._id } : { students: user._id };
  const classes = await Classroom.find({ ...classFilter, archived: false }).select('title color').lean();
  const classIds = classes.map((c) => c._id);
  const classById = Object.fromEntries(classes.map((c) => [String(c._id), c]));

  const [sessions, assignments, bookings] = await Promise.all([
    Session.find({ classroom: { $in: classIds }, status: { $ne: 'cancelled' }, startsAt: { $gte: from, $lte: to } }).lean(),
    Assignment.find({ classroom: { $in: classIds }, dueDate: { $gte: from, $lte: to } }).lean(),
    Booking.find({
      [user.role === 'tutor' ? 'tutor' : 'student']: user._id,
      status: { $in: ['pending', 'confirmed', 'completed'] },
      startsAt: { $gte: from, $lte: to },
    })
      .populate('tutor student', 'name')
      .lean(),
  ]);

  const events = [
    ...sessions.map((s) => {
      const c = classById[String(s.classroom)];
      return {
        id: String(s._id), type: 'session', title: s.title, start: s.startsAt, durationMinutes: s.durationMinutes,
        status: s.status, color: c.color, subtitle: c.title, link: `/classes/${c._id}?tab=sessions`,
      };
    }),
    ...assignments.map((a) => {
      const c = classById[String(a.classroom)];
      return {
        id: String(a._id), type: 'assignment', title: a.title, start: a.dueDate, color: c.color,
        subtitle: `${c.title} · due`, link: `/classes/${c._id}/assignments/${a._id}`,
      };
    }),
    ...bookings.map((b) => ({
      id: String(b._id), type: 'booking', title: `${b.subject} 1-on-1`, start: b.startsAt, durationMinutes: b.durationMinutes,
      status: b.status, color: '#db2777', subtitle: `with ${user.role === 'tutor' ? b.student.name : b.tutor.name}`, link: '/bookings',
    })),
  ].sort((a, b) => new Date(a.start) - new Date(b.start));

  res.json(events);
});

/* ------------------------------- Grades ------------------------------- */

/** All of a student's submissions with grades, grouped per class. */
export const myGrades = asyncHandler(async (req, res) => {
  const classes = await Classroom.find({ students: req.user._id }).select('title subject color').lean();
  const assignments = await Assignment.find({ classroom: { $in: classes.map((c) => c._id) } }).sort('dueDate').lean();
  const subs = await Submission.find({ student: req.user._id, assignment: { $in: assignments.map((a) => a._id) } }).lean();
  const subByAssignment = Object.fromEntries(subs.map((s) => [String(s.assignment), s]));

  const result = classes.map((c) => {
    const items = assignments
      .filter((a) => String(a.classroom) === String(c._id))
      .map((a) => {
        const s = subByAssignment[String(a._id)];
        const graded = s && s.grade !== undefined && s.grade !== null;
        return {
          _id: a._id, title: a.title, dueDate: a.dueDate, maxMarks: a.maxMarks,
          status: graded ? 'graded' : s ? 'submitted' : a.dueDate < new Date() ? 'missing' : 'pending',
          grade: graded ? s.grade : null, feedback: s?.feedback ?? '', percent: graded ? Math.round((s.grade / a.maxMarks) * 100) : null,
        };
      });
    const graded = items.filter((i) => i.percent !== null);
    const average = graded.length ? Math.round(graded.reduce((sum, i) => sum + i.percent, 0) / graded.length) : null;
    return { classroom: c, items, average };
  });

  const allGraded = result.flatMap((r) => r.items.filter((i) => i.percent !== null));
  res.json({
    overall: allGraded.length ? Math.round(allGraded.reduce((s, i) => s + i.percent, 0) / allGraded.length) : null,
    gradedCount: allGraded.length,
    classes: result,
  });
});
