import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { loadAccessState } from '@/lib/access/load'
import { isStaff } from '@/lib/access/policy'
import { Crest } from '@/components/Chrome'
import AdminNav from '@/components/admin/AdminNav'

export const metadata: Metadata = {
  title: 'Admin — GWOP University',
  robots: { index: false, follow: false },
}

/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN SHELL  —  the staff gate, moved up from page.tsx 2026-09-26.

   Built for MAUI's tracker tasks: "Organize modules by GWOP level" (Aug 23)
   and "Report missing items". It replaced a status PDF that was already a week
   stale by the time anyone read it.

   ⚠ THE GATE LIVES HERE SO IT CANNOT BE FORGOTTEN ON A NEW SECTION. It used to
   sit inside page.tsx. That was correct while /admin was one page; with four
   routes underneath it, whoever adds the fifth would have had to remember to
   copy nine lines of auth. A layout wraps every child by construction.

   ⚠ CHILD PAGES THAT TOUCH THE DATABASE STILL CHECK AGAIN. A Next layout and
   its page render in parallel, so a page's code can execute before the
   layout's notFound() resolves. For the three content pages that reads from a
   TypeScript file and is harmless. The dashboard queries enrollments and
   payments, so it re-checks. Defence in depth, not distrust of the router.

   ⚠ STAFF, NOT ADMIN, DESPITE THE ROUTE NAME. has_role() is a rank
   comparison, so admin and owner pass this too. Maui and Sheena — the people
   this was built for — need reading rights, not write rights.

   ⚠ notFound(), NOT A REDIRECT AND NOT A 403. Same reasoning as the asset
   route: a 403 confirms the page exists and is worth attacking. A student who
   wanders here gets the same 404 as a typo.

   HISTORY, BECAUSE IT MATTERS. This block once read "No auth yet — Phase 2. Do
   not expose publicly." It was exposed publicly: middleware.ts lists /admin in
   PROTECTED_PREFIXES, but that only requires A SESSION, and signup is open to
   anyone. Every registered student could read the whole production map. No
   customer data was reachable, so it was internal disclosure rather than a
   breach — it still told any curious buyer that the course they had just paid
   for was 47 lessons short.

   ⚠ AND THAT IS WHY THERE IS NO STUDENT LIST IN HERE. Reviewed 2026-09-26 when
   this became a multi-section console. The obvious next sections were Students
   and Payments — staff can read both under RLS. They are deliberately absent.
   The dashboard shows COUNTS: how many enrolled, how much collected. A staff
   login should answer "how are we doing", not export the customer base. Same
   asymmetry the asset route argues for: read access in the UI, no bulk export.

   If a named list is ever genuinely needed, put it behind is_admin() rather
   than has_role('staff'), and decide that deliberately.
   ═══════════════════════════════════════════════════════════════════════════ */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase()
  const access = await loadAccessState(supabase)
  if (!access || !isStaff(access)) notFound()

  return (
    <div className="ashell">
      <aside className="aside">
        <div className="aside-brand">
          <Crest size={28} />
          <b>GWOP Admin</b>
        </div>
        <AdminNav />
        <p className="aside-foot">
          Read-only. Content status comes from <code>src/content/modules.ts</code>;
          counts come from the database.
        </p>
      </aside>
      <main className="amain">{children}</main>
    </div>
  )
}
