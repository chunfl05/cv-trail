'use client';

import { useEffect, useState, useTransition } from 'react';
import { requestMagicLink, devSignIn } from './actions';

const CALLBACK_ERRORS = {
  not_allowed: 'This app is private. That email is not allowed to sign in.',
  auth_failed: 'The sign-in link was invalid or expired. Request a new one.',
};

export default function LoginForm({ showDevLogin }) {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [isDevPending, startDevTransition] = useTransition();

  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get('error');
    if (error) setResult({ ok: false, message: CALLBACK_ERRORS[error] || 'Sign-in failed.' });
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set('email', email);
    startTransition(async () => {
      const res = await requestMagicLink(null, formData);
      setResult(res);
    });
  };

  const submitDev = () => {
    startDevTransition(async () => {
      const res = await devSignIn();
      if (res.ok) {
        window.location.assign('/');
      } else {
        setResult(res);
      }
    });
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="card-body">
          <h1 className="auth-title">CV Trail</h1>
          <p className="page-sub">Sign in with a magic link sent to your email.</p>
          <form onSubmit={submit}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <button className="btn auth-submit" type="submit" disabled={isPending}>
              {isPending ? 'Sending…' : 'Send magic link'}
            </button>
          </form>

          {showDevLogin && (
            <>
              <div className="auth-divider">or, local dev only</div>
              <button
                className="btn ghost auth-submit"
                type="button"
                onClick={submitDev}
                disabled={isDevPending}
              >
                {isDevPending ? 'Signing in…' : 'Sign in as dev (skip email)'}
              </button>
            </>
          )}

          {result && (
            <p className={`auth-message ${result.ok ? 'ok' : 'error'}`}>{result.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
