import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Package, Calendar, DollarSign, Filter, X } from 'lucide-react';
import api from '../lib/axios';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import StatusBadge from '../components/ui/StatusBadge';
import Pagination from '../components/ui/Pagination';
import { format } from 'date-fns';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const type = searchParams.get('type') || 'lost';
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const location = searchParams.get('location') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const updateParams = (updates) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v) newParams.set(k, v);
      else newParams.delete(k);
    });
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  useEffect(() => {
    api.get('/admin/categories/public')
      .then(r => setCategories(r.data.data.categories || []))
      .catch(() => {});
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (location) params.set('location', location);

      const endpoint = type === 'lost' ? `/lost-items?${params}&status=active` : `/found-items?${params}&status=available`;
      const res = await api.get(endpoint);
      setItems(res.data.data || []);
      setPagination(res.data.pagination);
    } catch {}
    finally { setLoading(false); }
  }, [type, search, category, location, page]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const setPage = (p) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', p.toString());
    setSearchParams(newParams);
  };

  return (
    <div className="min-h-screen" style={{ background: '#121214' }}>
      <Navbar />
      <div className="page-container pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">
            Search <span className="gradient-text">{type === 'lost' ? 'Lost' : 'Found'} Items</span>
          </h1>
          <p className="text-white/40">Browse and search through all reported items</p>
        </div>

        {/* Search Bar */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="flex-1 min-w-64 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search items, brands, colors..."
              defaultValue={search}
              onKeyDown={e => e.key === 'Enter' && updateParams({ search: e.target.value })}
              onChange={e => !e.target.value && updateParams({ search: '' })}
              className="input-field pl-10 pr-4"
            />
          </div>

          <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#0A0F1D' }}>
            {['lost', 'found'].map(t => (
              <button key={t} onClick={() => updateParams({ type: t })}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${type === t ? 'bg-gradient-cyber text-black font-bold' : 'text-white/40 hover:text-white/70'}`}>
                {t}
              </button>
            ))}
          </div>

          <button onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${showFilters ? 'border-neon-cyan text-neon-cyan' : ''}`}>
            <Filter size={15} /> Filters {(category || location) ? '•' : ''}
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4"
            style={{ background: '#0D1117', border: '1px solid rgba(0,240,255,0.1)' }}
          >
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2">Category</label>
              <select
                className="input-field"
                value={category}
                onChange={e => updateParams({ category: e.target.value })}
                style={{ background: 'rgba(255,255,255,0.04)', color: '#e2e8f0' }}
              >
                <option value="" style={{ background: '#0A0F1D' }}>All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id} style={{ background: '#0A0F1D' }}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2">Location</label>
              <input
                type="text"
                placeholder="City, area..."
                defaultValue={location}
                onKeyDown={e => e.key === 'Enter' && updateParams({ location: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="flex items-end">
              <button onClick={() => { updateParams({ category: '', location: '' }); }}
                className="btn-ghost text-sm text-white/40 flex items-center gap-1.5 hover:text-red-400">
                <X size={14} /> Clear Filters
              </button>
            </div>
          </motion.div>
        )}

        {/* Category Quick Filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8 pb-2">
          <button onClick={() => updateParams({ category: '' })}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm transition-all ${!category ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            All
          </button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => updateParams({ category: cat.id.toString() })}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all ${category === cat.id.toString() ? 'text-black font-bold' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
              style={{
                background: category === cat.id.toString() ? cat.color : 'transparent',
                border: `1px solid ${category === cat.id.toString() ? cat.color : 'rgba(255,255,255,0.08)'}`,
              }}>
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden animate-pulse" style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="aspect-video bg-white/5" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-white/3 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Search size={48} className="text-white/10 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white/40 mb-2">No items found</h3>
            <p className="text-white/20 text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-white/30 mb-4">{pagination?.total || 0} results</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="group"
                >
                  <Link
                    to={`/dashboard/${type}/${item.uuid}`}
                    className="block rounded-xl overflow-hidden transition-all duration-300 group-hover:shadow-card-hover"
                    style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,240,255,0.2)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                  >
                    <div className="aspect-video overflow-hidden bg-white/5 relative">
                      {item.primary_image ? (
                        <img src={item.primary_image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">
                          {item.category_icon || '📦'}
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <StatusBadge status={item.status} />
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-white/80 text-sm group-hover:text-white transition-colors truncate">
                        {item.title}
                      </h3>
                      <p className="text-xs text-white/30 flex items-center gap-1 mt-1.5 truncate">
                        <MapPin size={10} /> {item.location}
                      </p>
                      <p className="text-xs text-white/20 flex items-center gap-1 mt-1">
                        <Calendar size={10} />
                        {format(new Date(item.date_lost || item.date_found), 'MMM d, yyyy')}
                      </p>
                      {item.reward > 0 && (
                        <p className="text-xs text-neon-green flex items-center gap-1 mt-1">
                          <DollarSign size={10} /> ${item.reward} reward
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}

        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>
      <Footer />
    </div>
  );
}
