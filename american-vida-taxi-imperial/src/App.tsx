import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from '@/features/auth/AuthContext';
import LoginPage from '@/features/auth/pages/LoginPage';
import ChangePasswordPage from '@/features/auth/pages/ChangePasswordPage';
import AppLayout from '@/components/layout/AppLayout';
import DashboardPage from '@/features/requirements/pages/DashboardPage';
import RequirementsListPage from '@/features/requirements/pages/RequirementsListPage';
import RequirementNewPage from '@/features/requirements/pages/RequirementNewPage';
import RequirementDetailPage from '@/features/requirements/pages/RequirementDetailPage';
import UsersPage from '@/features/users/UsersPage';

function RequireAuth({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const location = useLocation();
  if (!session) return <Navigate to="/login" replace />;
  if (session.user.mustChangePassword && location.pathname !== '/cambiar-contrasena') {
    return <Navigate to="/cambiar-contrasena" replace />;
  }
  return <>{children}</>;
}

function RequireApprover({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  if (session?.user.role !== 'aprobador') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/cambiar-contrasena"
            element={
              <RequireAuth>
                <ChangePasswordPage />
              </RequireAuth>
            }
          />
          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/requerimientos" element={<RequirementsListPage />} />
            <Route path="/requerimientos/nuevo" element={<RequirementNewPage />} />
            <Route path="/requerimientos/:id" element={<RequirementDetailPage />} />
            <Route
              path="/usuarios"
              element={
                <RequireApprover>
                  <UsersPage />
                </RequireApprover>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
