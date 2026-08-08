import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RootLayout } from '@/components/layout/RootLayout';
import { HomePage } from '@/features/home/HomePage';
import { NotFoundPage } from '@/features/NotFoundPage';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { ROUTES } from './routes';
import { SectionLoad } from '@/components/ui/Spinner';
import { RouteBoundary } from './RouteBoundary';

/**
 * The route tree, shared by the browser and the prerender build.
 *
 * Declarative <Routes> rather than createBrowserRouter, because a data router
 * cannot render under StaticRouter. Nothing here used loaders or actions, so
 * there is nothing to give up.
 *
 * The homepage loads eagerly — it is the entry point for almost every visitor.
 * Everything else is split, and the CMS is split hardest: someone reading
 * stories should never download the admin panel.
 */
const MovementPage = lazy(() => import('@/features/movement/MovementPage').then((m) => ({ default: m.MovementPage })));
const CollectionsPage = lazy(() => import('@/features/collections/CollectionsPage').then((m) => ({ default: m.CollectionsPage })));
const LooksPage = lazy(() => import('@/features/collections/LooksPage').then((m) => ({ default: m.LooksPage })));
const DocuseriesPage = lazy(() => import('@/features/docuseries/DocuseriesPage').then((m) => ({ default: m.DocuseriesPage })));
const PodcastPage = lazy(() => import('@/features/podcast/PodcastPage').then((m) => ({ default: m.PodcastPage })));
const MusicPage = lazy(() => import('@/features/music/MusicPage').then((m) => ({ default: m.MusicPage })));
const GwopPage = lazy(() => import('@/features/gwop/GwopPage').then((m) => ({ default: m.GwopPage })));
const CommunityPage = lazy(() => import('@/features/community/CommunityPage').then((m) => ({ default: m.CommunityPage })));
const StorySubmissionPage = lazy(() => import('@/features/community/StorySubmissionPage').then((m) => ({ default: m.StorySubmissionPage })));
const FounderPage = lazy(() => import('@/features/founder/FounderPage').then((m) => ({ default: m.FounderPage })));
const JoinPage = lazy(() => import('@/features/join/JoinPage').then((m) => ({ default: m.JoinPage })));
const LegalPage = lazy(() => import('@/features/legal/LegalPage').then((m) => ({ default: m.LegalPage })));
const RegisterPage = lazy(() => import('@/features/account/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const MemberSignInPage = lazy(() => import('@/features/account/MemberSignInPage').then((m) => ({ default: m.MemberSignInPage })));
const AccountPage = lazy(() => import('@/features/account/AccountPage').then((m) => ({ default: m.AccountPage })));

const SignInPage = lazy(() => import('@/features/auth/SignInPage').then((m) => ({ default: m.SignInPage })));
const AdminLayout = lazy(() => import('@/features/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })));
const DashboardPage = lazy(() => import('@/features/admin/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const AdminH2C = lazy(() => import('@/features/admin/modules').then((m) => ({ default: m.AdminH2CPage })));
const AdminKitchen = lazy(() => import('@/features/admin/modules').then((m) => ({ default: m.AdminKitchenPage })));
const AdminGwop = lazy(() => import('@/features/admin/modules').then((m) => ({ default: m.AdminGwopPage })));
const AdminCommunity = lazy(() => import('@/features/admin/CommunityPage').then((m) => ({ default: m.AdminCommunityPage })));
const AdminMedia = lazy(() => import('@/features/admin/MediaPage').then((m) => ({ default: m.AdminMediaPage })));
const AdminSubscribers = lazy(() => import('@/features/admin/SubscribersPage').then((m) => ({ default: m.AdminSubscribersPage })));
const AdminUsers = lazy(() => import('@/features/admin/UsersPage').then((m) => ({ default: m.AdminUsersPage })));
const AdminHomepage = lazy(() => import('@/features/admin/HomepagePage').then((m) => ({ default: m.AdminHomepagePage })));
const AdminNavigation = lazy(() => import('@/features/admin/NavigationPage').then((m) => ({ default: m.AdminNavigationPage })));
const AdminSeo = lazy(() => import('@/features/admin/SeoPage').then((m) => ({ default: m.AdminSeoPage })));
const AdminFounder = lazy(() => import('@/features/admin/FounderPage').then((m) => ({ default: m.AdminFounderPage })));
const AdminSettings = lazy(() => import('@/features/admin/SettingsPage').then((m) => ({ default: m.AdminSettingsPage })));
const ResourceList = lazy(() => import('@/features/admin/ResourceListPage').then((m) => ({ default: m.ResourceListPage })));
const ResourceEdit = lazy(() => import('@/features/admin/ResourceEditPage').then((m) => ({ default: m.ResourceEditPage })));

/** Deliberately quiet: a spinner on every navigation is worse than a beat of nothing. */
/**
 * Shown while a route's chunk is downloading.
 *
 * It used to be an empty box, which meant a slow or failed chunk looked exactly
 * like a blank page — indistinguishable from a broken site. A visible, labelled
 * spinner says the difference out loud.
 */
function RouteFallback() {
  return (
    <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
      <SectionLoad label="Loading" rows={2} />
    </div>
  );
}

export function AppRoutes() {
  return (
    <RouteBoundary>
      <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path={ROUTES.home} element={<HomePage />} />
          <Route path={ROUTES.movement} element={<MovementPage />} />
          <Route path={ROUTES.collections} element={<CollectionsPage />} />
          <Route path={ROUTES.looks} element={<LooksPage />} />
          <Route path={ROUTES.docuseries} element={<DocuseriesPage />} />
          <Route path={ROUTES.podcast} element={<PodcastPage />} />
          <Route path={ROUTES.music} element={<MusicPage />} />
          <Route path={ROUTES.gwop} element={<GwopPage />} />
          <Route path={ROUTES.community} element={<CommunityPage />} />
          <Route path={ROUTES.submitStory} element={<StorySubmissionPage />} />
          <Route path={ROUTES.founder} element={<FounderPage />} />
          <Route path={ROUTES.join} element={<JoinPage />} />
          <Route path={ROUTES.register} element={<RegisterPage />} />
          <Route path={ROUTES.signInMember} element={<MemberSignInPage />} />
          <Route path={ROUTES.account} element={<AccountPage />} />
          <Route path={ROUTES.legal} element={<LegalPage />} />
          <Route path={ROUTES.legalDoc} element={<LegalPage />} />

          {/* "Shop" was renamed to "Collections" and must not 404. */}
          <Route path="/shop" element={<Navigate to={ROUTES.collections} replace />} />

          <Route path={ROUTES.notFound} element={<NotFoundPage />} />
        </Route>

        <Route path={ROUTES.signIn} element={<SignInPage />} />

        <Route element={<RequireAuth />}>
          <Route path={ROUTES.admin} element={<AdminLayout />}>
            <Route index element={<Navigate to={ROUTES.adminDashboard} replace />} />
            <Route path={ROUTES.adminDashboard} element={<DashboardPage />} />
            <Route path={ROUTES.adminH2C} element={<AdminH2C />} />
            <Route path={ROUTES.adminKitchen} element={<AdminKitchen />} />
            <Route path={ROUTES.adminGwop} element={<AdminGwop />} />
            <Route path={ROUTES.adminCommunity} element={<AdminCommunity />} />
            <Route path={ROUTES.adminMedia} element={<AdminMedia />} />
            <Route path={ROUTES.adminSubscribers} element={<AdminSubscribers />} />
            <Route path={ROUTES.adminUsers} element={<AdminUsers />} />

            <Route path={ROUTES.adminHomepage} element={<AdminHomepage />} />
            <Route path={ROUTES.adminNavigation} element={<AdminNavigation />} />
            <Route path={ROUTES.adminSeo} element={<AdminSeo />} />
            <Route path={ROUTES.adminFounder} element={<AdminFounder />} />
            <Route path={ROUTES.adminSettings} element={<AdminSettings />} />

            {/* Declared before the :id route so "new" is not read as an id. */}
            <Route path={ROUTES.adminRecords} element={<ResourceList />} />
            <Route path={ROUTES.adminRecordNew} element={<ResourceEdit />} />
            <Route path={ROUTES.adminRecordEdit} element={<ResourceEdit />} />
          </Route>
        </Route>
        </Routes>
      </Suspense>
    </RouteBoundary>
  );
}
