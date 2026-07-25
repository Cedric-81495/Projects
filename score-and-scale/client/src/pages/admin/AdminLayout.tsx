import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/enrollments', label: 'Enrollments' },
  { to: '/admin/contacts', label: 'Contact Inbox' },
];

// Visually distinct from /dashboard on purpose: sidebar + dense tables,
// so anyone glancing at the screen can immediately tell which surface
// they're on — reduces the risk of an admin acting as if in the customer view.
export function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex bg-[#0A0A0A] text-gray-200">
      <aside className="w-60 border-r border-gray-800 p-6 flex flex-col">
        <div className="font-mono text-xs uppercase tracking-wide text-gray-500 mb-8">Admin Console</div>
        <nav className="space-y-1 flex-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block text-sm px-3 py-2 rounded ${isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="text-xs text-gray-500 mb-2">{user?.email}</div>
        <button onClick={logout} className="text-xs text-gray-500 hover:text-white text-left">
          Log out
        </button>
      </aside>
      <main className="flex-1 p-10">
        <Outlet />
      </main>
    </div>
  );
}
