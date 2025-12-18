import { useState, useMemo, useEffect } from 'react';
import { useAuth, User, UserRole } from '../hooks/useAuth';
import { useAuditLog } from '../hooks/useAuditLog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX, 
  Filter,
  Download,
  Upload
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { UserForm } from './UserForm';
import { toast } from 'sonner@2.0.3';
import { api } from '../utils/api';

// Datos de prueba expandidos
const mockUsers: User[] = [
  {
    id: '1',
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'admin@instituto.edu',
    telefono: '+57 300 123 4567',
    cedula: '12345678',
    rol: 'administrador',
    departamento: 'Administración',
    fechaIngreso: '2020-01-15',
    estado: 'activo',
    biografia: 'Administrador del sistema con más de 10 años de experiencia.',
    configuraciones: {
      notificacionesEmail: true,
      notificacionesPush: true,
      tema: 'sistema',
      idioma: 'es'
    }
  },
  {
    id: '2',
    nombre: 'María',
    apellido: 'García',
    email: 'coordinador@instituto.edu',
    telefono: '+57 301 987 6543',
    cedula: '87654321',
    rol: 'coordinador',
    departamento: 'Coordinación Académica',
    especialidad: 'Ingeniería de Sistemas',
    fechaIngreso: '2019-03-20',
    estado: 'activo',
    biografia: 'Coordinadora académica especializada en seguimiento educativo.',
    configuraciones: {
      notificacionesEmail: true,
      notificacionesPush: false,
      tema: 'claro',
      idioma: 'es'
    }
  },
  {
    id: '3',
    nombre: 'Carlos',
    apellido: 'Rodríguez',
    email: 'docente@instituto.edu',
    telefono: '+57 302 456 7890',
    cedula: '11223344',
    rol: 'docente',
    departamento: 'Ciencias de la Computación',
    especialidad: 'Desarrollo de Software',
    fechaIngreso: '2021-08-10',
    estado: 'activo',
    biografia: 'Docente especializado en desarrollo de software.',
    configuraciones: {
      notificacionesEmail: false,
      notificacionesPush: true,
      tema: 'oscuro',
      idioma: 'es'
    }
  },
  {
    id: '4',
    nombre: 'Ana',
    apellido: 'Martínez',
    email: 'ana.martinez@instituto.edu',
    telefono: '+57 310 234 5678',
    cedula: '22334455',
    rol: 'docente',
    departamento: 'Matemáticas',
    especialidad: 'Matemáticas Aplicadas',
    fechaIngreso: '2022-02-14',
    estado: 'activo',
    biografia: 'Docente de matemáticas con enfoque en aplicaciones prácticas.',
    configuraciones: {
      notificacionesEmail: true,
      notificacionesPush: true,
      tema: 'claro',
      idioma: 'es'
    }
  },
  {
    id: '5',
    nombre: 'Luis',
    apellido: 'Torres',
    email: 'luis.torres@instituto.edu',
    telefono: '+57 320 345 6789',
    cedula: '33445566',
    rol: 'coordinador',
    departamento: 'Ciencias Naturales',
    especialidad: 'Biología',
    fechaIngreso: '2020-09-01',
    estado: 'inactivo',
    biografia: 'Coordinador de ciencias naturales con especialización en biología.',
    configuraciones: {
      notificacionesEmail: false,
      notificacionesPush: false,
      tema: 'sistema',
      idioma: 'es'
    }
  },
  {
    id: '6',
    nombre: 'Sandra',
    apellido: 'López',
    email: 'sandra.lopez@instituto.edu',
    telefono: '+57 315 456 7890',
    cedula: '44556677',
    rol: 'docente',
    departamento: 'Humanidades',
    especialidad: 'Literatura',
    fechaIngreso: '2023-01-15',
    estado: 'activo',
    biografia: 'Docente de literatura con pasión por la enseñanza.',
    configuraciones: {
      notificacionesEmail: true,
      notificacionesPush: false,
      tema: 'claro',
      idioma: 'es'
    }
  }
];

const departamentos = [
  'Administración',
  'Coordinación Académica', 
  'Ciencias de la Computación',
  'Matemáticas',
  'Ciencias Naturales',
  'Humanidades',
  'Idiomas',
  'Educación Física'
];

export function UserManagement() {
  const { user } = useAuth();
  const { log } = useAuditLog();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar usuarios desde el backend
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { users: fetched } = await api.getUsers({ page: 1, pageSize: 50 });
        if (mounted) {
          setUsers(fetched);
        }
      } catch (err) {
        console.error(err);
        if (mounted) {
          setError('No se pudieron cargar los usuarios. Usando datos locales.');
          // Fallback a datos locales para que la UI siga funcionando
          setUsers(mockUsers);
          toast.error('Error cargando usuarios desde el servidor');
        }
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'todos'>('todos');
  const [filterStatus, setFilterStatus] = useState<'activo' | 'inactivo' | 'todos'>('todos');
  const [filterDepartment, setFilterDepartment] = useState<string>('todos');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Verificar permisos de administrador
  if (user?.rol !== 'administrador') {
    // 🔐 Registrar intento de acceso denegado
    log({
      action: 'security.access_denied',
      description: 'Intento de acceso denegado a Gestión de Usuarios',
      success: false,
      severity: 'warning',
      metadata: {
        seccionSolicitada: 'UserManagement',
        rolRequerido: 'administrador',
        rolActual: user?.rol || 'guest'
      }
    });

    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h3>Acceso Denegado</h3>
          <p className="text-muted-foreground">
            No tienes permisos para acceder a la gestión de usuarios.
          </p>
        </div>
      </div>
    );
  }

  // Filtrar usuarios
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.cedula.includes(searchTerm);
      
      const matchesRole = filterRole === 'todos' || user.rol === filterRole;
      const matchesStatus = filterStatus === 'todos' || user.estado === filterStatus;
      const matchesDepartment = filterDepartment === 'todos' || user.departamento === filterDepartment;
      
      return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
    });
  }, [users, searchTerm, filterRole, filterStatus, filterDepartment]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = users.length;
    const activos = users.filter(u => u.estado === 'activo').length;
    const administradores = users.filter(u => u.rol === 'administrador').length;
    const coordinadores = users.filter(u => u.rol === 'coordinador').length;
    const docentes = users.filter(u => u.rol === 'docente').length;

    return { total, activos, administradores, coordinadores, docentes };
  }, [users]);

  const handleCreateUser = async (userData: Partial<User>) => {
    const toBackendRole = (r: UserRole | undefined) => {
      switch ((r || 'docente')) {
        case 'administrador':
          return 'Administrador' as const;
        case 'coordinador':
          return 'Coordinador' as const;
        default:
          return 'Docente' as const;
      }
    };
    try {
      const created = await api.createUser({
        email: userData.email || '',
        password: 'Admin123!',
        nombre: userData.nombre || '',
        apellido: userData.apellido || '',
        rol: toBackendRole(userData.rol),
        activo: true,
        telefono: userData.telefono,
      });

      setUsers([...users, created]);
      setIsFormOpen(false);

      log({
        action: 'user.create',
        description: `Nuevo usuario creado: ${created.nombre} ${created.apellido}`,
        targetType: 'user',
        targetId: created.id,
        targetName: `${created.nombre} ${created.apellido}`,
        metadata: {
          email: created.email,
          rol: created.rol,
          departamento: created.departamento,
          cedula: created.cedula
        },
        success: true
      });

      toast.success('Usuario creado exitosamente');
    } catch (error) {
      log({
        action: 'user.create',
        description: `Error al crear usuario: ${userData.email}`,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error desconocido',
        severity: 'error',
        metadata: { email: userData.email }
      });
      toast.error(error instanceof Error ? error.message : 'Error al crear usuario');
    }
  };

  const handleEditUser = async (userData: Partial<User>) => {
    if (!editingUser) return;
    const toBackendRole = (r: UserRole | undefined) => {
      switch ((r || 'docente')) {
        case 'administrador':
          return 'Administrador' as const;
        case 'coordinador':
          return 'Coordinador' as const;
        default:
          return 'Docente' as const;
      }
    };
    try {
      const payload: any = {};
      if (userData.email !== undefined) payload.email = userData.email;
      if (userData.nombre !== undefined) payload.nombre = userData.nombre;
      if (userData.apellido !== undefined) payload.apellido = userData.apellido;
      if (userData.rol !== undefined) payload.rol = toBackendRole(userData.rol);
      if (userData.telefono !== undefined) payload.telefono = userData.telefono;

      const updated = await api.updateUser(Number(editingUser.id), payload);
      const updatedUsers = users.map(u => (u.id === editingUser.id ? updated : u));
      setUsers(updatedUsers);

      // Detectar cambios para auditoría
      const changes: { field: string; oldValue: any; newValue: any }[] = [];
      (['email','nombre','apellido','rol','telefono'] as const).forEach((k) => {
        const oldValue = (editingUser as any)[k];
        const newValue = (updated as any)[k];
        if (oldValue !== newValue) changes.push({ field: k, oldValue, newValue });
      });

      log({
        action: 'user.update',
        description: `Usuario actualizado: ${updated.nombre} ${updated.apellido}`,
        targetType: 'user',
        targetId: updated.id,
        targetName: `${updated.nombre} ${updated.apellido}`,
        changes,
        metadata: { email: updated.email, rol: updated.rol },
        success: true,
      });

      setEditingUser(null);
      setIsFormOpen(false);
      toast.success('Usuario actualizado exitosamente');
    } catch (error) {
      log({
        action: 'user.update',
        description: `Error al actualizar usuario: ${editingUser.email}`,
        targetType: 'user',
        targetId: editingUser.id,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error desconocido',
        severity: 'error',
      });
      toast.error(error instanceof Error ? error.message : 'Error al actualizar usuario');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;
    try {
      await api.deleteUser(Number(userId));
      setUsers(users.filter(u => u.id !== userId));
      log({
        action: 'user.delete',
        description: `Usuario eliminado: ${userToDelete.nombre} ${userToDelete.apellido}`,
        targetType: 'user',
        targetId: userToDelete.id,
        targetName: `${userToDelete.nombre} ${userToDelete.apellido}`,
        metadata: { email: userToDelete.email, rol: userToDelete.rol, departamento: userToDelete.departamento, cedula: userToDelete.cedula },
        success: true,
        severity: 'warning',
      });
      toast.success('Usuario eliminado exitosamente');
    } catch (error) {
      log({
        action: 'user.delete',
        description: `Error al eliminar usuario: ${userToDelete.email}`,
        targetType: 'user',
        targetId: userToDelete.id,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error desconocido',
        severity: 'error',
      });
      toast.error(error instanceof Error ? error.message : 'Error al eliminar usuario');
    }
  };

  const handleToggleStatus = async (userId: string) => {
    const userToToggle = users.find(u => u.id === userId);
    if (!userToToggle) return;
    const oldStatus = userToToggle.estado;
    try {
      const toggled = await api.toggleUser(Number(userId));
      const updatedUsers = users.map(u => (u.id === userId ? toggled : u));
      setUsers(updatedUsers);

      log({
        action: 'user.status_change',
        description: `Usuario ${toggled.estado === 'activo' ? 'activado' : 'desactivado'}: ${userToToggle.nombre} ${userToToggle.apellido}`,
        targetType: 'user',
        targetId: userId,
        targetName: `${userToToggle.nombre} ${userToToggle.apellido}`,
        changes: [{ field: 'estado', oldValue: oldStatus, newValue: toggled.estado }],
        metadata: { email: userToToggle.email, rol: userToToggle.rol },
        success: true,
      });

      toast.success(`Usuario ${toggled.estado === 'activo' ? 'activado' : 'desactivado'} exitosamente`);
    } catch (error) {
      log({
        action: 'user.status_change',
        description: `Error al cambiar estado de usuario: ${userToToggle.email}`,
        targetType: 'user',
        targetId: userId,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error desconocido',
        severity: 'error',
      });
      toast.error(error instanceof Error ? error.message : 'Error al cambiar estado del usuario');
    }
  };

  const getRoleBadgeVariant = (rol: UserRole) => {
    switch (rol) {
      case 'administrador': return 'destructive';
      case 'coordinador': return 'default';
      case 'docente': return 'secondary';
    }
  };

  const getStatusBadgeVariant = (estado: string) => {
    return estado === 'activo' ? 'default' : 'secondary';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Gestión de Usuarios</h1>
          <p className="text-muted-foreground">
            Administra los usuarios del sistema académico
          </p>
          {loading && (
            <p className="text-sm text-muted-foreground">Cargando usuarios…</p>
          )}
          {error && (
            <p className="text-sm text-yellow-600">{error}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingUser(null)}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? 'Editar Usuario' : 'Crear Usuario'}
                </DialogTitle>
              </DialogHeader>
              <UserForm
                user={editingUser}
                departments={departamentos}
                onSubmit={editingUser ? handleEditUser : handleCreateUser}
                onCancel={() => setIsFormOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Administradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.administradores}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Coordinadores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.coordinadores}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Docentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.docentes}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email o cédula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterRole} onValueChange={(v) => setFilterRole(v as UserRole | 'todos')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los roles</SelectItem>
                <SelectItem value="administrador">Administrador</SelectItem>
                <SelectItem value="coordinador">Coordinador</SelectItem>
                <SelectItem value="docente">Docente</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as 'activo' | 'inactivo' | 'todos')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterDepartment} onValueChange={(v) => setFilterDepartment(v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los departamentos</SelectItem>
                {departamentos.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de usuarios */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Ingreso</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.nombre.charAt(0)}{user.apellido.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {user.nombre} {user.apellido}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.cedula}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">{user.email}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.telefono}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.rol)}>
                      {user.rol}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">{user.departamento}</div>
                      {user.especialidad && (
                        <div className="text-sm text-muted-foreground">
                          {user.especialidad}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(user.estado)}>
                      {user.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.fechaIngreso).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => setSelectedUser(user)}
                        >
                          Ver Detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setEditingUser(user);
                            setIsFormOpen(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleToggleStatus(user.id)}
                        >
                          {user.estado === 'activo' ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" />
                              Desactivar
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente
                                el usuario "{user.nombre} {user.apellido}" del sistema.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filteredUsers.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No se encontraron usuarios que coincidan con los filtros aplicados.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal de detalles del usuario */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles del Usuario</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar} />
                  <AvatarFallback className="text-lg">
                    {selectedUser.nombre.charAt(0)}{selectedUser.apellido.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3>{selectedUser.nombre} {selectedUser.apellido}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={getRoleBadgeVariant(selectedUser.rol)}>
                      {selectedUser.rol}
                    </Badge>
                    <Badge variant={getStatusBadgeVariant(selectedUser.estado)}>
                      {selectedUser.estado}
                    </Badge>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="profesional">Profesional</TabsTrigger>
                  <TabsTrigger value="configuracion">Configuración</TabsTrigger>
                </TabsList>
                
                <TabsContent value="personal" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Cédula</label>
                      <p>{selectedUser.cedula}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Teléfono</label>
                      <p>{selectedUser.telefono || 'No especificado'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Biografía</label>
                    <p>{selectedUser.biografia || 'No especificada'}</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="profesional" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Departamento</label>
                      <p>{selectedUser.departamento || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Especialidad</label>
                      <p>{selectedUser.especialidad || 'No especificada'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Fecha de Ingreso</label>
                      <p>{new Date(selectedUser.fechaIngreso).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Estado</label>
                      <p>{selectedUser.estado}</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="configuracion" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Notificaciones por Email</label>
                      <p>{selectedUser.configuraciones.notificacionesEmail ? 'Activadas' : 'Desactivadas'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Notificaciones Push</label>
                      <p>{selectedUser.configuraciones.notificacionesPush ? 'Activadas' : 'Desactivadas'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Tema</label>
                      <p>{selectedUser.configuraciones.tema}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Idioma</label>
                      <p>{selectedUser.configuraciones.idioma}</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}