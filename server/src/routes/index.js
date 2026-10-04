import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { protect, allow, loadClassroom, tutorOnly } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import * as auth from '../controllers/auth.controller.js';
import * as cls from '../controllers/class.controller.js';
import * as content from '../controllers/content.controller.js';
import * as tutors from '../controllers/tutor.controller.js';
import * as dash from '../controllers/dashboard.controller.js';
import * as google from '../controllers/google.controller.js';
import * as slots from '../controllers/slot.controller.js';

const router = Router();

/* -------------------------------- Auth -------------------------------- */
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false });
router.post('/auth/register', authLimiter, auth.register);
router.post('/auth/login', authLimiter, auth.login);
router.get('/auth/me', protect, auth.me);
router.patch('/auth/me', protect, auth.updateMe);

// Google redirects here after sign-in (no bearer token on a browser redirect; the signed `state` identifies the user).
router.get('/google/callback', google.callback);

router.use(protect);

router.get('/dashboard', dash.dashboard);
router.get('/calendar', dash.calendar);
router.get('/grades', allow('student'), dash.myGrades);

/* ------------------------------- Classes ------------------------------ */
router.get('/classes', cls.listMyClasses);
router.post('/classes', allow('tutor', 'admin'), cls.createClass);
router.post('/classes/join', allow('student'), cls.joinClass);
router.post('/meets/join', content.joinMeetByCode);

const c = Router({ mergeParams: true });
router.use('/classes/:classId', loadClassroom(), c);

c.get('/', cls.getClass);
c.patch('/', tutorOnly, cls.updateClass);
c.delete('/', tutorOnly, cls.deleteClass);
c.post('/code', tutorOnly, cls.regenerateCode);
c.delete('/students/:studentId', cls.removeStudent);

c.get('/announcements', cls.listAnnouncements);
c.post('/announcements', tutorOnly, cls.createAnnouncement);
c.delete('/announcements/:id', tutorOnly, cls.deleteAnnouncement);

c.get('/messages', cls.listMessages);

c.get('/materials', content.listMaterials);
c.post('/materials', tutorOnly, upload.single('file'), content.createMaterial);
c.delete('/materials/:id', tutorOnly, content.deleteMaterial);

c.get('/sessions', content.listSessions);
c.post('/sessions', tutorOnly, content.createSession);
c.patch('/sessions/:id', tutorOnly, content.updateSession);
c.delete('/sessions/:id', tutorOnly, content.deleteSession);
c.post('/sessions/:id/join', content.joinSession);

c.get('/assignments', content.listAssignments);
c.post('/assignments', tutorOnly, upload.single('file'), content.createAssignment);
c.get('/assignments/:id', content.getAssignment);
c.delete('/assignments/:id', tutorOnly, content.deleteAssignment);
c.post('/assignments/:id/submit', upload.single('file'), content.submitAssignment);
c.patch('/assignments/:id/submissions/:submissionId', tutorOnly, content.gradeSubmission);

/* --------------------------- Tutors & bookings ------------------------ */
// Browsing and booking tutors is for students (admins can view for management).
router.get('/tutors', allow('student', 'admin'), tutors.listTutors);
router.get('/tutors/for-me', allow('student'), tutors.tutorsForMe);
router.get('/tutors/:id', allow('student', 'admin'), tutors.getTutor);
router.get('/tutors/:id/slots', allow('student', 'admin'), slots.tutorSlots);

/* ------------------------- Tutor availability ------------------------ */
router.get('/slots/mine', allow('tutor'), slots.mySlots);
router.post('/slots', allow('tutor'), slots.createSlots);
router.delete('/slots/:id', allow('tutor'), slots.deleteSlot);
router.post('/slots/:id/book', allow('student'), slots.bookSlot);
router.post('/tutors/:id/reviews', allow('student'), tutors.reviewTutor);

router.get('/bookings', tutors.listBookings);
router.post('/bookings', allow('student'), tutors.createBooking);
router.patch('/bookings/:id', tutors.updateBookingStatus);
router.get('/bookings/:id/join', tutors.joinBooking);
router.patch('/bookings/:id/meet', allow('tutor'), tutors.setBookingMeet);

/* --------------------------- Google Meet ----------------------------- */
router.get('/google/status', google.status);
router.get('/google/auth-url', allow('tutor', 'admin'), google.authUrl);
router.delete('/google', google.disconnectGoogle);

/* -------------------------------- Admin ------------------------------- */
router.get('/admin/stats', allow('admin'), dash.adminStats);
router.get('/admin/users', allow('admin'), dash.adminListUsers);
router.patch('/admin/users/:id', allow('admin'), dash.adminUpdateUser);

export default router;
