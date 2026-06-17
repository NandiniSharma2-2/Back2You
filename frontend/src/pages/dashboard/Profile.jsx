import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { User, Camera, Lock, Shield, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/axios';
import Input, { Textarea } from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const profileForm = useForm({
    defaultValues: {
      firstName: user?.first_name || '',
      lastName: user?.last_name || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      location: user?.location || '',
    },
  });

  const passwordForm = useForm();

  const onProfileSubmit = async (data) => {
    setProfileLoading(true);
    try {
      const res = await api.put('/users/me', data);
      updateUser(res.data.data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setProfileLoading(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    setPasswordLoading(true);
    try {
      await api.put('/auth/change-password', data);
      toast.success('Password changed! Please sign in again.');
      passwordForm.reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(res.data.data.user);
      toast.success('Avatar updated!');
    } catch {
      toast.error('Avatar upload failed.');
    } finally {
      setAvatarLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <User size={22} className="text-neon-cyan" /> Profile Settings
        </h1>
        <p className="text-white/40 text-sm mt-1">Manage your account information</p>
      </div>

      {/* Avatar */}
      <div className="rounded-xl p-6" style={{ background: '#0D1117', border: '1px solid rgba(0,240,255,0.1)' }}>
        <h3 className="font-semibold text-white mb-5">Profile Photo</h3>
        <div className="flex items-center gap-5">
          <div className="relative">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black"
                style={{ background: 'linear-gradient(135deg, #00F0FF, #FF007F)', color: '#000' }}>
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
            )}
            <label className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-all ${avatarLoading ? 'opacity-50' : 'hover:scale-110'}`}
              style={{ background: 'linear-gradient(135deg, #00F0FF, #FF007F)' }}>
              {avatarLoading ? (
                <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera size={12} style={{ color: '#000' }} />
              )}
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" disabled={avatarLoading} />
            </label>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{user?.first_name} {user?.last_name}</p>
            <p className="text-xs text-white/40">@{user?.username}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="badge-cyan text-xs">{user?.role_name}</span>
              {user?.is_verified && <span className="badge-green text-xs">Verified</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl p-6"
        style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h3 className="font-semibold text-white mb-5">Personal Information</h3>
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              error={profileForm.formState.errors.firstName?.message}
              {...profileForm.register('firstName', { required: 'Required' })}
            />
            <Input
              label="Last Name"
              error={profileForm.formState.errors.lastName?.message}
              {...profileForm.register('lastName', { required: 'Required' })}
            />
          </div>
          <Input
            label="Phone"
            type="tel"
            placeholder="+1 234 567 8900"
            {...profileForm.register('phone')}
          />
          <Input
            label="Location"
            placeholder="City, Country"
            {...profileForm.register('location')}
          />
          <Textarea
            label="Bio"
            placeholder="Tell us about yourself..."
            rows={3}
            {...profileForm.register('bio')}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={profileLoading} className="px-8">Save Changes</Button>
          </div>
        </form>
      </motion.div>

      {/* Change Password */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl p-6"
        style={{ background: '#0D1117', border: '1px solid rgba(255,0,127,0.1)' }}
      >
        <h3 className="font-semibold text-white mb-5 flex items-center gap-2">
          <Lock size={16} className="text-neon-pink" /> Change Password
        </h3>
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
          <Input
            label="Current Password"
            type={showCurrentPw ? 'text' : 'password'}
            error={passwordForm.formState.errors.currentPassword?.message}
            rightElement={
              <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="text-white/30 hover:text-white/60">
                {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            {...passwordForm.register('currentPassword', { required: 'Current password required' })}
          />
          <Input
            label="New Password"
            type={showNewPw ? 'text' : 'password'}
            hint="Min 8 chars with uppercase, lowercase, number"
            error={passwordForm.formState.errors.newPassword?.message}
            rightElement={
              <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                className="text-white/30 hover:text-white/60">
                {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            {...passwordForm.register('newPassword', {
              required: 'New password required',
              minLength: { value: 8, message: 'Min 8 characters' },
              pattern: { value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: 'Must include uppercase, lowercase, number' },
            })}
          />
          <Input
            label="Confirm New Password"
            type="password"
            error={passwordForm.formState.errors.confirmPassword?.message}
            {...passwordForm.register('confirmPassword', {
              required: 'Please confirm password',
              validate: v => v === passwordForm.watch('newPassword') || 'Passwords must match',
            })}
          />
          <div className="flex justify-end">
            <Button type="submit" variant="secondary" loading={passwordLoading} className="px-8">
              Update Password
            </Button>
          </div>
        </form>
      </motion.div>

      {/* Account Info */}
      <div className="rounded-xl p-5" style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Shield size={14} className="text-white/30" />
          <h3 className="text-sm text-white/30">Account Information</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-white/20">Email</p>
            <p className="text-sm text-white/50 mt-0.5">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs text-white/20">Member Since</p>
            <p className="text-sm text-white/50 mt-0.5">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/20">Account Status</p>
            <span className={`badge-${user?.is_verified ? 'green' : 'gray'} text-xs mt-0.5 inline-block`}>
              {user?.is_verified ? 'Verified' : 'Unverified'}
            </span>
          </div>
          <div>
            <p className="text-xs text-white/20">Role</p>
            <p className="text-sm text-neon-cyan/70 mt-0.5 capitalize">{user?.role_name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
