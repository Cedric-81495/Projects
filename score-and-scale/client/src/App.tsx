import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AdminRoute } from './routes/AdminRoute';
import { BackToTop } from './components/ui/BackToTop';
import { ScrollToTop } from './components/ui/ScrollToTop';
import { SessionManager } from './components/auth/SessionManager';

import { Home } from './pages/Home';
import { Contact } from './pages/Contact';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { DashboardHome } from './pages/dashboard/DashboardHome';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminHome } from './pages/admin/AdminHome';
import { EnrollmentsTable } from './pages/admin/EnrollmentsTable';
import { ContactsInbox } from './pages/admin/ContactsInbox';
import Checkout from './pages/Checkout';
import { NotFound } from './pages/NotFound';
import { DocumentsReview } from './pages/admin/DocumentsReview';
import { PaymentsTable } from './pages/admin/PaymentsTable';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/checkout" element={<Checkout />} />
          </Route>

          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
            <Route path="documents" element={<DocumentsReview />} />
            <Route path="payments" element={<PaymentsTable />} />
              <Route index element={<AdminHome />} />
              <Route path="enrollments" element={<EnrollmentsTable />} />
              <Route path="contacts" element={<ContactsInbox />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        <BackToTop />
        <SessionManager />
      </AuthProvider>
    </BrowserRouter>
  );
}
