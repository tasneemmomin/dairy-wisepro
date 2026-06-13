import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

// Derive the Socket.IO server URL from the API URL environment variable.
// VITE_API_URL is e.g. "https://your-backend.onrender.com/api"
// We strip the "/api" suffix to get the socket server root.
const getSocketURL = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  // Remove trailing "/api" to get the server root for socket.io
  return apiUrl.replace(/\/api\/?$/, '');
};

const SOCKET_URL = getSocketURL();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, token } = useAuth();

  useEffect(() => {
    if (!token) return;

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

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
  }, [token]); // Only reconnect when token changes, not on every user object update

  const markAllRead = () => setUnreadCount(0);

  return (
    <SocketContext.Provider value={{ socket, notifications, unreadCount, setNotifications, markAllRead }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
