import { useNotifications, Notification } from '../hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

interface NotificationListProps {
  compact?: boolean;
  maxItems?: number;
  onViewAll?: () => void;
  filter?: 'all' | 'unread' | 'important';
}

export function NotificationList({ 
  compact = false, 
  maxItems,
  onViewAll,
  filter = 'all'
}: NotificationListProps) {
  const { notifications, markAsRead } = useNotifications();

  // Aplicar filtros
  let filteredNotifications = notifications;
  
  if (filter === 'unread') {
    filteredNotifications = notifications.filter(n => !n.leido);
  } else if (filter === 'important') {
    filteredNotifications = notifications.filter(n => n.importante);
  }

  // Limitar cantidad si es necesario
  const displayNotifications = maxItems 
    ? filteredNotifications.slice(0, maxItems)
    : filteredNotifications;

  const hasMore = maxItems && filteredNotifications.length > maxItems;

  if (filteredNotifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-muted-foreground text-center">
          <p className="text-sm">No hay notificaciones</p>
          <p className="text-xs mt-1">
            {filter === 'unread' && 'Todas las notificaciones han sido leídas'}
            {filter === 'important' && 'No hay notificaciones importantes'}
            {filter === 'all' && 'Cuando recibas notificaciones, aparecerán aquí'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {compact && (
        <div className="px-4 py-3 border-b">
          <h4 className="text-sm">Notificaciones</h4>
          <p className="text-xs text-muted-foreground">
            {filteredNotifications.filter(n => !n.leido).length} sin leer
          </p>
        </div>
      )}

      <ScrollArea className={compact ? "h-96" : "h-full"}>
        <div className="divide-y">
          {displayNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={markAsRead}
              compact={compact}
            />
          ))}
        </div>
      </ScrollArea>

      {compact && hasMore && onViewAll && (
        <div className="px-4 py-3 border-t">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full"
            onClick={onViewAll}
          >
            Ver todas las notificaciones
          </Button>
        </div>
      )}
    </div>
  );
}
