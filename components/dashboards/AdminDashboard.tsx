import { useEffect, useState } from 'react';
import { useAuditLog } from '../../hooks/useAuditLog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Users, 
  BookOpen, 
  FileText, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { api } from '../../utils/api';

export function AdminDashboard() {
  const { log } = useAuditLog();

  // 📊 Registrar acceso al dashboard
  useEffect(() => {
    log({
      action: 'dashboard.access',
      description: 'Acceso al Dashboard de Administrador',
      metadata: {
        dashboard: 'admin',
        vistas: ['estadísticas', 'actividad reciente', 'alertas']
      },
      success: true
    });
  }, [log]);
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<any | null>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true); setError(null);
    try {
      const s = await api.getAdminDashboardStats();
      const a = await api.getAdminDashboardActivity(8);
      const t = await api.getAdminPendingTasks();
      if (s.success) setStatsData(s.data);
      if (a.success) setActivity(a.data);
      if (t.success) setTasks(t.data);
    } catch (e:any) {
      setError(e.message || 'Error cargando dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const recentActivity = activity.map(ev => ({
    action: ev.action,
    user: ev.actor || ev.evidencia || '—',
    time: ev.timestamp ? new Date(ev.timestamp).toLocaleString() : 'Sin fecha',
    status: ev.categoria === 'calificacion' ? 'success' : 'info'
  }));

  const pendingTasks = tasks ? [
    { task: 'Usuarios inactivos', count: tasks.usuariosInactivos, priority: tasks.usuariosInactivos > 10 ? 'high' : tasks.usuariosInactivos > 0 ? 'medium' : 'low' },
    { task: 'Evidencias sin calificación', count: tasks.evidenciasPendientes, priority: tasks.evidenciasPendientes > 100 ? 'high' : tasks.evidenciasPendientes > 10 ? 'medium' : 'low' },
    { task: 'Estudiantes alto riesgo (>10 no entregadas)', count: tasks.estudiantesAltoRiesgo, priority: tasks.estudiantesAltoRiesgo > 0 ? 'high' : 'low' }
  ] : [];

  const stats = statsData ? [
    { title: 'Usuarios Activos', value: String(statsData.usuariosActivos), description: `Tendencia ${statsData.tendencias.usuarios}% vs semana anterior`, icon: Users, color: 'text-blue-600' },
    { title: 'Fichas Registradas', value: String(statsData.fichasRegistradas), description: 'Total grupos académicos', icon: BookOpen, color: 'text-green-600' },
    { title: 'Calificaciones Cargadas', value: String(statsData.tareasCargadas), description: `Tareas distintas: ${statsData.tareasDistintas}`, icon: FileText, color: 'text-purple-600' },
    { title: 'Variación Cargas (%)', value: `${statsData.tendencias.cargas}%`, description: 'Últimos 30 días vs previos', icon: BarChart3, color: 'text-orange-600' }
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1>Dashboard Administrativo</h1>
        <p className="text-muted-foreground">
          Vista general del sistema y estadísticas principales
        </p>
      </div>

      {/* Estadísticas principales */}
      {error && (
        <div className="p-3 text-sm text-red-700 border border-red-300 rounded bg-red-50">{error}</div>
      )}
      <div className="flex justify-between items-center">
        <div className="text-xs text-muted-foreground">Rango: {statsData ? new Date(statsData.periodo.actualDesde).toLocaleDateString() + ' - ' + new Date(statsData.periodo.actualHasta).toLocaleDateString() : '—'}</div>
        <Button size="sm" variant="outline" onClick={loadData} disabled={loading}>
          {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Actualizar
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading && stats.length === 0 ? (
          Array.from({ length: 4 }).map((_,i)=>(
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium bg-muted h-4 w-24" /></CardHeader>
              <CardContent>
                <div className="h-6 w-16 bg-muted rounded mb-2" />
                <div className="h-3 w-32 bg-muted rounded" />
              </CardContent>
            </Card>
          ))
        ) : (
          stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tareas Pendientes */}
        <Card>
          <CardHeader>
            <CardTitle>Tareas Pendientes</CardTitle>
            <CardDescription>
              Acciones que requieren tu atención
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingTasks.map((task, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium">{task.task}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant={
                        task.priority === 'high' ? 'destructive' : 
                        task.priority === 'medium' ? 'default' : 'secondary'
                      }
                      className="text-xs"
                    >
                      {task.priority === 'high' ? 'Alta' : 
                       task.priority === 'medium' ? 'Media' : 'Baja'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {task.count} pendiente{task.count > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Ver
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actividad Reciente */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>
              Últimas acciones en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="mt-1">
                  {activity.status === 'success' && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  {activity.status === 'error' && (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                  {activity.status === 'info' && (
                    <Clock className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.user}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Accesos directos a funciones principales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="justify-start h-auto p-4" variant="outline">
              <Users className="mr-2 h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Gestionar Usuarios</div>
                <div className="text-xs text-muted-foreground">Crear, editar y asignar roles</div>
              </div>
            </Button>
            <Button className="justify-start h-auto p-4" variant="outline">
              <BookOpen className="mr-2 h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Fichas y Materias</div>
                <div className="text-xs text-muted-foreground">Administrar grupos académicos</div>
              </div>
            </Button>
            <Button className="justify-start h-auto p-4" variant="outline">
              <BarChart3 className="mr-2 h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Ver Reportes</div>
                <div className="text-xs text-muted-foreground">Generar informes detallados</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}