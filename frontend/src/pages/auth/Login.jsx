import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const user = await login(data.email, data.password);
      toast.success(`Welcome back, ${user.first_name}!`);
      navigate('/dashboard');
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 cyber-grid"
      style={{ background: '#121214' }}>
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,240,255,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <Link to="/" className="block text-center mb-8">
          <div className="text-3xl font-black tracking-widest neon-text-cyan text-shadow-cyan">BACK2YOU</div>
          <div className="text-xs text-white/30 tracking-widest mt-1">RECOVERY NETWORK</div>
        </Link>

        <div className="rounded-2xl p-8"
          style={{ background: '#0D1117', border: '1px solid rgba(0,240,255,0.15)', boxShadow: '0 0 40px rgba(0,240,255,0.05)' }}>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Sign In</h1>
            <p className="text-white/40 text-sm mt-1">Access your recovery network</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              icon={Mail}
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
              })}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              icon={Lock}
              error={errors.password?.message}
              rightElement={
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="text-white/30 hover:text-white/60 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              {...register('password', { required: 'Password is required' })}
            />

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-neon-cyan/60 hover:text-neon-cyan transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Sign In <ArrowRight size={16} />
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-sm text-white/40">
              Don't have an account?{' '}
              <Link to="/register" className="text-neon-cyan hover:text-neon-cyan/80 font-medium transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="mt-4 p-4 rounded-xl text-xs"
          style={{ background: 'rgba(0,240,255,0.04)', border: '1px solid rgba(0,240,255,0.1)' }}>
          <p className="text-neon-cyan/60 font-medium mb-2">Demo Accounts:</p>
          <div className="space-y-1 text-white/40">
            <p>User: john@example.com / User@123456</p>
            <p>Admin: admin@back2you.com / Admin@123456</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
