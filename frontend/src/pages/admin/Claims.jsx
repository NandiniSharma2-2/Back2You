import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, Eye, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../lib/axios';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';

const STATUS_COLORS = {
  submitted: '#00F0FF',
  under_review: '#FF007F',
  approved: '#39FF14',
  rejected: '#FF3B3B',
  completed: '#39FF14',
};

export default function AdminClaims() {
  const [claims, setClaims] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewClaim, setViewClaim] = useState(null);
  const [reviewModal, setReviewModal] = useState(null); // { claim, action: 'approved'|'rejected' }
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/claims/all?${params}`);
      // Filter by search client-side (no server-side search on claims)
      let data = res.data.data || [];
      if (search) {
        const q = search.toLowerCase();
        data = data.filter(c =>
          c.found_item_title?.toLowerCase().includes(q) ||
          c.claimant_username?.toLowerCase().includes(q)
        );
      }
      setClaims(data);
      setPagination(res.data.pagination);
    } catch {
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  const handleReview = async () => {
    if (!reviewModal) return;
    setSubmitting(true);
    try {
      await api.put(`/claims/${reviewModal.claim.uuid}/review`, {
        status: reviewModal.action,
        reviewNotes,
      });
      toast.success(`Claim ${reviewModal.action} successfully.`);
      fetchClaims();
      setReviewModal(null);
      setReviewNotes('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const openReview = (claim, action) => {
    setReviewModal({ claim, action });
    setReviewNotes('');
  };

  const statusOptions = ['submitted', 'under_review', 'approved', 'rejected', 'completed'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText size={22} className="text-neon-cyan" /> Claims Management
        </h1>
        <p className="text-white/40 text-sm mt-1">Review and process ownership claims</p>
      </div>

      {/* Summary badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pending Review', status: 'submitted', icon: Clock, color: '#00F0FF' },
          { label: 'Under Review', status: 'under_review', icon: Eye, color: '#FF007F' },
          { label: 'Approved', status: 'approved', icon: CheckCircle, color: '#39FF14' },
          { label: 'Rejected', status: 'rejected', icon: XCircle, color: '#FF3B3B' },
        ].map(({ label, status, icon: Icon, color }) => (
          <button
            key={status}
            onClick={() => { setStatusFilter(statusFilter === status ? '' : status); setPage(1); }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left"
            style={{
              background: statusFilter === status ? `${color}15` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${statusFilter === status ? color + '40' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            <Icon size={16} style={{ color }} />
            <span className="text-xs text-white/50">{label}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search by item or claimant..."
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
                {['Claim', 'Claimant', 'Found Item', 'Status', 'Submitted', 'Actions'].map(h => (
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
              ) : claims.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-white/30 text-sm">
                    No claims found
                  </td>
                </tr>
              ) : claims.map(claim => (
                <motion.tr
                  key={claim.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ borderTop: '1px solid rgba(255,255,255,0.03)', background: '#0D1117' }}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="text-xs font-mono text-white/30">#{claim.id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #00F0FF33, #FF007F33)', color: '#00F0FF' }}
                      >
                        {claim.claimant_first_name?.[0] || claim.claimant_username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm text-white/70">
                          {claim.claimant_first_name} {claim.claimant_last_name}
                        </p>
                        <p className="text-xs text-white/30">@{claim.claimant_username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-white/60 truncate max-w-[180px]">
                      {claim.found_item_title || '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        color: STATUS_COLORS[claim.status] || '#fff',
                        background: (STATUS_COLORS[claim.status] || '#fff') + '15',
                        border: `1px solid ${(STATUS_COLORS[claim.status] || '#fff')}30`,
                      }}
                    >
                      {claim.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/30">
                    {claim.created_at
                      ? formatDistanceToNow(new Date(claim.created_at), { addSuffix: true })
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewClaim(claim)}
                        className="p-1.5 rounded text-white/20 hover:text-neon-cyan hover:bg-neon-cyan/10 transition-all"
                        title="View details"
                      >
                        <Eye size={13} />
                      </button>
                      {['submitted', 'under_review'].includes(claim.status) && (
                        <>
                          <button
                            onClick={() => openReview(claim, 'approved')}
                            className="p-1.5 rounded text-white/20 hover:text-neon-green hover:bg-neon-green/10 transition-all"
                            title="Approve claim"
                          >
                            <CheckCircle size={13} />
                          </button>
                          <button
                            onClick={() => openReview(claim, 'rejected')}
                            className="p-1.5 rounded text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Reject claim"
                          >
                            <XCircle size={13} />
                          </button>
                        </>
                      )}
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
      <Modal isOpen={!!viewClaim} onClose={() => setViewClaim(null)} title="Claim Details" size="lg">
        {viewClaim && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-white/30 mb-1">Claim ID</p>
                <p className="text-sm font-mono text-white/60">#{viewClaim.id}</p>
              </div>
              <div>
                <p className="text-xs text-white/30 mb-1">Status</p>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    color: STATUS_COLORS[viewClaim.status] || '#fff',
                    background: (STATUS_COLORS[viewClaim.status] || '#fff') + '15',
                    border: `1px solid ${(STATUS_COLORS[viewClaim.status] || '#fff')}30`,
                  }}
                >
                  {viewClaim.status?.replace(/_/g, ' ')}
                </span>
              </div>
              <div>
                <p className="text-xs text-white/30 mb-1">Claimant</p>
                <p className="text-sm text-white/80">
                  {viewClaim.claimant_first_name} {viewClaim.claimant_last_name}
                  <span className="text-white/40 ml-1">(@{viewClaim.claimant_username})</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-white/30 mb-1">Found Item</p>
                <p className="text-sm text-white/80">{viewClaim.found_item_title || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-white/30 mb-1">Submitted</p>
                <p className="text-sm text-white/60">
                  {viewClaim.created_at ? format(new Date(viewClaim.created_at), 'MMM d, yyyy HH:mm') : '—'}
                </p>
              </div>
              {viewClaim.reviewed_at && (
                <div>
                  <p className="text-xs text-white/30 mb-1">Reviewed</p>
                  <p className="text-sm text-white/60">
                    {format(new Date(viewClaim.reviewed_at), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs text-white/30 mb-1">Ownership Description</p>
              <p className="text-sm text-white/60 leading-relaxed p-3 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {viewClaim.ownership_description || '—'}
              </p>
            </div>

            {viewClaim.additional_info && (
              <div>
                <p className="text-xs text-white/30 mb-1">Additional Info</p>
                <p className="text-sm text-white/60 leading-relaxed">{viewClaim.additional_info}</p>
              </div>
            )}

            {viewClaim.review_notes && (
              <div>
                <p className="text-xs text-white/30 mb-1">Review Notes</p>
                <p className="text-sm text-white/60 leading-relaxed p-3 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {viewClaim.review_notes}
                </p>
              </div>
            )}

            {/* Evidence */}
            {viewClaim.evidence?.length > 0 && (
              <div>
                <p className="text-xs text-white/30 mb-2">Evidence ({viewClaim.evidence.length} files)</p>
                <div className="flex gap-2 flex-wrap">
                  {viewClaim.evidence.map((ev, i) => (
                    ev.file_type === 'image' || ev.url?.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                      <a key={i} href={ev.url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={ev.url}
                          alt=""
                          className="w-20 h-20 rounded-lg object-cover hover:opacity-80 transition-opacity"
                          style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                      </a>
                    ) : (
                      <a
                        key={i}
                        href={ev.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-neon-cyan hover:underline"
                      >
                        📎 Evidence {i + 1}
                      </a>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Quick actions */}
            {['submitted', 'under_review'].includes(viewClaim.status) && (
              <div className="flex gap-3 pt-2 border-t border-white/5">
                <button
                  onClick={() => { setViewClaim(null); openReview(viewClaim, 'approved'); }}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold text-neon-green border border-neon-green/30 hover:bg-neon-green/10 transition-all"
                >
                  Approve Claim
                </button>
                <button
                  onClick={() => { setViewClaim(null); openReview(viewClaim, 'rejected'); }}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold text-red-400 border border-red-400/30 hover:bg-red-500/10 transition-all"
                >
                  Reject Claim
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={!!reviewModal}
        onClose={() => { setReviewModal(null); setReviewNotes(''); }}
        title={reviewModal?.action === 'approved' ? 'Approve Claim' : 'Reject Claim'}
        size="sm"
      >
        {reviewModal && (
          <div className="space-y-4">
            <p className="text-sm text-white/50">
              {reviewModal.action === 'approved'
                ? `Approving this claim will mark the found item as claimed and notify the claimant.`
                : `Rejecting this claim will notify the claimant with your reason.`}
            </p>
            <div>
              <label className="block text-xs text-white/40 mb-2">
                Review Notes {reviewModal.action === 'rejected' ? '(required)' : '(optional)'}
              </label>
              <textarea
                className="input-field w-full resize-none"
                rows={4}
                placeholder={
                  reviewModal.action === 'approved'
                    ? 'Add any notes for the claimant...'
                    : 'Provide a reason for rejection...'
                }
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setReviewModal(null); setReviewNotes(''); }}
                className="btn-secondary text-sm px-4 py-2"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={submitting || (reviewModal.action === 'rejected' && !reviewNotes.trim())}
                className={`text-sm px-5 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 ${
                  reviewModal.action === 'approved'
                    ? 'text-neon-green border border-neon-green/30 hover:bg-neon-green/10'
                    : 'text-red-400 border border-red-400/30 hover:bg-red-500/10'
                }`}
              >
                {submitting ? 'Processing...' : `Confirm ${reviewModal.action === 'approved' ? 'Approval' : 'Rejection'}`}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
