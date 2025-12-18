import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { 
  Shield, 
  Download, 
  Trash2, 
  Search,
  AlertCircle,
  Info,
  AlertTriangle,
  XCircle,
  Activity,
  Users,
  FileText,
  Lock
} from 'lucide-react';
import {
  getAuditLogs,
  getAuditStatistics,
  searchAuditLogs,
  exportAuditLogs,
  cleanOldLogs,
  clearAllLogs,
  AuditLog,
  AuditCategory,
  AuditSeverity
} from '../utils/auditLogger';
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
import { AuditLogTable } from './AuditLogTable';
import { toast } from 'sonner@2.0.3';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type TimePeriod = 'today' | 'week' | 'month' | 'all';

export function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AuditCategory | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<AuditSeverity | 'all'>('all');
  const [successFilter, setSuccessFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [period, setPeriod] = useState<TimePeriod>('all');
  const [stats, setStats] = useState(getAuditStatistics());

  // Cargar logs
  useEffect(() => {
    loadLogs();
  }, []);

  // Aplicar filtros cuando cambien
  useEffect(() => {
    applyFilters();
  }, [logs, searchText, categoryFilter, severityFilter, successFilter, period]);

  const loadLogs = () => {
    const allLogs = getAuditLogs();
    setLogs(allLogs);
    setStats(getAuditStatistics(period));
  };

  const applyFilters = () => {
    const filters: any = {};

    if (searchText) filters.searchText = searchText;
    if (categoryFilter !== 'all') filters.category = categoryFilter;
    if (severityFilter !== 'all') filters.severity = severityFilter;
    if (successFilter === 'success') filters.success = true;
    if (successFilter === 'failed') filters.success = false;

    // Filtro de periodo
    if (period !== 'all') {
      const now = new Date();
      if (period === 'today') {
        filters.startDate = new Date();
        filters.startDate.setHours(0, 0, 0, 0);
      } else if (period === 'week') {
        filters.startDate = new Date();
        filters.startDate.setDate(now.getDate() - 7);
      } else if (period === 'month') {
        filters.startDate = new Date();
        filters.startDate.setMonth(now.getMonth() - 1);
      }
    }

    const filtered = searchAuditLogs(filters);
    setFilteredLogs(filtered);
  };

  const handleExport = () => {
    const filters: any = {};
    if (categoryFilter !== 'all') filters.category = categoryFilter;
    if (severityFilter !== 'all') filters.severity = severityFilter;
    if (successFilter !== 'all') filters.success = successFilter === 'success';

    const json = exportAuditLogs(filters);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Logs exportados correctamente');
  };

  const handleCleanOld = () => {
    const removed = cleanOldLogs(90);
    loadLogs();
    toast.success(`Se eliminaron ${removed} logs antiguos (>90 días)`);
  };

  const handleClearAll = () => {
    clearAllLogs();
    setLogs([]);
    setFilteredLogs([]);
    loadLogs();
    toast.success('Todos los logs han sido eliminados');
  };

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

  const getSeverityColor = (severity: AuditSeverity) => {
    switch (severity) {
      case 'info': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      case 'critical': return 'text-red-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8" />
            <div>
              <h1>Auditoría y Seguridad</h1>
              <p className="text-muted-foreground">
                Registro completo de todas las acciones del sistema
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Limpiar Antiguos
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Limpiar logs antiguos?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se eliminarán los logs con más de 90 días de antigüedad.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleCleanOld}>
                  Limpiar
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
              Total de Logs
              <Activity className="w-4 h-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLogs}</div>
            <p className="text-xs text-muted-foreground">Registros totales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Usuarios Activos
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
            <p className="text-xs text-muted-foreground">Usuarios únicos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Acciones Fallidas
              <AlertCircle className="w-4 h-4 text-red-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failedActions}</div>
            <p className="text-xs text-muted-foreground">Errores registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Alertas Críticas
              <Lock className="w-4 h-4 text-red-700" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {stats.bySeverity.critical}
            </div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribución por Categoría y Severidad */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Por Categoría</CardTitle>
            <CardDescription>Distribución de logs por tipo de acción</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats.byCategory).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm capitalize">{category.replace(/_/g, ' ')}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Por Severidad</CardTitle>
            <CardDescription>Distribución por nivel de importancia</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats.bySeverity).map(([severity, count]) => (
              <div key={severity} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getSeverityIcon(severity as AuditSeverity)}
                  <span className={`text-sm capitalize ${getSeverityColor(severity as AuditSeverity)}`}>
                    {severity}
                  </span>
                </div>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Top Usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios Más Activos</CardTitle>
          <CardDescription>Top 5 usuarios por cantidad de acciones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.topUsers.map((user, index) => (
              <div key={user.userId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant={index === 0 ? "default" : "secondary"}>
                    #{index + 1}
                  </Badge>
                  <span className="text-sm">{user.userName}</span>
                </div>
                <Badge variant="outline">{user.count} acciones</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filtros y Tabla */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Registro de Auditoría</CardTitle>
              <CardDescription>
                Historial completo de acciones del sistema
              </CardDescription>
            </div>
            <Select value={period} onValueChange={(value) => setPeriod(value as TimePeriod)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mes</SelectItem>
                <SelectItem value="all">Todo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="authentication">Autenticación</SelectItem>
                <SelectItem value="user_management">Gestión de Usuarios</SelectItem>
                <SelectItem value="file_management">Gestión de Archivos</SelectItem>
                <SelectItem value="academic_data">Datos Académicos</SelectItem>
                <SelectItem value="reports">Reportes</SelectItem>
                <SelectItem value="security">Seguridad</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={(value) => setSeverityFilter(value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Severidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las severidades</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="critical">Crítico</SelectItem>
              </SelectContent>
            </Select>

            <Select value={successFilter} onValueChange={(value) => setSuccessFilter(value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="success">Exitosos</SelectItem>
                <SelectItem value="failed">Fallidos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Resultados */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Mostrando {filteredLogs.length} de {stats.totalLogs} registros
            </span>
            {(searchText || categoryFilter !== 'all' || severityFilter !== 'all' || successFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchText('');
                  setCategoryFilter('all');
                  setSeverityFilter('all');
                  setSuccessFilter('all');
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>

          {/* Tabla */}
          <AuditLogTable logs={filteredLogs} />
        </CardContent>
      </Card>

      {/* Logs Críticos Recientes */}
      {stats.recentCritical.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="w-5 h-5" />
              Alertas Críticas Recientes
            </CardTitle>
            <CardDescription>
              Eventos de seguridad que requieren atención inmediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentCritical.slice(0, 5).map(log => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="destructive" className="text-xs">
                        {log.action}
                      </Badge>
                      <span className="text-sm">{log.userName}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{log.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                    {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm", { locale: es })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
