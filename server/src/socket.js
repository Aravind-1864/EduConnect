import { Server } from 'socket.io';
import { env } from './config/env.js';
import { userFromToken } from './middleware/auth.js';
import { Classroom, Message } from './models/index.js';

/**
 * Rooms:
 *   user:<id>   - personal notifications
 *   class:<id>  - class chat + live updates (sessions, announcements)
 */
export function initSocket(httpServer) {
  const io = new Server(httpServer, { cors: { origin: env.clientUrl, credentials: true } });

  io.use(async (socket, next) => {
    try {
      socket.user = await userFromToken(socket.handshake.auth?.token);
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const { user } = socket;
    socket.join(`user:${user._id}`);

    const canAccess = async (classId) => {
      const classroom = await Classroom.findById(classId).select('tutor students');
      return classroom && (user.role === 'admin' || classroom.hasMember(user._id));
    };

    socket.on('class:join', async (classId, ack) => {
      try {
        if (!(await canAccess(classId))) return ack?.({ ok: false });
        socket.join(`class:${classId}`);
        ack?.({ ok: true });
      } catch {
        ack?.({ ok: false });
      }
    });

    socket.on('class:leave', (classId) => socket.leave(`class:${classId}`));

    socket.on('chat:send', async ({ classId, text } = {}, ack) => {
      const clean = String(text ?? '').trim().slice(0, 2000);
      if (!clean || !socket.rooms.has(`class:${classId}`)) return ack?.({ ok: false });
      const message = await Message.create({ classroom: classId, sender: user._id, text: clean });
      await message.populate('sender', 'name role avatarColor');
      io.to(`class:${classId}`).emit('chat:message', message);
      ack?.({ ok: true });
    });

    socket.on('chat:typing', ({ classId } = {}) => {
      if (socket.rooms.has(`class:${classId}`)) socket.to(`class:${classId}`).emit('chat:typing', { name: user.name });
    });
  });

  return io;
}
