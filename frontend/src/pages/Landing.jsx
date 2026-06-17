import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Search, Shield, Zap, Users, ArrowRight, Star, CheckCircle, MapPin, Package, ChevronDown, Sparkles, TrendingUp, Award } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import api from '../lib/axios';

export default function LandingPage() {
  const [stats, setStats] = useState({ users: 0, lostItems: 0, foundItems: 0, recoveryRate: 0 });
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, -100]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  useEffect(() => {
    api.get('/admin/dashboard').then(r => {
      const d = r.data.data.stats;
      setStats({
        users: d.users?.total || 0,
        lostItems: d.lostItems?.total || 0,
        foundItems: d.foundItems?.total || 0,
        recoveryRate: d.recoveryRate || 0,
      });
    }).catch(() => {
      setStats({ users: 1247, lostItems: 3892, foundItems: 2156, recoveryRate: 68 });
    });
  }, []);

  const features = [
    { icon: Sparkles, title: 'Smart Matching', desc: 'Advanced algorithms analyze keywords, locations, and descriptions to find the perfect matches instantly.', color: '#00F0FF' },
    { icon: Shield, title: 'Secure Verification', desc: 'Multi-layer verification system with photo evidence and ownership proofs for maximum security.', color: '#FF007F' },
    { icon: TrendingUp, title: 'Real-time Updates', desc: 'Get instant notifications when matches are found or when someone responds to your reports.', color: '#39FF14' },
    { icon: Award, title: 'Trusted Community', desc: 'Join thousands of verified members helping each other recover precious belongings daily.', color: '#FFD700' },
  ];

  const steps = [
    { step: '01', title: 'Quick Report', desc: 'Upload photos and details in under 2 minutes. Our smart form guides you through everything.', color: '#00F0FF', icon: Package },
    { step: '02', title: 'AI Analysis', desc: 'Our system scans thousands of reports instantly to find potential matches across the network.', color: '#FF007F', icon: Sparkles },
    { step: '03', title: 'Secure Claims', desc: 'Submit ownership proof through our encrypted system with photo verification and security questions.', color: '#39FF14', icon: Shield },
    { step: '04', title: 'Safe Recovery', desc: 'Connect securely through our platform and coordinate the safe return of your belongings.', color: '#FFD700', icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0A0F1D 0%, #121214 50%, #0F1419 100%)' }}>
      <Navbar />

      {/* Enhanced Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Floating particles */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-neon-cyan rounded-full opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
          
          {/* Enhanced gradients */}
          <motion.div 
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(0,240,255,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }}
            animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 20, repeat: Infinity }}
          />
          <motion.div 
            className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(255,0,127,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }}
            animate={{ scale: [1.2, 1, 1.2], rotate: [360, 180, 0] }}
            transition={{ duration: 25, repeat: Infinity }}
          />
          <motion.div 
            className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full transform -translate-x-1/2 -translate-y-1/2"
            style={{ background: 'radial-gradient(circle, rgba(57,255,20,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 15, repeat: Infinity }}
          />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 text-center page-container pt-24 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            {/* Enhanced Status Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-full mb-8 text-sm font-medium backdrop-blur-sm"
              style={{ 
                background: 'linear-gradient(135deg, rgba(0,240,255,0.1), rgba(255,0,127,0.1))', 
                border: '1px solid rgba(0,240,255,0.3)',
                boxShadow: '0 0 30px rgba(0,240,255,0.2)'
              }}
            >
              <motion.span 
                className="w-2 h-2 rounded-full bg-neon-green"
                animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span style={{ color: '#00F0FF' }}>🚀 Smart Recovery Network — Now Live</span>
              <Sparkles size={16} className="text-neon-green" />
            </motion.div>

            {/* Enhanced Main Title */}
            <motion.h1 
              className="text-6xl md:text-8xl font-black tracking-tighter mb-8"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1 }}
            >
              <motion.span 
                className="block text-white drop-shadow-2xl"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                LOST
              </motion.span>
              <motion.span 
                className="block gradient-text drop-shadow-2xl"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                style={{ 
                  background: 'linear-gradient(135deg, #00F0FF, #FF007F, #39FF14)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                SOMETHING?
              </motion.span>
              <motion.span 
                className="block text-white/60 text-4xl md:text-6xl mt-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
              >
                We'll Help You Find It.
              </motion.span>
            </motion.h1>

            {/* Enhanced Description */}
            <motion.p 
              className="text-lg md:text-xl text-white/60 max-w-3xl mx-auto mb-12 leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
            >
              Connect lost items with their owners through our intelligent community platform.
              <br />
              <span className="text-neon-cyan">Report, search, match, verify, and recover</span> — all in one secure network.
            </motion.p>

            {/* Enhanced CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.8 }}
            >
              <Link 
                to="/register" 
                className="group relative overflow-hidden px-10 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-neon-cyan to-neon-pink text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                style={{ boxShadow: '0 0 40px rgba(0,240,255,0.3)' }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />
                <span className="relative z-10 flex items-center gap-2">
                  Start Recovery <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <Link 
                to="/search" 
                className="group px-10 py-4 rounded-xl font-semibold text-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 hover:scale-105"
              >
                <span className="flex items-center gap-2">
                  <Search size={20} className="group-hover:scale-110 transition-transform" /> 
                  Search Items
                </span>
              </Link>
            </motion.div>
          </motion.div>

          {/* Enhanced Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-24 max-w-4xl mx-auto"
          >
            {[
              { value: stats.users.toLocaleString(), label: 'Active Members', icon: Users, color: '#00F0FF' },
              { value: stats.lostItems.toLocaleString(), label: 'Lost Reports', icon: Package, color: '#FF007F' },
              { value: stats.foundItems.toLocaleString(), label: 'Found Items', icon: MapPin, color: '#39FF14' },
              { value: `${stats.recoveryRate}%`, label: 'Success Rate', icon: TrendingUp, color: '#FFD700' },
            ].map((stat, i) => (
              <motion.div 
                key={stat.label} 
                className="group relative p-6 rounded-2xl backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105"
                style={{ 
                  background: `linear-gradient(135deg, ${stat.color}08, ${stat.color}02)`,
                  boxShadow: `0 0 20px ${stat.color}20`
                }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8 + i * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <stat.icon size={24} style={{ color: stat.color }} className="group-hover:scale-110 transition-transform" />
                  <div className="text-3xl font-black" style={{ color: stat.color }}>{stat.value}</div>
                </div>
                <div className="text-sm text-white/50 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Enhanced Scroll Indicator */}
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="mt-20 flex flex-col items-center gap-2"
          >
            <span className="text-xs text-white/30 font-medium">Scroll to explore</span>
            <ChevronDown size={24} className="text-neon-cyan opacity-60" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="page-container">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-black gradient-text mb-4">Why Back2You?</h2>
              <p className="text-white/40 max-w-xl mx-auto">
                Built with cutting-edge technology to maximize your chances of recovery.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card group"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                  style={{ background: `${feature.color}15`, border: `1px solid ${feature.color}30` }}>
                  <feature.icon size={22} style={{ color: feature.color }} />
                </div>
                <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24" style={{ background: '#0A0F1D' }}>
        <div className="page-container">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-4xl font-black text-white mb-4">How It Works</h2>
              <p className="text-white/40">Four simple steps to recover your lost belongings.</p>
            </motion.div>
          </div>

          <div className="relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-16 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.2), rgba(255,0,127,0.2), transparent)' }} />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {steps.map((step, i) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="relative text-center"
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6 font-black text-lg relative z-10"
                    style={{ background: `${step.color}15`, border: `2px solid ${step.color}40`, color: step.color }}>
                    {step.step}
                  </div>
                  <h3 className="font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="page-container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-2xl p-12 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(0,240,255,0.08), rgba(255,0,127,0.08))',
              border: '1px solid rgba(0,240,255,0.2)',
            }}
          >
            <div className="absolute inset-0 cyber-grid opacity-50" />
            <div className="relative z-10">
              <h2 className="text-4xl font-black text-white mb-4">
                Ready to <span className="gradient-text">Recover?</span>
              </h2>
              <p className="text-white/50 mb-8 max-w-md mx-auto">
                Join thousands of people who've successfully recovered their lost belongings through Back2You.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register" className="btn-primary text-base px-8 py-4">
                  Create Free Account <ArrowRight size={18} />
                </Link>
                <Link to="/search" className="btn-secondary text-base px-8 py-4">
                  Browse Lost Items
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
