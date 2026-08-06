import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '@/services/auth';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await adminLogin(email.trim(), password);
      navigate('/admin', { replace: true });
    } catch {
      setError('Invalid email or password.');
      setBusy(false);
    }
  }, [email, password, navigate]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 'var(--gut)',
        background: 'var(--pitch)',
      }}
    >
      <div style={{ width: 'min(400px, 100%)' }}>
        <span className="mark" style={{ fontSize: '1.1rem' }}>
          H2C<span>·</span>Admin
        </span>
        <h1 className="h3" style={{ marginTop: 18 }}>
          Dashboard sign-in
        </h1>
        <form
          className="form"
          style={{ marginTop: 18 }}
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy) void submit();
          }}
        >
          <div className="field">
            <label htmlFor="ad-email">Email</label>
            <input
              id="ad-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="ad-pass">Password</label>
            <input
              id="ad-pass"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="said">{error}</p>}
          <button className="btn btn--gold" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
