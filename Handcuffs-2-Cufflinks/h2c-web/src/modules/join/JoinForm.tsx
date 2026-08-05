import { useState, type FormEvent } from 'react';
import { submitJoin } from '@/services/content';
import { useUI } from '@/shared/UIContext';

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export function JoinForm() {
  const { showToast } = useUI();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const next: Record<string, boolean> = {};
    if (!data.first?.trim()) next.first = true;
    if (!emailOk(data.email ?? '')) next.email = true;
    if (!data.consent) next.consent = true;
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    const res = await submitJoin({
      first: data.first, email: data.email, mobile: data.mobile, country: data.country,
      consent: Boolean(data.consent),
    });
    setBusy(false);
    if (res.ok) { setSent(true); showToast("You're in"); form.reset(); }
  };

  if (sent) {
    return (
      <p className="said">
        You&apos;re in. Check your inbox — the first drop goes to this list before anyone else.
      </p>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate style={{ maxWidth: 520, margin: '0 auto', textAlign: 'left' }}>
      <div className="f2">
        <div className={`field ${errors.first ? 'invalid' : ''}`}>
          <label htmlFor="j-first">First name</label>
          <input id="j-first" name="first" type="text" autoComplete="given-name" required />
        </div>
        <div className={`field ${errors.email ? 'invalid' : ''}`}>
          <label htmlFor="j-email">Email</label>
          <input id="j-email" name="email" type="email" autoComplete="email" required />
        </div>
      </div>
      <div className="f2">
        <div className="field"><label htmlFor="j-mobile">Mobile number</label><input id="j-mobile" name="mobile" type="tel" autoComplete="tel" placeholder="+1" /></div>
        <div className="field">
          <label htmlFor="j-country">Country</label>
          <select id="j-country" name="country" defaultValue="United States">
            {['United States', 'Canada', 'United Kingdom', 'Australia', 'Other'].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <label className={`check ${errors.consent ? 'invalid' : ''}`}>
        <input type="checkbox" name="consent" value="yes" />
        <span>I want email and occasional texts about drops, episodes, and releases. I can unsubscribe any time.</span>
      </label>
      <button className="btn btn--dark" type="submit" disabled={busy}>
        {busy ? 'Joining…' : 'Get on the list'}
      </button>
    </form>
  );
}
