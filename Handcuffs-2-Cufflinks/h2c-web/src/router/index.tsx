import { BrowserRouter } from 'react-router-dom';
import { SessionTimeout } from '@/components/session/SessionTimeout';
import { AppRoutes } from './AppRoutes';

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppRoutes />
      {/* Inside the router, because ending a staff session navigates. Outside
          the routes, so the countdown survives moving between pages. */}
      <SessionTimeout />
    </BrowserRouter>
  );
}
