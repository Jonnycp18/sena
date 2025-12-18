import { useState, useEffect } from 'react';
import { Materia, Ficha } from './FichasMateriasManagement';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';

interface MateriaFormProps {
  materia?: Materia | null;
  fichas: Ficha[];
  materias: Materia[];
  onSubmit: (materiaData: Partial<Materia>) => void;
  onCancel: () => void;
}

// Usuarios docentes de prueba (en una implementación real vendría de la API)
const mockDocentes = [
  { id: '3', nombre: 'Carlos Rodríguez', especialidad: 'Desarrollo de Software' },
  { id: '4', nombre: 'Ana Martínez', especialidad: 'Matemáticas Aplicadas' },
  { id: '6', nombre: 'Sandra López', especialidad: 'Literatura' }
];

export function MateriaForm({ materia, fichas, materias, onSubmit, onCancel }: MateriaFormProps) {
  const { user } = useAuth();
  type MateriaFormState = {
    nombre: string;
    codigo: string;
    descripcion: string;
    horas: number;
    fichaId: string;
    docenteId: string;
    prerrequisitos: string[];
    tipoMateria: Materia['tipoMateria'];
  };

  const [formData, setFormData] = useState<MateriaFormState>({
    nombre: '',
    codigo: '',
    descripcion: '',
    horas: 48,
    fichaId: '',
    docenteId: '',
    prerrequisitos: [],
    tipoMateria: 'teorico-practica'
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [materiasDisponibles, setMateriasDisponibles] = useState<Materia[]>([]);
  const isSubmitDisabled = !formData.fichaId || Object.keys(errors).length > 0;

  useEffect(() => {
    if (materia) {
      setFormData({
        nombre: materia.nombre,
        codigo: materia.codigo,
        descripcion: materia.descripcion,
        horas: materia.horas,
        fichaId: materia.fichaId,
        docenteId: materia.docenteId || '',
        prerrequisitos: materia.prerrequisitos,
        tipoMateria: materia.tipoMateria
      });
    }
  }, [materia]);

  useEffect(() => {
    // Filtrar materias disponibles como prerrequisitos
    // Sin filtro por semestre
    if (formData.fichaId) {
      const materiasEnFicha = materias.filter(m => m.fichaId === formData.fichaId && m.id !== materia?.id);
      setMateriasDisponibles(materiasEnFicha);
    } else {
      setMateriasDisponibles([]);
    }
  }, [formData.fichaId, materias, materia]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.codigo.trim()) {
      newErrors.codigo = 'El código es requerido';
    } else if (!/^[A-Za-z0-9]+$/.test(formData.codigo)) {
      newErrors.codigo = 'El código debe contener solo letras y números';
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida';
    }

    if (!formData.fichaId) {
      newErrors.fichaId = 'Debe seleccionar una ficha';
    }

    if (formData.horas < 16 || formData.horas > 128) {
      newErrors.horas = 'Las horas deben estar entre 16 y 128';
    }
    // Se removió validación de créditos y semestre

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    onSubmit(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpiar error cuando el usuario empiece a corregir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    // Limpiar prerrequisitos si cambia la ficha
    if (field === 'fichaId') {
      setFormData(prev => ({
        ...prev,
        prerrequisitos: []
      }));
    }
  };

  const handlePrerrequisitoChange = (materiaId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        prerrequisitos: [...prev.prerrequisitos, materiaId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        prerrequisitos: prev.prerrequisitos.filter(id => id !== materiaId)
      }));
    }
  };

  // Se removió sugerencia automática basada en créditos

  const fichaSeleccionada = fichas.find(f => f.id === formData.fichaId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Información básica */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre de la Materia *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                placeholder="Ej: Fundamentos de Programación"
                className={errors.nombre ? 'border-destructive' : ''}
              />
              {errors.nombre && (
                <p className="text-sm text-destructive">{errors.nombre}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => handleInputChange('codigo', e.target.value)}
                placeholder="Ej: FP101, ADSO1"
                className={errors.codigo ? 'border-destructive' : ''}
              />
              {errors.codigo && (
                <p className="text-sm text-destructive">{errors.codigo}</p>
              )}
              <p className="text-xs text-muted-foreground">Solo letras y números, sin restricciones de formato.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción *</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => handleInputChange('descripcion', e.target.value)}
                placeholder="Descripción de la materia..."
                rows={3}
                className={errors.descripcion ? 'border-destructive' : ''}
              />
              {errors.descripcion && (
                <p className="text-sm text-destructive">{errors.descripcion}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Configuración académica */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Configuración Académica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fichaId">Ficha Académica *</Label>
              <Select 
                value={formData.fichaId} 
                onValueChange={(value) => handleInputChange('fichaId', value)}
              >
                <SelectTrigger className={errors.fichaId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecciona una ficha" />
                </SelectTrigger>
                <SelectContent>
                  {fichas.filter(f => f.estado === 'activa').map((ficha) => (
                    <SelectItem key={ficha.id} value={ficha.id}>
                      {ficha.nombre} ({ficha.codigo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.fichaId && (
                <p className="text-sm text-destructive">{errors.fichaId}</p>
              )}
              {!formData.fichaId && (
                <p className="text-xs text-yellow-600">Selecciona una ficha antes de crear la materia.</p>
              )}
              {fichaSeleccionada && (
                <p className="text-xs text-muted-foreground">
                  Ficha seleccionada: {fichaSeleccionada.nombre}
                </p>
              )}
            </div>

            {/* Se removieron campos de semestre y créditos */}

            <div className="space-y-2">
              <Label htmlFor="tipoMateria">Tipo de Materia</Label>
              <Select 
                value={formData.tipoMateria} 
                onValueChange={(value) => {
                  handleInputChange('tipoMateria', value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teorica">Teórica</SelectItem>
                  <SelectItem value="practica">Práctica</SelectItem>
                  <SelectItem value="teorico-practica">Teórico-Práctica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="horas">Horas Académicas *</Label>
              <Input
                id="horas"
                type="number"
                min="16"
                max="128"
                value={formData.horas}
                onChange={(e) => handleInputChange('horas', parseInt(e.target.value) || 16)}
                className={errors.horas ? 'border-destructive' : ''}
              />
              {errors.horas && (
                <p className="text-sm text-destructive">{errors.horas}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Define las horas académicas requeridas para la materia.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asignación y prerrequisitos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Asignación de docente */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Asignación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="docenteId">Docente Asignado</Label>
              <Select 
                value={formData.docenteId || undefined}
                onValueChange={(value) => handleInputChange('docenteId', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un docente (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {mockDocentes.map((docente) => (
                    <SelectItem key={docente.id} value={docente.id}>
                      {docente.nombre}
                      {docente.especialidad && (
                        <span className="text-muted-foreground"> - {docente.especialidad}</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Prerrequisitos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Prerrequisitos</CardTitle>
          </CardHeader>
          <CardContent>
            {materiasDisponibles.length > 0 ? (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {materiasDisponibles.map((materia) => (
                  <div key={materia.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`prereq-${materia.id}`}
                      checked={formData.prerrequisitos.includes(materia.id)}
                      onCheckedChange={(checked) => 
                        handlePrerrequisitoChange(materia.id, !!checked)
                      }
                    />
                    <Label htmlFor={`prereq-${materia.id}`} className="text-sm">
                      {materia.nombre}
                      <span className="text-muted-foreground ml-2">
                        ({materia.codigo})
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {formData.fichaId 
                  ? 'No hay materias disponibles como prerrequisitos para esta ficha'
                  : 'Selecciona una ficha para ver prerrequisitos disponibles'
                }
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resumen */}
      {formData.nombre && formData.fichaId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Resumen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Ficha</p>
                <p className="font-medium">
                  {fichas.find(f => f.id === formData.fichaId)?.nombre}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Carga académica</p>
                <p className="font-medium">{formData.horas}h</p>
              </div>
              <div>
                <p className="text-muted-foreground">Prerrequisitos</p>
                <p className="font-medium">
                  {formData.prerrequisitos.length} materia{formData.prerrequisitos.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            {formData.prerrequisitos.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Prerrequisitos seleccionados:</p>
                <div className="flex flex-wrap gap-1">
                  {formData.prerrequisitos.map(prereqId => {
                    const prereq = materiasDisponibles.find(m => m.id === prereqId);
                    return prereq ? (
                      <Badge key={prereqId} variant="outline" className="text-xs">
                        {prereq.codigo}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Separator />

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitDisabled}>
          {materia ? 'Actualizar Materia' : 'Crear Materia'}
        </Button>
      </div>
    </form>
  );
}