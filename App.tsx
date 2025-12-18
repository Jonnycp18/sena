import { useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { NotificationProvider } from './hooks/useNotifications';
import { AuditProvider } from './hooks/useAuditLog';
import { LoginPage } from './components/LoginPage';
import { MainLayout } from './components/MainLayout';
import { Toaster } from './components/ui/sonner';
import { seedAuditLogs } from './utils/seedAuditLogs';

function AppContent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <MainLayout />;
}

export default function App() {
  // Generar logs de ejemplo al iniciar
  useEffect(() => {
    seedAuditLogs();
  }, []);

  return (
    <AuthProvider>
      <AuditProvider>
        <NotificationProvider>
          <AppContent />
          <Toaster />
        </NotificationProvider>
      </AuditProvider>
    </AuthProvider>
  );
}