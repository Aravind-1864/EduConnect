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

  if (oldClasses.length || codeless.length) {
    console.log(`[migrate] updated ${oldClasses.length} classroom code(s), ${codeless.length} meet code(s)`);
  }
}
