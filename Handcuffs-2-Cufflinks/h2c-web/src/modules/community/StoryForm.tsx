import { useState, type FormEvent } from 'react';
import { submitStory } from '@/services/content';
import { useUI } from '@/shared/UIContext';

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export function StoryForm() {
  const { showToast } = useUI();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const next: Record<string, boolean> = {};
    if (!data.name?.trim()) next.name = true;
    if (!emailOk(data.email ?? '')) next.email = true;
    if (!data.consent) next.consent = true;
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    const res = await submitStory({
      name: data.name, email: data.email, city: data.city, country: data.country,
      social: data.social, title: data.title, story: data.story, video: data.video,
      consent: Boolean(data.consent),
    });
    setBusy(false);
    if (res.ok) { setSent(true); showToast('Story received'); form.reset(); }
  };

  if (sent) {
    return (
      <p className="said">
        Received. We read every submission, and we will contact you before anything is published.
      </p>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <div className="f2">
        <div className={`field ${errors.name ? 'invalid' : ''}`}>
          <label htmlFor="s-name">Name</label>
          <input id="s-name" name="name" type="text" autoComplete="name" required />
        </div>
        <div className={`field ${errors.email ? 'invalid' : ''}`}>
          <label htmlFor="s-email">Email</label>
          <input id="s-email" name="email" type="email" autoComplete="email" required />
        </div>
      </div>
      <div className="f2">
        <div className="field"><label htmlFor="s-city">City</label><input id="s-city" name="city" type="text" /></div>
        <div className="field"><label htmlFor="s-country">Country</label><input id="s-country" name="country" type="text" /></div>
      </div>
      <div className="f2">
        <div className="field"><label htmlFor="s-social">Social handle</label><input id="s-social" name="social" type="text" placeholder="@" /></div>
        <div className="field"><label htmlFor="s-title">Story title</label><input id="s-title" name="title" type="text" /></div>
      </div>
      <div className="field">
        <label htmlFor="s-story">Your story</label>
        <textarea id="s-story" name="story" placeholder="Where you started, what changed it, where you are now." />
      </div>
      <div className="field"><label htmlFor="s-video">Video link</label><input id="s-video" name="video" type="url" placeholder="https://" /></div>
      <label className={`check ${errors.consent ? 'invalid' : ''}`}>
        <input type="checkbox" name="consent" value="yes" />
        <span>I understand a person reads every submission and will contact me before anything is published, and I can withdraw permission at any time.</span>
      </label>
      <button className="btn btn--gold" type="submit" disabled={busy}>
        {busy ? 'Sending…' : 'Submit your story'}
      </button>
    </form>
  );
}
