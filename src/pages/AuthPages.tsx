import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Video, ShieldCheck, ArrowRight, UserPlus, LogIn, AlertCircle } from 'lucide-react';

interface AuthPagesProps {
  initialMode?: 'signin' | 'signup';
  onSuccess: () => void;
  onNavigate: (view: string) => void;
}

export function AuthPages({ initialMode = 'signin', onSuccess, onNavigate }: AuthPagesProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  
  // Sign In state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign Up state
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regBio, setRegBio] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      setLoading(true);
      await login({ email: loginEmail.trim(), password: loginPassword });
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (regPassword !== regConfirm) {
      setErrorMsg('Passwords do not match');
      return;
    }
    try {
      setLoading(true);
      await register({
        username: regUsername.trim(),
        email: regEmail.trim(),
        password: regPassword,
        confirm_password: regConfirm,
        bio: regBio.trim()
      });
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register account');
    } finally {
      setLoading(false);
    }
  };

  const quickDemoLogin = async (email: string) => {
    setErrorMsg('');
    try {
      setLoading(true);
      await login({ email, password: 'password123' });
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to login with demo user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 space-y-8">
      
      {/* Brand Icon & Welcome */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center mx-auto shadow-md">
          <Video className="w-6 h-6" />
        </div>
        <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-white">
          {mode === 'signin' ? 'Welcome Back to VlogVerse' : 'Create Creator Channel'}
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {mode === 'signin' 
            ? 'Sign in to publish vlogs, like films, and comment.' 
            : 'Join thousands of indie filmmakers and travel storytellers.'}
        </p>
      </div>

      {/* Mode Toggle Tabs */}
      <div className="flex p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => { setMode('signin'); setErrorMsg(''); }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${mode === 'signin' ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
        >
          Sign In
        </button>
        <button
          onClick={() => { setMode('signup'); setErrorMsg(''); }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${mode === 'signup' ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
        >
          Sign Up
        </button>
      </div>

      {/* Error Box */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Forms */}
      {mode === 'signin' ? (
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-200">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="alex@vlogverse.io"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-200">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-xs font-semibold text-white bg-zinc-900 dark:bg-white dark:text-zinc-950 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 transition shadow"
          >
            {loading ? 'Signing in...' : 'Sign In to VlogVerse'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-200">
              Username
            </label>
            <input
              type="text"
              required
              placeholder="e.g. wanderer_film"
              value={regUsername}
              onChange={(e) => setRegUsername(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-200">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="you@domain.com"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="6+ chars"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                Confirm
              </label>
              <input
                type="password"
                required
                placeholder="Repeat"
                value={regConfirm}
                onChange={(e) => setRegConfirm(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-200">
              Creator Bio (optional)
            </label>
            <input
              type="text"
              placeholder="Short bio about your video style..."
              value={regBio}
              onChange={(e) => setRegBio(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-xs font-semibold text-white bg-zinc-900 dark:bg-white dark:text-zinc-950 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 transition shadow"
          >
            {loading ? 'Creating Channel...' : 'Create Account'}
          </button>
        </form>
      )}

      {/* Quick Demo Test Accounts Box */}
      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 text-center">
          Instant Demo Creator Login
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => quickDemoLogin('alex@vlogverse.io')}
            className="p-2 text-center rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">Alex</p>
            <p className="text-[10px] text-zinc-500">Tokyo Vibes</p>
          </button>
          <button
            type="button"
            onClick={() => quickDemoLogin('sophia@vlogverse.io')}
            className="p-2 text-center rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">Sophia</p>
            <p className="text-[10px] text-zinc-500">Indie Cinema</p>
          </button>
          <button
            type="button"
            onClick={() => quickDemoLogin('marco@vlogverse.io')}
            className="p-2 text-center rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">Marco</p>
            <p className="text-[10px] text-zinc-500">Alpine & Coffee</p>
          </button>
        </div>
      </div>

    </div>
  );
}
