import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAuditLog } from '../../hooks/useAuditLog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { StudentReport } from './StudentReport';
import { SubjectReport } from './SubjectReport';
import { ComparativeReport } from './ComparativeReport';
import { ReportFilters } from './ReportFilters';
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  TrendingUp,
  Download,
  FileText
} from 'lucide-react';
import { Button } from '../ui/button';

export interface ReportFilters {
  materia: string;
  ficha: string;
  docente: string;
  fechaInicio: string;
  fechaFin: string;
}

export function ReportsPage() {
  const { user } = useAuth();
  const { log } = useAuditLog();
  const [filters, setFilters] = useState<ReportFilters>({
    materia: 'todos',
    ficha: 'todos',
    docente: 'todos',
    fechaInicio: '',
    fechaFin: ''
  });

  // 📄 Función para generar reporte
  const handleGenerateReport = () => {
    log({
      action: 'report.generate',
      description: 'Generación de reporte solicitada',
      metadata: {
        filtros: filters,
        formato: 'interno'
      },
      success: true
    });
    // Aquí iría la lógica de generación
  };

  // 📥 Función para exportar a PDF
  const handleExportPDF = () => {
    log({
      action: 'report.export',
      description: 'Exportación de reporte a PDF',
      metadata: {
        filtros: filters,
        formato: 'PDF'
      },
      success: true
    });
    // Aquí iría la lógica de exportación
  };

  // 📊 Registrar acceso a reportes
  useEffect(() => {
    if (user && user.rol !== 'docente') {
      log({
        action: 'reports.access',
        description: 'Acceso a la página de Reportes',
        metadata: {
          seccion: 'reportes',
          rol: user.rol
        },
        success: true
      });
    }
  }, [user, log]);

  // Verificar permisos
  if (!user || user.rol === 'docente') {
    // 🔐 Registrar acceso denegado
    log({
      action: 'security.access_denied',
      description: 'Intento de acceso denegado a Reportes',
      success: false,
      severity: 'warning',
      metadata: {
        seccionSolicitada: 'ReportsPage',
        rolRequerido: 'administrador o coordinador',
        rolActual: user?.rol || 'guest'
      }
    });

    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h3>Acceso Denegado</h3>
          <p className="text-muted-foreground">
            Solo administradores y coordinadores pueden acceder a los reportes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Reportes y Analytics</h1>
          <p className="text-muted-foreground">
            Análisis detallado de calificaciones, tendencias y estadísticas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleGenerateReport}>
            <FileText className="w-4 h-4 mr-2" />
            Generar Reporte
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Filtros globales */}
      <ReportFilters filters={filters} onFiltersChange={setFilters} />

      {/* Tabs de reportes */}
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Estudiantes
          </TabsTrigger>
          <TabsTrigger value="subjects" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Materias
          </TabsTrigger>
          <TabsTrigger value="comparative" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Comparativas
          </TabsTrigger>
        </TabsList>

        {/* Tab: Analytics Dashboard */}
        <TabsContent value="analytics">
          <AnalyticsDashboard filters={filters} />
        </TabsContent>

        {/* Tab: Reporte de Estudiantes */}
        <TabsContent value="students">
          <StudentReport filters={filters} />
        </TabsContent>

        {/* Tab: Reporte de Materias */}
        <TabsContent value="subjects">
          <SubjectReport filters={filters} />
        </TabsContent>

        {/* Tab: Reportes Comparativos */}
        <TabsContent value="comparative">
          <ComparativeReport filters={filters} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
