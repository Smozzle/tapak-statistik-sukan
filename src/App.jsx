import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Statistik from './pages/Statistik.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminKeputusan from './pages/admin/AdminKeputusan.jsx';
import AdminRumah from './pages/admin/AdminRumah.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="rumah/:rumahId" element={<Statistik />} />
        <Route path="admin/login" element={<AdminLogin />} />
        <Route
          path="admin"
          element={
            <ProtectedRoute>
              <AdminKeputusan />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/rumah"
          element={
            <ProtectedRoute>
              <AdminRumah />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
