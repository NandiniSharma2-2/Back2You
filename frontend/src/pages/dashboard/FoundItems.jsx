import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Package, Calendar, MapPin, Eye, Trash2 } from 'lucide-react';
import api from '../../lib/axios';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import { ConfirmModal } from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function FoundItemsPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.get(`/found-items/my?${params}`);
      setItems(res.data.data || []);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load items'); }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/found-items/${deleteTarget}`);
      toast.success('Item deleted.');
      fetchItems();
    } catch { toast.error('Delete failed.'); }
    finally { setDeleteTarget(null); }
  };

  const statuses = [
    { value: '', label: 'All' },
    { value: 'available', label: 'Available' },
    { value: 'verification_pending', label: 'Pending' },
    { value: 'claimed', label: 'Claimed' },
    { value: 'returned', label: 'Returned' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package size={22} className="text-neon-pink" /> My Found Items
          </h1>
          <p className="text-white/40 text-sm mt-1">Items you've found and reported</p>
        </div>
        <Link to="/dashboard/found/create" className="btn-primary">
          <Plus size={16} /> Report Found Item
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {statuses.map(s => (
          <button key={s.value} onClick={() => { setStatusFilter(s.value); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === s.value ? 'bg-neon-pink text-black' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
            style={{ border: statusFilter === s.value ? 'none' : '1px solid rgba(255,255,255,0.08)' }}>
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl p-6 animate-pulse" style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="h-4 bg-white/5 rounded w-3/4 mb-2" /><div className="h-3 bg-white/5 rounded w-1/2" />
          </div>
        ))}</div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No found items"
          description="You haven't reported any found items yet."
          action={{ label: 'Report Found Item', href: '/dashboard/found/create' }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-xl overflow-hidden" style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex gap-4 p-5">
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
                  {item.primary_image ? (
                    <img src={item.primary_image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">{item.category_icon || '📦'}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-white text-sm truncate">{item.title}</h3>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-xs text-white/40 flex items-center gap-1"><MapPin size={10} /> {item.location}</p>
                  <p className="text-xs text-white/40 flex items-center gap-1 mt-1">
                    <Calendar size={10} /> Found {format(new Date(item.date_found), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex border-t border-white/5">
                <Link to={`/dashboard/found/${item.uuid}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-white/40 hover:text-neon-pink hover:bg-neon-pink/5 transition-all">
                  <Eye size={12} /> View
                </Link>
                <button onClick={() => setDeleteTarget(item.uuid)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-all">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />
      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Found Item Report" message="Are you sure? This action cannot be undone." confirmText="Delete" />
    </div>
  );
}
