import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Shield, Ban, UserCheck, ChevronDown } from 'lucide-react';
import api from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Input';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [actionModal, setActionModal] = useState(null); // { user, action }
  const [actionReason, setActionReason] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const res = await api.get(`/users?${params}`);
      setUsers(res.data.data || []);
      setPagination(res.data.pagination);
    } catch {}
    finally { setLoading(false); }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleAction = async () => {
    if (!actionModal) return;
    const { user: target, action } = actionModal;
    try {
      if (action === 'suspend') await api.put(`/users/${target.uuid}/suspend`, { reason: actionReason });
      else if (action === 'ban') await api.put(`/users/${target.uuid}/ban`, { reason: actionReason });
      else if (action === 'reinstate') await api.put(`/users/${target.uuid}/reinstate`);
      toast.success(`User ${action}ed successfully.`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    } finally {
      setActionModal(null);
      setActionReason('');
    }
  };

  const handleRoleChange = async (user, roleId) => {
    try {
      await api.put(`/users/${user.uuid}/role`, { roleId: parseInt(roleId) });
      toast.success('Role updated.');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role.');
    }
  };

  const roles = [
    { id: 2, name: 'user' },
    { id: 3, name: 'moderator' },
    { id: 4, name: 'admin' },
    { id: 5, name: 'super_admin' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users size={22} className="text-neon-pink" /> User Management
          </h1>
          <p className="text-white/40 text-sm mt-1">Manage platform users and permissions</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input type="text" placeholder="Search users..." className="input-field pl-9"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input-field w-40" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          <option value="" style={{ background: '#0A0F1D' }}>All Roles</option>
          {roles.map(r => <option key={r.id} value={r.name} style={{ background: '#0A0F1D' }}>{r.name}</option>)}
        </select>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#080C18' }}>
                {['User', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-white/30 tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-white/5 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.map((u) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ borderTop: '1px solid rgba(255,255,255,0.03)', background: '#0D1117' }}
                  className="hover:bg-white/2 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #00F0FF33, #FF007F33)', color: '#00F0FF' }}>
                        {u.first_name?.[0]}{u.last_name?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/80">{u.first_name} {u.last_name}</p>
                        <p className="text-xs text-white/30">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/40">{u.email}</td>
                  <td className="px-4 py-3">
                    {me?.role_name === 'super_admin' && u.id !== me.id ? (
                      <select
                        className="text-xs rounded-lg px-2 py-1 bg-transparent border border-white/10 text-white/60 cursor-pointer"
                        value={roles.find(r => r.name === u.role_name)?.id || 2}
                        onChange={e => handleRoleChange(u, e.target.value)}
                        style={{ background: '#0D1117' }}
                      >
                        {roles.map(r => <option key={r.id} value={r.id} style={{ background: '#0A0F1D' }}>{r.name}</option>)}
                      </select>
                    ) : (
                      <span className="badge-cyan text-xs">{u.role_name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.is_banned ? <span className="badge-danger text-xs">Banned</span>
                      : u.is_suspended ? <span className="badge-pink text-xs">Suspended</span>
                      : u.is_verified ? <span className="badge-green text-xs">Active</span>
                      : <span className="badge-gray text-xs">Unverified</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-white/30">
                    {u.created_at && format(new Date(u.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    {u.id !== me?.id && (
                      <div className="flex gap-1">
                        {!u.is_suspended && !u.is_banned && (
                          <button onClick={() => setActionModal({ user: u, action: 'suspend' })}
                            className="p-1.5 rounded text-white/20 hover:text-yellow-400 hover:bg-yellow-400/10 transition-all" title="Suspend">
                            <Shield size={13} />
                          </button>
                        )}
                        {!u.is_banned && (
                          <button onClick={() => setActionModal({ user: u, action: 'ban' })}
                            className="p-1.5 rounded text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Ban">
                            <Ban size={13} />
                          </button>
                        )}
                        {(u.is_suspended || u.is_banned) && (
                          <button onClick={() => setActionModal({ user: u, action: 'reinstate' })}
                            className="p-1.5 rounded text-white/20 hover:text-neon-green hover:bg-neon-green/10 transition-all" title="Reinstate">
                            <UserCheck size={13} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination pagination={pagination} onPageChange={setPage} />

      <Modal isOpen={!!actionModal} onClose={() => { setActionModal(null); setActionReason(''); }}
        title={`${actionModal?.action?.charAt(0).toUpperCase()}${actionModal?.action?.slice(1)} User`} size="sm">
        {actionModal?.action !== 'reinstate' && (
          <Textarea
            label="Reason (optional)"
            placeholder={`Reason for ${actionModal?.action}ing this user...`}
            value={actionReason}
            onChange={e => setActionReason(e.target.value)}
            rows={3}
          />
        )}
        {actionModal?.action === 'reinstate' && (
          <p className="text-sm text-white/60 mb-4">
            This will remove all suspensions and bans from @{actionModal?.user?.username}.
          </p>
        )}
        <div className="flex gap-3 justify-end mt-4">
          <button onClick={() => { setActionModal(null); setActionReason(''); }} className="btn-secondary text-sm px-4 py-2">Cancel</button>
          <button onClick={handleAction}
            className={`text-sm px-4 py-2 rounded-lg font-semibold ${actionModal?.action === 'reinstate' ? 'text-neon-green border border-neon-green/30 hover:bg-neon-green/10' : 'text-red-400 border border-red-400/30 hover:bg-red-500/10'} transition-all`}>
            Confirm {actionModal?.action}
          </button>
        </div>
      </Modal>
    </div>
  );
}
