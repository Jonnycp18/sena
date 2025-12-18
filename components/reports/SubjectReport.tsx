import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { ReportFilters } from './ReportsPage';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { BookOpen, Users, CheckCircle, XCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SubjectReportProps {
  filters: ReportFilters;
}

// Datos mock de materias
const mockSubjects = [
  {
    id: '1',
    nombre: 'Fundamentos de Programación',
    codigo: 'FP-101',
    docente: 'Carlos Rodríguez',
    ficha: '2558901',
    totalEstudiantes: 55,
    evidenciasTotales: 8,
    aprobadas: 380,
    desaprobadas: 52,
    noEntregadas: 8,
    porcentajeAprobacion: 86,
    promedio: 4.2,
    distribucion: [
      { rango: '90-100%', cantidad: 25 },
      { rango: '70-89%', cantidad: 20 },
      { rango: '50-69%', cantidad: 8 },
      { rango: '0-49%', cantidad: 2 },
    ]
  },
  {
    id: '2',
    nombre: 'Bases de Datos',
    codigo: 'BD-201',
    docente: 'Ana Martínez',
    ficha: '2558901',
    totalEstudiantes: 55,
    evidenciasTotales: 8,
    aprobadas: 320,
    desaprobadas: 95,
    noEntregadas: 25,
    porcentajeAprobacion: 73,
    promedio: 3.8,
    distribucion: [
      { rango: '90-100%', cantidad: 15 },
      { rango: '70-89%', cantidad: 25 },
      { rango: '50-69%', cantidad: 12 },
      { rango: '0-49%', cantidad: 3 },
    ]
  },
  {
    id: '3',
    nombre: 'Desarrollo Web',
    codigo: 'DW-301',
    docente: 'Luis González',
    ficha: '2558902',
    totalEstudiantes: 48,
    evidenciasTotales: 8,
    aprobadas: 315,
    desaprobadas: 85,
    noEntregadas: 24,
    porcentajeAprobacion: 76,
    promedio: 3.9,
    distribucion: [
      { rango: '90-100%', cantidad: 18 },
      { rango: '70-89%', cantidad: 22 },
      { rango: '50-69%', cantidad: 6 },
      { rango: '0-49%', cantidad: 2 },
    ]
  },
  {
    id: '4',
    nombre: 'Algoritmos y Estructuras',
    codigo: 'AE-202',
    docente: 'Patricia Sánchez',
    ficha: '2558903',
    totalEstudiantes: 42,
    evidenciasTotales: 8,
    aprobadas: 265,
    desaprobadas: 110,
    noEntregadas: 21,
    porcentajeAprobacion: 67,
    promedio: 3.5,
    distribucion: [
      { rango: '90-100%', cantidad: 10 },
      { rango: '70-89%', cantidad: 18 },
      { rango: '50-69%', cantidad: 10 },
      { rango: '0-49%', cantidad: 4 },
    ]
  },
];

export function SubjectReport({ filters }: SubjectReportProps) {
  const getStatusBadge = (porcentaje: number) => {
    if (porcentaje >= 80) return <Badge variant="default" className="bg-green-600">Excelente</Badge>;
    if (porcentaje >= 60) return <Badge variant="outline" className="border-yellow-600 text-yellow-600">Regular</Badge>;
    return <Badge variant="destructive">Requiere Atención</Badge>;
  };

  // Calcular estadísticas generales
  const totalMaterias = mockSubjects.length;
  const avgAprobacion = (mockSubjects.reduce((sum, s) => sum + s.porcentajeAprobacion, 0) / totalMaterias).toFixed(1);
  const materiasExcelentes = mockSubjects.filter(s => s.porcentajeAprobacion >= 80).length;
  const materiasRiesgo = mockSubjects.filter(s => s.porcentajeAprobacion < 60).length;

  // Datos para comparativa
  const dataComparativa = mockSubjects.map(m => ({
    nombre: m.codigo,
    aprobacion: m.porcentajeAprobacion,
    promedio: m.promedio * 20 // Escalar a 100 para comparar visualmente
  }));

  return (
    <div className="space-y-6">
      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Materias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMaterias}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Promedio Aprobación</CardTitle>
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
            <div className="text-2xl font-bold text-green-600">{materiasExcelentes}</div>
            <p className="text-xs text-muted-foreground">≥80% aprobación</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Requieren Atención</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{materiasRiesgo}</div>
            <p className="text-xs text-muted-foreground">&lt;60% aprobación</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfica comparativa */}
      <Card>
        <CardHeader>
          <CardTitle>Comparativa de Materias</CardTitle>
          <CardDescription>Porcentaje de aprobación y promedio por materia</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dataComparativa}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="aprobacion" fill="#22c55e" name="% Aprobación" />
              <Bar dataKey="promedio" fill="#3b82f6" name="Promedio (x20)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabla detallada de materias */}
      <Card>
        <CardHeader>
          <CardTitle>Listado Detallado de Materias</CardTitle>
          <CardDescription>Estadísticas completas por materia</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Materia</TableHead>
                <TableHead>Docente</TableHead>
                <TableHead>Estudiantes</TableHead>
                <TableHead>Aprobadas</TableHead>
                <TableHead>Desaprobadas</TableHead>
                <TableHead>No Entregadas</TableHead>
                <TableHead>% Aprobación</TableHead>
                <TableHead>Promedio</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSubjects.map((subject) => {
                const totalEvidencias = subject.aprobadas + subject.desaprobadas + subject.noEntregadas;
                
                return (
                  <TableRow key={subject.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{subject.nombre}</div>
                          <div className="text-sm text-muted-foreground">{subject.codigo}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{subject.docente}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        <span>{subject.totalEstudiantes}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-green-600 font-medium">{subject.aprobadas}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-red-600 font-medium">{subject.desaprobadas}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-yellow-600 font-medium">{subject.noEntregadas}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{subject.porcentajeAprobacion}%</span>
                        <Progress value={subject.porcentajeAprobacion} className="w-16" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{subject.promedio}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(subject.porcentajeAprobacion)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detalles expandidos de cada materia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mockSubjects.map((subject) => (
          <Card key={subject.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{subject.nombre}</CardTitle>
                  <CardDescription>
                    {subject.codigo} • {subject.docente} • Ficha {subject.ficha}
                  </CardDescription>
                </div>
                {getStatusBadge(subject.porcentajeAprobacion)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Métricas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Estudiantes</p>
                  <p className="text-2xl font-bold">{subject.totalEstudiantes}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Evidencias</p>
                  <p className="text-2xl font-bold">{subject.evidenciasTotales}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">% Aprobación</p>
                  <p className="text-2xl font-bold text-green-600">{subject.porcentajeAprobacion}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Promedio</p>
                  <p className="text-2xl font-bold text-blue-600">{subject.promedio}</p>
                </div>
              </div>

              {/* Distribución de calificaciones */}
              <div>
                <h4 className="mb-2 text-sm">Distribución de Estudiantes</h4>
                <div className="space-y-2">
                  {subject.distribucion.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground w-20">{item.rango}</span>
                      <Progress value={(item.cantidad / subject.totalEstudiantes) * 100} className="flex-1" />
                      <span className="text-sm font-medium w-8">{item.cantidad}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumen de evidencias */}
              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    Aprobadas
                  </span>
                  <span className="font-medium">{subject.aprobadas}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-red-600">
                    <XCircle className="w-3 h-3" />
                    Desaprobadas
                  </span>
                  <span className="font-medium">{subject.desaprobadas}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-yellow-600">
                    <AlertTriangle className="w-3 h-3" />
                    No Entregadas
                  </span>
                  <span className="font-medium">{subject.noEntregadas}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
