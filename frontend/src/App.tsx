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
import { ErrorBoundary } from './components/ui/ErrorBoundary';

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/login', element: <Login /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <SidebarLayout />,
        children: [
          { path: '/dashboard',      element: <ErrorBoundary><Dashboard /></ErrorBoundary> },
          { path: '/builder',        element: <ErrorBoundary><Builder /></ErrorBoundary> },
          { path: '/analytics',      element: <ErrorBoundary><Analytics /></ErrorBoundary> },
          { path: '/playground',     element: <ErrorBoundary><Playground /></ErrorBoundary> },
          { path: '/settings',       element: <ErrorBoundary><Settings /></ErrorBoundary> },
          { path: '/blueprints/:id', element: <ErrorBoundary><BlueprintDetail /></ErrorBoundary> },
          { path: '/blueprint',      element: <ErrorBoundary><Builder /></ErrorBoundary> },
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
