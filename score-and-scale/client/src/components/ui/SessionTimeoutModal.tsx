import { useEffect, useState } from 'react';

interface SessionTimeoutModalProps {
  /** Seconds remaining until auto-logout, counted down live. */
  countdownSeconds: number;
  onStayLoggedIn: () => void;
  onLogoutNow: () => void;
}

export function SessionTimeoutModal({
  countdownSeconds,
  onStayLoggedIn,
  onLogoutNow,
}: SessionTimeoutModalProps) {
  const [remaining, setRemaining] = useState(countdownSeconds);

  useEffect(() => {
    setRemaining(countdownSeconds);
    const interval = setInterval(() => {
      setRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdownSeconds]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-lg bg-ink2 border border-line p-6 text-center">
        <h2 className="text-lg font-semibold text-offwhite mb-2">Still there?</h2>
        <p className="text-sm text-paper2 mb-4">
          You've been inactive for a while. For your security, you'll be logged out in{' '}
          <span className="font-mono text-brassBright">{remaining}s</span> unless you'd like to
          stay signed in.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onLogoutNow}
            className="flex-1 rounded-sm border border-paper2 py-2.5 text-sm text-paper2 hover:border-brassBright hover:text-brassBright transition-colors"
          >
            Log out
          </button>
          <button
            onClick={onStayLoggedIn}
            className="flex-1 rounded-sm bg-brass py-2.5 text-sm font-semibold text-ink hover:bg-brassBright transition-colors"
          >
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  );
}
