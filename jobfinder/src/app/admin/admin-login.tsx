'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        // Full reload so the server component re-runs with the new cookie.
        window.location.reload();
        return;
      }
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'That password was not accepted.');
      setPassword('');
    } catch {
      setError('Could not reach the server. Check that it is running.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-5 py-16">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-ink">Admin sign in</h1>
        <p className="text-sm text-ink-muted">
          Collection controls are restricted. Enter the admin password to continue.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">Password</span>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            autoFocus
            required
          />
        </label>

        {error && (
          <p className="text-sm text-red-700" role="alert">{error}</p>
        )}

        <Button type="submit" disabled={busy || !password} className="w-full">
          {busy ? 'Checking…' : 'Sign in'}
        </Button>
      </form>
    </div>
  );
}
