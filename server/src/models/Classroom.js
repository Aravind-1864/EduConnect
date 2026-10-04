import mongoose from 'mongoose';
import { randomClassCode, uniqueCode } from '../utils/codes.js';

// Notebook-friendly banner colours (all keep white text readable).
const COLORS = ['#e2683c', '#23324a', '#2f7d62', '#3a6ea5', '#b5562f', '#5b6b2f', '#8a4f7d'];

const classroomSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    subject: { type: String, trim: true, default: '' },
    description: { type: String, default: '', maxlength: 2000 },
    tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // 5-digit join code the tutor shares with students.
    code: { type: String, unique: true },
    // The class's standing Google Meet link; used by sessions that don't set their own.
    meetUrl: { type: String, trim: true },
    color: { type: String },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

classroomSchema.pre('validate', async function assignDefaults() {
  if (!this.code) this.code = await uniqueCode(randomClassCode, (code) => this.constructor.exists({ code }));
  if (!this.color) this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
});

/** True when the given user is the tutor or an enrolled student. */
classroomSchema.methods.hasMember = function hasMember(userId) {
  const id = String(userId);
  const tutorId = String(this.tutor?._id ?? this.tutor);
  return tutorId === id || this.students.some((s) => String(s?._id ?? s) === id);
};

export const Classroom = mongoose.model('Classroom', classroomSchema);
