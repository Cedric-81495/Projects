import { Suspense, lazy } from 'react'
import { Outlet, Route, Routes } from 'react-router-dom'
import { SessionManager } from './components/auth/SessionManager'
import { Footer } from './components/marketing/Footer'
import { Header } from './components/marketing/Header'
import { BackToTop } from './components/ui/BackToTop'
import { PageTransitionBar } from './components/ui/PageTransitionBar'
import { ScrollToTop } from './components/ui/ScrollToTop'
import { LoadingBlock } from './components/ui/Spinner'
import { AdminRoute } from './routes/AdminRoute'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { Contact } from './pages/Contact'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { NotFound } from './pages/NotFound'
import { Register } from './pages/Register'

/**
 * Route-level code splitting.
 *
 * The funnel page is what most visitors load, so it stays in the main bundle.
 * Checkout pulls in the Braintree SDK and the admin console is only reachable by
 * staff — neither should cost a first-time visitor anything, so both are lazy.
 */
const Checkout = lazy(() => import('./pages/Checkout').then((m) => ({ default: m.Checkout })))
const DashboardHome = lazy(() =>
  import('./pages/dashboard/DashboardHome').then((m) => ({ default: m.DashboardHome })),
)
const Academy = lazy(() =>
  import('./pages/dashboard/Academy').then((m) => ({ default: m.Academy })),
)
const AdminLayout = lazy(() =>
  import('./pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })),
)
const AdminHome = lazy(() =>
  import('./pages/admin/AdminHome').then((m) => ({ default: m.AdminHome })),
)
const EnrollmentsTable = lazy(() =>
  import('./pages/admin/EnrollmentsTable').then((m) => ({ default: m.EnrollmentsTable })),
)
const ContactsInbox = lazy(() =>
  import('./pages/admin/ContactsInbox').then((m) => ({ default: m.ContactsInbox })),
)
const DocumentsReview = lazy(() =>
  import('./pages/admin/DocumentsReview').then((m) => ({ default: m.DocumentsReview })),
)
const PaymentsTable = lazy(() =>
  import('./pages/admin/PaymentsTable').then((m) => ({ default: m.PaymentsTable })),
)
const AuditLog = lazy(() => import('./pages/admin/AuditLog').then((m) => ({ default: m.AuditLog })))

/**
 * Public and customer-facing chrome: marketing header, footer, and the
 * floating controls. The admin console renders its own shell instead.
 */
function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <BackToTop />
    </div>
  )
}

export default function App() {
  return (
    <>
      {/* First tab stop on every page, for keyboard and screen-reader users. */}
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <ScrollToTop />
      <PageTransitionBar />
      <SessionManager />

      <Suspense fallback={<LoadingBlock />}>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/dashboard" element={<DashboardHome />} />
              <Route path="/dashboard/academy" element={<Academy />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Admin sits outside SiteLayout so it does not inherit the marketing chrome. */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminHome />} />
              <Route path="enrollments" element={<EnrollmentsTable />} />
              <Route path="contacts" element={<ContactsInbox />} />
              <Route path="documents" element={<DocumentsReview />} />
              <Route path="payments" element={<PaymentsTable />} />
              <Route path="audit-log" element={<AuditLog />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}
