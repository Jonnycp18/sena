import { useState, useEffect } from 'react';
import { Ficha } from './FichasMateriasManagement';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { toast } from 'sonner@2.0.3';

interface FichaFormProps {
  ficha?: Ficha | null;
  onSubmit: (fichaData: Partial<Ficha>) => void;
  onCancel: () => void;
}

export function FichaForm({ ficha, onSubmit, onCancel }: FichaFormProps) {
  type FichaFormState = {
    nombre: string;
    codigo: string;
    descripcion: string;
    tipoPrograma: Ficha['tipoPrograma'];
    modalidad: Ficha['modalidad'];
    fecha_inicio: string;
    fecha_fin: string;
  };

  const [formData, setFormData] = useState<FichaFormState>({
    nombre: '',
    codigo: '',
    descripcion: '',
    tipoPrograma: 'tecnico',
    modalidad: 'presencial',
    fecha_inicio: new Date().toISOString().slice(0,10),
    fecha_fin: new Date(new Date().setFullYear(new Date().getFullYear(), 11, 31)).toISOString().slice(0,10)
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (ficha) {
      setFormData({
        nombre: ficha.nombre,
        codigo: ficha.codigo,
        descripcion: ficha.descripcion,
        tipoPrograma: ficha.tipoPrograma,
        modalidad: ficha.modalidad,
        fecha_inicio: new Date().toISOString().slice(0,10),
        fecha_fin: new Date(new Date().setFullYear(new Date().getFullYear(), 11, 31)).toISOString().slice(0,10)
      });
    }
  }, [ficha]);

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

    if (!formData.fecha_inicio) {
      newErrors.fecha_inicio = 'La fecha de inicio es requerida';
    }
    if (!formData.fecha_fin) {
      newErrors.fecha_fin = 'La fecha de fin es requerida';
    }

    // Se removieron duración en semestres y créditos totales

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
  };

  // Se removieron sugerencias de créditos

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
              <Label htmlFor="nombre">Nombre de la Ficha *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                placeholder="Ej: Técnico en Desarrollo de Software"
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
                placeholder="Ej: 2826503, ADSO1"
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
                placeholder="Descripción del programa académico..."
                rows={4}
                className={errors.descripcion ? 'border-destructive' : ''}
              />
              {errors.descripcion && (
                <p className="text-sm text-destructive">{errors.descripcion}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha_inicio">Fecha de Inicio *</Label>
                <Input
                  id="fecha_inicio"
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) => handleInputChange('fecha_inicio', e.target.value)}
                  className={`w-64 md:w-72 h-11 text-sm font-mono tracking-wide px-3 ${errors.fecha_inicio ? 'border-destructive' : ''}`}
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                />
                {errors.fecha_inicio && (
                  <p className="text-sm text-destructive">{errors.fecha_inicio}</p>
                )}
                <p className="text-xs text-muted-foreground">Formato: AAAA-MM-DD. Ej: 2025-12-31</p>
                <p className="text-xs text-muted-foreground">Seleccionado: {formData.fecha_inicio}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha_fin">Fecha de Fin *</Label>
                <Input
                  id="fecha_fin"
                  type="date"
                  value={formData.fecha_fin}
                  onChange={(e) => handleInputChange('fecha_fin', e.target.value)}
                  className={`w-64 md:w-72 h-11 text-sm font-mono tracking-wide px-3 ${errors.fecha_fin ? 'border-destructive' : ''}`}
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                />
                {errors.fecha_fin && (
                  <p className="text-sm text-destructive">{errors.fecha_fin}</p>
                )}
                <p className="text-xs text-muted-foreground">Formato: AAAA-MM-DD. Ej: 2025-12-31</p>
                <p className="text-xs text-muted-foreground">Seleccionado: {formData.fecha_fin}</p>
              </div>
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
              <Label htmlFor="tipoPrograma">Tipo de Programa *</Label>
              <Select 
                value={formData.tipoPrograma} 
                onValueChange={(value) => {
                  handleInputChange('tipoPrograma', value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                  <SelectItem value="tecnologico">Tecnológico</SelectItem>
                  <SelectItem value="profesional">Profesional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modalidad">Modalidad</Label>
              <Select 
                value={formData.modalidad} 
                onValueChange={(value) => handleInputChange('modalidad', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la modalidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="virtual">Virtual</SelectItem>
                  <SelectItem value="mixta">Mixta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Se removieron campos de duración y créditos */}
          </CardContent>
        </Card>
      </div>

      {/* Información adicional */}
      {/* Se removió el resumen de duración/créditos */}

      <Separator />

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {ficha ? 'Actualizar Ficha' : 'Crear Ficha'}
        </Button>
      </div>
    </form>
  );
}