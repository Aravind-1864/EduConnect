import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const ROLES = ['student', 'tutor', 'admin'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ROLES, default: 'student' },
    bio: { type: String, maxlength: 500, default: '' },
    subjects: [{ type: String, trim: true }],
    hourlyRate: { type: Number, min: 0, default: 0 },
    avatarColor: { type: String, default: '#6366f1' },
    isActive: { type: Boolean, default: true },
    // Students: what they study, used to suggest tutors.
    education: {
      level: { type: String, enum: ['school', 'btech'] },
      grade: { type: Number, min: 1, max: 12 },
      branch: { type: String },
    },
    // Tutors: sample profiles shipped with the app, and the student groups they teach.
    isDemo: { type: Boolean, default: false },
    audiences: [{ type: String }],
    // Google account linked for automatic Meet links (tutors only). Token never leaves the server.
    google: {
      email: String,
      refreshToken: { type: String, select: false },
      connectedAt: Date,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    if (ret.google) delete ret.google.refreshToken;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);
