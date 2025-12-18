import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { ReportFilters } from './ReportsPage';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { TrendingUp, TrendingDown, Users, BookOpen, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useAnalytics } from '../../hooks/useAnalytics';

interface AnalyticsDashboardProps { filters: ReportFilters; }

export function AnalyticsDashboard({ filters }: AnalyticsDashboardProps) {
  const {
    loading,
    error,
    fetchAprobacionPorMateria,
    fetchEstadoGeneral,
    fetchTendenciaAprobacion,
    fetchRendimientoPorFicha,
    fetchRendimientoPorCompetencia
  } = useAnalytics();

  const [aprobacion, setAprobacion] = useState<any[]>([]);
  const [estadoGeneral, setEstadoGeneral] = useState<any | null>(null);
  const [tendencia, setTendencia] = useState<any[]>([]);
  const [rendFicha, setRendFicha] = useState<any[]>([]);
  const [rendCompetencia, setRendCompetencia] = useState<any[]>([]);

  // Map filters to query params
  const fichaId = filters.ficha !== 'todos' ? Number(filters.ficha) || undefined : undefined;
  const materiaId = filters.materia !== 'todos' ? Number(filters.materia) || undefined : undefined;
  const fromDate = filters.fechaInicio || undefined;
  const toDate = filters.fechaFin || undefined;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [ap, eg, ten, rf, rc] = await Promise.all([
        fetchAprobacionPorMateria({ ficha_id: fichaId, materia_id: materiaId, from: fromDate, to: toDate }),
        fetchEstadoGeneral({ ficha_id: fichaId, materia_id: materiaId, from: fromDate, to: toDate }),
        fetchTendenciaAprobacion({ intervalo: 'semanal', ficha_id: fichaId, materia_id: materiaId, from: fromDate, to: toDate }),
        fetchRendimientoPorFicha({ from: fromDate, to: toDate }),
        fetchRendimientoPorCompetencia({ ficha_id: fichaId, from: fromDate, to: toDate })
      ]);
      if (cancelled) return;
      setAprobacion(ap || []);
      // Normalizar clave noEntregaron vs no_entregaron
      if (eg) {
        const ne = (eg as any).noEntregaron ?? (eg as any).no_entregaron ?? 0;
        setEstadoGeneral({ ...eg, noEntregaron: ne });
      } else setEstadoGeneral(null);
      setTendencia((ten || []).map(t => ({ semana: t.periodo, aprobacion: t.aprobacion })));
      setRendFicha(rf || []);
      setRendCompetencia(rc || []);
    })();
    return () => { cancelled = true; };
  }, [fichaId, materiaId, fromDate, toDate, fetchAprobacionPorMateria, fetchEstadoGeneral, fetchTendenciaAprobacion, fetchRendimientoPorFicha, fetchRendimientoPorCompetencia]);

  const totalEstudiantes = estadoGeneral?.total || 0;
  const aprobadosCount = estadoGeneral?.aprobados || 0;
  const tasaAprobacion = useMemo(() => {
    if (!estadoGeneral) return '0.0';
    return ((aprobadosCount / (totalEstudiantes || 1)) * 100).toFixed(1);
  }, [aprobadosCount, totalEstudiantes, estadoGeneral]);
  const tendenciaValor = useMemo(() => {
    if (tendencia.length < 2) return 0;
    return tendencia[tendencia.length - 1].aprobacion - tendencia[tendencia.length - 2].aprobacion;
  }, [tendencia]);

  const dataPie = useMemo(() => [
    { name: 'Aprobados', value: estadoGeneral?.aprobados || 0, color: '#22c55e' },
    { name: 'Reprobados', value: estadoGeneral?.reprobados || 0, color: '#ef4444' },
    { name: 'No Entregaron', value: estadoGeneral?.noEntregaron || 0, color: '#f59e0b' },
  ], [estadoGeneral]);

  if (loading && aprobacion.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Cargando datos de analytics...</p>
        </div>
      </div>
    );
  }

  if (error && aprobacion.length === 0) {
    return (
      <div className="p-6 border rounded-md text-center">
        <p className="text-red-600 font-medium">Error al cargar analytics: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Total Estudiantes
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEstudiantes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Activos en el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Tasa de Aprobación
              <CheckCircle className="w-4 h-4 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{tasaAprobacion}%</div>
            <div className="flex items-center gap-1 mt-1">
              {tendenciaValor > 0 ? (
                <>
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <p className="text-xs text-green-600">+{tendenciaValor.toFixed(1)}% vs semana anterior</p>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3 h-3 text-red-600" />
                  <p className="text-xs text-red-600">{tendenciaValor.toFixed(1)}% vs semana anterior</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Desaprobados
              <XCircle className="w-4 h-4 text-red-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{estadoGeneral?.reprobados || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {estadoGeneral ? ((estadoGeneral.reprobados / (totalEstudiantes || 1)) * 100).toFixed(1) : '0.0'}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              No Entregaron
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{estadoGeneral?.noEntregaron || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requieren atención
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficas principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfica de Aprobación por Materia */}
        <Card>
          <CardHeader>
            <CardTitle>Aprobación por Materia</CardTitle>
            <CardDescription>Comparativa de resultados por materia</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={aprobacion}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="materia" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="aprobados" fill="#22c55e" name="Aprobados" />
                <Bar dataKey="reprobados" fill="#ef4444" name="Reprobados" />
                <Bar dataKey="noEntregaron" fill="#f59e0b" name="No Entregaron" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfica de Estado General (Pie) */}
        <Card>
          <CardHeader>
            <CardTitle>Estado General</CardTitle>
            <CardDescription>Distribución de calificaciones</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                    data={dataPie}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                    {dataPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tendencia y Rendimiento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencia Semanal */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Aprobación</CardTitle>
            <CardDescription>Evolución semanal del porcentaje de aprobación</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tendencia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="semana" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="aprobacion" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  name="% Aprobación"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Rendimiento por Ficha */}
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento por Ficha</CardTitle>
            <CardDescription>Comparativa de fichas académicas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rendFicha}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="numero" />
                <YAxis yAxisId="left" orientation="left" stroke="#22c55e" />
                <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="aprobacion" fill="#22c55e" name="% Aprobación" />
                <Bar yAxisId="right" dataKey="promedio" fill="#3b82f6" name="Promedio" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Análisis por Competencias */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis por Competencias</CardTitle>
          <CardDescription>Rendimiento en diferentes áreas de conocimiento</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={rendCompetencia}>
              <PolarGrid />
              <PolarAngleAxis dataKey="competencia" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="Rendimiento" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Resumen de materias con alertas */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen por Materia</CardTitle>
          <CardDescription>Estado detallado de cada materia</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aprobacion.map((materia, idx) => {
              const total = materia.total || (materia.aprobados + materia.reprobados + materia.noEntregaron);
              const porcentaje = total ? ((materia.aprobados / total) * 100).toFixed(1) : '0.0';
              const estado = parseFloat(porcentaje) >= 80 ? 'success' : parseFloat(porcentaje) >= 60 ? 'warning' : 'danger';
              
              return (
                <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4 flex-1">
                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4>{materia.materia}</h4>
                        <Badge 
                          variant={estado === 'success' ? 'default' : estado === 'warning' ? 'outline' : 'destructive'}
                        >
                          {porcentaje}% aprobación
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          {materia.aprobados} aprobados
                        </span>
                        <span className="flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-red-600" />
                          {materia.reprobados} reprobados
                        </span>
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-yellow-600" />
                          {materia.noEntregaron} sin entregar
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{total}</div>
                    <p className="text-xs text-muted-foreground">estudiantes</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
