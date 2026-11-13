import { createBrowserRouter } from 'react-router';
import AppLayout from './layouts/AppLayout/AppLayout.tsx';
import ChatConversation from './pages/chat/ChatConversation/ChatConversation.tsx';
import ChatHome from './pages/chat/ChatHome/ChatHome.tsx';
import ChatLayout from './pages/chat/ChatLayout/ChatLayout.tsx';
import Dashboard from './pages/Dashboard/Dashboard.tsx';
import Home from './pages/Home/Home.tsx';
import NotFound from './pages/NotFound/NotFound.tsx';
import ProjectDetail from './pages/ProjectDetail/ProjectDetail.tsx';
import Projects from './pages/Projects/Projects.tsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'projects', element: <Projects /> },
      { path: 'projects/:id', element: <ProjectDetail /> },
      {
        path: 'chat',
        element: <ChatLayout />,
        children: [
          { index: true, element: <ChatHome /> },
          { path: ':id', element: <ChatConversation /> },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
