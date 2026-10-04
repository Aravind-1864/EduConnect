import { env } from '../config/env.js';
import { Message } from '../models/index.js';

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

export const newMeetMessage = (session, base) =>
  `📢 New class meet: ${session.title}\n🗓 ${fmtWhen(session.startsAt)} · ${session.durationMinutes} min\n🔑 Meet code: ${session.code}\nJoin with the code, or open: ${meetLink(session, base)}`;

export const meetStartedMessage = (session, base) =>
  `🔴 Class meet started: ${session.title}\n🔑 Meet code: ${session.code}\nJoin now: ${meetLink(session, base)}`;

export const meetLinkMessage = (url) => `📹 Class meeting link (Google Meet): ${url}\nClick the link to join our live classes.`;
