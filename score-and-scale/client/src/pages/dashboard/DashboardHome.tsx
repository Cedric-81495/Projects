import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import { StatusBadge, EnrollmentStatus } from '../../components/dashboard/StatusBadge';
import { DocumentUpload } from '../../components/dashboard/DocumentUpload';
import { PaymentHistory } from '../../components/dashboard/PaymentHistory';

interface Enrollment {
  id: string;
  programId: string;
  programSlug: string;
  programName: string;
  status: EnrollmentStatus;
  history: { status: string; changedAt: string }[];
}

interface Program {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  billingType: 'one_time' | 'program' | 'engagement';
}

function formatPrice(priceCents: number) {
  return `$${(priceCents / 100).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
}

// Statuses the USER can self-cancel from the dashboard. Anything already
// paid/settled ('active', 'funded') is intentionally excluded — unwinding
// those involves a real charge and should go through support/admin instead.
const CANCELLABLE_STATUSES: EnrollmentStatus[] = ['pending_payment' as EnrollmentStatus, 'in_review' as EnrollmentStatus];

// --- Minimal monochrome inline icons (no lucide-react per project constraint) ---
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="4" />
      <path
        d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={`transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
    >
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
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

export function DashboardHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  // Default is light, per the requested design.
  const [darkMode, setDarkMode] = useState(false);
  const [programsOpen, setProgramsOpen] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Sidebar is a static column on desktop and an off-canvas drawer on
  // small screens — closed by default there so it doesn't cover the page
  // on first load.
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch<Enrollment[]>('/api/enrollments').catch(() => []),
      apiFetch<Program[]>('/api/programs').catch(() => []),
    ]).then(([enrollmentsData, programsData]) => {
      setEnrollments(enrollmentsData);
      setPrograms(programsData);
      setLoading(false);
    });
  }, []);

  // Defensive: coerce both sides to string before comparing, in case
  // programId ever comes back as a populated object instead of a plain id.
  const enrolledProgramIds = new Set(enrollments.map((e) => String(e.programId)));
  const otherPrograms = programs.filter((p) => !enrolledProgramIds.has(String(p.id)));

  function handleEnroll(program: Program) {
    const amount = (program.priceCents / 100).toFixed(2);
    setSidebarOpen(false); // close the drawer on mobile before navigating away
    navigate(`/checkout?programSlug=${program.slug}&amount=${amount}`);
  }

  async function handleCancel(enrollmentId: string) {
    setCancellingId(enrollmentId);
    setActionError(null);
    try {
      await apiFetch(`/api/enrollments/${enrollmentId}/cancel`, { method: 'PATCH' });
      setEnrollments((prev) =>
        prev.map((e) =>
          e.id === enrollmentId
            ? {
                ...e,
                status: 'cancelled' as EnrollmentStatus,
                history: [...e.history, { status: 'cancelled', changedAt: new Date().toISOString() }],
              }
            : e
        )
      );
    } catch (err: any) {
      setActionError(err?.message || "Couldn't cancel this request. Please try again.");
    } finally {
      setCancellingId(null);
    }
  }

  // Explicit navigation after logout — do NOT rely on ProtectedRoute to
  // react to the cleared user and improvise a redirect. If it does, it
  // stamps location.state.from with wherever we were standing (e.g.
  // /dashboard), and the NEXT login (possibly as a different user/role)
  // would then honor that stale `from` over the correct role-based
  // destination in Login.tsx.
  async function handleLogout() {
    setSidebarOpen(false);
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen flex bg-white dark:bg-black transition-colors duration-150">
        {/* Backdrop — mobile only, closes the drawer on tap */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar — off-canvas drawer on mobile, static column from md: up */}
        <aside
          className={`fixed md:static z-40 top-0 left-0 h-full w-[260px] shrink-0 border-r border-gray-200 dark:border-[#232323]
            bg-white dark:bg-black flex flex-col p-6 transition-transform duration-200 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        >
          {/* Close button — mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            className="md:hidden self-end -mt-2 -mr-2 mb-4 p-2 text-gray-500 dark:text-[#9A9A9A] hover:text-gray-900 dark:hover:text-white"
          >
            <CloseIcon />
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={() => setDarkMode((d) => !d)}
            className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-[#9A9A9A] hover:text-gray-900 dark:hover:text-white transition-colors mb-6 self-start"
          >
            {darkMode ? <SunIcon /> : <MoonIcon />}
            {darkMode ? 'Light mode' : 'Dark mode'}
          </button>

          {/* User */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#171717] border border-gray-200 dark:border-[#232323] flex items-center justify-center text-[13px] font-medium text-gray-900 dark:text-white shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</div>
              {user?.email && (
                <div className="text-xs text-gray-500 dark:text-[#6F6F6F] truncate">{user.email}</div>
              )}
            </div>
          </div>

          <div className="h-px bg-gray-200 dark:bg-[#232323] mb-6" />

          {/* Programs dropdown */}
          <button
            onClick={() => setProgramsOpen((o) => !o)}
            className="flex items-center justify-between text-[11px] uppercase tracking-wide font-medium text-gray-500 dark:text-[#6F6F6F] mb-3 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Programs
            <ChevronIcon open={programsOpen} />
          </button>

          {programsOpen && (
            <div className="space-y-1 mb-6">
              {otherPrograms.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-[#6F6F6F] px-1">
                  You're enrolled in everything available.
                </p>
              ) : (
                otherPrograms.map((program) => (
                  <button
                    key={program.id}
                    onClick={() => handleEnroll(program)}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-[#9A9A9A] hover:bg-gray-100 dark:hover:bg-[#171717] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">{program.name}</span>
                      <span className="text-xs text-gray-400 dark:text-[#6F6F6F] shrink-0">
                        {formatPrice(program.priceCents)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          <div className="mt-auto pt-6 border-t border-gray-200 dark:border-[#232323]">
            <button
              onClick={handleLogout}
              className="text-xs text-gray-500 dark:text-[#9A9A9A] hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Log out
            </button>
          </div>
        </aside>

        {/* Main content: My Programs */}
        <main className="flex-1 min-w-0 px-6 md:px-10 py-6 md:py-10 max-w-[900px]">
          {/* Mobile top bar — hamburger toggle only shown below md: */}
          <div className="flex items-center gap-3 mb-6 md:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="p-2 -ml-2 rounded-lg text-gray-700 dark:text-[#9A9A9A] hover:bg-gray-100 dark:hover:bg-[#171717]"
            >
              <MenuIcon />
            </button>
            <span className="text-sm font-medium text-gray-900 dark:text-white">My Programs</span>
          </div>

          <h1 className="hidden md:block text-2xl font-semibold text-gray-900 dark:text-white mb-1">My Programs</h1>
          <p className="hidden md:block text-sm text-gray-500 dark:text-[#9A9A9A] mb-8">
            Track the status of everything you've enrolled in.
          </p>

          {actionError && (
            <div className="mb-6 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm px-4 py-3">
              {actionError}
            </div>
          )}

          {loading ? (
            <p className="text-gray-500 dark:text-[#9A9A9A] text-sm">Loading your enrollments…</p>
          ) : enrollments.length > 0 ? (
            <div className="space-y-4">
              {enrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="rounded-2xl border border-gray-200 dark:border-[#232323] bg-white dark:bg-[#111111] p-6 transition-colors duration-150"
                >
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-[17px] font-medium text-gray-900 dark:text-white">
                      {enrollment.programName}
                    </h2>
                    <DocumentUpload enrollmentId={enrollment.id} />
                    <StatusBadge status={enrollment.status} />
                  </div>

                  <div className="h-px bg-gray-200 dark:bg-[#232323] mb-5" />

                  <h4 className="text-[11px] uppercase tracking-wide font-medium text-gray-400 dark:text-[#6F6F6F] mb-3">
                    Timeline
                  </h4>
                  <ul className="relative pl-5 mb-5">
                    <div className="absolute left-[5px] top-1 bottom-1 w-px bg-gray-200 dark:bg-[#232323]" />
                    {enrollment.history.map((h, i) => (
                      <li key={i} className="relative flex items-center justify-between py-2.5">
                        <div className="absolute -left-5 w-2 h-2 rounded-full bg-gray-300 dark:bg-[#3a3a3a] border border-gray-400 dark:border-[#6F6F6F]" />
                        <span className="text-[13px] text-gray-500 dark:text-[#9A9A9A] capitalize">{h.status}</span>
                        <span className="text-[12px] font-mono text-gray-400 dark:text-[#6F6F6F]">
                          {new Date(h.changedAt).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Status-specific actions */}
                  <div className="flex items-center gap-3">
                    {CANCELLABLE_STATUSES.includes(enrollment.status) && (
                      <button
                        onClick={() => handleCancel(enrollment.id)}
                        disabled={cancellingId === enrollment.id}
                        className="text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-lg px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50 transition-colors"
                      >
                        {cancellingId === enrollment.id ? 'Cancelling…' : 'Cancel request'}
                      </button>
                    )}
                    {enrollment.status === 'funded' && (
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        Funded — this program is complete.
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 dark:border-[#232323] bg-white dark:bg-[#111111] p-8 text-center">
              <p className="text-gray-500 dark:text-[#9A9A9A] text-sm">
                No programs yet — pick one from the sidebar to get started.
              </p>
            </div>
          )}
          <div className="mt-8">
            <PaymentHistory />
          </div>
        </main>
      </div>
    </div>
  );
}
