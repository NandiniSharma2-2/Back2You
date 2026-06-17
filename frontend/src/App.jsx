import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import LoadingScreen from './components/ui/LoadingScreen';

// Lazy loaded pages
const LandingPage = lazy(() => import('./pages/Landing'));
const LoginPage = lazy(() => import('./pages/auth/Login'));
const RegisterPage = lazy(() => import('./pages/auth/Register'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPassword'));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmail'));
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));
const DashboardHome = lazy(() => import('./pages/dashboard/Home'));
const LostItemsPage = lazy(() => import('./pages/dashboard/LostItems'));
const CreateLostItemPage = lazy(() => import('./pages/dashboard/CreateLostItem'));
const FoundItemsPage = lazy(() => import('./pages/dashboard/FoundItems'));
const CreateFoundItemPage = lazy(() => import('./pages/dashboard/CreateFoundItem'));
const ItemDetailPage = lazy(() => import('./pages/dashboard/ItemDetail'));
const ClaimsPage = lazy(() => import('./pages/dashboard/Claims'));
const ClaimDetailPage = lazy(() => import('./pages/dashboard/ClaimDetail'));
const ChatPage = lazy(() => import('./pages/dashboard/Chat'));
const NotificationsPage = lazy(() => import('./pages/dashboard/Notifications'));
const ProfilePage = lazy(() => import('./pages/dashboard/Profile'));
const SearchPage = lazy(() => import('./pages/Search'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminItems = lazy(() => import('./pages/admin/Items'));
const AdminClaims = lazy(() => import('./pages/admin/Claims'));
const AdminCategories = lazy(() => import('./pages/admin/Categories'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));
const AdminAuditLogs = lazy(() => import('./pages/admin/AuditLogs'));
const NotFoundPage = lazy(() => import('./pages/NotFound'));

function ProtectedRoute({ children, roles }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user?.role_name)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* Guest-only */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />

        {/* User Dashboard */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<DashboardHome />} />
          <Route path="lost" element={<LostItemsPage />} />
          <Route path="lost/create" element={<CreateLostItemPage />} />
          <Route path="lost/:uuid" element={<ItemDetailPage type="lost" />} />
          <Route path="found" element={<FoundItemsPage />} />
          <Route path="found/create" element={<CreateFoundItemPage />} />
          <Route path="found/:uuid" element={<ItemDetailPage type="found" />} />
          <Route path="claims" element={<ClaimsPage />} />
          <Route path="claims/:uuid" element={<ClaimDetailPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Admin Panel */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin', 'super_admin', 'moderator']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="items" element={<AdminItems />} />
          <Route path="claims" element={<AdminClaims />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="settings" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminSettings /></ProtectedRoute>} />
          <Route path="audit-logs" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminAuditLogs /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0A0F1D',
              color: '#e2e8f0',
              border: '1px solid rgba(0, 240, 255, 0.2)',
              borderRadius: '8px',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#39FF14', secondary: '#0A0F1D' },
            },
            error: {
              iconTheme: { primary: '#FF3B3B', secondary: '#0A0F1D' },
            },
          }}
        />
      </NotificationProvider>
    </AuthProvider>
  );
}
