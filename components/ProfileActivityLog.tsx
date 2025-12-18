import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { 
  User, 
  Mail, 
  Phone, 
  Settings, 
  Shield,
  Clock
} from 'lucide-react';

interface ActivityLog {
  id: string;
  tipo: 'perfil' | 'configuracion' | 'seguridad';
  accion: string;
  fecha: string;
  detalles?: string;
}

// Datos mock para el historial de actividad
const mockActivityLogs: ActivityLog[] = [
  {
    id: '1',
    tipo: 'perfil',
    accion: 'Actualización de información personal',
    fecha: '2024-01-15T10:30:00Z',
    detalles: 'Se actualizó el número de teléfono'
  },
  {
    id: '2',
    tipo: 'configuracion',
    accion: 'Cambio de tema',
    fecha: '2024-01-10T14:20:00Z',
    detalles: 'Cambió de tema claro a oscuro'
  },
  {
    id: '3',
    tipo: 'seguridad',
    accion: 'Cambio de contraseña',
    fecha: '2024-01-05T09:15:00Z',
    detalles: 'Contraseña actualizada exitosamente'
  },
  {
    id: '4',
    tipo: 'configuracion',
    accion: 'Configuración de notificaciones',
    fecha: '2024-01-01T16:45:00Z',
    detalles: 'Se desactivaron las notificaciones por email'
  },
  {
    id: '5',
    tipo: 'perfil',
    accion: 'Actualización de biografía',
    fecha: '2023-12-28T11:30:00Z',
    detalles: 'Se añadió información profesional'
  }
];

export function ProfileActivityLog() {
  const getActivityIcon = (tipo: ActivityLog['tipo']) => {
    switch (tipo) {
      case 'perfil':
        return User;
      case 'configuracion':
        return Settings;
      case 'seguridad':
        return Shield;
      default:
        return Clock;
    }
  };

  const getActivityBadgeVariant = (tipo: ActivityLog['tipo']) => {
    switch (tipo) {
      case 'perfil':
        return 'default';
      case 'configuracion':
        return 'secondary';
      case 'seguridad':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Historial de Actividad
        </CardTitle>
        <CardDescription>
          Registro de cambios recientes en tu perfil
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {mockActivityLogs.map((log) => {
              const IconComponent = getActivityIcon(log.tipo);
              return (
                <div key={log.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                  <div className={`p-2 rounded-full ${
                    log.tipo === 'perfil' ? 'bg-blue-100 text-blue-600' :
                    log.tipo === 'configuracion' ? 'bg-gray-100 text-gray-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{log.accion}</p>
                      <Badge variant={getActivityBadgeVariant(log.tipo)}>
                        {log.tipo.charAt(0).toUpperCase() + log.tipo.slice(1)}
                      </Badge>
                    </div>
                    {log.detalles && (
                      <p className="text-sm text-muted-foreground">{log.detalles}</p>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(log.fecha)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}