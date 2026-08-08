import { createContext, useContext } from 'react';

export type AdminTheme = 'dark' | 'light';

export interface AdminThemeValue {
  theme: AdminTheme;
  setTheme: (theme: AdminTheme) => void;
  toggle: () => void;
  /** Sidebar collapsed to an icon rail on desktop. */
  railTight: boolean;
  toggleRail: () => void;
  /** Sidebar open as an overlay drawer on narrow screens. */
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
}

export const AdminThemeContext = createContext<AdminThemeValue | null>(null);

export function useAdminChrome(): AdminThemeValue {
  const value = useContext(AdminThemeContext);
  if (!value) throw new Error('useAdminChrome must be used inside AdminChromeProvider');
  return value;
}
