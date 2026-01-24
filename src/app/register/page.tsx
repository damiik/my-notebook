'use client';

import React, { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthContext from '@/context/AuthContext';
import { Terminal, Lock, Mail, User as UserIcon, AlertCircle, ShieldCheck } from 'lucide-react';

const RegisterPage = () => {
  const { register, isAuthenticated, error, clearErrors } = useContext(AuthContext);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });

  const { name, email, password, passwordConfirm } = formData;

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) clearErrors();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      alert("Passwords do not match!");
      return;
    }
    try {
      await register({ name, email, password });
      router.push('/');
    } catch (err) {
      // Error is handled in AuthContext state
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dracula-bg p-4 font-mono">
      <div className="max-w-md w-full bg-dracula-current border-2 border-dracula-green rounded-lg shadow-2xl overflow-hidden text-dracula-fg">
        <div className="bg-dracula-green p-3 flex items-center space-x-2 text-dracula-bg font-bold text-sm uppercase tracking-wider">
          <ShieldCheck size={18} />
          <span>New User Initialization</span>
        </div>
        
        <div className="p-8">
          <h2 className="text-2xl font-bold text-dracula-cyan mb-6 text-center underline underline-offset-8 decoration-dracula-green">REGISTER_NEW_NODE</h2>
          
          <form onSubmit={onSubmit} className="space-y-5 text-sm">
            <div className="space-y-2">
              <label className="text-dracula-green flex items-center space-x-2">
                <UserIcon size={14} />
                <span>DISPLAY_NAME</span>
              </label>
              <input
                type="text"
                name="name"
                value={name}
                onChange={onChange}
                className="w-full bg-dracula-bg border border-dracula-comment text-dracula-fg p-3 rounded focus:border-dracula-green focus:outline-none transition-colors shadow-inner"
                placeholder="Agent Smith"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-dracula-green flex items-center space-x-2">
                <Mail size={14} />
                <span>EMAIL_ADDRESS</span>
              </label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={onChange}
                className="w-full bg-dracula-bg border border-dracula-comment text-dracula-fg p-3 rounded focus:border-dracula-green focus:outline-none transition-colors shadow-inner"
                placeholder="neo@matrix.net"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-dracula-green flex items-center space-x-2">
                <Lock size={14} />
                <span>SECRET_KEY</span>
              </label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={onChange}
                className="w-full bg-dracula-bg border border-dracula-comment text-dracula-fg p-3 rounded focus:border-dracula-green focus:outline-none transition-colors shadow-inner"
                placeholder="Min 6 chars"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-dracula-green flex items-center space-x-2">
                <Lock size={14} />
                <span>CONFIRM_KEY</span>
              </label>
              <input
                type="password"
                name="passwordConfirm"
                value={passwordConfirm}
                onChange={onChange}
                className="w-full bg-dracula-bg border border-dracula-comment text-dracula-fg p-3 rounded focus:border-dracula-green focus:outline-none transition-colors shadow-inner"
                placeholder="Repeat password"
                required
              />
            </div>

            {error && (
              <div className="bg-dracula-red/20 border border-dracula-red text-dracula-red p-3 rounded flex items-center space-x-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-dracula-green hover:bg-dracula-cyan text-dracula-bg font-bold py-3 rounded shadow-lg transition-all transform hover:-translate-y-1"
            >
              INITIALIZE_REGISTER
            </button>
          </form>

          <div className="mt-8 text-center space-y-4">
            <p className="text-dracula-comment text-sm">
              ALREADY_HAVE_NODE?{' '}
              <Link href="/login" className="text-dracula-pink hover:underline underline-offset-4">
                LOGIN_HERE
              </Link>
            </p>
            <p className="text-xs text-dracula-comment/50 italic flex items-center justify-center space-x-2">
              <Terminal size={12} />
              <span>system register --force --verbose</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
