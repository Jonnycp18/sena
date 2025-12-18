import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAuditLog } from '../hooks/useAuditLog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { ProfileActivityLog } from './ProfileActivityLog';
import { ProfileStats } from './ProfileStats';
import { PasswordChangeDialog } from './PasswordChangeDialog';
import { LogoutButton } from './LogoutButton';
import { toast } from 'sonner@2.0.3';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Building2, 
  GraduationCap, 
  Shield,
  Save,
  Camera,
  Bell,
  Palette,
  Globe
} from 'lucide-react';

export function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { log } = useAuditLog();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    email: user?.email || '',
    telefono: user?.telefono || '',
    cedula: user?.cedula || '',
    departamento: user?.departamento || '',
    especialidad: user?.especialidad || '',
    biografia: user?.biografia || '',
    configuraciones: {
      notificacionesEmail: user?.configuraciones.notificacionesEmail || false,
      notificacionesPush: user?.configuraciones.notificacionesPush || false,
      tema: user?.configuraciones.tema || 'sistema',
      idioma: user?.configuraciones.idioma || 'es'
    }
  });

  // 👤 Registrar acceso al perfil
  useEffect(() => {
    if (user) {
      log({
        action: 'profile.view',
        description: 'Acceso a la página de Perfil',
        metadata: {
          seccion: 'perfil'
        },
        success: true
      });
    }
  }, [user, log]);

  if (!user) return null;

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('configuraciones.')) {
      const configField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        configuraciones: {
          ...prev.configuraciones,
          [configField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Detectar cambios
      const changes: any[] = [];
      Object.keys(formData).forEach((key) => {
        if (key === 'configuraciones') {
          Object.keys(formData.configuraciones).forEach((configKey) => {
            if (formData.configuraciones[configKey as keyof typeof formData.configuraciones] !== 
                user?.configuraciones[configKey as keyof typeof user.configuraciones]) {
              changes.push({
                field: `configuraciones.${configKey}`,
                oldValue: user?.configuraciones[configKey as keyof typeof user.configuraciones],
                newValue: formData.configuraciones[configKey as keyof typeof formData.configuraciones]
              });
            }
          });
        } else if ((formData as any)[key] !== (user as any)[key]) {
          changes.push({
            field: key,
            oldValue: (user as any)[key],
            newValue: (formData as any)[key]
          });
        }
      });

      const success = await updateProfile(formData);
      if (success) {
        // ✅ Registrar actualización exitosa
        log({
          action: 'profile.update',
          description: 'Perfil actualizado correctamente',
          targetType: 'user',
          targetId: user.id,
          targetName: `${user.nombre} ${user.apellido}`,
          changes,
          metadata: {
            camposActualizados: changes.length,
            campos: changes.map(c => c.field)
          },
          success: true
        });

        toast.success('Perfil actualizado correctamente');
        setIsEditing(false);
      } else {
        // ❌ Registrar error
        log({
          action: 'profile.update',
          description: 'Error al actualizar perfil',
          success: false,
          severity: 'error',
          errorMessage: 'Fallo en la actualización'
        });

        toast.error('Error al actualizar el perfil');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

      // ❌ Registrar excepción
      log({
        action: 'profile.update',
        description: 'Excepción al actualizar perfil',
        success: false,
        severity: 'error',
        errorMessage
      });

      toast.error('Error al actualizar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      telefono: user.telefono || '',
      cedula: user.cedula,
      departamento: user.departamento || '',
      especialidad: user.especialidad || '',
      biografia: user.biografia || '',
      configuraciones: user.configuraciones
    });
    setIsEditing(false);
  };

  const getRolColor = (rol: string) => {
    switch (rol) {
      case 'administrador': return 'destructive';
      case 'coordinador': return 'default';
      case 'docente': return 'secondary';
      default: return 'outline';
    }
  };

  const getUserInitials = () => {
    return `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`;
  };

  return (
    <div className="container max-w-4xl mx-auto py-6 space-y-6">
      {/* Estadísticas del usuario */}
      <ProfileStats />
      {/* Header del perfil */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="text-lg">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1>{user.nombre} {user.apellido}</h1>
                  <Badge variant={getRolColor(user.rol)}>
                    {user.rol.charAt(0).toUpperCase() + user.rol.slice(1)}
                  </Badge>
                  <Badge variant={user.estado === 'activo' ? 'default' : 'secondary'}>
                    {user.estado.charAt(0).toUpperCase() + user.estado.slice(1)}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{user.email}</p>
                {user.departamento && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Building2 className="h-4 w-4" />
                    {user.departamento}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <LogoutButton variant="outline" size="default" showText={true} />
                  <PasswordChangeDialog />
                  <Button onClick={() => setIsEditing(true)}>
                    <User className="h-4 w-4 mr-2" />
                    Editar Perfil
                  </Button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCancel}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs del perfil */}
      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Información Personal</TabsTrigger>
          <TabsTrigger value="professional">Información Profesional</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
          <TabsTrigger value="activity">Historial</TabsTrigger>
        </TabsList>

        {/* Información Personal */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>
                Gestiona tu información personal y de contacto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input
                    id="apellido"
                    value={formData.apellido}
                    onChange={(e) => handleInputChange('apellido', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => handleInputChange('telefono', e.target.value)}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cedula">Cédula</Label>
                <Input
                  id="cedula"
                  value={formData.cedula}
                  onChange={(e) => handleInputChange('cedula', e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="biografia">Biografía</Label>
                <Textarea
                  id="biografia"
                  value={formData.biografia}
                  onChange={(e) => handleInputChange('biografia', e.target.value)}
                  disabled={!isEditing}
                  rows={4}
                  placeholder="Cuéntanos sobre ti..."
                />
              </div>

              <Separator />
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Fecha de ingreso: {new Date(user.fechaIngreso).toLocaleDateString('es-ES')}
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  ID: {user.id}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Información Profesional */}
        <TabsContent value="professional">
          <Card>
            <CardHeader>
              <CardTitle>Información Profesional</CardTitle>
              <CardDescription>
                Información relacionada con tu rol y responsabilidades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="departamento">Departamento</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="departamento"
                      value={formData.departamento}
                      onChange={(e) => handleInputChange('departamento', e.target.value)}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>
                {(user.rol === 'coordinador' || user.rol === 'docente') && (
                  <div className="space-y-2">
                    <Label htmlFor="especialidad">Especialidad</Label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="especialidad"
                        value={formData.especialidad}
                        onChange={(e) => handleInputChange('especialidad', e.target.value)}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="mb-2">Permisos del Rol</h4>
                <div className="flex flex-wrap gap-2">
                  {user.rol === 'administrador' && (
                    <>
                      <Badge variant="outline">Gestión completa del sistema</Badge>
                      <Badge variant="outline">Administración de usuarios</Badge>
                      <Badge variant="outline">Auditoría y seguridad</Badge>
                      <Badge variant="outline">Reportes avanzados</Badge>
                    </>
                  )}
                  {user.rol === 'coordinador' && (
                    <>
                      <Badge variant="outline">Seguimiento académico</Badge>
                      <Badge variant="outline">Reportes y métricas</Badge>
                      <Badge variant="outline">Gestión de indicadores</Badge>
                    </>
                  )}
                  {user.rol === 'docente' && (
                    <>
                      <Badge variant="outline">Carga de calificaciones</Badge>
                      <Badge variant="outline">Gestión de archivos</Badge>
                      <Badge variant="outline">Consulta de reportes</Badge>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuración */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
              <CardDescription>
                Personaliza tu experiencia en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notificaciones */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  <h4>Notificaciones</h4>
                </div>
                <div className="space-y-3 pl-7">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">Notificaciones por Email</Label>
                      <p className="text-sm text-muted-foreground">
                        Recibe notificaciones importantes por correo electrónico
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={formData.configuraciones.notificacionesEmail}
                      onCheckedChange={(checked) => 
                        handleInputChange('configuraciones.notificacionesEmail', checked)
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-notifications">Notificaciones Push</Label>
                      <p className="text-sm text-muted-foreground">
                        Recibe notificaciones en tiempo real en el navegador
                      </p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={formData.configuraciones.notificacionesPush}
                      onCheckedChange={(checked) => 
                        handleInputChange('configuraciones.notificacionesPush', checked)
                      }
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Apariencia */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  <h4>Apariencia</h4>
                </div>
                <div className="space-y-3 pl-7">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Tema</Label>
                    <Select
                      value={formData.configuraciones.tema}
                      onValueChange={(value) => handleInputChange('configuraciones.tema', value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tema" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="claro">Claro</SelectItem>
                        <SelectItem value="oscuro">Oscuro</SelectItem>
                        <SelectItem value="sistema">Sistema</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Idioma */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  <h4>Idioma</h4>
                </div>
                <div className="space-y-3 pl-7">
                  <div className="space-y-2">
                    <Label htmlFor="language">Idioma del Sistema</Label>
                    <Select
                      value={formData.configuraciones.idioma}
                      onValueChange={(value) => handleInputChange('configuraciones.idioma', value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar idioma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historial de Actividad */}
        <TabsContent value="activity">
          <ProfileActivityLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}
