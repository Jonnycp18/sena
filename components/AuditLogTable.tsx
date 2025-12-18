import { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { 
  Info, 
  AlertTriangle, 
  AlertCircle, 
  XCircle,
  Eye,
  CheckCircle,
  Ban
} from 'lucide-react';
import { AuditLog, AuditSeverity } from '../utils/auditLogger';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AuditLogTableProps {
  logs: AuditLog[];
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const getSeverityIcon = (severity: AuditSeverity) => {
    switch (severity) {
      case 'info':
        return <Info className="w-4 h-4 text-blue-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-700" />;
    }
  };

  const getSeverityBadge = (severity: AuditSeverity) => {
    const variants: Record<AuditSeverity, any> = {
      info: 'secondary',
      warning: 'outline',
      error: 'destructive',
      critical: 'destructive'
    };
    return (
      <Badge variant={variants[severity]} className="flex items-center gap-1">
        {getSeverityIcon(severity)}
        <span className="capitalize">{severity}</span>
      </Badge>
    );
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      authentication: 'bg-blue-100 text-blue-700',
      user_management: 'bg-purple-100 text-purple-700',
      file_management: 'bg-green-100 text-green-700',
      academic_data: 'bg-orange-100 text-orange-700',
      reports: 'bg-indigo-100 text-indigo-700',
      security: 'bg-red-100 text-red-700',
      system: 'bg-gray-100 text-gray-700'
    };
    return (
      <Badge className={colors[category] || colors.system}>
        {category.replace(/_/g, ' ')}
      </Badge>
    );
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailsDialog(true);
  };

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Info className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-sm">No se encontraron registros</h3>
        <p className="text-sm text-muted-foreground">
          Intenta ajustar los filtros o el periodo de búsqueda
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha/Hora</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Severidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className={!log.success ? 'bg-red-50 dark:bg-red-950/10' : ''}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {format(new Date(log.timestamp), "dd/MM/yy HH:mm:ss", { locale: es })}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">{log.userName}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {log.userRole}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {log.action}
                    </code>
                  </TableCell>
                  <TableCell>
                    {getCategoryBadge(log.category)}
                  </TableCell>
                  <TableCell>
                    {getSeverityBadge(log.severity)}
                  </TableCell>
                  <TableCell>
                    {log.success ? (
                      <Badge variant="default" className="flex items-center gap-1 w-fit">
                        <CheckCircle className="w-3 h-3" />
                        Exitoso
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                        <Ban className="w-3 h-3" />
                        Fallido
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="text-sm truncate" title={log.description}>
                      {log.description}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(log)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Dialog de Detalles */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalles del Log de Auditoría</DialogTitle>
            <DialogDescription>
              Información completa sobre la acción registrada
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <ScrollArea className="max-h-[600px] pr-4">
              <div className="space-y-6">
                {/* Info Principal */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm mb-2">Información General</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ID:</span>
                        <code className="text-xs bg-muted px-2 py-0.5 rounded">{selectedLog.id}</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fecha/Hora:</span>
                        <span>{format(new Date(selectedLog.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: es })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Acción:</span>
                        <code className="text-xs bg-muted px-2 py-0.5 rounded">{selectedLog.action}</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Categoría:</span>
                        {getCategoryBadge(selectedLog.category)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Severidad:</span>
                        {getSeverityBadge(selectedLog.severity)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Estado:</span>
                        {selectedLog.success ? (
                          <Badge variant="default" className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Exitoso
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <Ban className="w-3 h-3" />
                            Fallido
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm mb-2">Usuario</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nombre:</span>
                        <span>{selectedLog.userName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ID Usuario:</span>
                        <code className="text-xs bg-muted px-2 py-0.5 rounded">{selectedLog.userId}</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rol:</span>
                        <Badge variant="secondary" className="capitalize">{selectedLog.userRole}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">IP:</span>
                        <code className="text-xs bg-muted px-2 py-0.5 rounded">{selectedLog.ipAddress}</code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <h4 className="text-sm mb-2">Descripción</h4>
                  <p className="text-sm bg-muted p-3 rounded-lg">
                    {selectedLog.description}
                  </p>
                </div>

                {/* Error Message */}
                {selectedLog.errorMessage && (
                  <div>
                    <h4 className="text-sm mb-2 text-red-600">Mensaje de Error</h4>
                    <p className="text-sm bg-red-50 dark:bg-red-950/10 p-3 rounded-lg text-red-700">
                      {selectedLog.errorMessage}
                    </p>
                  </div>
                )}

                {/* Target */}
                {selectedLog.targetType && (
                  <div>
                    <h4 className="text-sm mb-2">Objetivo de la Acción</h4>
                    <div className="space-y-2 text-sm bg-muted p-3 rounded-lg">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tipo:</span>
                        <Badge variant="secondary">{selectedLog.targetType}</Badge>
                      </div>
                      {selectedLog.targetId && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ID:</span>
                          <code className="text-xs bg-background px-2 py-0.5 rounded">{selectedLog.targetId}</code>
                        </div>
                      )}
                      {selectedLog.targetName && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nombre:</span>
                          <span>{selectedLog.targetName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Changes */}
                {selectedLog.changes && selectedLog.changes.length > 0 && (
                  <div>
                    <h4 className="text-sm mb-2">Cambios Realizados</h4>
                    <div className="space-y-2">
                      {selectedLog.changes.map((change, index) => (
                        <div key={index} className="bg-muted p-3 rounded-lg">
                          <div className="text-sm mb-2">
                            <Badge variant="secondary">{change.field}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground block mb-1">Valor anterior:</span>
                              <code className="block bg-red-100 dark:bg-red-950/20 px-2 py-1 rounded text-red-700">
                                {JSON.stringify(change.oldValue)}
                              </code>
                            </div>
                            <div>
                              <span className="text-muted-foreground block mb-1">Valor nuevo:</span>
                              <code className="block bg-green-100 dark:bg-green-950/20 px-2 py-1 rounded text-green-700">
                                {JSON.stringify(change.newValue)}
                              </code>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <h4 className="text-sm mb-2">Metadatos Adicionales</h4>
                    <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                {/* User Agent */}
                {selectedLog.userAgent && (
                  <div>
                    <h4 className="text-sm mb-2">Información del Navegador</h4>
                    <p className="text-xs bg-muted p-3 rounded-lg text-muted-foreground break-all">
                      {selectedLog.userAgent}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
