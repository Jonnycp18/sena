import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Filter, X } from 'lucide-react';
import { ReportFilters as IReportFilters } from './ReportsPage';

interface ReportFiltersProps {
  filters: IReportFilters;
  onFiltersChange: (filters: IReportFilters) => void;
}

// Datos mock

const mockMaterias = [
  { id: 'todos', nombre: 'Todas las materias' },
  { id: '1', nombre: 'Fundamentos de Programación' },
  { id: '2', nombre: 'Bases de Datos' },
  { id: '3', nombre: 'Desarrollo Web' },
];

const mockFichas = [
  { id: 'todos', nombre: 'Todas las fichas' },
  { id: '2558901', nombre: 'Ficha 2558901 - ADSO' },
  { id: '2558902', nombre: 'Ficha 2558902 - Diseño' },
  { id: '2558903', nombre: 'Ficha 2558903 - Multimedia' },
];

const mockDocentes = [
  { id: 'todos', nombre: 'Todos los docentes' },
  { id: '1', nombre: 'Carlos Rodríguez' },
  { id: '2', nombre: 'Ana Martínez' },
  { id: '3', nombre: 'Luis González' },
];

export function ReportFilters({ filters, onFiltersChange }: ReportFiltersProps) {
  const handleFilterChange = (key: keyof IReportFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      materia: 'todos',
      ficha: 'todos',
      docente: 'todos',
      fechaInicio: '',
      fechaFin: ''
    });
  };

  const hasActiveFilters = 
    filters.materia !== 'todos' ||
    filters.ficha !== 'todos' ||
    filters.docente !== 'todos' ||
    filters.fechaInicio !== '' ||
    filters.fechaFin !== '';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <CardTitle>Filtros de Búsqueda</CardTitle>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-2" />
              Limpiar Filtros
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">

          {/* Materia */}
          <div className="space-y-2">
            <Label>Materia</Label>
            <Select value={filters.materia} onValueChange={(value) => handleFilterChange('materia', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mockMaterias.map((materia) => (
                  <SelectItem key={materia.id} value={materia.id}>
                    {materia.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ficha */}
          <div className="space-y-2">
            <Label>Ficha</Label>
            <Select value={filters.ficha} onValueChange={(value) => handleFilterChange('ficha', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mockFichas.map((ficha) => (
                  <SelectItem key={ficha.id} value={ficha.id}>
                    {ficha.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Docente */}
          <div className="space-y-2">
            <Label>Docente</Label>
            <Select value={filters.docente} onValueChange={(value) => handleFilterChange('docente', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mockDocentes.map((docente) => (
                  <SelectItem key={docente.id} value={docente.id}>
                    {docente.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fecha Inicio */}
          <div className="space-y-2">
            <Label>Fecha Inicio</Label>
            <Input
              type="date"
              value={filters.fechaInicio}
              onChange={(e) => handleFilterChange('fechaInicio', e.target.value)}
            />
          </div>

          {/* Fecha Fin */}
          <div className="space-y-2">
            <Label>Fecha Fin</Label>
            <Input
              type="date"
              value={filters.fechaFin}
              onChange={(e) => handleFilterChange('fechaFin', e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
