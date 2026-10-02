import { User } from '../models/index.js';
import { signToken } from '../middleware/auth.js';
import { ApiError, asyncHandler, requireFields } from '../utils/ApiError.js';

const authResponse = (user) => ({ token: signToken(user), user });

export const register = asyncHandler(async (req, res) => {
  requireFields(req.body, ['name', 'email', 'password']);
  const { name, email, password, role = 'student', subjects, bio } = req.body;

  // Admin accounts cannot be self-registered.
  if (!['student', 'tutor'].includes(role)) throw ApiError.badRequest('Role must be student or tutor');
  if (password.length < 6) throw ApiError.badRequest('Password must be at least 6 characters');
  if (await User.exists({ email: email.toLowerCase() })) throw ApiError.conflict('An account with this email already exists');

  const user = await User.create({
    name,
    email,
    password,
    role,
    bio,
    subjects: Array.isArray(subjects) ? subjects : [],
  });
  res.status(201).json(authResponse(user));
});

export const login = asyncHandler(async (req, res) => {
  requireFields(req.body, ['email', 'password']);
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(req.body.password))) throw ApiError.unauthorized('Invalid email or password');
  if (!user.isActive) throw ApiError.forbidden('This account has been disabled');
  res.json(authResponse(user));
});

export const me = (req, res) => res.json({ user: req.user });

export const updateMe = asyncHandler(async (req, res) => {
  const editable = ['name', 'bio', 'subjects', 'hourlyRate', 'avatarColor'];
  for (const key of editable) if (req.body[key] !== undefined) req.user[key] = req.body[key];

  if (req.body.newPassword) {
    const withPw = await User.findById(req.user._id).select('+password');
    if (!(await withPw.comparePassword(req.body.currentPassword || ''))) throw ApiError.badRequest('Current password is incorrect');
    if (req.body.newPassword.length < 6) throw ApiError.badRequest('New password must be at least 6 characters');
    withPw.password = req.body.newPassword;
    for (const key of editable) withPw[key] = req.user[key];
    await withPw.save();
    return res.json({ user: withPw });
  }

  await req.user.save();
  res.json({ user: req.user });
});
