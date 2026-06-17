import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Package, Search, Eye, Trash2, CheckCircle, MapPin, Calendar, Filter } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../lib/axios';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/Modal';

const TAB_LOST = 'lost';
const TAB_FOUND = 'found';

export default function AdminItems() {
  const [tab, setTab] = useState(TAB_LOST);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewItem, setViewItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const endpoint = tab === TAB_LOST ? '/lost-items' : '/found-items';
      const res = await api.get(`${endpoint}?${params}`);
      setItems(res.data.data || []);
      setPagination(res.data.pagination);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [tab, page, search, statusFilter]);

  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [tab]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const endpoint = tab === TAB_LOST ? `/lost-items/${deleteTarget.uuid}` : `/found-items/${deleteTarget.uuid}`;
      await api.delete(endpoint);
      toast.success('Item removed successfully.');
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete item.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleVerify = async (item) => {
    try {
      await api.put(`/found-items/${item.uuid}/verify`, { status: 'available' });
      toast.success('Item verified.');
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to verify item.');
    }
  };

  const lostStatuses = ['active', 'matched', 'recovered', 'closed'];
  const foundStatuses = ['available', 'verification_pending', 'claimed', 'returned'];
  const statusOptions = tab === TAB_LOST ? lostStatuses : foundStatuses;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Package size={22} className="text-neon-cyan" /> Items Management
        </h1>
        <p className="text-white/40 text-sm mt-1">Manage all lost and found reports on the platform</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { key: TAB_LOST, label: 'Lost Items' },
          { key: TAB_FOUND, label: 'Found Items' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setStatusFilter(''); setSearch(''); }}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === key
                ? 'text-black font-bold'
                : 'text-white/40 hover:text-white/70'
            }`}
            style={tab === key ? { background: tab === TAB_LOST ? '#FF007F' : '#00F0FF' } : {}}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search items..."
            className="input-field pl-9"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          <select
            className="input-field pl-9 w-44"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <option value="" style={{ background: '#0A0F1D' }}>All Statuses</option>
            {statusOptions.map(s => (
              <option key={s} value={s} style={{ background: '#0A0F1D' }}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#080C18' }}>
                {['Item', 'Category', 'Reporter', 'Location', 'Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-white/30 tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-white/5 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-white/30 text-sm">
                    No items found
                  </td>
                </tr>
              ) : items.map(item => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ borderTop: '1px solid rgba(255,255,255,0.03)', background: '#0D1117' }}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {item.images?.[0] ? (
                        <img
                          src={item.images[0].image_url}
                          alt=""
                          className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-lg"
                          style={{ background: 'rgba(255,255,255,0.05)' }}>
                          {item.category_icon || '📦'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white/80 truncate max-w-[160px]">{item.title}</p>
                        {item.brand && <p className="text-xs text-white/30 truncate">{item.brand}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-white/40">
                      {item.category_icon} {item.category_name || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-white/40">@{item.username || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-xs text-white/30">
                      <MapPin size={11} />
                      <span className="truncate max-w-[100px]">{item.location_name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/30">
                    <div className="flex items-center gap-1">
                      <Calendar size={11} />
                      {item.date_lost || item.date_found
                        ? format(new Date(item.date_lost || item.date_found), 'MMM d, yyyy')
                        : '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewItem(item)}
                        className="p-1.5 rounded text-white/20 hover:text-neon-cyan hover:bg-neon-cyan/10 transition-all"
                        title="View details"
                      >
                        <Eye size={13} />
                      </button>
                      {tab === TAB_FOUND && item.status === 'verification_pending' && (
                        <button
                          onClick={() => handleVerify(item)}
                          className="p-1.5 rounded text-white/20 hover:text-neon-green hover:bg-neon-green/10 transition-all"
                          title="Verify item"
                        >
                          <CheckCircle size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="p-1.5 rounded text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Delete item"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination pagination={pagination} onPageChange={setPage} />

      {/* View Modal */}
      <Modal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Item Details" size="lg">
        {viewItem && (
          <div className="space-y-4">
            {/* Images */}
            {viewItem.images?.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {viewItem.images.map((img, i) => (
                  <img
                    key={i}
                    src={img.image_url}
                    alt=""
                    className="w-24 h-24 rounded-lg object-cover"
                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-white/30 mb-1">Title</p>
                <p className="text-sm text-white/80">{viewItem.title}</p>
              </div>
              <div>
                <p className="text-xs text-white/30 mb-1">Status</p>
                <StatusBadge status={viewItem.status} />
              </div>
              <div>
                <p className="text-xs text-white/30 mb-1">Category</p>
                <p className="text-sm text-white/80">{viewItem.category_icon} {viewItem.category_name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-white/30 mb-1">Reporter</p>
                <p className="text-sm text-white/80">@{viewItem.username}</p>
              </div>
              {viewItem.brand && (
                <div>
                  <p className="text-xs text-white/30 mb-1">Brand</p>
                  <p className="text-sm text-white/80">{viewItem.brand}</p>
                </div>
              )}
              {viewItem.color && (
                <div>
                  <p className="text-xs text-white/30 mb-1">Color</p>
                  <p className="text-sm text-white/80">{viewItem.color}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-white/30 mb-1">Location</p>
                <p className="text-sm text-white/80">{viewItem.location_name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-white/30 mb-1">Date</p>
                <p className="text-sm text-white/80">
                  {viewItem.date_lost || viewItem.date_found
                    ? format(new Date(viewItem.date_lost || viewItem.date_found), 'MMM d, yyyy')
                    : '—'}
                </p>
              </div>
            </div>

            {viewItem.description && (
              <div>
                <p className="text-xs text-white/30 mb-1">Description</p>
                <p className="text-sm text-white/60 leading-relaxed">{viewItem.description}</p>
              </div>
            )}

            <div className="text-xs text-white/20 pt-2 border-t border-white/5">
              Reported {format(new Date(viewItem.created_at), 'MMM d, yyyy HH:mm')}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Item"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
