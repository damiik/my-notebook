'use client';

import React, { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthContext from '@/context/AuthContext';
import { Terminal, Lock, Mail, User as UserIcon, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const { login, isAuthenticated, error, clearErrors } = useContext(AuthContext);
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const { email, password } = formData;

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
    try {
      await login({ email, password });
      router.push('/');
    } catch (err) {
      // Error is handled in AuthContext state
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dracula-bg p-4 font-mono">
      <div className="max-w-md w-full bg-dracula-current border-2 border-dracula-purple rounded-lg shadow-2xl overflow-hidden">
        <div className="bg-dracula-purple p-3 flex items-center space-x-2">
          <Terminal size={18} className="text-dracula-bg" />
          <span className="text-dracula-bg font-bold text-sm uppercase tracking-wider">Authentication - Login</span>
        </div>
        
        <div className="p-8">
          <h2 className="text-2xl font-bold text-dracula-pink mb-6 text-center">ACCESS_GRANTED?</h2>
          
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-dracula-purple text-sm flex items-center space-x-2">
                <Mail size={14} />
                <span>EMAIL_ADDRESS</span>
              </label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={onChange}
                className="w-full bg-dracula-bg border border-dracula-comment text-dracula-fg p-3 rounded focus:border-dracula-cyan focus:outline-none transition-colors"
                placeholder="neo@matrix.net"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-dracula-purple text-sm flex items-center space-x-2">
                <Lock size={14} />
                <span>SECRET_KEY</span>
              </label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={onChange}
                className="w-full bg-dracula-bg border border-dracula-comment text-dracula-fg p-3 rounded focus:border-dracula-cyan focus:outline-none transition-colors"
                placeholder="********"
                required
              />
            </div>

            {error && (
              <div className="bg-dracula-red/20 border border-dracula-red text-dracula-red p-3 rounded flex items-center space-x-2 text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-dracula-purple hover:bg-dracula-pink text-dracula-bg font-bold py-3 rounded shadow-lg transition-all transform hover:-translate-y-1 active:translate-y-0"
            >
              EXECUTE LOGIN
            </button>
          </form>

          <div className="mt-8 text-center space-y-4">
            <p className="text-dracula-comment text-sm">
              NO_ACCOUNT?{' '}
              <Link href="/register" className="text-dracula-cyan hover:underline underline-offset-4">
                SIGN_UP_HERE
              </Link>
            </p>
            <p className="text-xs text-dracula-comment/50 italic">
              $ system auth --connect --secure
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
