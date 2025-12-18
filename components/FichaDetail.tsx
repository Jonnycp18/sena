import { Ficha, Materia } from './FichasMateriasManagement';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { 
  BookOpen, 
  Clock, 
  GraduationCap, 
  Calendar,
  Users,
  Award,
  ChevronRight
} from 'lucide-react';

interface FichaDetailProps {
  ficha: Ficha;
  materias: Materia[];
}

// Datos de docentes mock (en una implementación real vendría de la API)
const mockDocentes = [
  { id: '3', nombre: 'Carlos Rodríguez', especialidad: 'Desarrollo de Software' },
  { id: '4', nombre: 'Ana Martínez', especialidad: 'Matemáticas Aplicadas' },
  { id: '6', nombre: 'Sandra López', especialidad: 'Literatura' }
];

export function FichaDetail({ ficha, materias }: FichaDetailProps) {
  // Agrupar materias por tipo (se eliminó concepto de semestre)
  const materiasPorTipo = materias.reduce((acc, materia) => {
    const key = materia.tipoMateria || 'general';
    if (!acc[key]) acc[key] = [];
    acc[key].push(materia);
    return acc;
  }, {} as { [key: string]: Materia[] });

  // Estadísticas de la ficha
  const materiasActivas = materias.filter(m => m.estado === 'activa').length;
  const materiasConDocente = materias.filter(m => m.docenteId).length;
  const totalHoras = materias.reduce((sum, m) => sum + m.horas, 0);
  // Se eliminaron créditos y progreso basado en créditos

  const getDocenteNombre = (docenteId?: string) => {
    if (!docenteId) return 'Sin asignar';
    const docente = mockDocentes.find(d => d.id === docenteId);
    return docente ? docente.nombre : 'Docente no encontrado';
  };

  const getTipoBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case 'tecnico': return 'secondary';
      case 'tecnologico': return 'default';
      case 'profesional': return 'destructive';
      default: return 'outline';
    }
  };

  const getTipoMateriaBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case 'teorica': return 'outline';
      case 'practica': return 'secondary';
      case 'teorico-practica': return 'default';
      default: return 'outline';
    }
  };

  const getEstadoBadgeVariant = (estado: string) => {
    return estado === 'activa' ? 'default' : 'secondary';
  };

  return (
    <div className="space-y-6">
      {/* Header con información principal */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-md">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2>{ficha.nombre}</h2>
                <p className="text-muted-foreground">{ficha.codigo}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getTipoBadgeVariant(ficha.tipoPrograma)}>
                {ficha.tipoPrograma}
              </Badge>
              <Badge variant={getEstadoBadgeVariant(ficha.estado)}>
                {ficha.estado}
              </Badge>
              <Badge variant="outline">
                {ficha.modalidad}
              </Badge>
            </div>
          </div>
        </div>

        <p className="text-muted-foreground">
          {ficha.descripcion}
        </p>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Materias</p>
                <p className="text-lg font-medium">{materias.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Se eliminó tarjeta de duración (semestres) */}

        {/* Se eliminó tarjeta de créditos */}

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Con Docente</p>
                <p className="text-lg font-medium">{materiasConDocente}/{materias.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Se eliminó progreso de créditos */}

      {/* Contenido principal con pestañas */}
      <Tabs defaultValue="pensum" className="w-full">
        <TabsList>
          <TabsTrigger value="pensum">Pensum Académico</TabsTrigger>
          <TabsTrigger value="materias">Lista de Materias</TabsTrigger>
          <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="pensum" className="space-y-4">
          {/* Vista por tipo de materia */}
          <div className="grid gap-4">
            {Object.keys(materiasPorTipo).map(tipo => (
              <Card key={tipo}>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {tipo}
                    <Badge variant="outline" className="ml-2">
                      {materiasPorTipo[tipo].length} materias
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {materiasPorTipo[tipo].map(materia => (
                      <div key={materia.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{materia.nombre}</h4>
                            <Badge variant={getTipoMateriaBadgeVariant(materia.tipoMateria)} className="text-xs">
                              {materia.tipoMateria}
                            </Badge>
                            <Badge variant={getEstadoBadgeVariant(materia.estado)} className="text-xs">
                              {materia.estado}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {materia.codigo} • {materia.horas} horas
                          </p>
                          {materia.docenteId && (
                            <p className="text-sm text-blue-600 mt-1">
                              👨‍🏫 {getDocenteNombre(materia.docenteId)}
                            </p>
                          )}
                          {materia.prerrequisitos.length > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              <span className="text-xs text-muted-foreground">Prerrequisitos:</span>
                              {materia.prerrequisitos.map(prereqId => {
                                const prereq = materias.find(m => m.id === prereqId);
                                return prereq ? (
                                  <Badge key={prereqId} variant="outline" className="text-xs">
                                    {prereq.codigo}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="materias" className="space-y-4">
          {/* Tabla completa de materias */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Materia</TableHead>
                    {/* Se removieron columnas de semestre y créditos */}
                    <TableHead>Horas</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Docente</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materias.sort((a, b) => a.nombre.localeCompare(b.nombre)).map((materia) => (
                    <TableRow key={materia.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{materia.nombre}</div>
                          <div className="text-sm text-muted-foreground">{materia.codigo}</div>
                        </div>
                      </TableCell>
                      {/* Columnas removidas */}
                      <TableCell>{materia.horas}h</TableCell>
                      <TableCell>
                        <Badge variant={getTipoMateriaBadgeVariant(materia.tipoMateria)} className="text-xs">
                          {materia.tipoMateria}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={materia.docenteId ? 'text-blue-600' : 'text-muted-foreground'}>
                          {getDocenteNombre(materia.docenteId)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getEstadoBadgeVariant(materia.estado)}>
                          {materia.estado}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estadisticas" className="space-y-4">
          {/* Estadísticas detalladas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Distribución por Tipo de Materia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['teorica', 'practica', 'teorico-practica'].map(tipo => {
                    const count = materias.filter(m => m.tipoMateria === tipo).length;
                    const percentage = materias.length > 0 ? (count / materias.length) * 100 : 0;
                    return (
                      <div key={tipo} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{tipo.replace('-', '-')}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Asignación de Docentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Con docente asignado</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 transition-all duration-300"
                          style={{ width: `${materias.length > 0 ? (materiasConDocente / materias.length) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8">{materiasConDocente}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sin docente</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-orange-500 transition-all duration-300"
                          style={{ width: `${materias.length > 0 ? ((materias.length - materiasConDocente) / materias.length) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8">{materias.length - materiasConDocente}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Carga Académica por Semestre</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: ficha.duracionSemestres }, (_, i) => i + 1).map(semestre => {
                    const materiasSemestre = materiasPorSemestre[semestre] || [];
                    const creditosSemestre = materiasSemestre.reduce((sum, m) => sum + m.creditos, 0);
                    const horasSemestre = materiasSemestre.reduce((sum, m) => sum + m.horas, 0);
                    return (
                      <div key={semestre} className="flex items-center justify-between text-sm">
                        <span>Semestre {semestre}</span>
                        <div className="text-right">
                          <div>{creditosSemestre} créditos</div>
                          <div className="text-muted-foreground">{horasSemestre} horas</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Información General</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha de creación</span>
                    <span>{new Date(ficha.fechaCreacion).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total de materias</span>
                    <span>{materias.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Materias activas</span>
                    <span>{materiasActivas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total de horas</span>
                    <span>{totalHoras}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Promedio créditos/semestre</span>
                    <span>{Math.round(totalCreditos / ficha.duracionSemestres)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}