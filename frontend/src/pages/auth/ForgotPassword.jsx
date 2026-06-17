import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle, ArrowLeft } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', data);
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#121214' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link to="/" className="block text-center mb-8">
          <div className="text-3xl font-black tracking-widest neon-text-cyan">BACK2YOU</div>
        </Link>

        <div className="rounded-2xl p-8" style={{ background: '#0D1117', border: '1px solid rgba(0,240,255,0.15)' }}>
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(57,255,20,0.1)', border: '2px solid rgba(57,255,20,0.3)' }}>
                <CheckCircle size={28} className="text-neon-green" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Check Your Email</h2>
              <p className="text-white/40 text-sm mb-6">If that email is registered, you'll receive reset instructions shortly.</p>
              <Link to="/login" className="btn-secondary w-full inline-flex justify-center">
                <ArrowLeft size={16} /> Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Forgot Password?</h1>
                <p className="text-white/40 text-sm mt-1">Enter your email to receive reset instructions.</p>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  icon={Mail}
                  error={errors.email?.message}
                  {...register('email', { required: 'Email required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } })}
                />
                <Button type="submit" loading={loading} className="w-full">
                  Send Reset Link <ArrowRight size={16} />
                </Button>
              </form>
              <div className="mt-4 text-center">
                <Link to="/login" className="text-sm text-white/40 hover:text-white/70 inline-flex items-center gap-1">
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
