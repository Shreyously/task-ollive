import { Navigate, createBrowserRouter } from 'react-router-dom';

import { AppShell } from './components/layout/app-shell';
import { ChatPage } from './pages/chat-page';
import { DashboardPage } from './pages/dashboard-page';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/chat" replace /> },
      { path: 'chat', element: <ChatPage /> },
      { path: 'dashboard', element: <DashboardPage /> },
    ],
  },
]);
