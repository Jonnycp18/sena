import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AppSidebar } from './AppSidebar';
import { AdminDashboard } from './dashboards/AdminDashboard';
import { CoordinadorDashboard } from './dashboards/CoordinadorDashboard';
import { DocenteDashboard } from './dashboards/DocenteDashboard';
import { ProfilePage } from './ProfilePage';
import { UserManagement } from './UserManagement';
import { FichasMateriasManagement } from './FichasMateriasManagement';
import { FileUploadManagement } from './FileUploadManagement';
import { ReportsPage } from './reports/ReportsPage';
import { NotificationCenter } from './NotificationCenter';
import { NotificationBell } from './NotificationBell';
import { LogoutButton } from './LogoutButton';
import { AuditLogPage } from './AuditLogPage';
import { CalificacionesPage } from './CalificacionesPage';
import { SidebarProvider, SidebarInset, SidebarTrigger } from './ui/sidebar';
import { Separator } from './ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from './ui/breadcrumb';

export function MainLayout() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState('/dashboard');

  if (!user) return null;

  const renderContent = () => {
    if (currentPage === '/dashboard') {
      switch (user.rol) {
        case 'administrador':
          return <AdminDashboard />;
        case 'coordinador':
          return <CoordinadorDashboard />;
        case 'docente':
          return <DocenteDashboard />;
        default:
          return <div>Dashboard no disponible para este rol</div>;
      }
    }

    if (currentPage === '/perfil') {
      return <ProfilePage />;
    }

    if (currentPage === '/usuarios') {
      return <UserManagement />;
    }

    if (currentPage === '/fichas') {
      return <FichasMateriasManagement />;
    }

    if (currentPage === '/carga-archivos') {
      return <FileUploadManagement />;
    }

    // Página de Evidencias Wide eliminada (duplicada de Carga de Archivos)

    if (currentPage === '/reportes') {
      return <ReportsPage />;
    }

    if (currentPage === '/notificaciones') {
      return <NotificationCenter />;
    }

    if (currentPage === '/auditoria') {
      return <AuditLogPage />;
    }

    if (currentPage === '/calificaciones') {
      return <CalificacionesPage />;
    }

    // Placeholder para otras páginas
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <h2>Página en desarrollo</h2>
        <p className="text-muted-foreground">
          La funcionalidad para "{currentPage}" estará disponible próximamente.
        </p>
      </div>
    );
  };

  const getPageTitle = () => {
    const pageMap: { [key: string]: string } = {
      '/dashboard': 'Dashboard',
      '/usuarios': 'Gestión de Usuarios',
      '/fichas': 'Fichas y Materias',
      '/carga-archivos': 'Carga de Archivos',
      '/tareas': 'Tareas y Calificaciones',
      '/reportes': 'Reportes',
      '/indicadores': 'Indicadores',
      '/calificaciones': 'Mis Calificaciones',
      '/notificaciones': 'Notificaciones',
      '/auditoria': 'Auditoría',
      '/perfil': 'Mi Perfil'
    };
    return pageMap[currentPage] || 'Sistema Académico';
  };

  return (
    <SidebarProvider>
      <AppSidebar 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center justify-between gap-2 px-4 w-full">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">
                      Sistema Académico
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{getPageTitle()}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell onNavigateToCenter={() => setCurrentPage('/notificaciones')} />
              <Separator orientation="vertical" className="h-6" />
              <LogoutButton variant="ghost" size="sm" showText={false} />
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {renderContent()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
