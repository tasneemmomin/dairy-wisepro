import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, token } = useAuth();

  useEffect(() => {
    if (token) {
      const newSocket = io('http://localhost:5000', { transports: ['websocket', 'polling'] });

      newSocket.on('connect', () => {
        if (user?._id || user?.id) newSocket.emit('join', user._id || user.id);
      });

      newSocket.on('notification', (notif) => {
        setNotifications(prev => [notif, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      newSocket.on('new_order', () => {
        setUnreadCount(prev => prev + 1);
      });

      setSocket(newSocket);
      return () => newSocket.close();
    }
  }, [token, user]);

  const markAllRead = () => setUnreadCount(0);

  return (
    <SocketContext.Provider value={{ socket, notifications, unreadCount, setNotifications, markAllRead }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
