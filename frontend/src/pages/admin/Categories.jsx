import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Plus, Pencil, PowerOff, Search, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios';
import Modal from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/Modal';

const DEFAULT_ICONS = ['📦', '📱', '💻', '🎒', '🔑', '💳', '👓', '🎧', '⌚', '📷', '🏠', '🐾', '💍', '📚', '👜', '🧳', '🚗', '🎮'];
const PRESET_COLORS = ['#00F0FF', '#FF007F', '#39FF14', '#FF3B3B', '#FF9500', '#AF52DE', '#5AC8FA', '#FFCC00'];

const emptyForm = { name: '', description: '', icon: '📦', color: '#00F0FF', sortOrder: 0 };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formModal, setFormModal] = useState(null); // null | { mode: 'create'|'edit', data: {} }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/categories');
      setCategories(res.data.data?.categories || []);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const openCreate = () => {
    setForm(emptyForm);
    setFormModal({ mode: 'create' });
  };

  const openEdit = (cat) => {
    setForm({
      name: cat.name,
      description: cat.description || '',
      icon: cat.icon || '📦',
      color: cat.color || '#00F0FF',
      sortOrder: cat.sort_order || 0,
    });
    setFormModal({ mode: 'edit', id: cat.id });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Category name is required.');
    setSubmitting(true);
    try {
      if (formModal.mode === 'create') {
        await api.post('/admin/categories', {
          name: form.name,
          description: form.description || null,
          icon: form.icon,
          color: form.color,
          sortOrder: parseInt(form.sortOrder) || 0,
        });
        toast.success('Category created.');
      } else {
        await api.put(`/admin/categories/${formModal.id}`, {
          name: form.name,
          description: form.description || null,
          icon: form.icon,
          color: form.color,
          sortOrder: parseInt(form.sortOrder) || 0,
        });
        toast.success('Category updated.');
      }
      fetchCategories();
      setFormModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin/categories/${deleteTarget.id}`);
      toast.success('Category deactivated.');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const filtered = categories.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Tag size={22} className="text-neon-cyan" /> Categories
          </h1>
          <p className="text-white/40 text-sm mt-1">Manage item categories for the platform</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #00F0FF, #FF007F)', color: '#000' }}
        >
          <Plus size={15} /> New Category
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          placeholder="Search categories..."
          className="input-field pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl p-5 animate-pulse"
              style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.05)', height: '120px' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-white/30 text-sm">
          No categories found
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((cat) => (
              <motion.div
                key={cat.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-xl p-5 group relative"
                style={{
                  background: `linear-gradient(135deg, ${cat.color}08, #0D1117)`,
                  border: `1px solid ${cat.color}20`,
                  opacity: cat.is_active ? 1 : 0.45,
                }}
              >
                {/* Icon & Name */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: cat.color + '15', border: `1px solid ${cat.color}30` }}
                    >
                      {cat.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white/90 text-sm">{cat.name}</h3>
                      {!cat.is_active && (
                        <span className="text-xs text-red-400/60">Inactive</span>
                      )}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(cat)}
                      className="p-1.5 rounded-lg text-white/30 hover:text-neon-cyan hover:bg-neon-cyan/10 transition-all"
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    {cat.is_active && (
                      <button
                        onClick={() => setDeleteTarget(cat)}
                        className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Deactivate"
                      >
                        <PowerOff size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Description */}
                {cat.description && (
                  <p className="text-xs text-white/40 mb-3 leading-relaxed line-clamp-2">{cat.description}</p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1 text-white/30">
                    <Hash size={10} />
                    <span>{(cat.lost_count || 0) + (cat.found_count || 0)} items</span>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-white/20">Lost: {cat.lost_count || 0}</span>
                    <span className="text-white/20">Found: {cat.found_count || 0}</span>
                  </div>
                </div>

                {/* Color bar */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl"
                  style={{ background: `linear-gradient(90deg, transparent, ${cat.color}, transparent)` }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={!!formModal}
        onClose={() => setFormModal(null)}
        title={formModal?.mode === 'create' ? 'New Category' : 'Edit Category'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs text-white/40 mb-2">Category Name *</label>
            <input
              type="text"
              className="input-field w-full"
              placeholder="e.g. Electronics"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-white/40 mb-2">Description</label>
            <textarea
              className="input-field w-full resize-none"
              rows={2}
              placeholder="Short description..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          {/* Icon picker */}
          <div>
            <label className="block text-xs text-white/40 mb-2">Icon</label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_ICONS.map(icon => (
                <button
                  type="button"
                  key={icon}
                  onClick={() => setForm(f => ({ ...f, icon }))}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                    form.icon === icon ? 'ring-2 ring-neon-cyan scale-110' : 'hover:bg-white/5'
                  }`}
                  style={{ background: form.icon === icon ? 'rgba(0,240,255,0.1)' : 'rgba(255,255,255,0.03)' }}
                >
                  {icon}
                </button>
              ))}
            </div>
            <input
              type="text"
              className="input-field mt-2 w-20 text-center text-xl"
              placeholder="🔖"
              value={form.icon}
              onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
              maxLength={4}
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-xs text-white/40 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap items-center">
              {PRESET_COLORS.map(c => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-white/50' : 'hover:scale-110'}`}
                  style={{ background: c }}
                />
              ))}
              <input
                type="color"
                className="w-8 h-8 rounded cursor-pointer bg-transparent border border-white/10"
                value={form.color}
                onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                title="Custom color"
              />
            </div>
          </div>

          {/* Sort order */}
          <div>
            <label className="block text-xs text-white/40 mb-2">Sort Order</label>
            <input
              type="number"
              className="input-field w-24"
              min={0}
              value={form.sortOrder}
              onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))}
            />
          </div>

          {/* Preview */}
          <div
            className="rounded-xl p-4 flex items-center gap-3"
            style={{
              background: `linear-gradient(135deg, ${form.color}10, #0D1117)`,
              border: `1px solid ${form.color}25`,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: form.color + '15' }}
            >
              {form.icon}
            </div>
            <div>
              <p className="font-semibold text-white/90 text-sm">{form.name || 'Category Name'}</p>
              {form.description && <p className="text-xs text-white/40 truncate max-w-[200px]">{form.description}</p>}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => setFormModal(null)}
              className="btn-secondary text-sm px-4 py-2"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="text-sm px-5 py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #00F0FF, #FF007F)', color: '#000' }}
            >
              {submitting ? 'Saving...' : formModal?.mode === 'create' ? 'Create Category' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Deactivate Confirm */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeactivate}
        title="Deactivate Category"
        message={`Deactivating "${deleteTarget?.name}" will hide it from new item reports. Existing items won't be affected.`}
        confirmText="Deactivate"
        variant="danger"
      />
    </div>
  );
}
