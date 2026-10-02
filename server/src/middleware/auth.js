import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User, Classroom } from '../models/index.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';

export const signToken = (user) =>
  jwt.sign({ sub: String(user._id), role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

export async function userFromToken(token) {
  const payload = jwt.verify(token, env.jwtSecret);
  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw ApiError.unauthorized('Account not found or disabled');
  return user;
}

export const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw ApiError.unauthorized();
  try {
    req.user = await userFromToken(token);
  } catch (err) {
    throw err instanceof ApiError ? err : ApiError.unauthorized('Session expired, please log in again');
  }
  next();
});

export const allow = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
  next();
};

/**
 * Loads the classroom from req.params[param] and verifies membership.
 * Admins can access any classroom. Sets req.classroom and req.isClassTutor.
 */
export const loadClassroom = (param = 'classId') =>
  asyncHandler(async (req, _res, next) => {
    const classroom = await Classroom.findById(req.params[param]);
    if (!classroom) throw ApiError.notFound('Class not found');
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && !classroom.hasMember(req.user._id)) throw ApiError.forbidden('You are not a member of this class');
    req.classroom = classroom;
    req.isClassTutor = isAdmin || String(classroom.tutor) === String(req.user._id);
    next();
  });

export const tutorOnly = (req, _res, next) =>
  req.isClassTutor ? next() : next(ApiError.forbidden('Only the class tutor can do this'));
