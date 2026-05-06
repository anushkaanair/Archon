import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import SidebarLayout from './components/layout/SidebarLayout';
import Builder from './pages/Builder';
import Playground from './pages/Playground';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import BlueprintDetail from './pages/BlueprintDetail';
import NotFound from './pages/NotFound';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/login', element: <Login /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <SidebarLayout />,
        children: [
          { path: '/dashboard',      element: <Dashboard /> },
          { path: '/builder',        element: <Builder /> },      // Blueprint Builder form
          { path: '/analytics',      element: <Analytics /> },
          { path: '/playground',     element: <Playground /> },   // Visual node editor
          { path: '/settings',       element: <Settings /> },
          { path: '/blueprints/:id', element: <BlueprintDetail /> },
          // Legacy redirect support
          { path: '/blueprint',      element: <Builder /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFound /> },               // catch-all 404
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
