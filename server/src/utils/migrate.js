import { Classroom, Session } from '../models/index.js';
import { CLASS_CODE_RE, randomClassCode, randomMeetCode, uniqueCode } from './codes.js';

/**
 * One-off data upgrades that run on every start (cheap when there is nothing to do):
 * - classrooms created before 5-digit codes get a new numeric code
 * - class meets created before meet codes get one
 */
export async function runMigrations() {
  const oldClasses = await Classroom.find({ code: { $not: CLASS_CODE_RE } }).select('code');
  for (const c of oldClasses) {
    c.code = await uniqueCode(randomClassCode, (code) => Classroom.exists({ code }));
    await c.save({ validateBeforeSave: false });
  }

  const codeless = await Session.find({ $or: [{ code: { $exists: false } }, { code: null }] }).select('_id');
  for (const s of codeless) {
    const code = await uniqueCode(randomMeetCode, (value) => Session.exists({ code: value }));
    await Session.updateOne({ _id: s._id }, { $set: { code } });
  }

  // Recolour classrooms from the old palette to the notebook palette.
  const OLD_TO_NEW = { '#6366f1': '#e2683c', '#16a34a': '#2f7d62', '#d97706': '#b5562f', '#db2777': '#8a4f7d', '#0891b2': '#3a6ea5', '#7c3aed': '#23324a', '#dc2626': '#5b6b2f' };
  for (const [from, to] of Object.entries(OLD_TO_NEW)) await Classroom.updateMany({ color: from }, { $set: { color: to } });

  if (oldClasses.length || codeless.length) {
    console.log(`[migrate] updated ${oldClasses.length} classroom code(s), ${codeless.length} meet code(s)`);
  }
}
