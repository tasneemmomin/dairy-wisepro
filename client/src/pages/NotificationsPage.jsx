import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import API from '../services/api';
import { useSocket } from '../context/SocketContext';

const typeColors = {
  new_order: 'bg-blue-100 text-blue-600',
  low_stock: 'bg-orange-100 text-orange-600',
  delivery_assigned: 'bg-purple-100 text-purple-600',
  payment_received: 'bg-green-100 text-green-600',
  subscription: 'bg-indigo-100 text-indigo-600',
  general: 'bg-gray-100 text-gray-600',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { notifications: realtimeNotifs } = useSocket();

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (realtimeNotifs.length > 0) {
      setNotifications(prev => {
        const ids = new Set(prev.map(n => n._id));
        const newOnes = realtimeNotifs.filter(n => n._id && !ids.has(n._id));
        return [...newOnes, ...prev];
      });
    }
  }, [realtimeNotifs]);

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications');
      setNotifications(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const markRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) { console.error(err); }
  };

  const markAllRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) { console.error(err); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
          <p className="text-sm text-gray-500">{notifications.filter(n => !n.isRead).length} unread</p>
        </div>
        <button onClick={markAllRead}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
          <CheckCheck size={14} /> Mark all read
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="bg-white h-16 rounded-xl animate-pulse border border-gray-100" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif, i) => (
            <motion.div key={notif._id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`flex items-center gap-4 p-4 rounded-xl border transition ${
                notif.isRead ? 'bg-white border-gray-100' : 'bg-green-50/50 border-green-100'
              }`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColors[notif.type] || typeColors.general}`}>
                <Bell size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${notif.isRead ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>{notif.title}</p>
                <p className="text-xs text-gray-500 truncate">{notif.message}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400 whitespace-nowrap">
                  {new Date(notif.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
                {!notif.isRead && (
                  <button onClick={() => markRead(notif._id)}
                    className="p-1.5 hover:bg-green-100 rounded-lg text-green-600 transition">
                    <Check size={12} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
