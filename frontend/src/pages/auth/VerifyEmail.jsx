import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import api from '../../lib/axios';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    api.get(`/auth/verify-email/${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#121214' }}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        {status === 'loading' && (
          <>
            <Loader size={48} className="text-neon-cyan animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white">Verifying your email...</h2>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(57,255,20,0.1)', border: '2px solid rgba(57,255,20,0.3)' }}>
              <CheckCircle size={36} className="text-neon-green" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
            <p className="text-white/40 mb-6">Your account is now active. Welcome to Back2You!</p>
            <Link to="/login" className="btn-primary">Sign In Now</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(255,59,59,0.1)', border: '2px solid rgba(255,59,59,0.3)' }}>
              <XCircle size={36} className="text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
            <p className="text-white/40 mb-6">The verification link is invalid or expired.</p>
            <Link to="/login" className="btn-secondary">Back to Sign In</Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
