import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refetch } = useAuth();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      await refetch();
      navigate('/dashboard');
    } catch {
      setError('Registration isn’t connected yet — the backend is next.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-8">
      <form onSubmit={handleSubmit} className="w-full max-w-[400px] space-y-6">
        <h1 className="font-display text-3xl text-offwhite mb-2">Create account</h1>
        <div>
          <label htmlFor="name" className="block text-sm text-paper2 mb-2">Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-ink2 border border-line rounded-sm px-4 py-3 text-offwhite focus:outline-none focus:border-brass"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm text-paper2 mb-2">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-ink2 border border-line rounded-sm px-4 py-3 text-offwhite focus:outline-none focus:border-brass"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm text-paper2 mb-2">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-ink2 border border-line rounded-sm px-4 py-3 text-offwhite focus:outline-none focus:border-brass"
          />
        </div>
        {error && <p className="text-brandRed text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-sm text-sm font-semibold bg-brass text-ink hover:bg-brassBright disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
        <p className="text-sm text-paper2 text-center">
          Already have an account? <Link to="/login" className="text-brassBright hover:text-brass">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
