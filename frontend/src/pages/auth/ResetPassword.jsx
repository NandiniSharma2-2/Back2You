import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const token = searchParams.get('token');
  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password: data.password });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Token may be expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#121214' }}>
      <div className="text-center">
        <p className="text-white/40">Invalid reset link.</p>
        <Link to="/forgot-password" className="btn-primary mt-4">Request New Link</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#121214' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link to="/" className="block text-center mb-8">
          <div className="text-3xl font-black tracking-widest neon-text-cyan">BACK2YOU</div>
        </Link>
        <div className="rounded-2xl p-8" style={{ background: '#0D1117', border: '1px solid rgba(0,240,255,0.15)' }}>
          <h1 className="text-2xl font-bold text-white mb-1">Reset Password</h1>
          <p className="text-white/40 text-sm mb-6">Choose a strong new password.</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              icon={Lock}
              error={errors.password?.message}
              rightElement={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-white/30 hover:text-white/60">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              {...register('password', {
                required: 'Password required',
                minLength: { value: 8, message: 'Min 8 characters' },
                pattern: { value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: 'Must contain uppercase, lowercase, number' },
              })}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Please confirm',
                validate: v => v === password || 'Passwords must match',
              })}
            />
            <Button type="submit" loading={loading} className="w-full">Reset Password</Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
