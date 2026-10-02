import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { API_BASE, tokenStore } from '../api/client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);
const NotificationContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return undefined;
    const s = io(API_BASE || undefined, { auth: { token: tokenStore.get() }, transports: ['websocket', 'polling'] });
    s.on('notify', (n) => {
      setNotifications((prev) => [{ ...n, id: crypto.randomUUID(), at: new Date().toISOString(), read: false }, ...prev].slice(0, 30));
      toast(`${n.title}\n${n.body}`, { icon: '🔔', duration: 5000 });
    });
    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
      setNotifications([]);
    };
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const markAllRead = useCallback(() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))), []);
  const notificationValue = useMemo(
    () => ({ notifications, unread: notifications.filter((n) => !n.read).length, markAllRead, clear: () => setNotifications([]) }),
    [notifications, markAllRead]
  );

  return (
    <SocketContext.Provider value={socket}>
      <NotificationContext.Provider value={notificationValue}>{children}</NotificationContext.Provider>
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
export const useNotifications = () => useContext(NotificationContext);
