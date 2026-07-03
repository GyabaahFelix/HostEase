import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../api';
import { Save, ShieldAlert, Sparkles, User as UserIcon, Phone, BookOpen, Key, Users } from 'lucide-react';

interface EditProfileFormProps {
  user: User;
  onProfileUpdated: (updatedUser: User) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function EditProfileForm({ user, onProfileUpdated, showToast }: EditProfileFormProps) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [department, setDepartment] = useState(user.department || '');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(
    (user.gender as 'male' | 'female' | 'other') || 'male'
  );
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('Name field is required.', 'error');
      return;
    }

    if (password) {
      if (password.length < 6) {
        showToast('Password must be at least 6 characters.', 'error');
        return;
      }
      if (password !== confirmPassword) {
        showToast('Passwords do not match.', 'error');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload: {
        name?: string;
        phone?: string;
        department?: string;
        gender?: string;
        password?: string;
      } = {
        name,
        phone,
        department,
        gender,
      };

      if (password) {
        payload.password = password;
      }

      const response = await api.updateProfile(payload);
      showToast(response.message || 'Profile updated successfully!', 'success');
      onProfileUpdated(response.user);
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-[#0A0A0B] p-6 rounded-2xl border border-white/5 space-y-4">
        <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center space-x-2 pb-2 border-b border-white/5">
          <UserIcon className="w-4 h-4 text-indigo-400" />
          <span>Personal Information</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
              Full Legal Name *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <UserIcon className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#121214] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                placeholder="Firstname Lastname"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
              Gender Category *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Users className="w-3.5 h-3.5" />
              </span>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full bg-[#121214] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-medium"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
              Mobile Contact Number
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Phone className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#121214] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                placeholder="+234 803 456 7890"
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
              Academic Department
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <BookOpen className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-[#121214] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                placeholder="e.g. Computer Science"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0A0A0B] p-6 rounded-2xl border border-white/5 space-y-4">
        <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center space-x-2 pb-2 border-b border-white/5">
          <Key className="w-4 h-4 text-indigo-400" />
          <span>Security & Credentials</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-semibold font-mono text-red-400/80">
              New Security Password (Optional)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
              placeholder="Leave blank to keep current"
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
              placeholder="Confirm your new password"
              disabled={!password}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white text-xs uppercase tracking-wider font-semibold px-6 py-3 rounded-xl transition-all flex items-center space-x-2 shadow-lg shadow-indigo-600/15 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{isSubmitting ? 'Saving Profile...' : 'Save Profile Changes'}</span>
        </button>
      </div>
    </form>
  );
}
