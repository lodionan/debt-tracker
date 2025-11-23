import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import ClientDashboard from './components/ClientDashboard';
import ClientsManagement from './components/ClientsManagement';
import DebtsManagement from './components/DebtsManagement';
import ReportsScreen from './components/ReportsScreen';
import MonthlyReportScreen from './components/MonthlyReportScreen';
import TopClientsScreen from './components/TopClientsScreen';
import CollectionPerformanceScreen from './components/CollectionPerformanceScreen';
import PaymentMethodsAnalysisScreen from './components/PaymentMethodsAnalysisScreen';
import SettingsScreen from './components/SettingsScreen';
import { theme } from './shared/styles/theme';
import './App.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({
  children,
  adminOnly = false
}) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.textSecondary
      }}>
        Cargando...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// App Routes Component
const AppRoutes: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />
          ) : (
            <Login />
          )
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <ClientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients"
        element={
          <ProtectedRoute adminOnly>
            <ClientsManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/debts"
        element={
          <ProtectedRoute adminOnly>
            <DebtsManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute adminOnly>
            <ReportsScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/monthly"
        element={
          <ProtectedRoute adminOnly>
            <MonthlyReportScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/top-clients"
        element={
          <ProtectedRoute adminOnly>
            <TopClientsScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/collection-performance"
        element={
          <ProtectedRoute adminOnly>
            <CollectionPerformanceScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/payment-methods"
        element={
          <ProtectedRoute adminOnly>
            <PaymentMethodsAnalysisScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute adminOnly>
            <SettingsScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? (isAdmin ? "/admin" : "/dashboard") : "/login"} replace />}
      />
    </Routes>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          backgroundColor: theme.colors.background,
          minHeight: '100vh'
        }}>
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
