import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { getTokens } from '../utils/api';
import { toast } from 'sonner@2.0.3';
// TODO: reemplazar cualquier acceso directo a localStorage por llamadas reales a backend
// Backend endpoints: GET /api/v1/notifications, GET /api/v1/notifications/unread-count,
// POST /api/v1/notifications/mark-read, GET /api/v1/notifications/summary
// Esta capa mantiene compatibilidad inicial y luego intenta sincronizar.

export type NotificationType = 'info' | 'warning' | 'error' | 'success' | 'task';

export interface Notification {
  id: string;
  tipo: NotificationType;
  titulo: string;
  mensaje: string;
  fecha: string;
  leido: boolean;
  importante: boolean;
  accion?: {
    label: string;
    url: string;
  };
  metadatos?: {
    estudiante?: string;
    materia?: string;
    tarea?: string;
    cedula?: string;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'fecha' | 'leido'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Datos mock de notificaciones iniciales (fallback si backend falla)
const mockNotifications: Notification[] = [
  {
    id: '1',
    tipo: 'warning',
    titulo: 'Tareas sin entregar',
    mensaje: 'Juan Pérez no entregó "Taller 3 - Algoritmos" después de la fecha límite',
    fecha: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
    leido: false,
    importante: true,
    accion: {
      label: 'Ver Detalles',
      url: '/carga-archivos'
    },
    metadatos: {
      estudiante: 'Juan Pérez',
      cedula: '12345678',
      materia: 'Fundamentos de Programación',
      tarea: 'Taller 3 - Algoritmos'
    }
  },
  {
    id: '2',
    tipo: 'warning',
    titulo: 'Tareas sin entregar',
    mensaje: 'María García no entregó "Quiz 1 - Bases de Datos" después de la fecha límite',
    fecha: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    leido: false,
    importante: true,
    accion: {
      label: 'Ver Detalles',
      url: '/carga-archivos'
    },
    metadatos: {
      estudiante: 'María García',
      cedula: '87654321',
      materia: 'Bases de Datos',
      tarea: 'Quiz 1'
    }
  },
  {
    id: '3',
    tipo: 'success',
    titulo: 'Carga de calificaciones exitosa',
    mensaje: 'Se cargaron 55 calificaciones correctamente para "Fundamentos de Programación"',
    fecha: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    leido: true,
    importante: false,
    accion: {
      label: 'Ver Reporte',
      url: '/reportes'
    },
    metadatos: {
      materia: 'Fundamentos de Programación'
    }
  },
  {
    id: '4',
    tipo: 'info',
    titulo: 'Nuevo docente agregado',
    mensaje: 'El usuario "Carlos Rodríguez" fue agregado al sistema como Docente',
    fecha: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    leido: true,
    importante: false
  },
  {
    id: '5',
    tipo: 'warning',
    titulo: 'Tareas sin entregar',
    mensaje: 'Carlos López no entregó "Proyecto Final" después de la fecha límite',
    fecha: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    leido: false,
    importante: true,
    accion: {
      label: 'Ver Detalles',
      url: '/carga-archivos'
    },
    metadatos: {
      estudiante: 'Carlos López',
      cedula: '11223344',
      materia: 'Desarrollo Web',
      tarea: 'Proyecto Final'
    }
  },
  {
    id: '6',
    tipo: 'error',
    titulo: 'Error en carga de archivo',
    mensaje: 'El archivo "calificaciones_mayo.xlsx" tiene errores de formato en la fila 15',
    fecha: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    leido: true,
    importante: false,
    accion: {
      label: 'Revisar Archivo',
      url: '/carga-archivos'
    }
  },
];

const STORAGE_KEY = 'academic-notifications';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

async function fetchUnreadCount(): Promise<number> {
  try {
    const tokens = getTokens();
    const resp = await fetch(`${API_BASE}/notifications/unread-count`, {
      headers: {
        ...(tokens?.access_token ? { Authorization: `Bearer ${tokens.access_token}` } : {})
      }
    });
    if (!resp.ok) return 0;
    const json = await resp.json();
    return json?.data?.unread ?? 0;
  } catch {
    return 0;
  }
}

interface BackendNotificationRow {
  id: number;
  type: string;
  message: string;
  created_at: string;
  read_at: string | null;
  priority: number;
  metadata?: Record<string, any>;
}

function mapBackend(row: BackendNotificationRow): Notification {
  return {
    id: String(row.id),
    tipo: row.type as NotificationType || 'info',
    titulo: row.type.toUpperCase(),
    mensaje: row.message,
    fecha: row.created_at,
    leido: !!row.read_at,
    importante: (row.priority || 0) > 5,
    metadatos: {
      estudiante: row.metadata?.estudiante,
      materia: row.metadata?.materia,
      tarea: row.metadata?.tarea,
      cedula: row.metadata?.cedula
    }
  };
}

async function fetchNotifications(page = 1, pageSize = 50): Promise<Notification[]> {
  try {
    const tokens = getTokens();
    const resp = await fetch(`${API_BASE}/notifications?page=${page}&pageSize=${pageSize}`, {
      headers: {
        ...(tokens?.access_token ? { Authorization: `Bearer ${tokens.access_token}` } : {})
      }
    });
    if (!resp.ok) return [];
    const json = await resp.json();
    const rows: BackendNotificationRow[] = json?.data || [];
    return rows.map(mapBackend);
  } catch {
    return [];
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch { /* ignore */ }
    }
    return mockNotifications;
  });
  const [backendLoaded, setBackendLoaded] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(notifications.filter(n => !n.leido).length);

  // Evitar doble ejecución en StrictMode
  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return; // protege contra doble montaje en dev
    initRef.current = true;
    let aborted = false;
    const controller = new AbortController();
    (async () => {
      try {
        const backend = await fetchNotifications();
        if (!aborted && backend.length) {
          setNotifications(backend);
          setBackendLoaded(true);
        }
        const unread = await fetchUnreadCount();
        if (!aborted) setUnreadCount(unread);
      } catch (e:any) {
        if (!aborted) {
          // Mostrar solo un aviso silencioso en consola, no spamear toasts
          console.warn('[Notificaciones] Backend inaccesible:', e?.message || e);
        }
      }
    })();
    return () => {
      aborted = true;
      controller.abort();
    };
  }, []);

  // Persistencia local como cache
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    if (!backendLoaded) {
      setUnreadCount(notifications.filter(n => !n.leido).length);
    }
  }, [notifications, backendLoaded]);

  const addNotification = (notification: Omit<Notification, 'id' | 'fecha' | 'leido'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fecha: new Date().toISOString(),
      leido: false
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Mostrar toast
    const typeMap = {
      info: toast.info,
      success: toast.success,
      warning: toast.warning,
      error: toast.error,
      task: toast.warning
    };

    typeMap[notification.tipo](notification.titulo, {
      description: notification.mensaje,
      duration: 5000,
    });
  };

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, leido: true } : n)));
    setUnreadCount(c => Math.max(0, c - 1));
    // Intentar backend
    try {
      const tokens = getTokens();
      if (!tokens?.access_token) return; // evitar 401 si no autenticado
      await fetch(`${API_BASE}/notifications/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.access_token}` },
        body: JSON.stringify([Number(id)])
      });
    } catch { /* silent */ }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.leido).map(n => Number(n.id));
    setNotifications(prev => prev.map(n => ({ ...n, leido: true })));
    setUnreadCount(0);
    if (unreadIds.length) {
      try {
        const tokens = getTokens();
        if (!tokens?.access_token) return; // evitar 401 si no autenticado
        await fetch(`${API_BASE}/notifications/mark-read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.access_token}` },
          body: JSON.stringify(unreadIds)
        });
      } catch { /* silent */ }
    }
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
