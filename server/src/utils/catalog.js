/**
 * Education levels students choose at sign-up, and the subjects tutors are offered for each.
 * A student maps to one "group" (e.g. school:6-8 or btech:CSE).
 */

export const SCHOOL_GRADES = Array.from({ length: 12 }, (_, i) => i + 1);

export const BTECH_BRANCHES = {
  CSE: 'Computer Science & Engineering',
  CSM: 'CSE (AI & Machine Learning)',
  'CS-DS': 'CSE (Data Science)',
  'CS-CS': 'CSE (Cyber Security)',
  Civil: 'Civil Engineering',
  Mech: 'Mechanical Engineering',
  ECE: 'Electronics & Communication Engineering',
  EEE: 'Electrical & Electronics Engineering',
};

const SCHOOL_BANDS = [
  { key: 'school:1-5', from: 1, to: 5, subjects: ['Maths', 'English', 'EVS', 'Hindi', 'Science', 'Computers'] },
  { key: 'school:6-8', from: 6, to: 8, subjects: ['Maths', 'Physics', 'Chemistry', 'Biology', 'English', 'Social Studies'] },
  { key: 'school:9-10', from: 9, to: 10, subjects: ['Maths', 'Physics', 'Chemistry', 'Biology', 'English', 'Social Studies'] },
  { key: 'school:11-12', from: 11, to: 12, subjects: ['Physics', 'Chemistry', 'Maths', 'Biology', 'Computer Science', 'English'] },
];

const BTECH_SUBJECTS = {
  CSE: ['C Programming', 'Java', 'Python', 'Machine Learning', 'Algorithms (DSA)', 'Full Stack Development', 'DevOps', 'Computer Networks'],
  CSM: ['Python', 'Machine Learning', 'Deep Learning', 'Artificial Intelligence', 'Data Structures', 'Maths for ML'],
  'CS-DS': ['Python', 'Statistics', 'Data Analytics', 'SQL & DBMS', 'Machine Learning', 'Big Data'],
  'CS-CS': ['Computer Networks', 'Ethical Hacking', 'Cryptography', 'Linux', 'Python', 'Cloud Security'],
  Civil: ['Engineering Mechanics', 'Structural Analysis', 'Surveying', 'Fluid Mechanics', 'AutoCAD', 'Concrete Technology'],
  Mech: ['Thermodynamics', 'Engineering Drawing & CAD', 'Fluid Mechanics', 'Strength of Materials', 'Manufacturing', 'Machine Design'],
  ECE: ['Electronic Devices', 'Signals & Systems', 'Digital Electronics', 'Communication Systems', 'Microprocessors', 'VLSI'],
  EEE: ['Circuit Theory', 'Electrical Machines', 'Power Systems', 'Control Systems', 'Power Electronics', 'Embedded Systems'],
};

/** Every group with its label and subjects. */
export const GROUPS = [
  ...SCHOOL_BANDS.map((b) => ({ key: b.key, label: `Class ${b.from}–${b.to}`, subjects: b.subjects })),
  ...Object.entries(BTECH_SUBJECTS).map(([branch, subjects]) => ({ key: `btech:${branch}`, label: `BTech ${branch}`, subjects })),
];

/** Validates/normalises a student's education input. Returns null when absent; throws a message string when invalid. */
export function parseEducation(input) {
  if (!input || !input.level) return null;
  if (input.level === 'school') {
    const grade = Number(input.grade);
    if (!SCHOOL_GRADES.includes(grade)) throw 'Choose your class (1st to 12th)';
    return { level: 'school', grade, branch: undefined };
  }
  if (input.level === 'btech') {
    if (!BTECH_BRANCHES[input.branch]) throw 'Choose your BTech branch';
    return { level: 'btech', branch: input.branch, grade: undefined };
  }
  throw 'Choose School or BTech';
}

/** The tutor group for a student's education, or null. */
export function groupFor(education) {
  if (!education?.level) return null;
  if (education.level === 'school') {
    const band = SCHOOL_BANDS.find((b) => education.grade >= b.from && education.grade <= b.to);
    return band ? GROUPS.find((g) => g.key === band.key) : null;
  }
  return GROUPS.find((g) => g.key === `btech:${education.branch}`) ?? null;
}

/** Human label like "Class 6" or "BTech CSE". */
export const educationLabel = (education) =>
  !education?.level ? null : education.level === 'school' ? `Class ${education.grade}` : `BTech ${education.branch}`;
