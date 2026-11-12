import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/common/ProtectedRoute';
import './index.css';

// Lazy-loaded portals
const LoginPage       = lazy(() => import('./components/auth/LoginPage'));
const AdminPortal     = lazy(() => import('./components/admin/AdminPortal'));
const TeacherPortal   = lazy(() => import('./components/teacher/TeacherPortal'));
const StudentPortal   = lazy(() => import('./components/student/StudentPortal'));
const ParentPortal    = lazy(() => import('./components/parent/ParentPortal'));

function PageLoader() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--clr-bg)', flexDirection: 'column', gap: '16px',
    }}>
      <div className="spinner" />
      <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.9rem' }}>Loading...</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

            {/* Admin Portal */}
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPortal />
              </ProtectedRoute>
            } />

            {/* Teacher Portal */}
            <Route path="/teacher/*" element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherPortal />
              </ProtectedRoute>
            } />

            {/* Student Portal */}
            <Route path="/student/*" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentPortal />
              </ProtectedRoute>
            } />

            {/* Parent Portal */}
            <Route path="/parent/*" element={
              <ProtectedRoute allowedRoles={['parent']}>
                <ParentPortal />
              </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
