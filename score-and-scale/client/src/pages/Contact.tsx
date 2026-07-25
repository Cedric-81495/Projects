import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/marketing/Header';
import { Footer } from '../components/marketing/Footer';
import { apiFetch } from '../lib/api';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [company, setCompany] = useState(''); // honeypot — real users never fill this
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    if (company) {
      // Honeypot tripped — silently pretend success, don't call the API.
      setStatus('success');
      return;
    }
    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMsg('Fill in your name, email, and message.');
      return;
    }

    setStatus('submitting');
    try {
      // /api/contact doesn't exist until the Express server is built.
      // This will fail with a network error until then — expected for now.
      await apiFetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify({ name, email, message }),
      });
      setStatus('success');
      setName('');
      setEmail('');
      setMessage('');
    } catch {
      setStatus('error');
      setErrorMsg("Couldn't send — the backend isn't connected yet.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Header />

      <section className="flex-1 px-8 py-24">
        <div className="max-w-[620px] mx-auto">
          <span className="block font-mono text-xs uppercase tracking-wide text-brassBright mb-3.5">
            Get In Touch
          </span>
          <h1 className="font-display text-[clamp(32px,4vw,48px)] text-offwhite mb-4">
            Let's talk about your file.
          </h1>
          <p className="text-paper2 mb-12">
            Questions about a program, or not sure which one fits? Send us a message and someone
            from the team will follow up within one business day.
          </p>

          {status === 'success' ? (
            <div className="border border-teal/40 bg-teal/10 rounded-md p-8 text-center">
              <h2 className="text-xl text-offwhite font-display mb-2">Message sent</h2>
              <p className="text-paper2 mb-6">Thanks for reaching out — we'll be in touch soon.</p>
              <Link to="/" className="text-brassBright hover:text-brass text-sm font-semibold">
                ← Back to home
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Honeypot field — hidden from real users via CSS, bots fill it */}
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="absolute -left-[9999px] w-0 h-0 opacity-0"
                aria-hidden="true"
              />

              <div>
                <label htmlFor="name" className="block text-sm text-paper2 mb-2">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-ink2 border border-line rounded-sm px-4 py-3 text-offwhite placeholder:text-paper2/50 focus:outline-none focus:border-brass"
                  placeholder="Jordan Rivera"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm text-paper2 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-ink2 border border-line rounded-sm px-4 py-3 text-offwhite placeholder:text-paper2/50 focus:outline-none focus:border-brass"
                  placeholder="you@email.com"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm text-paper2 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-ink2 border border-line rounded-sm px-4 py-3 text-offwhite placeholder:text-paper2/50 focus:outline-none focus:border-brass resize-none"
                  placeholder="What can we help with?"
                />
              </div>

              {errorMsg && <p className="text-brandRed text-sm">{errorMsg}</p>}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="px-7 py-3.5 rounded-sm text-sm font-semibold tracking-wide bg-brass text-ink hover:bg-brassBright transition-colors disabled:opacity-60"
              >
                {status === 'submitting' ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
