import { env } from '../config/env.js';
import { Message } from '../models/index.js';
import { providerFor } from './meetingLink.js';

/** Posts a message to a class chat as `senderId` and broadcasts it to everyone in the class room. */
export async function postClassMessage(app, classroomId, senderId, text) {
  const message = await Message.create({ classroom: classroomId, sender: senderId, text });
  await message.populate('sender', 'name role avatarColor');
  app.get('io')?.to(`class:${classroomId}`).emit('chat:message', message);
  return message;
}

const fmtWhen = (date) =>
  new Intl.DateTimeFormat('en-IN', { timeZone: env.timeZone, weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(date);

/** Absolute link to the meet page, built from the request so it matches the site the user is on. */
export const siteUrl = (req) => `${req.protocol}://${req.get('host')}`;
const meetLink = (session, base) => `${base}/live/${session.classroom._id ?? session.classroom}/${session._id}`;

const videoLine = (session) => (session.meetUrl ? `
📹 Video call (${providerFor(session.meetUrl) ?? 'link'}): ${session.meetUrl}` : '');

export const newMeetMessage = (session, base) =>
  `📢 New class meet: ${session.title}
🗓 ${fmtWhen(session.startsAt)} · ${session.durationMinutes} min
🔑 Meet code: ${session.code}
Join with the code, or open: ${meetLink(session, base)}${videoLine(session)}`;

export const meetStartedMessage = (session, base) =>
  `🔴 Class meet started: ${session.title}
🔑 Meet code: ${session.code}
Join now: ${meetLink(session, base)}${videoLine(session)}`;

export const videoLinkAddedMessage = (session) =>
  `📹 Video link for "${session.title}" (${providerFor(session.meetUrl) ?? 'link'}): ${session.meetUrl}`;

export const meetLinkMessage = (url) => `📹 Class meeting link: ${url}
Click the link to join our live classes.`;
