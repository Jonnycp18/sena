import { useState, useEffect } from 'react';
import { User, UserRole } from '../hooks/useAuth';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { toast } from 'sonner@2.0.3';

interface UserFormProps {
  user?: User | null;
  departments: string[];
  onSubmit: (userData: Partial<User>) => void;
  onCancel: () => void;
}

const especialidadesPorDepartamento: { [key: string]: string[] } = {
  'Ciencias de la Computación': [
    'Desarrollo de Software',
    'Inteligencia Artificial',
    'Redes y Seguridad',
    'Bases de Datos',
    'Sistemas Embebidos'
  ],
  'Matemáticas': [
    'Matemáticas Aplicadas',
    'Estadística',
    'Matemáticas Puras',
    'Investigación de Operaciones'
  ],
  'Ciencias Naturales': [
    'Biología',
    'Química',
    'Física',
    'Ciencias Ambientales'
  ],
  'Humanidades': [
    'Literatura',
    'Historia',
    'Filosofía',
    'Arte'
  ],
  'Idiomas': [
    'Inglés',
    'Francés',
    'Alemán',
    'Portugués'
  ],
  'Educación Física': [
    'Deportes',
    'Recreación',
    'Entrenamiento'
  ]
};

export function UserForm({ user, departments, onSubmit, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    cedula: '',
    rol: 'docente' as UserRole,
    departamento: '',
    especialidad: '',
    biografia: '',
    configuraciones: {
      notificacionesEmail: true,
      notificacionesPush: true,
      tema: 'sistema' as const,
      idioma: 'es' as const
    }
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [especialidadesDisponibles, setEspecialidadesDisponibles] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        telefono: user.telefono || '',
        cedula: user.cedula,
        rol: user.rol,
        departamento: user.departamento || '',
        especialidad: user.especialidad || '',
        biografia: user.biografia || '',
        configuraciones: user.configuraciones
      });
    }
  }, [user]);

  useEffect(() => {
    if (formData.departamento) {
      setEspecialidadesDisponibles(especialidadesPorDepartamento[formData.departamento] || []);
      // Limpiar especialidad si no está disponible en el nuevo departamento
      if (formData.especialidad && !especialidadesPorDepartamento[formData.departamento]?.includes(formData.especialidad)) {
        setFormData(prev => ({ ...prev, especialidad: '' }));
      }
    } else {
      setEspecialidadesDisponibles([]);
    }
  }, [formData.departamento]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.apellido.trim()) {
      newErrors.apellido = 'El apellido es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.cedula.trim()) {
      newErrors.cedula = 'La cédula es requerida';
    } else if (!/^\d{7,10}$/.test(formData.cedula)) {
      newErrors.cedula = 'La cédula debe tener entre 7 y 10 dígitos';
    }

    if (formData.telefono && !/^\+?[\d\s\-\(\)]{10,}$/.test(formData.telefono)) {
      newErrors.telefono = 'El teléfono no es válido';
    }

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

  const handleConfigChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      configuraciones: {
        ...prev.configuraciones,
        [field]: value
      }
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Información Personal</TabsTrigger>
          <TabsTrigger value="profesional">Información Profesional</TabsTrigger>
          <TabsTrigger value="configuracion">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                placeholder="Ingresa el nombre"
                className={errors.nombre ? 'border-destructive' : ''}
              />
              {errors.nombre && (
                <p className="text-sm text-destructive">{errors.nombre}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido *</Label>
              <Input
                id="apellido"
                value={formData.apellido}
                onChange={(e) => handleInputChange('apellido', e.target.value)}
                placeholder="Ingresa el apellido"
                className={errors.apellido ? 'border-destructive' : ''}
              />
              {errors.apellido && (
                <p className="text-sm text-destructive">{errors.apellido}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="usuario@instituto.edu"
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cedula">Cédula *</Label>
              <Input
                id="cedula"
                value={formData.cedula}
                onChange={(e) => handleInputChange('cedula', e.target.value)}
                placeholder="12345678"
                className={errors.cedula ? 'border-destructive' : ''}
              />
              {errors.cedula && (
                <p className="text-sm text-destructive">{errors.cedula}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
                placeholder="+57 300 123 4567"
                className={errors.telefono ? 'border-destructive' : ''}
              />
              {errors.telefono && (
                <p className="text-sm text-destructive">{errors.telefono}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="biografia">Biografía</Label>
            <Textarea
              id="biografia"
              value={formData.biografia}
              onChange={(e) => handleInputChange('biografia', e.target.value)}
              placeholder="Breve descripción del usuario..."
              rows={3}
            />
          </div>
        </TabsContent>

        <TabsContent value="profesional" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rol">Rol *</Label>
            <Select value={formData.rol} onValueChange={(value) => handleInputChange('rol', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="administrador">Administrador</SelectItem>
                <SelectItem value="coordinador">Coordinador</SelectItem>
                <SelectItem value="docente">Docente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="departamento">Departamento</Label>
            <Select 
              value={formData.departamento} 
              onValueChange={(value) => handleInputChange('departamento', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un departamento" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {especialidadesDisponibles.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="especialidad">Especialidad</Label>
              <Select 
                value={formData.especialidad} 
                onValueChange={(value) => handleInputChange('especialidad', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una especialidad" />
                </SelectTrigger>
                <SelectContent>
                  {especialidadesDisponibles.map((esp) => (
                    <SelectItem key={esp} value={esp}>{esp}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </TabsContent>

        <TabsContent value="configuracion" className="space-y-4">
          <div className="space-y-4">
            <div>
              <h4 className="mb-3">Notificaciones</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones por Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Recibe notificaciones importantes por correo electrónico
                    </p>
                  </div>
                  <Switch
                    checked={formData.configuraciones.notificacionesEmail}
                    onCheckedChange={(checked) => handleConfigChange('notificacionesEmail', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones Push</Label>
                    <p className="text-sm text-muted-foreground">
                      Recibe notificaciones push en el navegador
                    </p>
                  </div>
                  <Switch
                    checked={formData.configuraciones.notificacionesPush}
                    onCheckedChange={(checked) => handleConfigChange('notificacionesPush', checked)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="mb-3">Preferencias</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tema</Label>
                  <Select 
                    value={formData.configuraciones.tema} 
                    onValueChange={(value) => handleConfigChange('tema', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="claro">Claro</SelectItem>
                      <SelectItem value="oscuro">Oscuro</SelectItem>
                      <SelectItem value="sistema">Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Idioma</Label>
                  <Select 
                    value={formData.configuraciones.idioma} 
                    onValueChange={(value) => handleConfigChange('idioma', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {user ? 'Actualizar Usuario' : 'Crear Usuario'}
        </Button>
      </div>
    </form>
  );
}