'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function requestMagicLink(_prevState, formData) {
  const email = String(formData.get('email') || '')
    .trim()
    .toLowerCase();
  const allowed = (process.env.ALLOWED_EMAIL || '').trim().toLowerCase();

  if (!allowed) {
    return { ok: false, message: 'Server is missing the ALLOWED_EMAIL configuration.' };
  }
  if (email !== allowed) {
    return { ok: false, message: 'This app is private. That email is not allowed to sign in.' };
  }

  const headerList = await headers();
  const origin = headerList.get('origin') || 'http://localhost:3000';

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true, message: 'Check your inbox for the magic link.' };
}

// Local-dev only: signs in as the fixed ALLOWED_EMAIL user via password instead of
// a magic link, so local development never touches Supabase's email rate limit.
// Inert unless ALLOW_DEV_LOGIN=true, which must only ever be set in .env.local —
// never in the Vercel project's environment variables.
export async function devSignIn() {
  if (process.env.ALLOW_DEV_LOGIN !== 'true') {
    return { ok: false, message: 'Dev login is disabled (ALLOW_DEV_LOGIN is not set).' };
  }

  const email = (process.env.ALLOWED_EMAIL || '').trim().toLowerCase();
  const password = process.env.DEV_USER_PASSWORD || '';

  if (!email || !password) {
    return { ok: false, message: 'Set ALLOWED_EMAIL and DEV_USER_PASSWORD in .env.local.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}
