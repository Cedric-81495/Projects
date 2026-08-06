import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Section, Eyebrow } from '@/shared/ui';
import { GoogleSignIn } from '@/components/GoogleSignIn';
import { useAuth } from '@/shared/AuthContext';
import { useUI } from '@/shared/UIContext';

type LocationState = { from?: string } | null;

export function SignInPage() {
  const { user, loading, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useUI();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dest = (location.state as LocationState)?.from || '/profile';

  // Already signed in → bounce to the intended page.
  if (!loading && user) {
    navigate(dest, { replace: true });
  }

  const handleCredential = useCallback(
    async (credential: string) => {
      setBusy(true);
      setError(null);
      try {
        const u = await loginWithGoogle(credential);
        showToast(`Welcome, ${u.name.split(' ')[0]}.`);
        navigate(dest, { replace: true });
      } catch {
        setError('Sign-in failed. Please try again.');
        setBusy(false);
      }
    },
    [loginWithGoogle, navigate, dest, showToast],
  );

  return (
    <Section tone="t-1" id="signin">
      <Eyebrow>Members</Eyebrow>
      <h1 className="h2">
        Join the <span className="gold-t">movement</span>
      </h1>
      <p className="lede" style={{ marginTop: 12 }}>
        Sign in with Google to build your member profile, share your journey, and follow the arc
        from struggle to success.
      </p>

      <div style={{ marginTop: 28, display: 'grid', gap: 16, maxWidth: 320 }}>
        {busy ? (
          <p className="body">Signing you in…</p>
        ) : (
          <GoogleSignIn onCredential={handleCredential} onError={setError} />
        )}
        {error && (
          <p className="said" role="alert">
            {error}
          </p>
        )}
      </div>

      <p className="consent" style={{ marginTop: 22 }}>
        We only use your Google name, email, and photo to create your profile. No password is
        stored. You can remove your account anytime.
      </p>
    </Section>
  );
}
