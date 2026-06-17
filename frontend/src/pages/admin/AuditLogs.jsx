import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ScrollText, Search, RefreshCw, User, Clock, Tag, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import api from '../../lib/axios';
import Pagination from '../../components/ui/Pagination';

// Color-code actions by type
const ACTION_COLORS = {
  create_category:   '#39FF14',
  update_category:   '#00F0FF',
  delete_category:   '#FF3B3B',
  update_setting:    '#FF9500',
  claim_approved:    '#39FF14',
  claim_rejected:    '#FF3B3B',
  claim_under_review:'#FF007F',
  suspend_user:      '#FF9500',
  ban_user:          '#FF3B3B',
  reinstate_user:    '#39FF14',
  update_role:       '#AF52DE',
};

const getActionColor = (action) => {
  if (!action) return '#ffffff40';
  const key = Object.keys(ACTION_COLORS).find(k => action.includes(k) || k.includes(action));
  if (key) return ACTION_COLORS[key];
  if (action.includes('creat') || action.includes('add')) return '#39FF14';
  if (action.includes('delet') || action.includes('remov') || action.includes('ban')) return '#FF3B3B';
  if (action.includes('updat') || action.includes('edit')) return '#00F0FF';
  if (action.includes('approv')) return '#39FF14';
  if (action.includes('reject') || action.includes('suspend')) return '#FF3B3B';
  return '#ffffff40';
};

const getTargetIcon = (type) => {
  if (!type) return '•';
  if (type.includes('user')) return '👤';
  if (type.includes('claim')) return '📋';
  if (type.includes('categor')) return '🏷️';
  if (type.includes('setting')) return '⚙️';
  if (type.includes('item')) return '📦';
  return '•';
};

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      const res = await api.get(`/admin/audit-logs?${params}`);
      let data = res.data.data || [];
      if (search) {
        const q = search.toLowerCase();
        data = data.filter(l =>
          l.action?.toLowerCase().includes(q) ||
          l.username?.toLowerCase().includes(q) ||
          l.target_type?.toLowerCase().includes(q) ||
          l.notes?.toLowerCase().includes(q)
        );
      }
      setLogs(data);
      setPagination(res.data.pagination);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ScrollText size={22} className="text-neon-cyan" /> Audit Logs
          </h1>
          <p className="text-white/40 text-sm mt-1">Immutable record of all administrative actions</p>
        </div>
        <button
          onClick={() => fetchLogs()}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/40 hover:text-white hover:bg-white/5 transition-all disabled:opacity-40"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          placeholder="Search logs..."
          className="input-field pl-9"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Stats strip */}
      {pagination && (
        <div className="flex items-center gap-4 text-xs text-white/30 font-mono">
          <span>{pagination.total?.toLocaleString()} total entries</span>
          <span className="text-white/10">·</span>
          <span>Page {pagination.page} of {pagination.totalPages}</span>
        </div>
      )}

      {/* Log List */}
      <div className="space-y-2">
        {loading ? (
          [...Array(10)].map((_, i) => (
            <div key={i} className="rounded-xl p-4 animate-pulse"
              style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.04)', height: '64px' }} />
          ))
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-white/30 text-sm">
            No audit log entries found
          </div>
        ) : logs.map((log) => {
          const color = getActionColor(log.action);
          const isExpanded = expandedId === log.id;

          return (
            <motion.div
              key={log.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-xl overflow-hidden cursor-pointer group"
              style={{
                background: '#0D1117',
                border: `1px solid ${isExpanded ? color + '30' : 'rgba(255,255,255,0.04)'}`,
                transition: 'border-color 0.2s',
              }}
              onClick={() => setExpandedId(isExpanded ? null : log.id)}
            >
              {/* Main row */}
              <div className="flex items-center gap-4 px-4 py-3">
                {/* Color indicator */}
                <div
                  className="w-1.5 h-8 rounded-full flex-shrink-0"
                  style={{ background: color, boxShadow: `0 0 8px ${color}60` }}
                />

                {/* Admin avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: `${color}20`, border: `1px solid ${color}30`, color }}
                >
                  {log.first_name?.[0] || log.username?.[0]?.toUpperCase() || '?'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Admin */}
                    <span className="text-xs text-white/50">
                      <span className="text-white/70">@{log.username || 'system'}</span>
                    </span>

                    {/* Action badge */}
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded-full font-medium"
                      style={{ color, background: color + '15', border: `1px solid ${color}25` }}
                    >
                      {log.action?.replace(/_/g, ' ') || 'unknown'}
                    </span>

                    {/* Target */}
                    {log.target_type && (
                      <span className="text-xs text-white/30 flex items-center gap-1">
                        {getTargetIcon(log.target_type)}
                        {log.target_type}
                        {log.target_id ? ` #${log.target_id}` : ''}
                      </span>
                    )}
                  </div>

                  {/* Notes preview */}
                  {log.notes && !isExpanded && (
                    <p className="text-xs text-white/25 mt-0.5 truncate">{log.notes}</p>
                  )}
                </div>

                {/* Time */}
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-white/25">
                    {log.created_at
                      ? formatDistanceToNow(new Date(log.created_at), { addSuffix: true })
                      : '—'}
                  </p>
                </div>

                {/* Expand toggle */}
                <div className="text-white/20 group-hover:text-white/40 transition-colors flex-shrink-0">
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-6 pb-4"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                    <div>
                      <p className="text-xs text-white/25 mb-1 flex items-center gap-1">
                        <User size={10} /> Admin
                      </p>
                      <p className="text-sm text-white/70">
                        {log.first_name} {log.last_name}
                        <span className="text-white/30 ml-1">(@{log.username})</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-white/25 mb-1 flex items-center gap-1">
                        <Tag size={10} /> Action
                      </p>
                      <p className="text-sm font-mono" style={{ color }}>
                        {log.action}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-white/25 mb-1 flex items-center gap-1">
                        <FileText size={10} /> Target
                      </p>
                      <p className="text-sm text-white/60">
                        {log.target_type || '—'}{log.target_id ? ` #${log.target_id}` : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-white/25 mb-1 flex items-center gap-1">
                        <Clock size={10} /> Timestamp
                      </p>
                      <p className="text-sm text-white/60">
                        {log.created_at
                          ? format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')
                          : '—'}
                      </p>
                    </div>
                  </div>
                  {log.notes && (
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <p className="text-xs text-white/25 mb-1">Notes</p>
                      <p className="text-sm text-white/50 leading-relaxed">{log.notes}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
