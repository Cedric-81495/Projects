'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SearchForm({ size = 'hero' }: { size?: 'hero' | 'compact' }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [location, setLocation] = useState(params.get('location') ?? '');
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const next = new URLSearchParams(params.toString());
    q.trim() ? next.set('q', q.trim()) : next.delete('q');
    location.trim() ? next.set('location', location.trim()) : next.delete('location');
    next.delete('page');
    startTransition(() => router.push(`/jobs?${next.toString()}`));
  }

  return (
    <form
      onSubmit={submit}
      className={size === 'hero'
        ? 'grid gap-2 sm:grid-cols-[2fr_1fr_auto]'
        : 'grid gap-2 sm:grid-cols-[2fr_1fr_auto]'}
    >
      <Input
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search job title, skill, or company"
        aria-label="Search job title, skill, or company"
        className={size === 'hero' ? 'h-12' : undefined}
      />
      <Input
        name="location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Location"
        aria-label="Location"
        className={size === 'hero' ? 'h-12' : undefined}
      />
      <Button
        type="submit"
        disabled={pending}
        className={size === 'hero' ? 'h-12 px-6' : undefined}
      >
        {pending ? 'Searching…' : 'Search jobs'}
      </Button>
    </form>
  );
}
