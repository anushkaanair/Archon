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
          { path: '/dashboard',       element: <Dashboard /> },
          { path: '/blueprint',       element: <Builder /> },
          { path: '/analytics',       element: <Analytics /> },
          { path: '/settings',        element: <Settings /> },
          { path: '/blueprints/:id',  element: <BlueprintDetail /> },
        ],
      },
      // Playground has its own full-screen layout (no sidebar)
      { path: '/builder', element: <Playground /> },
    ],
  },
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
