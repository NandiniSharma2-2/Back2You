import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Calendar, Package } from 'lucide-react';
import api from '../../lib/axios';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import { format } from 'date-fns';

export default function ClaimsPage() {
  const [claims, setClaims] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState('my'); // 'my' | 'incoming'
  const [statusFilter, setStatusFilter] = useState('');

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = tab === 'my' ? '/claims/my' : '/claims/for-my-items';
      const params = new URLSearchParams({ page, limit: 10 });
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.get(`${endpoint}?${params}`);
      setClaims(res.data.data || []);
      setPagination(res.data.pagination);
    } catch {}
    finally { setLoading(false); }
  }, [page, tab, statusFilter]);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  const statuses = [
    { value: '', label: 'All' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText size={22} className="text-neon-cyan" /> Claims
        </h1>
        <p className="text-white/40 text-sm mt-1">Track your ownership claims and incoming claims</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: '#0A0F1D' }}>
        {[
          { value: 'my', label: 'My Claims' },
          { value: 'incoming', label: 'Incoming Claims' },
        ].map(t => (
          <button key={t.value} onClick={() => { setTab(t.value); setPage(1); }}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === t.value ? 'bg-neon-cyan text-black' : 'text-white/40 hover:text-white/70'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap">
        {statuses.map(s => (
          <button key={s.value} onClick={() => { setStatusFilter(s.value); setPage(1); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s.value ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl p-5 animate-pulse" style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="h-4 bg-white/5 rounded w-1/2 mb-2" /><div className="h-3 bg-white/5 rounded w-3/4" />
          </div>
        ))}</div>
      ) : claims.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={tab === 'my' ? 'No claims submitted' : 'No incoming claims'}
          description={tab === 'my' ? 'Submit a claim when you find your lost item in the found items list.' : 'When someone claims your found items, they\'ll appear here.'}
        />
      ) : (
        <div className="space-y-3">
          {claims.map((claim, i) => (
            <motion.div key={claim.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link to={`/dashboard/claims/${claim.uuid}`}
                className="block rounded-xl p-5 transition-all group"
                style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,240,255,0.2)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Package size={14} className="text-neon-cyan flex-shrink-0" />
                      <p className="font-medium text-white/80 text-sm truncate">{claim.found_item_title}</p>
                    </div>
                    {tab === 'my' ? null : (
                      <p className="text-xs text-white/40">
                        Claimant: <span className="text-white/60">{claim.claimant_username} ({claim.claimant_first_name})</span>
                      </p>
                    )}
                    <p className="text-xs text-white/30 mt-1 flex items-center gap-1">
                      <Calendar size={10} /> {format(new Date(claim.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <StatusBadge status={claim.status} />
                </div>
                {claim.review_notes && (
                  <p className="mt-3 pt-3 border-t border-white/5 text-xs text-white/40">
                    Note: {claim.review_notes}
                  </p>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
