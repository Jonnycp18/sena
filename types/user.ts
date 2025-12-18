// Shared user types used across hooks and API layer

export type UserRole = 'administrador' | 'coordinador' | 'docente';

export interface User {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  cedula: string;
  rol: UserRole;
  departamento?: string;
  especialidad?: string;
  fechaIngreso: string;
  estado: 'activo' | 'inactivo';
  avatar?: string;
  biografia?: string;
  configuraciones: {
    notificacionesEmail: boolean;
    notificacionesPush: boolean;
    tema: 'claro' | 'oscuro' | 'sistema';
    idioma: 'es' | 'en';
  };
}
