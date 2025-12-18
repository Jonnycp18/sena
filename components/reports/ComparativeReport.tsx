import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { ReportFilters } from './ReportsPage';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { TrendingUp, TrendingDown, Calendar, Users } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface ComparativeReportProps {
  filters: ReportFilters;
}

// Datos mock para comparativas
const dataComparativaFichas = [
  { semana: 'Sem 1', ficha2558901: 75, ficha2558902: 72, ficha2558903: 78 },
  { semana: 'Sem 2', ficha2558901: 78, ficha2558902: 74, ficha2558903: 80 },
  { semana: 'Sem 3', ficha2558901: 80, ficha2558902: 76, ficha2558903: 82 },
  { semana: 'Sem 4', ficha2558901: 82, ficha2558902: 79, ficha2558903: 85 },
  { semana: 'Sem 5', ficha2558901: 85, ficha2558902: 82, ficha2558903: 87 },
  { semana: 'Sem 6', ficha2558901: 86, ficha2558902: 84, ficha2558903: 89 },
];

const dataComparativaDocentes = [
  { docente: 'C. Rodríguez', aprobacion: 86, estudiantes: 55, satisfaccion: 4.5 },
  { docente: 'A. Martínez', aprobacion: 78, estudiantes: 48, satisfaccion: 4.2 },
  { docente: 'L. González', aprobacion: 82, estudiantes: 52, satisfaccion: 4.3 },
  { docente: 'P. Sánchez', aprobacion: 74, estudiantes: 45, satisfaccion: 4.0 },
];

const dataEvolucionMensual = [
  { mes: 'Enero', aprobacion: 72, desaprobacion: 20, noEntrega: 8 },
  { mes: 'Febrero', aprobacion: 75, desaprobacion: 18, noEntrega: 7 },
  { mes: 'Marzo', aprobacion: 78, desaprobacion: 16, noEntrega: 6 },
  { mes: 'Abril', aprobacion: 80, desaprobacion: 15, noEntrega: 5 },
  { mes: 'Mayo', aprobacion: 82, desaprobacion: 14, noEntrega: 4 },
  { mes: 'Junio', aprobacion: 85, desaprobacion: 12, noEntrega: 3 },
];

// Eliminada la comparativa por periodos (no usamos periodo)

export function ComparativeReport({ filters }: ComparativeReportProps) {
  // Calcular tendencias
  const tendenciaFichas = {
    ficha2558901: ((dataComparativaFichas[dataComparativaFichas.length - 1].ficha2558901 - dataComparativaFichas[0].ficha2558901) / dataComparativaFichas[0].ficha2558901 * 100).toFixed(1),
    ficha2558902: ((dataComparativaFichas[dataComparativaFichas.length - 1].ficha2558902 - dataComparativaFichas[0].ficha2558902) / dataComparativaFichas[0].ficha2558902 * 100).toFixed(1),
    ficha2558903: ((dataComparativaFichas[dataComparativaFichas.length - 1].ficha2558903 - dataComparativaFichas[0].ficha2558903) / dataComparativaFichas[0].ficha2558903 * 100).toFixed(1),
  };

  return (
    <div className="space-y-6">
      {/* Header con métricas de tendencia */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ficha 2558901 - ADSO</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {dataComparativaFichas[dataComparativaFichas.length - 1].ficha2558901}%
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">+{tendenciaFichas.ficha2558901}%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Últimas 6 semanas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ficha 2558902 - Diseño</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {dataComparativaFichas[dataComparativaFichas.length - 1].ficha2558902}%
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">+{tendenciaFichas.ficha2558902}%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Últimas 6 semanas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ficha 2558903 - Multimedia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {dataComparativaFichas[dataComparativaFichas.length - 1].ficha2558903}%
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">+{tendenciaFichas.ficha2558903}%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Últimas 6 semanas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de comparativas */}
      <Tabs defaultValue="fichas" className="space-y-6">
        <TabsList>
          <TabsTrigger value="fichas">Por Fichas</TabsTrigger>
          <TabsTrigger value="docentes">Por Docentes</TabsTrigger>
          {/* Eliminado: Por Periodos */}
          <TabsTrigger value="evolucion">Evolución Mensual</TabsTrigger>
        </TabsList>

        {/* Comparativa por Fichas */}
        <TabsContent value="fichas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Evolución de Aprobación por Ficha</CardTitle>
              <CardDescription>Seguimiento semanal del porcentaje de aprobación</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dataComparativaFichas}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="semana" />
                  <YAxis domain={[60, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="ficha2558901" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Ficha 2558901 - ADSO"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ficha2558902" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Ficha 2558902 - Diseño"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ficha2558903" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    name="Ficha 2558903 - Multimedia"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { nombre: 'Ficha 2558901 - ADSO', inicial: 75, actual: 86, color: 'blue' },
              { nombre: 'Ficha 2558902 - Diseño', inicial: 72, actual: 84, color: 'red' },
              { nombre: 'Ficha 2558903 - Multimedia', inicial: 78, actual: 89, color: 'green' },
            ].map((ficha, idx) => {
              const mejora = ficha.actual - ficha.inicial;
              const mejoraPorcentaje = ((mejora / ficha.inicial) * 100).toFixed(1);
              
              return (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-sm">{ficha.nombre}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Inicial</span>
                      <Badge variant="outline">{ficha.inicial}%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Actual</span>
                      <Badge variant="default">{ficha.actual}%</Badge>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm font-medium">Mejora</span>
                      <div className="flex items-center gap-1 text-green-600">
                        <TrendingUp className="w-3 h-3" />
                        <span className="text-sm font-bold">+{mejoraPorcentaje}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Comparativa por Docentes */}
        <TabsContent value="docentes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Comparativa de Desempeño por Docente</CardTitle>
              <CardDescription>Porcentaje de aprobación y cantidad de estudiantes</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dataComparativaDocentes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="docente" />
                  <YAxis yAxisId="left" orientation="left" stroke="#22c55e" />
                  <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="aprobacion" fill="#22c55e" name="% Aprobación" />
                  <Bar yAxisId="right" dataKey="estudiantes" fill="#3b82f6" name="Estudiantes" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dataComparativaDocentes.map((docente, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-sm">{docente.docente}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Aprobación</p>
                    <p className="text-2xl font-bold text-green-600">{docente.aprobacion}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Estudiantes</p>
                    <p className="text-xl font-bold">{docente.estudiantes}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Satisfacción</p>
                    <div className="flex items-center gap-1">
                      <p className="text-xl font-bold">{docente.satisfaccion}</p>
                      <span className="text-sm text-muted-foreground">/ 5.0</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Eliminada sección comparativa por periodos */}

        {/* Evolución Mensual */}
        <TabsContent value="evolucion" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Evolución Mensual de Calificaciones</CardTitle>
              <CardDescription>Tendencia mensual acumulada de todos los indicadores</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={dataEvolucionMensual}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="aprobacion" 
                    stackId="1"
                    stroke="#22c55e" 
                    fill="#22c55e"
                    fillOpacity={0.6}
                    name="Aprobación"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="desaprobacion" 
                    stackId="1"
                    stroke="#ef4444" 
                    fill="#ef4444"
                    fillOpacity={0.6}
                    name="Desaprobación"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="noEntrega" 
                    stackId="1"
                    stroke="#f59e0b" 
                    fill="#f59e0b"
                    fillOpacity={0.6}
                    name="No Entrega"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
