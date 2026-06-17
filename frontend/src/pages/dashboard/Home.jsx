import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Package, FileText, Bell, TrendingUp, Plus, ArrowRight, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/axios';
import { formatDistanceToNow } from 'date-fns';

function StatCard({ icon: Icon, label, value, sub, color, href }) {
  return (
    <Link to={href || '#'}>
      <motion.div
        whileHover={{ y: -3 }}
        className="rounded-xl p-6 cursor-pointer transition-all"
        style={{
          background: `linear-gradient(135deg, ${color}08, ${color}04)`,
          border: `1px solid ${color}20`,
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
            <Icon size={18} style={{ color }} />
          </div>
          <span className="text-2xl font-black" style={{ color }}>{value}</span>
        </div>
        <p className="text-sm font-medium text-white/70">{label}</p>
        {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
      </motion.div>
    </Link>
  );
}

export default function DashboardHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentLost, setRecentLost] = useState([]);
  const [recentFound, setRecentFound] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, lostRes, foundRes] = await Promise.all([
          api.get('/users/me/stats'),
          api.get('/lost-items/my?limit=3'),
          api.get('/found-items/my?limit=3'),
        ]);
        setStats(statsRes.data.data);
        setRecentLost(lostRes.data.data || []);
        setRecentFound(foundRes.data.data || []);
      } catch {}
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {greeting}, <span className="gradient-text">{user?.first_name}</span>
          </h1>
          <p className="text-white/40 text-sm mt-1">Welcome to your recovery command center</p>
        </div>
        <div className="flex gap-3">
          <Link to="/dashboard/lost/create" className="btn-secondary text-sm">
            <Plus size={15} /> Report Lost
          </Link>
          <Link to="/dashboard/found/create" className="btn-primary text-sm">
            <Plus size={15} /> Report Found
          </Link>
        </div>
      </div>

      {/* Stats */}
      {!loading && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={MapPin} label="Lost Items" color="#00F0FF"
            value={stats.lostItems?.total || 0}
            sub={`${stats.lostItems?.active || 0} active`}
            href="/dashboard/lost"
          />
          <StatCard
            icon={Package} label="Found Items" color="#FF007F"
            value={stats.foundItems?.total || 0}
            sub={`${stats.foundItems?.available || 0} available`}
            href="/dashboard/found"
          />
          <StatCard
            icon={FileText} label="Claims" color="#39FF14"
            value={stats.claims?.total || 0}
            sub={`${stats.claims?.approved || 0} approved`}
            href="/dashboard/claims"
          />
          <StatCard
            icon={TrendingUp} label="Recoveries" color="#00F0FF"
            value={stats.lostItems?.recovered || 0}
            sub="items recovered"
          />
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Lost */}
        <div className="rounded-xl p-6" style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <MapPin size={16} className="text-neon-cyan" /> My Lost Items
            </h3>
            <Link to="/dashboard/lost" className="text-xs text-neon-cyan/60 hover:text-neon-cyan flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentLost.length === 0 ? (
              <div className="text-center py-6">
                <MapPin size={24} className="text-white/10 mx-auto mb-2" />
                <p className="text-xs text-white/30">No lost items reported yet</p>
                <Link to="/dashboard/lost/create" className="btn-primary text-xs px-4 py-2 mt-3 inline-flex">
                  Report Lost Item
                </Link>
              </div>
            ) : (
              recentLost.map(item => (
                <Link key={item.id} to={`/dashboard/lost/${item.uuid}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/3 transition-all group">
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                    {item.primary_image ? (
                      <img src={item.primary_image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20 text-lg">{item.category_icon || '📦'}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/80 truncate group-hover:text-white">{item.title}</p>
                    <p className="text-xs text-white/30 flex items-center gap-1 mt-0.5">
                      <Clock size={10} /> {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <span className={`badge-${item.status === 'active' ? 'cyan' : item.status === 'recovered' ? 'green' : 'gray'} text-xs`}>
                    {item.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Found */}
        <div className="rounded-xl p-6" style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Package size={16} className="text-neon-pink" /> My Found Items
            </h3>
            <Link to="/dashboard/found" className="text-xs text-neon-pink/60 hover:text-neon-pink flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentFound.length === 0 ? (
              <div className="text-center py-6">
                <Package size={24} className="text-white/10 mx-auto mb-2" />
                <p className="text-xs text-white/30">No found items reported yet</p>
                <Link to="/dashboard/found/create" className="btn-primary text-xs px-4 py-2 mt-3 inline-flex">
                  Report Found Item
                </Link>
              </div>
            ) : (
              recentFound.map(item => (
                <Link key={item.id} to={`/dashboard/found/${item.uuid}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/3 transition-all group">
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                    {item.primary_image ? (
                      <img src={item.primary_image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20 text-lg">{item.category_icon || '📦'}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/80 truncate group-hover:text-white">{item.title}</p>
                    <p className="text-xs text-white/30 flex items-center gap-1 mt-0.5">
                      <Clock size={10} /> {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <span className={`badge-${item.status === 'available' ? 'cyan' : item.status === 'returned' ? 'green' : 'gray'} text-xs`}>
                    {item.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
