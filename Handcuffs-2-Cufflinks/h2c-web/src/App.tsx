import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { HomePage } from '@/modules/home/HomePage';
import { MovementPage } from '@/modules/movement/MovementPage';
import { LookbookPage } from '@/modules/apparel/LookbookPage';
import { StoriesPage } from '@/modules/storytelling/StoriesPage';
import { PodcastPage } from '@/modules/media/podcast/PodcastPage';
import { MusicPage } from '@/modules/media/music/MusicPage';
import { GwopPage } from '@/modules/ecosystem/GwopPage';
import { AboutPage } from '@/modules/founder/AboutPage';
import { CommunityPage } from '@/modules/community/CommunityPage';
import { JoinPage } from '@/modules/join/JoinPage';
import { LegalPage } from '@/modules/legal/LegalPage';
import { NotFound } from '@/modules/NotFound';

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/movement', element: <MovementPage /> },
      { path: '/lookbook', element: <LookbookPage /> },
      { path: '/stories', element: <StoriesPage /> },
      { path: '/podcast', element: <PodcastPage /> },
      { path: '/music', element: <MusicPage /> },
      { path: '/gwop', element: <GwopPage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/community', element: <CommunityPage /> },
      { path: '/join', element: <JoinPage /> },
      { path: '/legal', element: <LegalPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
