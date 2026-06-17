import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Package, Calendar, FileText, CheckCircle, XCircle } from 'lucide-react';
import api from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
import StatusBadge from '../../components/ui/StatusBadge';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_STEPS = ['submitted', 'under_review', 'approved', 'completed'];

export default function ClaimDetailPage() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const { user, isModerator } = useAuth();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/claims/${uuid}`)
      .then(r => setClaim(r.data.data.claim))
      .catch(() => { toast.error('Claim not found.'); navigate(-1); })
      .finally(() => setLoading(false));
  }, [uuid]);

  const handleReview = async (status) => {
    const notes = prompt(`Review notes for "${status}" (optional):`);
    try {
      const res = await api.put(`/claims/${uuid}/review`, { status, reviewNotes: notes });
      setClaim(res.data.data.claim);
      toast.success(`Claim ${status}.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update claim.');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" />
    </div>
  );

  if (!claim) return null;

  const currentStepIndex = STATUS_STEPS.indexOf(claim.status);
  const isClaimant = claim.claimant_id === user?.id;
  const isFinder = claim.finder_id === user?.id;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Claim Details</h1>
          <p className="text-white/40 text-sm">Submitted {format(new Date(claim.created_at), 'MMMM d, yyyy')}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="rounded-xl p-6" style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white text-sm">Claim Progress</h3>
          <StatusBadge status={claim.status} />
        </div>
        <div className="flex items-center gap-0">
          {STATUS_STEPS.map((step, i) => {
            const isCompleted = i <= currentStepIndex && claim.status !== 'rejected';
            const isRejected = claim.status === 'rejected';
            return (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted ? 'bg-neon-green text-black' : isRejected && i <= 1 ? 'bg-red-500 text-white' : 'bg-white/5 text-white/30'
                  }`}>
                    {isCompleted ? '✓' : i + 1}
                  </div>
                  <span className="text-xs text-white/30 mt-1 capitalize hidden sm:block">{step.replace('_', ' ')}</span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 transition-all ${i < currentStepIndex ? 'bg-neon-green' : 'bg-white/5'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Found Item */}
        <div className="rounded-xl p-5" style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-sm font-semibold text-white/50 mb-3 flex items-center gap-2">
            <Package size={14} /> Found Item
          </h3>
          <p className="font-medium text-white/80">{claim.found_item_title}</p>
          {claim.found_item_location && (
            <p className="text-xs text-white/40 mt-1">{claim.found_item_location}</p>
          )}
        </div>

        {/* Claimant */}
        <div className="rounded-xl p-5" style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-sm font-semibold text-white/50 mb-3 flex items-center gap-2">
            <User size={14} /> Claimant
          </h3>
          <p className="font-medium text-white/80">{claim.claimant_first_name} {claim.claimant_last_name}</p>
          <p className="text-xs text-white/40">@{claim.claimant_username}</p>
          <p className="text-xs text-white/30 mt-1">{claim.claimant_email}</p>
        </div>
      </div>

      {/* Ownership Description */}
      <div className="rounded-xl p-6" style={{ background: '#0D1117', border: '1px solid rgba(0,240,255,0.1)' }}>
        <h3 className="font-semibold text-neon-cyan mb-3">Ownership Description</h3>
        <p className="text-white/60 text-sm leading-relaxed">{claim.ownership_description}</p>
      </div>

      {/* Security Answer */}
      {claim.security_answer && (
        <div className="rounded-xl p-5" style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="font-semibold text-white/60 mb-2">Security Answer</h3>
          <p className="text-white/50 text-sm">{claim.security_answer}</p>
        </div>
      )}

      {/* Additional Info */}
      {claim.additional_info && (
        <div className="rounded-xl p-5" style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="font-semibold text-white/60 mb-2">Additional Information</h3>
          <p className="text-white/50 text-sm">{claim.additional_info}</p>
        </div>
      )}

      {/* Evidence */}
      {claim.evidence && claim.evidence.length > 0 && (
        <div className="rounded-xl p-6" style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="font-semibold text-white mb-3">Evidence ({claim.evidence.length})</h3>
          <div className="grid grid-cols-3 gap-3">
            {claim.evidence.map((ev, i) => (
              <a key={i} href={ev.url} target="_blank" rel="noreferrer"
                className="aspect-square rounded-lg overflow-hidden bg-white/5 hover:opacity-80 transition-opacity">
                <img src={ev.url} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Review Notes */}
      {claim.review_notes && (
        <div className="rounded-xl p-5" style={{
          background: claim.status === 'approved' ? 'rgba(57,255,20,0.05)' : 'rgba(255,59,59,0.05)',
          border: `1px solid ${claim.status === 'approved' ? 'rgba(57,255,20,0.2)' : 'rgba(255,59,59,0.2)'}`,
        }}>
          <h3 className="font-semibold mb-2" style={{ color: claim.status === 'approved' ? '#39FF14' : '#FF3B3B' }}>
            {claim.status === 'approved' ? '✓' : '✗'} Reviewer Notes
          </h3>
          <p className="text-white/60 text-sm">{claim.review_notes}</p>
          {claim.reviewer_username && (
            <p className="text-xs text-white/30 mt-2">Reviewed by @{claim.reviewer_username}</p>
          )}
        </div>
      )}

      {/* Moderator/Admin Actions */}
      {isModerator && ['submitted', 'under_review'].includes(claim.status) && (
        <div className="rounded-xl p-6" style={{ background: '#0D1117', border: '1px solid rgba(255,0,127,0.15)' }}>
          <h3 className="font-semibold text-neon-pink mb-4">Review Actions</h3>
          <div className="flex flex-wrap gap-3">
            {claim.status === 'submitted' && (
              <button onClick={() => handleReview('under_review')} className="btn-secondary text-sm">
                Start Review
              </button>
            )}
            <button onClick={() => handleReview('approved')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-neon-green border border-neon-green/30 hover:bg-neon-green/10 transition-all">
              <CheckCircle size={15} /> Approve
            </button>
            <button onClick={() => handleReview('rejected')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-red-400 border border-red-400/30 hover:bg-red-500/10 transition-all">
              <XCircle size={15} /> Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
