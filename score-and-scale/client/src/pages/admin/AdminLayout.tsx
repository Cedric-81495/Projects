import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/enrollments', label: 'Enrollments' },
  { to: '/admin/contacts', label: 'Contact Inbox' },
];

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

// Visually distinct from /dashboard on purpose: sidebar + dense tables,
// so anyone glancing at the screen can immediately tell which surface
// they're on — reduces the risk of an admin acting as if in the customer view.
export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // Off-canvas on mobile, static column from md: up — closed by default
  // on small screens so it doesn't cover the page on first load.
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Explicit navigation after logout — do NOT rely on AdminRoute to react
  // to the cleared user and improvise a redirect. If it does, it stamps
  // location.state.from with wherever we were standing (e.g. /admin), and
  // the NEXT login (possibly as a non-admin) would then honor that stale
  // `from` over the correct role-based destination in Login.tsx.
  async function handleLogout() {
    setSidebarOpen(false);
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen flex bg-[#0A0A0A] text-gray-200">
      {/* Backdrop — mobile only */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:static z-40 top-0 left-0 h-full w-60 border-r border-gray-800 bg-[#0A0A0A]
          p-6 flex flex-col transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="font-mono text-xs uppercase tracking-wide text-gray-500">Admin Console</div>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            className="md:hidden p-1 text-gray-500 hover:text-white"
          >
            <CloseIcon />
          </button>
        </div>
        <nav className="space-y-1 flex-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `block text-sm px-3 py-2 rounded ${isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="text-xs text-gray-500 mb-2">{user?.email}</div>
        <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-white text-left">
          Log out
        </button>
      </aside>

      <main className="flex-1 min-w-0 p-6 md:p-10">
        {/* Mobile top bar — hamburger toggle only shown below md: */}
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          className="md:hidden mb-6 p-2 -ml-2 rounded text-gray-400 hover:text-white hover:bg-gray-900"
        >
          <MenuIcon />
        </button>
        <Outlet />
      </main>
    </div>
  );
}
