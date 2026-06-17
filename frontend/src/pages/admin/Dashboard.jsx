import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, MapPin, Package, FileText, TrendingUp, Activity, BarChart2 } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../../lib/axios';
import { formatDistanceToNow } from 'date-fns';

function StatCard({ icon: Icon, label, value, sub, color, change }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-5"
      style={{
        background: `linear-gradient(135deg, ${color}08, #0D1117)`,
        border: `1px solid ${color}20`,
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          <Icon size={18} style={{ color }} />
        </div>
        {change !== undefined && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${change >= 0 ? 'text-neon-green bg-neon-green/10' : 'text-red-400 bg-red-500/10'}`}>
            {change >= 0 ? '+' : ''}{change} today
          </span>
        )}
      </div>
      <div className="text-3xl font-black" style={{ color }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <p className="text-sm text-white/50 mt-1">{label}</p>
      {sub && <p className="text-xs text-white/30 mt-0.5">{sub}</p>}
    </motion.div>
  );
}

const COLORS = ['#00F0FF', '#FF007F', '#39FF14', '#FF3B3B'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 rounded-lg text-xs" style={{ background: '#0D1117', border: '1px solid rgba(0,240,255,0.2)' }}>
        <p className="text-white/60 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [growthData, setGrowthData] = useState({ userGrowth: [], itemGrowth: [] });
  const [categoryStats, setCategoryStats] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [claimStats, setClaimStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dashRes, growthRes, claimRes] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/admin/analytics/growth?period=30d'),
          api.get('/admin/analytics/claims'),
        ]);
        setStats(dashRes.data.data.stats);
        setCategoryStats(dashRes.data.data.categoryStats || []);
        setRecentActivity(dashRes.data.data.recentActivity || []);
        setGrowthData(growthRes.data.data);
        setClaimStats(claimRes.data.data || []);
      } catch {}
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl p-5 animate-pulse" style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.05)', height: '140px' }} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart2 size={22} className="text-neon-pink" /> Control Center
        </h1>
        <p className="text-white/40 text-sm mt-1">Platform analytics and management</p>
      </div>

      {/* Main Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard icon={Users} label="Total Users" color="#00F0FF"
            value={stats.users?.total || 0}
            sub={`${stats.users?.active || 0} active`}
            change={stats.users?.today || 0} />
          <StatCard icon={MapPin} label="Lost Reports" color="#FF007F"
            value={stats.lostItems?.total || 0}
            sub={`${stats.lostItems?.active || 0} active`}
            change={stats.lostItems?.today || 0} />
          <StatCard icon={Package} label="Found Reports" color="#39FF14"
            value={stats.foundItems?.total || 0}
            sub={`${stats.foundItems?.available || 0} available`}
            change={stats.foundItems?.today || 0} />
          <StatCard icon={FileText} label="Claims" color="#00F0FF"
            value={stats.claims?.total || 0}
            sub={`${stats.claims?.approved || 0} approved`}
            change={stats.claims?.today || 0} />
          <StatCard icon={TrendingUp} label="Recovery Rate" color="#39FF14"
            value={`${stats.recoveryRate || 0}%`}
            sub="items recovered" />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <div className="rounded-xl p-6" style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="font-semibold text-white mb-5">User Growth (30 days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={growthData.userGrowth}>
              <defs>
                <linearGradient id="cgCyan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00F0FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10 }} tickFormatter={v => v?.slice(5)} />
              <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" name="New Users" stroke="#00F0FF" fill="url(#cgCyan)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Item Reports Chart */}
        <div className="rounded-xl p-6" style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="font-semibold text-white mb-5">Daily Reports (30 days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={growthData.itemGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10 }} tickFormatter={v => v?.slice(5)} />
              <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }} />
              <Bar dataKey="lost_count" name="Lost" fill="#FF007F" fillOpacity={0.8} radius={[2,2,0,0]} />
              <Bar dataKey="found_count" name="Found" fill="#00F0FF" fillOpacity={0.8} radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Pie */}
        <div className="rounded-xl p-6" style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="font-semibold text-white mb-4">Items by Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={categoryStats.slice(0, 6)}
                dataKey="lost_count"
                nameKey="name"
                cx="50%" cy="50%"
                outerRadius={70}
                strokeWidth={0}
              >
                {categoryStats.slice(0, 6).map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1">
            {categoryStats.slice(0, 4).map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-white/50">{cat.icon} {cat.name}</span>
                </div>
                <span className="text-white/30">{cat.lost_count + cat.found_count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-xl p-6" style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Activity size={15} className="text-neon-pink" /> Recent Activity
          </h3>
          <div className="space-y-3 overflow-y-auto max-h-64">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-white/30 text-center py-4">No recent activity</p>
            ) : recentActivity.map((log, i) => (
              <div key={i} className="flex items-start gap-3 text-xs">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs"
                  style={{ background: 'linear-gradient(135deg, #00F0FF33, #FF007F33)', color: '#00F0FF' }}>
                  {log.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-white/50">{log.username && `@${log.username} `}</span>
                  <span className="text-white/30">{log.action?.replace(/_/g, ' ')}</span>
                  {log.resource_type && <span className="text-white/20"> · {log.resource_type}</span>}
                </div>
                <span className="text-white/20 flex-shrink-0">
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
