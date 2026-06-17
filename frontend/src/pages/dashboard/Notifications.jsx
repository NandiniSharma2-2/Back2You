import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Check, Trash2, CheckCheck } from 'lucide-react';
import api from '../../lib/axios';
import { useNotifications } from '../../contexts/NotificationContext';
import EmptyState from '../../components/ui/EmptyState';
import { formatDistanceToNow } from 'date-fns';

const typeIcons = {
  match_found: '🎯',
  new_claim: '📝',
  claim_update: '📦',
  message: '💬',
  system: '⚙️',
  matches_available: '🔍',
  default: '🔔',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { fetchUnreadCount } = useNotifications() || {};

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications?limit=50');
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    fetchUnreadCount?.();
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    fetchUnreadCount?.();
  };

  const deleteNotification = async (id) => {
    await api.delete(`/notifications/${id}`);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell size={22} className="text-neon-cyan" /> Notifications
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary text-xs px-4 py-2 flex items-center gap-1.5">
            <CheckCheck size={14} /> Mark All Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-xl p-4 animate-pulse" style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="h-3 bg-white/5 rounded w-2/3 mb-2" /><div className="h-2.5 bg-white/3 rounded w-1/2" />
          </div>
        ))}</div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You're all caught up! Notifications about matches, claims, and messages will appear here."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`flex items-start gap-4 p-4 rounded-xl transition-all ${!n.is_read ? 'border-neon-cyan/15' : ''}`}
              style={{
                background: !n.is_read ? 'rgba(0,240,255,0.04)' : '#0D1117',
                border: `1px solid ${!n.is_read ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.04)'}`,
              }}
            >
              <div className="text-2xl flex-shrink-0 mt-0.5">
                {typeIcons[n.type] || typeIcons.default}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`text-sm font-medium ${!n.is_read ? 'text-white' : 'text-white/70'}`}>{n.title}</p>
                    <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-xs text-white/20 mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full bg-neon-cyan flex-shrink-0 mt-1.5" />
                  )}
                </div>
                {n.action_url && (
                  <Link to={n.action_url} onClick={() => !n.is_read && markRead(n.id)}
                    className="inline-flex items-center gap-1 text-xs text-neon-cyan/70 hover:text-neon-cyan mt-2 transition-colors">
                    View Details →
                  </Link>
                )}
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                {!n.is_read && (
                  <button onClick={() => markRead(n.id)} className="p-1.5 rounded-lg text-white/20 hover:text-neon-green hover:bg-neon-green/10 transition-all">
                    <Check size={12} />
                  </button>
                )}
                <button onClick={() => deleteNotification(n.id)} className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <Trash2 size={12} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
