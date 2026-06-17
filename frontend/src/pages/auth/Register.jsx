import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Mail, Lock, Phone, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function RegisterPage() {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await registerAuth({
        username: data.username,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      });
      setSuccess(true);
      toast.success('Account created! Please check your email.');
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#121214' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(57,255,20,0.1)', border: '2px solid rgba(57,255,20,0.3)' }}
          >
            <CheckCircle size={36} className="text-neon-green" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-3">Account Created!</h2>
          <p className="text-white/50 mb-8">
            We've sent a verification email to your inbox. Verify to activate your account.
          </p>
          <Link to="/login" className="btn-primary">
            Go to Sign In <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 cyber-grid"
      style={{ background: '#121214' }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/3 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,0,127,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <Link to="/" className="block text-center mb-8">
          <div className="text-3xl font-black tracking-widest neon-text-cyan">BACK2YOU</div>
          <div className="text-xs text-white/30 tracking-widest mt-1">CREATE YOUR ACCOUNT</div>
        </Link>

        <div className="rounded-2xl p-8"
          style={{ background: '#0D1117', border: '1px solid rgba(0,240,255,0.15)', boxShadow: '0 0 40px rgba(0,240,255,0.05)' }}>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Create Account</h1>
            <p className="text-white/40 text-sm mt-1">Join the recovery network</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                placeholder="John"
                icon={User}
                error={errors.firstName?.message}
                {...register('firstName', { required: 'Required' })}
              />
              <Input
                label="Last Name"
                placeholder="Doe"
                error={errors.lastName?.message}
                {...register('lastName', { required: 'Required' })}
              />
            </div>

            <Input
              label="Username"
              placeholder="johndoe"
              icon={User}
              error={errors.username?.message}
              {...register('username', {
                required: 'Username required',
                minLength: { value: 3, message: 'Min 3 characters' },
                maxLength: { value: 30, message: 'Max 30 characters' },
                pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'Letters, numbers, underscores only' },
              })}
            />

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              icon={Mail}
              error={errors.email?.message}
              {...register('email', {
                required: 'Email required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
              })}
            />

            <Input
              label="Phone (optional)"
              type="tel"
              placeholder="+1 234 567 8900"
              icon={Phone}
              error={errors.phone?.message}
              {...register('phone')}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              icon={Lock}
              hint="Min 8 chars with uppercase, lowercase, number"
              error={errors.password?.message}
              rightElement={
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="text-white/30 hover:text-white/60">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              {...register('password', {
                required: 'Password required',
                minLength: { value: 8, message: 'Min 8 characters' },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: 'Must contain uppercase, lowercase, number',
                },
              })}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Please confirm password',
                validate: v => v === password || 'Passwords do not match',
              })}
            />

            <Button type="submit" loading={loading} className="w-full mt-2">
              Create Account <ArrowRight size={16} />
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-sm text-white/40">
              Already have an account?{' '}
              <Link to="/login" className="text-neon-cyan hover:text-neon-cyan/80 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
