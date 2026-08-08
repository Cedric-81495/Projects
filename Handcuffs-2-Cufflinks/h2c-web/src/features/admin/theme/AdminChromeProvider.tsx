import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { AdminThemeContext } from './theme';
import type { AdminTheme, AdminThemeValue } from './theme';

/**
 * CMS chrome state: theme, and whether the sidebar is a rail or a drawer.
 *
 * Dark is the default rather than the system preference. The public site is
 * obsidian, an operator moves between the two all day, and defaulting to the
 * operating system means half of them get flashbanged on the first load. The
 * system preference is still honoured — but only as the *initial* value for
 * someone who has never chosen, and only when it says light. Once they pick,
 * the choice is theirs and nothing overrides it.
 *
 * The stored value is read after mount (see useLocalStorage), so the first
 * frame is always the default. That is deliberate: reading storage during
 * render would disagree with the prerendered shell and trip a hydration
 * mismatch. The CMS is behind authentication and shows a loading state on that
 * first frame anyway, so nothing user-visible flickers.
 */
export function AdminChromeProvider({ children }: { children: React.ReactNode }) {
  const [stored, setStored, , hydrated] = useLocalStorage<AdminTheme | null>('h2c.cms.theme', null);
  const [railTight, setRailTight] = useLocalStorage<boolean>('h2c.cms.rail-tight', false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [systemLight, setSystemLight] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-color-scheme: light)');
    setSystemLight(query.matches);

    const onChange = (event: MediaQueryListEvent) => setSystemLight(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const theme: AdminTheme = stored ?? (hydrated && systemLight ? 'light' : 'dark');

  const setTheme = useCallback((next: AdminTheme) => setStored(next), [setStored]);
  const toggle = useCallback(
    () => setStored(theme === 'dark' ? 'light' : 'dark'),
    [setStored, theme]
  );
  const toggleRail = useCallback(() => setRailTight((current) => !current), [setRailTight]);

  /**
   * Paints the theme onto the document element as well as the shell.
   *
   * The shell owns the tokens, but the browser chrome — the scrollbar, the
   * overscroll gutter, form-control defaults — reads `color-scheme` off the
   * root. Without this a light CMS still has black scrollbars.
   */
  useEffect(() => {
    const root = document.documentElement;
    root.style.colorScheme = theme;
    return () => {
      root.style.colorScheme = '';
    };
  }, [theme]);

  const value = useMemo<AdminThemeValue>(
    () => ({ theme, setTheme, toggle, railTight, toggleRail, drawerOpen, setDrawerOpen }),
    [theme, setTheme, toggle, railTight, toggleRail, drawerOpen]
  );

  return <AdminThemeContext.Provider value={value}>{children}</AdminThemeContext.Provider>;
}
