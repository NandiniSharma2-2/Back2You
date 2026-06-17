import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ background: '#0A0F1D', borderTop: '1px solid rgba(0,240,255,0.08)' }}>
      <div className="page-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="text-2xl font-black tracking-widest neon-text-cyan mb-4">BACK2YOU</div>
            <p className="text-white/40 text-sm leading-relaxed max-w-sm">
              A community-driven lost and found platform helping people recover
              what matters most through intelligent matching, verification, and collaboration.
            </p>
            <div className="flex gap-4 mt-6">
              {['Twitter', 'Discord', 'GitHub'].map(platform => (
                <a key={platform} href="#" className="text-xs text-white/30 hover:text-neon-cyan transition-colors">
                  {platform}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold tracking-widest text-white/40 mb-4">PLATFORM</h4>
            <div className="space-y-3">
              {[
                { label: 'Report Lost Item', href: '/dashboard/lost/create' },
                { label: 'Report Found Item', href: '/dashboard/found/create' },
                { label: 'Search Items', href: '/search' },
                { label: 'How It Works', href: '/#how-it-works' },
              ].map(link => (
                <Link key={link.label} to={link.href}
                  className="block text-sm text-white/40 hover:text-neon-cyan transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold tracking-widest text-white/40 mb-4">ACCOUNT</h4>
            <div className="space-y-3">
              {[
                { label: 'Sign In', href: '/login' },
                { label: 'Register', href: '/register' },
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'My Claims', href: '/dashboard/claims' },
              ].map(link => (
                <Link key={link.label} to={link.href}
                  className="block text-sm text-white/40 hover:text-neon-cyan transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-xs text-white/20">© 2024 Back2You. All rights reserved.</p>
          <div className="flex gap-6">
            {['Privacy Policy', 'Terms of Service', 'Contact'].map(item => (
              <a key={item} href="#" className="text-xs text-white/20 hover:text-white/50 transition-colors">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
