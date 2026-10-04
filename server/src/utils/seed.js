import { fileURLToPath } from 'node:url';
import {
  User, Classroom, Session, Material, Assignment, Submission, Message, Announcement, Booking, Review,
} from '../models/index.js';

export const DEMO_PASSWORD = 'password123';

const hours = (h) => new Date(Date.now() + h * 60 * 60 * 1000);
const days = (d) => hours(d * 24);

/** Wipes all collections and inserts a realistic demo dataset. */
export async function seedDemoData() {
  await Promise.all([User, Classroom, Session, Material, Assignment, Submission, Message, Announcement, Booking, Review].map((m) => m.deleteMany({})));

  const mk = (data) => User.create({ password: DEMO_PASSWORD, ...data });
  const admin = await mk({ name: 'Admin', email: 'admin@educonnect.dev', role: 'admin', avatarColor: '#0f172a' });
  const kumar = await mk({
    name: 'Ravi Kumar', email: 'tutor@educonnect.dev', role: 'tutor', avatarColor: '#4f46e5', hourlyRate: 500,
    subjects: ['Mathematics', 'Calculus'], bio: '10+ years teaching high-school and engineering mathematics. I focus on intuition first, formulas second.',
  });
  const rao = await mk({
    name: 'Meera Rao', email: 'meera@educonnect.dev', role: 'tutor', avatarColor: '#16a34a', hourlyRate: 450,
    subjects: ['Physics', 'Chemistry'], bio: 'M.Sc Physics. I love turning tough concepts into simple experiments you can do at home.',
  });
  const thomas = await mk({
    name: 'Anita Thomas', email: 'anita@educonnect.dev', role: 'tutor', avatarColor: '#db2777', hourlyRate: 400,
    subjects: ['English', 'Communication'], bio: 'Cambridge-certified English trainer. Essays, grammar and spoken English.',
  });
  const anu = await mk({ name: 'Anu Sharma', email: 'student@educonnect.dev', role: 'student', avatarColor: '#d97706' });
  const others = await Promise.all(
    [['Rahul Verma', '#0891b2'], ['Priya Nair', '#7c3aed'], ['Karthik R', '#dc2626'], ['Sneha Iyer', '#16a34a']].map(([name, avatarColor], i) =>
      mk({ name, email: `student${i + 2}@educonnect.dev`, role: 'student', avatarColor })
    )
  );
  const students = [anu, ...others];
  const ids = (list) => list.map((s) => s._id);

  const math = await Classroom.create({
    title: 'Mathematics - Grade 10', subject: 'Mathematics', tutor: kumar._id, students: ids(students), code: '10101', color: '#6366f1',
    description: 'Full CBSE Grade 10 syllabus: real numbers, polynomials, quadratic equations, trigonometry and statistics.',
  });
  const physics = await Classroom.create({
    title: 'Physics Fundamentals', subject: 'Physics', tutor: rao._id, students: ids(students.slice(0, 4)), code: '20202', color: '#16a34a',
    description: 'Motion, force, work & energy, and light - with weekly hands-on demos.',
  });
  const english = await Classroom.create({
    title: 'English Writing Workshop', subject: 'English', tutor: thomas._id, students: ids([anu, others[1], others[3]]), code: '30303', color: '#d97706',
    description: 'Learn to write clear essays, letters and reports.',
  });

  await Session.create([
    { classroom: math._id, title: 'Quadratic Equations - Live Problem Solving', startsAt: hours(2), durationMinutes: 60, createdBy: kumar._id },
    { classroom: math._id, title: 'Introduction to Trigonometry', startsAt: days(2), durationMinutes: 60, createdBy: kumar._id },
    { classroom: math._id, title: 'Polynomials Recap', startsAt: days(-3), durationMinutes: 45, status: 'ended', createdBy: kumar._id, attendees: ids(students.slice(0, 3)) },
    { classroom: physics._id, title: 'Laws of Motion', startsAt: days(1), durationMinutes: 50, createdBy: rao._id },
    { classroom: english._id, title: 'Essay Structure Masterclass', startsAt: days(3), durationMinutes: 60, createdBy: thomas._id },
  ]);

  await Material.create([
    { classroom: math._id, title: 'NCERT Class 10 Maths Textbook', type: 'link', url: 'https://ncert.nic.in/textbook.php?jemh1=0-15', uploadedBy: kumar._id, description: 'Official textbook - all chapters.' },
    { classroom: math._id, title: 'Khan Academy - Quadratic Equations', type: 'link', url: 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:quadratic-functions-equations', uploadedBy: kumar._id },
    { classroom: physics._id, title: 'PhET Interactive Simulations', type: 'link', url: 'https://phet.colorado.edu/', uploadedBy: rao._id, description: 'Play with the forces & motion simulations before class.' },
    { classroom: english._id, title: 'Purdue OWL - Essay Writing', type: 'link', url: 'https://owl.purdue.edu/owl/general_writing/academic_writing/essay_writing/index.html', uploadedBy: thomas._id },
  ]);

  const [algebra, trig, polyQuiz] = await Assignment.create([
    { classroom: math._id, title: 'Algebra Worksheet', description: 'Solve all 10 problems. Show every step.', dueDate: days(1), maxMarks: 20, createdBy: kumar._id },
    { classroom: math._id, title: 'Trigonometry Practice Set', description: 'Questions 1-15 from exercise 8.1.', dueDate: days(6), maxMarks: 30, createdBy: kumar._id },
    { classroom: math._id, title: 'Polynomials Quiz', description: 'Short written quiz on zeroes of polynomials.', dueDate: days(-2), maxMarks: 10, createdBy: kumar._id },
  ]);
  const lab = await Assignment.create({ classroom: physics._id, title: 'Physics Lab Report', description: 'Write up the pendulum experiment.', dueDate: days(4), maxMarks: 25, createdBy: rao._id });
  await Assignment.create({ classroom: english._id, title: 'Persuasive Essay', description: '600 words: "Should homework be banned?"', dueDate: days(7), maxMarks: 50, createdBy: thomas._id });

  await Submission.create([
    { assignment: polyQuiz._id, student: anu._id, text: 'Answers: 1) -2, 3  2) 1/2 ...', submittedAt: days(-3), grade: 9, feedback: 'Excellent work!', gradedAt: days(-2) },
    { assignment: polyQuiz._id, student: others[0]._id, text: 'My answers are attached in text.', submittedAt: days(-3), grade: 7, feedback: 'Recheck Q3.', gradedAt: days(-2) },
    { assignment: algebra._id, student: others[0]._id, text: 'Q1: x = 4 ...', submittedAt: hours(-5) },
    { assignment: algebra._id, student: others[1]._id, text: 'Solutions for all 10 questions.', submittedAt: hours(-2) },
    { assignment: lab._id, student: anu._id, text: 'Period T was proportional to sqrt(L) ...', submittedAt: hours(-20), grade: 21, feedback: 'Great analysis, add error bars next time.', gradedAt: hours(-4) },
  ]);
  void trig;

  await Announcement.create([
    { classroom: math._id, author: kumar._id, text: 'Welcome to Grade 10 Maths! Please go through the NCERT link in Materials before our first live class.' },
    { classroom: physics._id, author: rao._id, text: 'Bring a string and a small weight to tomorrow\'s session - we will build a pendulum.' },
  ]);

  await Message.create([
    { classroom: math._id, sender: kumar._id, text: 'Hi everyone! Live class starts in 2 hours.', createdAt: hours(-0.3) },
    { classroom: math._id, sender: anu._id, text: 'Will it be recorded, sir?', createdAt: hours(-0.2) },
    { classroom: math._id, sender: kumar._id, text: 'Yes, I will share the notes after class.', createdAt: hours(-0.1) },
  ]);

  await Booking.create([
    { tutor: kumar._id, student: anu._id, subject: 'Calculus', startsAt: days(2), note: 'Need help with limits.', status: 'confirmed' },
    { tutor: kumar._id, student: others[2]._id, subject: 'Mathematics', startsAt: days(3), note: 'Exam prep.' },
    { tutor: rao._id, student: anu._id, subject: 'Physics', startsAt: days(-5), status: 'completed' },
  ]);

  await Review.create([
    { tutor: rao._id, student: anu._id, rating: 5, comment: 'Explains concepts so clearly!' },
    { tutor: kumar._id, student: others[0]._id, rating: 4, comment: 'Very patient teacher.' },
    { tutor: kumar._id, student: anu._id, rating: 5, comment: 'Best maths tutor I have had.' },
  ]);

  void admin;
  console.log(`[seed] demo data ready - log in with student@ / tutor@ / admin@educonnect.dev, password "${DEMO_PASSWORD}"`);
}

// Allow `npm run seed` to seed a real database configured via MONGO_URI.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { connectDB, disconnectDB } = await import('../config/db.js');
  await connectDB();
  await seedDemoData();
  await disconnectDB();
}
