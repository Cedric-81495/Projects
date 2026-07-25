import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';
import { StatusBadge, EnrollmentStatus } from '../../components/dashboard/StatusBadge';

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

export function DashboardHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

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

  const enrolledProgramIds = new Set(enrollments.map((e) => e.programId));
  const otherPrograms = programs.filter((p) => !enrolledProgramIds.has(p.id));

  function handleEnroll(program: Program) {
    const amount = (program.priceCents / 100).toFixed(2);
    navigate(`/checkout?programSlug=${program.slug}&amount=${amount}`);
  }

  return (
    <div className="min-h-screen bg-ink px-8 py-12">
      <div className="max-w-[780px] mx-auto">
        <div className="flex items-center justify-between mb-10">
          <h1 className="font-display text-2xl text-offwhite">Welcome{user ? `, ${user.name}` : ''}</h1>
          <button onClick={logout} className="text-sm text-paper2 hover:text-brassBright">
            Log out
          </button>
        </div>

        {loading ? (
          <p className="text-paper2">Loading your enrollments…</p>
        ) : (
          <>
            {/* Enrolled programs */}
            {enrollments.length > 0 ? (
              <div className="space-y-6 mb-12">
                {enrollments.map((enrollment) => (
                  <div key={enrollment.id} className="border border-line rounded-md bg-ink2 p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl text-offwhite font-display">{enrollment.programName}</h2>
                      <StatusBadge status={enrollment.status} />
                    </div>
                    <h3 className="font-mono text-xs uppercase tracking-wide text-brassBright mb-3">Timeline</h3>
                    <ul className="space-y-3">
                      {enrollment.history.map((h, i) => (
                        <li key={i} className="text-sm text-paper2 flex justify-between border-b border-line/50 pb-2">
                          <span>{h.status}</span>
                          <span className="font-mono text-xs">{new Date(h.changedAt).toLocaleDateString()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-line rounded-md bg-ink2 p-8 text-center mb-12">
                <p className="text-paper2">No active enrollment yet — choose a program below to get started.</p>
              </div>
            )}

            {/* Other programs available to enroll in */}
            {otherPrograms.length > 0 && (
              <div>
                <h3 className="font-mono text-xs uppercase tracking-wide text-brassBright mb-4">
                  {enrollments.length > 0 ? 'Explore other programs' : 'Available programs'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {otherPrograms.map((program) => (
                    <div
                      key={program.id}
                      className="border border-line rounded-md bg-ink2 p-6 flex flex-col justify-between"
                    >
                      <div>
                        <h4 className="text-lg text-offwhite font-display mb-1">{program.name}</h4>
                        <p className="text-brassBright font-mono text-sm mb-4">{formatPrice(program.priceCents)}</p>
                      </div>
                      <button
                        onClick={() => handleEnroll(program)}
                        className="border border-brass px-4 py-2 text-xs uppercase tracking-wide rounded-sm hover:bg-brass hover:text-ink transition-colors self-start"
                      >
                        Enroll
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
