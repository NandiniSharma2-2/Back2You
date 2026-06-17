import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Calendar, Tag, Palette, DollarSign, Phone, Mail, Eye, Star, MessageSquare, FileText } from 'lucide-react';
import api from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import { Textarea, Select } from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function ItemDetailPage({ type }) {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [claimModal, setClaimModal] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    const endpoint = type === 'lost' ? `/lost-items/${uuid}` : `/found-items/${uuid}`;
    api.get(endpoint)
      .then(res => {
        setItem(res.data.data.item);
        setMatches(res.data.data.matches || []);
      })
      .catch(() => toast.error('Item not found'))
      .finally(() => setLoading(false));
  }, [uuid, type]);

  const handleClaim = async (data) => {
    setClaimLoading(true);
    try {
      const formData = new FormData();
      formData.append('foundItemUuid', uuid);
      formData.append('ownershipDescription', data.ownershipDescription);
      if (data.securityAnswer) formData.append('securityAnswer', data.securityAnswer);
      if (data.additionalInfo) formData.append('additionalInfo', data.additionalInfo);

      await api.post('/claims', formData);
      toast.success('Claim submitted successfully!');
      setClaimModal(false);
      navigate('/dashboard/claims');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit claim.');
    } finally {
      setClaimLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" />
    </div>
  );

  if (!item) return (
    <div className="text-center py-16">
      <p className="text-white/40">Item not found.</p>
      <button onClick={() => navigate(-1)} className="btn-secondary mt-4">Go Back</button>
    </div>
  );

  const isOwner = item.user_id === user?.id;
  const canClaim = type === 'found' && !isOwner && item.status === 'available';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">{item.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={item.status} />
            <span className="text-xs text-white/30">{item.category_name && `${item.category_icon} ${item.category_name}`}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Images & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          {item.images && item.images.length > 0 ? (
            <div className="space-y-3">
              <div className="aspect-video rounded-xl overflow-hidden" style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}>
                <img src={item.images[activeImage]?.url} alt={item.title} className="w-full h-full object-contain" />
              </div>
              {item.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {item.images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImage(i)}
                      className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 transition-all ${i === activeImage ? 'ring-2 ring-neon-cyan' : 'opacity-50 hover:opacity-100'}`}>
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-video rounded-xl flex items-center justify-center text-6xl"
              style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}>
              {item.category_icon || '📦'}
            </div>
          )}

          {/* Description */}
          <div className="rounded-xl p-6 space-y-4" style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="font-semibold text-white">Description</h3>
            <p className="text-white/60 text-sm leading-relaxed">{item.description}</p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
              {item.location && (
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-neon-cyan mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-white/30">Location</p>
                    <p className="text-sm text-white/70">{item.location}</p>
                  </div>
                </div>
              )}
              {(item.date_lost || item.date_found) && (
                <div className="flex items-start gap-2">
                  <Calendar size={14} className="text-neon-pink mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-white/30">{type === 'lost' ? 'Date Lost' : 'Date Found'}</p>
                    <p className="text-sm text-white/70">{format(new Date(item.date_lost || item.date_found), 'MMMM d, yyyy')}</p>
                  </div>
                </div>
              )}
              {item.brand && (
                <div className="flex items-start gap-2">
                  <Tag size={14} className="text-neon-green mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-white/30">Brand</p>
                    <p className="text-sm text-white/70">{item.brand}</p>
                  </div>
                </div>
              )}
              {item.color && (
                <div className="flex items-start gap-2">
                  <Palette size={14} className="text-neon-cyan mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-white/30">Color</p>
                    <p className="text-sm text-white/70">{item.color}</p>
                  </div>
                </div>
              )}
              {item.reward > 0 && (
                <div className="flex items-start gap-2">
                  <DollarSign size={14} className="text-neon-green mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-white/30">Reward</p>
                    <p className="text-sm text-neon-green font-semibold">${item.reward}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <Eye size={14} className="text-white/30 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-white/30">Views</p>
                  <p className="text-sm text-white/50">{item.views}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Matches */}
          {matches.length > 0 && (
            <div className="rounded-xl p-6" style={{ background: '#0D1117', border: '1px solid rgba(57,255,20,0.15)' }}>
              <h3 className="font-semibold text-neon-green mb-4">🎯 Potential Matches ({matches.length})</h3>
              <div className="space-y-3">
                {matches.slice(0, 3).map((match, i) => (
                  <Link
                    key={i}
                    to={`/dashboard/${type === 'lost' ? 'found' : 'lost'}/${match.uuid || match.found_item_id || match.lost_item_id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/3 transition-all"
                    style={{ border: '1px solid rgba(57,255,20,0.1)' }}
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                      {match.primary_image ? (
                        <img src={match.primary_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/80 truncate">{match.title}</p>
                      <p className="text-xs text-white/40">{match.location}</p>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-black text-neon-green">{match.match_score}%</div>
                      <div className="text-xs text-white/30">match</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Reporter */}
          <div className="rounded-xl p-5" style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="text-sm font-semibold text-white/50 mb-3">
              {type === 'lost' ? 'Item Owner' : 'Found By'}
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #00F0FF, #FF007F)', color: '#000' }}>
                {item.first_name?.[0]}{item.last_name?.[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-white/80">{item.first_name} {item.last_name}</p>
                <p className="text-xs text-white/30">@{item.username}</p>
              </div>
            </div>

            {(item.contact_email || item.contact_phone) && (
              <div className="space-y-2 pt-3 border-t border-white/5">
                {item.contact_email && (
                  <a href={`mailto:${item.contact_email}`} className="flex items-center gap-2 text-xs text-white/40 hover:text-neon-cyan transition-colors">
                    <Mail size={12} /> {item.contact_email}
                  </a>
                )}
                {item.contact_phone && (
                  <a href={`tel:${item.contact_phone}`} className="flex items-center gap-2 text-xs text-white/40 hover:text-neon-cyan transition-colors">
                    <Phone size={12} /> {item.contact_phone}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {canClaim && (
              <button onClick={() => setClaimModal(true)} className="btn-primary w-full">
                <FileText size={16} /> Submit Claim
              </button>
            )}
            {!isOwner && (
              <button
                onClick={async () => {
                  try {
                    const res = await api.post('/chat/rooms', { userId: item.user_id });
                    navigate(`/dashboard/chat?room=${res.data.data.room.uuid}`);
                  } catch { toast.error('Failed to open chat.'); }
                }}
                className="btn-secondary w-full"
              >
                <MessageSquare size={16} /> Send Message
              </button>
            )}
          </div>

          {/* Metadata */}
          <div className="rounded-xl p-4" style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.04)' }}>
            <p className="text-xs text-white/30">
              Posted {format(new Date(item.created_at), 'MMMM d, yyyy')}
            </p>
            {item.updated_at !== item.created_at && (
              <p className="text-xs text-white/20 mt-1">
                Updated {format(new Date(item.updated_at), 'MMM d, yyyy')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Claim Modal */}
      <Modal isOpen={claimModal} onClose={() => setClaimModal(false)} title="Submit Ownership Claim" size="lg">
        <form onSubmit={handleSubmit(handleClaim)} className="space-y-5">
          <div className="p-4 rounded-lg" style={{ background: 'rgba(0,240,255,0.04)', border: '1px solid rgba(0,240,255,0.1)' }}>
            <p className="text-xs text-neon-cyan/70">
              ⚠️ Only submit a claim if this item belongs to you. False claims may result in account suspension.
            </p>
          </div>

          <Textarea
            label="Prove Ownership *"
            placeholder="Describe in detail why this item belongs to you. Include serial numbers, contents, purchase receipts, unique features, etc."
            rows={5}
            error={errors.ownershipDescription?.message}
            {...register('ownershipDescription', {
              required: 'Ownership description required',
              minLength: { value: 20, message: 'Please provide at least 20 characters' },
            })}
          />

          <Textarea
            label="Security Answer (optional)"
            placeholder="Answer any security question posted by the finder..."
            rows={2}
            {...register('securityAnswer')}
          />

          <Textarea
            label="Additional Information (optional)"
            placeholder="Any other information that supports your claim..."
            rows={3}
            {...register('additionalInfo')}
          />

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setClaimModal(false)} className="btn-secondary">Cancel</button>
            <Button type="submit" loading={claimLoading}>Submit Claim</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
