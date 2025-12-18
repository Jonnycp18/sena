import { useState, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuditLog } from '../hooks/useAuditLog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { NotificationList } from './NotificationList';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  AlertTriangle,
  Filter,
  Download
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';

export function NotificationCenter() {
  const { notifications, unreadCount, markAllAsRead, clearAll } = useNotifications();
  const { log } = useAuditLog();
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'important'>('all');

  const importantCount = notifications.filter(n => n.importante && !n.leido).length;
  const allCount = notifications.length;

  // 🔔 Registrar acceso al centro de notificaciones
  useEffect(() => {
    log({
      action: 'notifications.access',
      description: 'Acceso al Centro de Notificaciones',
      metadata: {
        totalNotificaciones: allCount,
        noLeidas: unreadCount,
        importantes: importantCount
      },
      success: true
    });
  }, [log]);

  // 📌 Función envuelta para marcar todas como leídas
  const handleMarkAllAsRead = () => {
    log({
      action: 'notifications.mark_all_read',
      description: `Marcadas ${unreadCount} notificaciones como leídas`,
      metadata: {
        notificacionesMarcadas: unreadCount
      },
      success: true
    });
    markAllAsRead();
  };

  // 🗑️ Función envuelta para limpiar todas
  const handleClearAll = () => {
    log({
      action: 'notifications.clear_all',
      description: `Eliminadas ${allCount} notificaciones`,
      metadata: {
        notificacionesEliminadas: allCount
      },
      success: true,
      severity: 'warning' // Las eliminaciones masivas son warning
    });
    clearAll();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8" />
            <div>
              <h1>Centro de Notificaciones</h1>
              <p className="text-muted-foreground">
                Mantente al día con todas las alertas y actualizaciones
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Marcar todas como leídas
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                disabled={allCount === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpiar todo
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar todas las notificaciones?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminarán permanentemente todas las notificaciones.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAll}>
                  Eliminar todo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Total
              <Bell className="w-4 h-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allCount}</div>
            <p className="text-xs text-muted-foreground">Notificaciones</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Sin Leer
              <Badge variant="destructive">{unreadCount}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Importantes
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{importantCount}</div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Leídas
              <CheckCheck className="w-4 h-4 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {allCount - unreadCount}
            </div>
            <p className="text-xs text-muted-foreground">Procesadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de notificaciones con tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Todas las Notificaciones</CardTitle>
              <CardDescription>
                Filtra y gestiona tus notificaciones
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <div className="px-6 pt-2 border-b">
              <TabsList className="w-full justify-start h-auto p-0 bg-transparent">
                <TabsTrigger 
                  value="all"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
                >
                  Todas ({allCount})
                </TabsTrigger>
                <TabsTrigger 
                  value="unread"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
                >
                  Sin Leer ({unreadCount})
                </TabsTrigger>
                <TabsTrigger 
                  value="important"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4"
                >
                  Importantes ({importantCount})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="m-0">
              <NotificationList filter="all" />
            </TabsContent>

            <TabsContent value="unread" className="m-0">
              <NotificationList filter="unread" />
            </TabsContent>

            <TabsContent value="important" className="m-0">
              <NotificationList filter="important" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Configuración de notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Preferencias de Notificaciones</CardTitle>
          <CardDescription>
            Configura qué notificaciones deseas recibir
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm">Tareas no entregadas</h4>
              <p className="text-xs text-muted-foreground">
                Alertas cuando un estudiante no entrega una tarea después de la fecha límite
              </p>
            </div>
            <Badge variant="default">Activo</Badge>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm">Cargas de archivos</h4>
              <p className="text-xs text-muted-foreground">
                Notificaciones sobre cargas exitosas o errores
              </p>
            </div>
            <Badge variant="default">Activo</Badge>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm">Cambios en usuarios</h4>
              <p className="text-xs text-muted-foreground">
                Alertas cuando se agregan o modifican usuarios
              </p>
            </div>
            <Badge variant="default">Activo</Badge>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm">Reportes programados</h4>
              <p className="text-xs text-muted-foreground">
                Notificaciones de reportes generados automáticamente
              </p>
            </div>
            <Badge variant="secondary">Inactivo</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
