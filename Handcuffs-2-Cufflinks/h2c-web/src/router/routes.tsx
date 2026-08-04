import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { HomePage } from '@/modules/home/HomePage';
import { MovementPage } from '@/modules/movement/MovementPage';
import { StoriesPage } from '@/modules/storytelling/StoriesPage';
import { PodcastPage } from '@/modules/media/podcast/PodcastPage';
import { MusicPage } from '@/modules/media/music/MusicPage';
import { ApparelPage } from '@/modules/apparel/ApparelPage';
import { CommunityPage } from '@/modules/community/CommunityPage';
import { FounderPage } from '@/modules/founder/FounderPage';
import { EcosystemPage } from '@/modules/ecosystem/EcosystemPage';
import { JoinPage } from '@/modules/join/JoinPage';
import { NotFoundPage } from '@/modules/NotFoundPage';
import { SimplePage } from '@/modules/SimplePage';
import { RouteError } from '@/components/system/RouteError';
import { RequireAdmin } from '@/modules/admin/RequireAdmin';
import { AdminLayout } from '@/modules/admin/AdminLayout';
import { AdminLoginPage } from '@/modules/admin/AdminLoginPage';
import { AdminDashboardPage } from '@/modules/admin/AdminDashboardPage';
import { AdminContentPage } from '@/modules/admin/AdminContentPage';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/movement', element: <MovementPage /> },
      { path: '/stories', element: <StoriesPage /> },
      { path: '/podcast', element: <PodcastPage /> },
      { path: '/music', element: <MusicPage /> },
      { path: '/apparel', element: <ApparelPage /> },
      { path: '/community', element: <CommunityPage /> },
      { path: '/founder', element: <FounderPage /> },
      { path: '/ecosystem', element: <EcosystemPage /> },
      { path: '/join', element: <JoinPage /> },
      { path: '/privacy', element: <SimplePage eyebrow="Legal" title="Privacy" /> },
      { path: '/terms', element: <SimplePage eyebrow="Legal" title="Terms" /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  // Admin (no public nav/footer). Login is open; dashboard is guarded.
  {
    path: '/admin',
    element: <AdminLoginPage />,
    errorElement: <RouteError />,
  },
  {
    element: <RequireAdmin />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin/dashboard', element: <AdminDashboardPage /> },
          { path: '/admin/content/:resource', element: <AdminContentPage /> },
        ],
      },
    ],
  },
]);
