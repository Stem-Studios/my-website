'use client';
import { Suspense, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Brand } from '@/components/shell';
import { createClient } from '@/utils/supabase/client';

export function AuthForm({ mode }: { mode: 'login' | 'signup' | 'reset' | 'recovery' }) {
  return (
    <Suspense fallback={<p role="status">Loading sign-in…</p>}>
      <AuthFormContent mode={mode} />
    </Suspense>
  );
}
function AuthFormContent({ mode }: { mode: 'login' | 'signup' | 'reset' | 'recovery' }) {
  const router = useRouter();
  const callbackError = useSearchParams().has('error');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const visibleMessage =
    message ||
    (callbackError
      ? 'The sign-in link is invalid or expired. Please sign in or request a new recovery email.'
      : '');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage('');
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');
    try {
      const supabase = createClient();
      if (mode === 'signup') {
        const username = String(form.get('username')).trim().toLowerCase();
        if (!/^[a-z0-9_]{3,24}$/.test(username))
          throw new Error('Use 3–24 letters, numbers or underscores for your username.');
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username, display_name: String(form.get('name')).trim() },
            emailRedirectTo: `${location.origin}/auth/callback/`,
          },
        });
        if (error) throw error;
        if (!data.session) {
          setMessage('Check your email to verify your account, then sign in.');
          return;
        }
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${location.origin}/auth/callback/?recovery=1`,
        });
        if (error) throw error;
        setMessage('If an account exists, a recovery link has been sent.');
        return;
      } else {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
      }
      // A full navigation clears any previous student's in-memory workspace.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign('/dashboard/');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to complete the request. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }
  const title = {
    login: 'Welcome back.',
    signup: 'Your next chapter starts here.',
    reset: 'Find your way back.',
    recovery: 'Choose a new password.',
  }[mode];
  return (
    <div className="auth-page">
      <Link href="/">
        <Brand />
      </Link>
      <section className="panel auth-panel">
        <h1>{title}</h1>
        <p>Your own account. Your own progress.</p>
        <form onSubmit={submit} className="account-auth-form">
          {mode === 'signup' && (
            <>
              <label>
                Display name
                <input name="name" autoComplete="name" required maxLength={60} />
              </label>
              <label>
                Username
                <input
                  name="username"
                  autoComplete="username"
                  pattern="[a-zA-Z0-9_]{3,24}"
                  required
                  minLength={3}
                  maxLength={24}
                />
              </label>
            </>
          )}
          {mode !== 'recovery' && (
            <label>
              Email
              <input name="email" type="email" autoComplete="email" required maxLength={254} />
            </label>
          )}
          {mode !== 'reset' && (
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={mode === 'login' ? 1 : 12}
                maxLength={128}
              />
            </label>
          )}
          {mode === 'signup' && (
            <p>Use a password of at least 12 characters. Your username must be unique.</p>
          )}
          {visibleMessage && <p role="status">{visibleMessage}</p>}
          <button className="button button-primary" disabled={busy}>
            {busy
              ? 'Please wait…'
              : {
                  login: 'Sign in',
                  signup: 'Create account',
                  reset: 'Send recovery link',
                  recovery: 'Update password',
                }[mode]}
          </button>
        </form>
        <Link className="subtle-link" href={mode === 'signup' ? '/login/' : '/signup/'}>
          {mode === 'signup' ? 'Already have an account? Sign in' : 'Create an account'}
        </Link>
        {mode === 'login' && (
          <Link className="subtle-link" href="/reset-password/">
            Forgot your password?
          </Link>
        )}
        <button className="button button-ghost" onClick={() => router.push('/')}>
          Back home
        </button>
      </section>
    </div>
  );
}
