import {
  Calendar,
  ChevronUp,
  FileText,
  Home,
  Settings,
  Users,
  UploadCloud,
  BarChart3,
  Bell,
  Shield,
  BookOpen,
  GraduationCap,
  UserCheck,
  LogOut
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "./ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

import { useAuth, UserRole } from '../hooks/useAuth';

// Menú por rol
const menuItems = {
  administrador: [
    {
      title: "Principal",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: Home },
        { title: "Usuarios", url: "/usuarios", icon: Users },
        { title: "Fichas y Materias", url: "/fichas", icon: BookOpen },
        { title: "Carga de Archivos", url: "/carga-archivos", icon: UploadCloud },
      ],
    },
    {
      title: "Gestión",
      items: [
        { title: "Tareas y Calificaciones", url: "/tareas", icon: FileText },
        { title: "Reportes", url: "/reportes", icon: BarChart3 },
        { title: "Notificaciones", url: "/notificaciones", icon: Bell },
        { title: "Auditoría", url: "/auditoria", icon: Shield },
      ],
    },
  ],
  coordinador: [
    {
      title: "Principal",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: Home },
        { title: "Reportes", url: "/reportes", icon: BarChart3 },
        { title: "Indicadores", url: "/indicadores", icon: BarChart3 },
      ],
    },
  ],
  docente: [
    {
      title: "Principal",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: Home },
        { title: "Carga de Archivos", url: "/carga-archivos", icon: UploadCloud },
        // Eliminado: Evidencias Wide (duplicado de Carga de Archivos)
        { title: "Mis Calificaciones", url: "/calificaciones", icon: GraduationCap },
      ],
    },
  ],
};

interface AppSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function AppSidebar({ currentPage, onNavigate }: AppSidebarProps) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const userMenuItems = menuItems[user.rol] || [];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="p-2 bg-primary rounded-md">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-medium">Sistema Académico</h2>
            <p className="text-xs text-muted-foreground">
              {user.rol.charAt(0).toUpperCase() + user.rol.slice(1)}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {userMenuItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      onClick={() => onNavigate(item.url)}
                      isActive={currentPage === item.url}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <SidebarGroup>
          <SidebarGroupLabel>Configuración</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => onNavigate('/perfil')}>
                  <Settings />
                  <span>Mi Perfil</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <UserCheck />
                  <span>{user.nombre}</span>
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                side="top" 
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem onClick={() => onNavigate('/perfil')}>
                  <Settings />
                  <span>Configuración</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}