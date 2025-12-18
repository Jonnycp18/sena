import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { ReportFilters } from './ReportsPage';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  Search, 
  Download, 
  Eye,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Progress } from '../ui/progress';
import { getStudentsAnalytics, api } from '../../utils/api';
import { Alert, AlertDescription } from '../ui/alert';

interface StudentReportProps {
  filters: ReportFilters;
}

type StudentRow = {
  id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  email?: string;
  ficha?: string;
  evidenciasTotal?: number;
  evidenciasAprobadas?: number;
  evidenciasDesaprobadas?: number;
  evidenciasNoEntregadas?: number;
  porcentajeAprobacion?: number;
  tendencia?: 'up' | 'down' | 'stable';
  materias?: Array<{ nombre: string; aprobadas: number; desaprobadas: number; noEntregadas: number; porcentaje: number }>;
};

export function StudentReport({ filters }: StudentReportProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getStudentsAnalytics({
          materia: filters.materia,
          ficha: filters.ficha,
          docente: filters.docente,
          from: filters.fechaInicio,
          to: filters.fechaFin,
          limit: 200
        });
        if (res.success) {
          const mapped: StudentRow[] = (res.data || []).map((r) => ({
            id: String(r.id ?? r.documento ?? Math.random().toString(36).slice(2)),
            cedula: String(r.documento ?? ''),
            nombre: String(r.nombre ?? ''),
            apellido: String(r.apellido ?? ''),
            email: r.email ?? undefined,
            ficha: r.fichaNumero ?? undefined,
            evidenciasTotal: r.evidenciasTotal ?? undefined,
            evidenciasAprobadas: r.aprobadas ?? undefined,
            evidenciasDesaprobadas: r.desaprobadas ?? undefined,
            evidenciasNoEntregadas: r.noEntregadas ?? (r.no_entregaron ?? undefined),
            porcentajeAprobacion: r.porcentaje ?? undefined,
            tendencia: r.tendencia ?? undefined,
            materias: []
          }));
          setStudents(mapped);
        } else {
          setError('No se pudo cargar el reporte de estudiantes');
        }
      } catch (e: any) {
        // Fallback: si 404, listar usuarios reales (alumnos) sin métricas
        const msg = e.message || 'Error de red';
        if (msg.startsWith('HTTP 404')) {
          try {
            const u = await api.getUsers({ page: 1, pageSize: 200 });
            const mappedUsers: StudentRow[] = (u.users || []).map((u) => ({
              id: String(u.id),
              cedula: u.cedula || '',
              nombre: u.nombre,
              apellido: u.apellido,
              email: u.email,
              ficha: undefined,
              evidenciasTotal: undefined,
              evidenciasAprobadas: undefined,
              evidenciasDesaprobadas: undefined,
              evidenciasNoEntregadas: undefined,
              porcentajeAprobacion: undefined,
              tendencia: 'stable',
              materias: []
            }));
            setStudents(mappedUsers);
            setError(null);
          } catch (e2:any) {
            setError(e2.message || msg);
          }
        } else {
          setError(msg);
        }
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.materia, filters.ficha, filters.docente, filters.fechaInicio, filters.fechaFin]);

  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.nombre.toLowerCase().includes(searchLower) ||
      student.apellido.toLowerCase().includes(searchLower) ||
      (student.cedula || '').includes(searchLower) ||
      (student.email || '').toLowerCase().includes(searchLower)
    );
  });

  const handleViewDetails = (student: typeof mockStudents[0]) => {
    setSelectedStudent(student);
    setShowDetailsDialog(true);
  };

  const getStatusBadge = (porcentaje: number) => {
    if (porcentaje >= 80) return <Badge variant="default" className="bg-green-600">Excelente</Badge>;
    if (porcentaje >= 60) return <Badge variant="outline" className="border-yellow-600 text-yellow-600">Regular</Badge>;
    return <Badge variant="destructive">Bajo</Badge>;
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  // Calcular estadísticas generales
  const totalStudents = filteredStudents.length;
  const avgAprobacion = totalStudents > 0
    ? (filteredStudents.reduce((sum, s) => sum + (s.porcentajeAprobacion || 0), 0) / totalStudents).toFixed(1)
    : '0.0';
  const estudiantesExcelentes = filteredStudents.filter(s => (s.porcentajeAprobacion || 0) >= 80).length;
  const estudiantesRiesgo = filteredStudents.filter(s => (s.porcentajeAprobacion || 0) < 60).length;

  return (
    <div className="space-y-6">
      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Estudiantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Promedio General</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{avgAprobacion}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Desempeño Excelente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{estudiantesExcelentes}</div>
            <p className="text-xs text-muted-foreground">≥80% aprobación</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">En Riesgo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{estudiantesRiesgo}</div>
            <p className="text-xs text-muted-foreground">&lt;60% aprobación</p>
          </CardContent>
        </Card>
      </div>

      {/* Buscador y acciones */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Listado de Estudiantes</CardTitle>
              <CardDescription>Reporte detallado de calificaciones por estudiante</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nombre, cédula o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Ficha</TableHead>
                  <TableHead>Evidencias</TableHead>
                  <TableHead>Aprobadas</TableHead>
                  <TableHead>Desaprobadas</TableHead>
                  <TableHead>No Entregadas</TableHead>
                  <TableHead>% Aprobación</TableHead>
                  <TableHead>Tendencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-sm text-muted-foreground">Cargando...</TableCell>
                  </TableRow>
                )}
                {!loading && filteredStudents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-sm text-muted-foreground">Sin resultados</TableCell>
                  </TableRow>
                )}
                {!loading && filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {student.nombre[0]}{student.apellido[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{student.nombre} {student.apellido}</div>
                          <div className="text-sm text-muted-foreground">{student.cedula}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{student.ficha || '—'}</Badge>
                    </TableCell>
                    <TableCell>{student.evidenciasTotal ?? '—'}</TableCell>
                    <TableCell>
                      <span className="text-green-600 font-medium">{student.evidenciasAprobadas ?? 0}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-red-600 font-medium">{student.evidenciasDesaprobadas ?? 0}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-yellow-600 font-medium">{student.evidenciasNoEntregadas ?? 0}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{student.porcentajeAprobacion ?? 0}%</span>
                        <Progress value={student.porcentajeAprobacion ?? 0} className="w-16" />
                      </div>
                    </TableCell>
                    <TableCell>{getTrendIcon(student.tendencia || 'stable')}</TableCell>
                    <TableCell>{getStatusBadge(student.porcentajeAprobacion || 0)}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewDetails(student)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de detalles del estudiante */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalle del Estudiante</DialogTitle>
            <DialogDescription>
              Reporte completo de calificaciones y desempeño
            </DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-6">
              {/* Info del estudiante */}
              <div className="flex items-start gap-4 p-4 border rounded-lg">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="text-lg">
                    {selectedStudent.nombre[0]}{selectedStudent.apellido[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3>{selectedStudent.nombre} {selectedStudent.apellido}</h3>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-muted-foreground">
                    <div>Cédula: {selectedStudent.cedula}</div>
                    <div>Ficha: {selectedStudent.ficha || '—'}</div>
                    <div>Aprobación: {selectedStudent.porcentajeAprobacion ?? 0}%</div>
                  </div>
                </div>
                {getStatusBadge(selectedStudent.porcentajeAprobacion || 0)}
              </div>

              {/* Resumen de evidencias */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Aprobadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {selectedStudent.evidenciasAprobadas ?? 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Desaprobadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {selectedStudent.evidenciasDesaprobadas ?? 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">No Entregadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {selectedStudent.evidenciasNoEntregadas ?? 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Desglose por materia */}
              <div>
                <h4 className="mb-4">Desempeño por Materia</h4>
                <div className="space-y-3">
                  {(selectedStudent.materias || []).map((materia, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4>{materia.nombre}</h4>
                        <Badge variant={materia.porcentaje >= 80 ? 'default' : materia.porcentaje >= 60 ? 'outline' : 'destructive'}>
                          {materia.porcentaje}%
                        </Badge>
                      </div>
                      <Progress value={materia.porcentaje} className="mb-2" />
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span className="text-green-600">A: {materia.aprobadas}</span>
                        <span className="text-red-600">D: {materia.desaprobadas}</span>
                        <span className="text-yellow-600">-: {materia.noEntregadas}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
