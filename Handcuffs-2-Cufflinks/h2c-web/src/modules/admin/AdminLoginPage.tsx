import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button } from '@/components/ui/Button';
import { Field, TextInput } from '@/components/ui/Field';
import { adminApi } from '@/services/admin';
import { useSubmit } from '@/hooks/useSubmit';

export function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { submit, isSubmitting, error } = useSubmit((e: string, p: string) => adminApi.login(e, p));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await submit(email.trim(), password);
    if (ok) navigate('/admin/dashboard', { replace: true });
  }

  return (
    <section className="grid min-h-[80vh] place-items-center bg-ink">
      <Container size="prose" className="max-w-md">
        <Eyebrow>Admin</Eyebrow>
        <h1 className="mt-5 font-display text-display-md font-semibold text-bone">Sign in</h1>
        <p className="mt-3 text-muted">Moderation and content for the movement.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-6" noValidate>
          <Field label="Email" htmlFor="ademail">
            <TextInput
              id="ademail"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@h2c.org"
            />
          </Field>
          <Field label="Password" htmlFor="adpass">
            <TextInput
              id="adpass"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" variant="gold" size="lg" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in\u2026' : 'Sign in'}
          </Button>
        </form>
      </Container>
    </section>
  );
}
