import { useState } from 'react';
import { AlertTriangle, Loader2, Lock } from 'lucide-react';
import { useAdminStore } from './adminStore.js';
import { login } from './api/auth.js';

export default function AdminLogin() {
  const setSession = useAdminStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const data = await login({ email, password });
      setSession({ token: data.token, user: data.user });
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-raspberry-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-blush-50 border-4 border-coffee-800 rounded-2xl shadow-retro overflow-hidden">
        <header className="bg-raspberry-900 text-blush-50 px-6 py-5 border-b-4 border-coffee-800">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-4xl tracking-tight leading-none">
              GRUB
            </span>
            <span className="italic font-bold text-berry-300 uppercase">
              admin
            </span>
          </div>
          <p className="mt-2 text-sm text-blush-200 italic">
            Grab the goodness · sign in to manage orders, menu, and delivery.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2 bg-raspberry-50 border-2 border-raspberry-700 rounded-md p-3 text-raspberry-900"
            >
              <AlertTriangle
                size={20}
                strokeWidth={2.5}
                className="text-raspberry-700 shrink-0 mt-0.5"
              />
              <p className="text-sm font-bold">{errorMsg}</p>
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-black text-coffee-900 mb-1.5 uppercase tracking-wide"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              className="w-full bg-blush-50 border-2 border-coffee-800 rounded-md px-3 py-2 text-raspberry-900 font-medium focus:outline-none focus:border-raspberry-700 focus:ring-2 focus:ring-raspberry-300 disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-black text-coffee-900 mb-1.5 uppercase tracking-wide"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              className="w-full bg-blush-50 border-2 border-coffee-800 rounded-md px-3 py-2 text-raspberry-900 font-medium focus:outline-none focus:border-raspberry-700 focus:ring-2 focus:ring-raspberry-300 disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-raspberry-600 text-blush-50 font-display italic uppercase tracking-wide text-lg px-5 py-2.5 rounded-md border-4 border-coffee-800 shadow-retro hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-retro-sm transition-transform disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-retro"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                <Lock size={18} strokeWidth={2.5} />
                Sign in
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
