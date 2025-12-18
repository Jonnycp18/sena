import { useEffect, useState } from 'react';
import { useAuditLog } from '../../hooks/useAuditLog';
import { coordinadorApi } from '../../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  BookOpen, 
  FileText,
  Download,
  Filter
} from 'lucide-react';

export function CoordinadorDashboard() {
  const { log } = useAuditLog();

  // 📊 Registrar acceso al dashboard
  useEffect(() => {
    log({
      action: 'dashboard.access',
      description: 'Acceso al Dashboard de Coordinador',
      metadata: {
        dashboard: 'coordinador',
        vistas: ['métricas académicas', 'progreso por ficha', 'alertas académicas']
      },
      success: true
    });
  }, [log]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any | null>(null);
  const [performance, setPerformance] = useState<any[]>([]);
  const [atRisk, setAtRisk] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<number>(0);

  const loadData = async () => {
    setLoading(true); setError(null);
    try {
      const s = await coordinadorApi.getCoordinadorDashboardStats();
      const p = await coordinadorApi.getCoordinadorPerformanceByCourse(5);
      const r = await coordinadorApi.getCoordinadorAtRiskStudents(5);
      const pa = await coordinadorApi.getCoordinadorPendingApprovals();
      if (s.success) setStats(s.data);
      if (p.success) setPerformance(p.data);
      if (r.success) setAtRisk(r.data);
      if (pa.success) setPendingApprovals(pa.data.cargasPendientesAprobacion);
    } catch (e:any) {
      setError(e.message || 'Error cargando métricas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const kpis = stats ? [
    { title: 'Tareas Entregadas', value: stats.tareasEntregadasPorcentaje + '%', change: stats.tendencias.tareas + '%', trend: stats.tendencias.tareas >=0 ? 'up':'down', description: 'Del total evidencias', color: 'text-green-600' },
    { title: 'Calificaciones Cargadas', value: stats.calificacionesCargadasPorcentaje + '%', change: stats.tendencias.calificaciones + '%', trend: stats.tendencias.calificaciones >=0 ? 'up':'down', description: 'Calificadas sobre total', color: 'text-blue-600' },
    { title: 'Promedio General', value: String(stats.promedioGeneral), change: '—', trend: 'up', description: 'Escala heurística', color: 'text-purple-600' },
    { title: 'Fichas Activas', value: String(stats.fichasActivas), change: '—', trend: 'up', description: 'Grupos activos', color: 'text-orange-600' }
  ] : [];

  const fichasProgress = performance.map(c => ({ ficha: c.curso || '—', progreso: c.progreso, estudiantes: c.total, completadas: c.entregadas }));

  const docentesRanking: any[] = []; // Placeholder hasta tener endpoint docente

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1>Dashboard de Coordinación</h1>
          <p className="text-muted-foreground">
            Indicadores y métricas de seguimiento académico
          </p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="2024-2">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {/* Eliminados items de periodo */}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs Principales */}
      {error && <div className="p-3 text-sm text-red-700 border border-red-300 rounded bg-red-50">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading && kpis.length === 0 ? (
          Array.from({length:4}).map((_,i)=>(
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium bg-muted h-4 w-24" /></CardHeader>
              <CardContent>
                <div className="h-6 w-16 bg-muted rounded mb-2" />
                <div className="h-3 w-32 bg-muted rounded" />
              </CardContent>
            </Card>
          ))
        ) : (
          kpis.map((kpi, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <div className={`p-2 rounded-full ${kpi.color} bg-opacity-10`}>
                  <BarChart3 className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  {kpi.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className={`text-xs ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>{kpi.change}</span>
                  <span className="text-xs text-muted-foreground">vs semana anterior</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress por Fichas */}
        <Card>
          <CardHeader>
            <CardTitle>Progreso por Fichas</CardTitle>
            <CardDescription>
              Porcentaje de tareas completadas por grupo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fichasProgress.map((ficha, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{ficha.ficha}</p>
                    <p className="text-xs text-muted-foreground">
                      {ficha.completadas}/{ficha.estudiantes} estudiantes
                    </p>
                  </div>
                  <Badge variant={ficha.progreso >= 90 ? 'default' : ficha.progreso >= 75 ? 'secondary' : 'destructive'}>
                    {ficha.progreso}%
                  </Badge>
                </div>
                <Progress value={ficha.progreso} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Ranking de Docentes */}
        <Card>
          <CardHeader>
            <CardTitle>Ranking de Docentes</CardTitle>
            <CardDescription>
              Por cumplimiento en carga de calificaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {docentesRanking.map((docente, index) => (
              <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{docente.nombre}</p>
                  <p className="text-xs text-muted-foreground">{docente.materia}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{docente.cumplimiento}%</div>
                  <div className="text-xs text-muted-foreground">
                    {docente.calificaciones} calif.
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Alertas y Acciones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Alertas del Sistema</CardTitle>
            <CardDescription>
              Situaciones que requieren atención
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 border-l-4 border-red-500 bg-red-50">
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">
                  5 estudiantes con más de 10 evidencias faltantes
                </p>
                <p className="text-xs text-red-600">
                  Ficha: Técnico en Programación - 2B
                </p>
              </div>
              <Button size="sm" variant="outline">
                Ver detalles
              </Button>
            </div>
            
            <div className="flex items-start gap-3 p-3 border-l-4 border-yellow-500 bg-yellow-50">
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  Docente sin cargar calificaciones en 7 días
                </p>
                <p className="text-xs text-yellow-600">
                  María José Ruiz - Inglés Técnico
                </p>
              </div>
              <Button size="sm" variant="outline">
                Notificar
              </Button>
            </div>

            <div className="flex items-start gap-3 p-3 border-l-4 border-blue-500 bg-blue-50">
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800">
                  Nueva semana disponible
                </p>
                <p className="text-xs text-blue-600">
                  Configurar fechas para 2024-3
                </p>
              </div>
              <Button size="sm" variant="outline">
                Configurar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              Generar Reporte
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Ver Estudiantes
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <BookOpen className="mr-2 h-4 w-4" />
              Revisar Fichas
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Exportar Datos
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}