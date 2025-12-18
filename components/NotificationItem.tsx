import { Notification } from '../hooks/useNotifications';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  AlertCircle, 
  CheckCircle, 
  Info, 
  XCircle, 
  Clock,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNotifications } from '../hooks/useNotifications';

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  compact?: boolean;
}

export function NotificationItem({ notification, onRead, compact = false }: NotificationItemProps) {
  const { deleteNotification } = useNotifications();

  const getIcon = () => {
    const iconClass = "h-5 w-5";
    switch (notification.tipo) {
      case 'success':
        return <CheckCircle className={`${iconClass} text-green-600`} />;
      case 'warning':
        return <AlertCircle className={`${iconClass} text-yellow-600`} />;
      case 'error':
        return <XCircle className={`${iconClass} text-red-600`} />;
      case 'task':
        return <Clock className={`${iconClass} text-blue-600`} />;
      default:
        return <Info className={`${iconClass} text-blue-600`} />;
    }
  };

  const getBadgeVariant = () => {
    switch (notification.tipo) {
      case 'success':
        return 'default';
      case 'warning':
        return 'outline';
      case 'error':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.fecha), {
    addSuffix: true,
    locale: es
  });

  const handleClick = () => {
    if (!notification.leido) {
      onRead(notification.id);
    }
  };

  return (
    <div
      className={`p-4 hover:bg-accent/50 transition-colors cursor-pointer ${
        !notification.leido ? 'bg-accent/20' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-medium">{notification.titulo}</h4>
              {notification.importante && (
                <Badge variant="destructive" className="text-xs h-5">
                  Importante
                </Badge>
              )}
              {!notification.leido && (
                <div className="h-2 w-2 rounded-full bg-blue-600" title="No leído" />
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
            {notification.mensaje}
          </p>

          {/* Metadata */}
          {notification.metadatos && !compact && (
            <div className="flex flex-wrap gap-2 mb-2">
              {notification.metadatos.estudiante && (
                <Badge variant="outline" className="text-xs">
                  {notification.metadatos.estudiante}
                </Badge>
              )}
              {notification.metadatos.materia && (
                <Badge variant="outline" className="text-xs">
                  {notification.metadatos.materia}
                </Badge>
              )}
              {notification.metadatos.tarea && (
                <Badge variant="outline" className="text-xs">
                  {notification.metadatos.tarea}
                </Badge>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
            
            <div className="flex items-center gap-1">
              {notification.accion && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Aquí navegarías a la URL
                    console.log('Navigate to:', notification.accion?.url);
                  }}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  {notification.accion.label}
                </Button>
              )}
              
              {!compact && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
