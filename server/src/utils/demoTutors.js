import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { GROUPS } from './catalog.js';

/*
 * Sample tutors so every student sees relevant tutors from day one.
 * They are clearly flagged (isDemo) in the UI, have no reviews, and nobody can log in as them.
 */

const FIRST = ['Aarav', 'Ananya', 'Rohan', 'Priya', 'Vikram', 'Sneha', 'Arjun', 'Kavya', 'Rahul', 'Meera', 'Karthik', 'Divya', 'Siddharth', 'Pooja', 'Aditya', 'Lakshmi', 'Nikhil', 'Shreya', 'Varun', 'Neha', 'Harsha', 'Ishita', 'Manoj', 'Swathi', 'Rajesh', 'Anjali', 'Suresh', 'Deepika', 'Kiran', 'Bhavana', 'Teja', 'Ritika', 'Sandeep', 'Nandini', 'Ajay', 'Keerthi', 'Gaurav', 'Pallavi', 'Vamsi', 'Tanvi'];
const LAST = ['Sharma', 'Reddy', 'Iyer', 'Nair', 'Gupta', 'Rao', 'Menon', 'Patel', 'Verma', 'Kulkarni', 'Joshi', 'Pillai', 'Das', 'Bose', 'Chopra', 'Naidu', 'Mishra', 'Kapoor', 'Varma', 'Singh'];
const COLORS = ['#4f46e5', '#16a34a', '#d97706', '#db2777', '#0891b2', '#7c3aed', '#dc2626', '#0d9488', '#ea580c', '#2563eb'];

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function bioFor(group, subject, years) {
  if (group.key.startsWith('school')) {
    return `${subject} teacher for ${group.label} with ${years} years of experience. I explain every concept step by step with simple examples, regular practice and doubt-clearing sessions before exams.`;
  }
  return `${subject} mentor for ${group.label} students with ${years} years of teaching and industry experience. Concept-first classes, hands-on practice and help with lab work, projects and semester exams.`;
}

/** Inserts any missing demo tutors. Cheap no-op once they exist. */
export async function ensureDemoTutors() {
  const wanted = [];
  let i = 0;
  for (const group of GROUPS) {
    for (const subject of group.subjects) {
      const years = 3 + (i % 9);
      const school = group.key.startsWith('school');
      wanted.push({
        email: `demo-${slug(group.key)}-${slug(subject)}@educonnect.demo`,
        name: `${FIRST[i % FIRST.length]} ${LAST[(i * 7) % LAST.length]}`,
        role: 'tutor',
        isDemo: true,
        audiences: [group.key],
        subjects: [subject],
        bio: bioFor(group, subject, years),
        hourlyRate: school ? 250 + (i % 5) * 50 : 500 + (i % 6) * 100,
        avatarColor: COLORS[i % COLORS.length],
      });
      i += 1;
    }
  }

  const existing = new Set((await User.find({ email: { $in: wanted.map((w) => w.email) } }).select('email').lean()).map((u) => u.email));
  const missing = wanted.filter((w) => !existing.has(w.email));
  if (!missing.length) return;

  // One random, never-shared password hash: nobody can sign in as a demo tutor.
  const password = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
  await User.insertMany(missing.map((m) => ({ ...m, password })));
  console.log(`[demo] added ${missing.length} demo tutors`);
}
