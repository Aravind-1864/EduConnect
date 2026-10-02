import { Message } from '../models/index.js';

/** Posts a message to a class chat as `senderId` and broadcasts it to everyone in the class room. */
export async function postClassMessage(app, classroomId, senderId, text) {
  const message = await Message.create({ classroom: classroomId, sender: senderId, text });
  await message.populate('sender', 'name role avatarColor');
  app.get('io')?.to(`class:${classroomId}`).emit('chat:message', message);
  return message;
}

export const meetLinkMessage = (url) => `📹 Class meeting link (Google Meet): ${url}\nClick the link to join our live classes.`;
export const liveNowMessage = (title, url) => `🔴 Live now: ${title}\nJoin here: ${url}`;
