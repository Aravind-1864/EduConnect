import mongoose from 'mongoose';
import crypto from 'node:crypto';

const COLORS = ['#6366f1', '#16a34a', '#d97706', '#db2777', '#0891b2', '#7c3aed', '#dc2626'];

const classroomSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    subject: { type: String, required: true, trim: true },
    description: { type: String, default: '', maxlength: 2000 },
    tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    code: { type: String, unique: true },
    color: { type: String },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

classroomSchema.pre('validate', function assignDefaults(next) {
  if (!this.code) this.code = crypto.randomBytes(3).toString('hex').toUpperCase();
  if (!this.color) this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
  next();
});

/** True when the given user is the tutor or an enrolled student. */
classroomSchema.methods.hasMember = function hasMember(userId) {
  const id = String(userId);
  const tutorId = String(this.tutor?._id ?? this.tutor);
  return tutorId === id || this.students.some((s) => String(s?._id ?? s) === id);
};

export const Classroom = mongoose.model('Classroom', classroomSchema);
