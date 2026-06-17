import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, RotateCcw, Info, Shield, Bell, Mail, Layers, Database } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios';

// Map setting keys to human-friendly metadata
const SETTING_META = {
  site_name:            { label: 'Site Name',              group: 'General',       icon: Layers,   type: 'text',    description: 'The name of the platform shown to users.' },
  site_description:     { label: 'Site Description',       group: 'General',       icon: Layers,   type: 'textarea',description: 'Short description shown in meta tags and footers.' },
  contact_email:        { label: 'Contact Email',          group: 'General',       icon: Mail,     type: 'email',   description: 'Public contact address shown on the landing page.' },
  max_images_per_item:  { label: 'Max Images Per Item',    group: 'Limits',        icon: Database, type: 'number',  description: 'Maximum number of images a user can upload per report.' },
  max_claims_per_user:  { label: 'Max Claims Per User',    group: 'Limits',        icon: Database, type: 'number',  description: 'Maximum simultaneous active claims a user can have.' },
  items_per_page:       { label: 'Items Per Page',         group: 'Limits',        icon: Database, type: 'number',  description: 'Default pagination size for listings.' },
  email_verification_required: { label: 'Require Email Verification', group: 'Security', icon: Shield, type: 'boolean', description: 'If enabled, new accounts must verify their email before logging in.' },
  registration_enabled: { label: 'Allow New Registrations',group: 'Security',      icon: Shield,   type: 'boolean', description: 'Toggle user registration on or off.' },
  notification_email_enabled: { label: 'Email Notifications',    group: 'Notifications', icon: Bell, type: 'boolean', description: 'Send email notifications for claims, matches, etc.' },
  match_score_threshold:{ label: 'Match Score Threshold',  group: 'Matching',      icon: Layers,   type: 'number',  description: 'Minimum AI match score (0-100) to surface suggestions.' },
};

const GROUP_ICONS = { General: Layers, Limits: Database, Security: Shield, Notifications: Bell, Matching: Layers };
const GROUP_COLORS = { General: '#00F0FF', Limits: '#FF007F', Security: '#39FF14', Notifications: '#FF9500', Matching: '#AF52DE' };

export default function AdminSettings() {
  const [settings, setSettings] = useState([]);
  const [edited, setEdited] = useState({});   // { key: newValue }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/settings');
      setSettings(res.data.data?.settings || []);
      setEdited({});
    } catch {
      toast.error('Failed to load settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const getValue = (key) => {
    if (key in edited) return edited[key];
    const s = settings.find(s => s.setting_key === key);
    return s ? s.setting_value : '';
  };

  const isDirty = (key) => key in edited && edited[key] !== settings.find(s => s.setting_key === key)?.setting_value;

  const handleChange = (key, val) => {
    setEdited(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async (key) => {
    setSaving(prev => ({ ...prev, [key]: true }));
    try {
      await api.put(`/admin/settings/${key}`, { value: edited[key] ?? getValue(key) });
      toast.success('Setting saved.');
      // Sync into settings array
      setSettings(prev => prev.map(s => s.setting_key === key ? { ...s, setting_value: edited[key] } : s));
      setEdited(prev => { const n = { ...prev }; delete n[key]; return n; });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save setting.');
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleReset = (key) => {
    setEdited(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  // Group settings
  const grouped = {};
  settings.forEach(s => {
    const meta = SETTING_META[s.setting_key];
    const group = meta?.group || 'Other';
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(s);
  });

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl p-6 animate-pulse space-y-4"
            style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="h-5 bg-white/5 rounded w-32" />
            {[...Array(2)].map((_, j) => (
              <div key={j} className="h-12 bg-white/5 rounded" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings size={22} className="text-neon-cyan" /> System Settings
          </h1>
          <p className="text-white/40 text-sm mt-1">Configure platform-wide settings and behaviour</p>
        </div>
        {Object.keys(edited).length > 0 && (
          <div className="flex items-center gap-2 text-xs text-neon-cyan px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.2)' }}>
            <Info size={12} /> {Object.keys(edited).length} unsaved change{Object.keys(edited).length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Groups */}
      {Object.entries(grouped).map(([group, groupSettings]) => {
        const GroupIcon = GROUP_ICONS[group] || Layers;
        const color = GROUP_COLORS[group] || '#00F0FF';

        return (
          <motion.div
            key={group}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {/* Group header */}
            <div className="px-6 py-4 flex items-center gap-3"
              style={{ background: `linear-gradient(135deg, ${color}08, #080C18)`, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: color + '15', border: `1px solid ${color}30` }}>
                <GroupIcon size={15} style={{ color }} />
              </div>
              <div>
                <h2 className="font-semibold text-white/90 text-sm">{group}</h2>
                <p className="text-xs text-white/30">{groupSettings.length} setting{groupSettings.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Settings */}
            <div className="divide-y divide-white/[0.04]" style={{ background: '#0D1117' }}>
              {groupSettings.map(s => {
                const meta = SETTING_META[s.setting_key];
                const val = getValue(s.setting_key);
                const dirty = isDirty(s.setting_key);
                const isSaving = saving[s.setting_key];
                const inputType = meta?.type || s.value_type || 'text';

                return (
                  <div key={s.setting_key} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <label className="text-sm font-medium text-white/80">
                            {meta?.label || s.setting_key.replace(/_/g, ' ')}
                          </label>
                          {dirty && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
                              Modified
                            </span>
                          )}
                        </div>
                        {meta?.description && (
                          <p className="text-xs text-white/30 mb-3">{meta.description}</p>
                        )}

                        {/* Input */}
                        {inputType === 'boolean' ? (
                          <button
                            type="button"
                            onClick={() => handleChange(s.setting_key, val === 'true' || val === '1' ? 'false' : 'true')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                              val === 'true' || val === '1' ? 'bg-neon-green/70' : 'bg-white/10'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                val === 'true' || val === '1' ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        ) : inputType === 'textarea' ? (
                          <textarea
                            className="input-field w-full max-w-lg resize-none"
                            rows={3}
                            value={val}
                            onChange={e => handleChange(s.setting_key, e.target.value)}
                          />
                        ) : (
                          <input
                            type={inputType === 'number' ? 'number' : inputType === 'email' ? 'email' : 'text'}
                            className="input-field w-full max-w-sm"
                            value={val}
                            min={inputType === 'number' ? 0 : undefined}
                            onChange={e => handleChange(s.setting_key, e.target.value)}
                          />
                        )}
                      </div>

                      {/* Save / Reset */}
                      <div className="flex items-center gap-2 pt-6 flex-shrink-0">
                        {dirty && (
                          <button
                            onClick={() => handleReset(s.setting_key)}
                            className="p-1.5 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/5 transition-all"
                            title="Reset to saved"
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleSave(s.setting_key)}
                          disabled={isSaving || !dirty}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            dirty
                              ? 'text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/10'
                              : 'text-white/20 border border-white/5 cursor-not-allowed'
                          } disabled:opacity-50`}
                        >
                          <Save size={12} /> {isSaving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })}

      {settings.length === 0 && !loading && (
        <div className="text-center py-16 text-white/30 text-sm">
          No settings found. Run database migrations to seed initial settings.
        </div>
      )}
    </div>
  );
}
