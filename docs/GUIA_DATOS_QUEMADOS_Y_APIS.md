# 🔥 Guía Completa: Datos Quemados y Migración a APIs Reales

## 📋 Índice
1. [Resumen General](#resumen-general)
2. [Archivos con Datos Quemados](#archivos-con-datos-quemados)
3. [Endpoints Necesarios por Módulo](#endpoints-necesarios-por-módulo)
4. [Guía de Migración Paso a Paso](#guía-de-migración-paso-a-paso)
5. [Configuración de API Client](#configuración-de-api-client)
6. [Ejemplos de Conversión](#ejemplos-de-conversión)

---

## 🎯 Resumen General

### Estado Actual
El frontend tiene **datos de prueba (hardcoded/quemados)** en varios archivos para mostrar la funcionalidad completa del sistema sin backend.

### Objetivo
Conectar el frontend con las APIs de FastAPI que estás creando.

### Archivos Principales con Datos Quemados

```
📁 FRONTEND
├── 🔥 hooks/
│   ├── useAuth.tsx (3 usuarios de prueba)
│   └── useNotifications.tsx (notificaciones simuladas)
│
├── 🔥 components/
│   ├── UserManagement.tsx (15+ usuarios mock)
│   ├── FichasMateriasManagement.tsx (fichas y materias mock)
│   ├── FileUploadManagement.tsx (archivos cargados simulados)
│   ├── dashboards/
│   │   ├── AdminDashboard.tsx (estadísticas quemadas)
│   │   ├── CoordinadorDashboard.tsx (métricas quemadas)
│   │   └── DocenteDashboard.tsx (datos quemados)
│   └── reports/
│       ├── StudentReport.tsx (estudiantes mock)
│       └── SubjectReport.tsx (reportes simulados)
│
└── 🔥 utils/
    ├── seedAuditLogs.ts (logs de auditoría simulados)
    └── uploadNotifications.ts (notificaciones de carga)
```

---

## 📂 Archivos con Datos Quemados

### 1️⃣ **`/hooks/useAuth.tsx`** 
**📍 Líneas 39-99**

#### Datos Quemados:
```typescript
const mockUsers: User[] = [
  {
    id: '1',
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'admin@instituto.edu',
    telefono: '+57 300 123 4567',
    cedula: '12345678',
    rol: 'administrador',
    // ... más campos
  },
  {
    id: '2',
    nombre: 'María',
    apellido: 'García',
    email: 'coordinador@instituto.edu',
    // ... más campos
  },
  {
    id: '3',
    nombre: 'Carlos',
    apellido: 'Rodríguez',
    email: 'docente@instituto.edu',
    // ... más campos
  }
];
```

#### Endpoints Necesarios:

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login` | Autenticación de usuario |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/auth/me` | Obtener usuario actual |
| PUT | `/api/users/{id}` | Actualizar perfil |

#### Estructura de Respuesta Esperada:

**POST `/api/auth/login`**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "admin@instituto.edu",
    "telefono": "+57 300 123 4567",
    "cedula": "12345678",
    "rol": "administrador",
    "departamento": "Administración",
    "especialidad": null,
    "fechaIngreso": "2020-01-15",
    "estado": "activo",
    "biografia": "Administrador del sistema...",
    "configuraciones": {
      "notificacionesEmail": true,
      "notificacionesPush": true,
      "tema": "sistema",
      "idioma": "es"
    }
  }
}
```

**Campos de Login:**
```json
{
  "email": "admin@instituto.edu",
  "password": "123456"
}
```

---

### 2️⃣ **`/components/UserManagement.tsx`**
**📍 Líneas 37-200 (aprox)**

#### Datos Quemados:
```typescript
const mockUsers: User[] = [
  // 15+ usuarios de prueba con roles diferentes
];
```

#### Endpoints Necesarios:

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/users` | Listar usuarios (con paginación y filtros) |
| GET | `/api/users/{id}` | Obtener usuario específico |
| POST | `/api/users` | Crear nuevo usuario |
| PUT | `/api/users/{id}` | Actualizar usuario |
| DELETE | `/api/users/{id}` | Eliminar usuario |
| PATCH | `/api/users/{id}/toggle-status` | Activar/desactivar usuario |

#### Query Parameters para GET `/api/users`:
```
?page=1
&limit=10
&search=juan
&rol=docente
&estado=activo
&departamento=Sistemas
```

#### Estructura de Respuesta:

**GET `/api/users`**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "nombre": "Juan",
      "apellido": "Pérez",
      "email": "admin@instituto.edu",
      "telefono": "+57 300 123 4567",
      "cedula": "12345678",
      "rol": "administrador",
      "departamento": "Administración",
      "especialidad": null,
      "fechaIngreso": "2020-01-15",
      "estado": "activo"
    }
  ],
  "pagination": {
    "total": 247,
    "page": 1,
    "limit": 10,
    "totalPages": 25
  }
}
```

**POST `/api/users`** (Body):
```json
{
  "nombre": "Pedro",
  "apellido": "Sánchez",
  "email": "pedro@instituto.edu",
  "telefono": "+57 300 111 2222",
  "cedula": "99887766",
  "rol": "docente",
  "departamento": "Matemáticas",
  "especialidad": "Álgebra",
  "password": "temporal123"
}
```

---

### 3️⃣ **`/components/FichasMateriasManagement.tsx`**
**📍 Líneas 69-200**

#### Datos Quemados:

```typescript
// FICHAS (Programas académicos)
const mockFichas: Ficha[] = [
  {
    id: '1',
    nombre: 'Técnico en Desarrollo de Software',
    codigo: 'TDS-001',
    descripcion: 'Programa técnico...',
    duracionSemestres: 4,
    creditosTotales: 120,
    estado: 'activa',
    fechaCreacion: '2023-01-15',
    tipoPrograma: 'tecnico',
    modalidad: 'presencial'
  }
  // ... más fichas
];

// MATERIAS (Cursos/Asignaturas)
const mockMaterias: Materia[] = [
  {
    id: '1',
    nombre: 'Fundamentos de Programación',
    codigo: 'FP-101',
    descripcion: 'Introducción a...',
    creditos: 4,
    horas: 64,
    semestre: 1,
    fichaId: '1',
    docenteId: '3',
    prerrequisitos: [],
    estado: 'activa',
    tipoMateria: 'teorico-practica'
  }
  // ... más materias
];
```

#### Endpoints Necesarios:

**FICHAS:**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/fichas` | Listar fichas |
| GET | `/api/fichas/{id}` | Detalle de ficha |
| POST | `/api/fichas` | Crear ficha |
| PUT | `/api/fichas/{id}` | Actualizar ficha |
| DELETE | `/api/fichas/{id}` | Eliminar ficha |
| GET | `/api/fichas/{id}/materias` | Materias de una ficha |
| GET | `/api/fichas/{id}/estudiantes` | Estudiantes de una ficha |

**MATERIAS:**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/materias` | Listar materias |
| GET | `/api/materias/{id}` | Detalle de materia |
| POST | `/api/materias` | Crear materia |
| PUT | `/api/materias/{id}` | Actualizar materia |
| DELETE | `/api/materias/{id}` | Eliminar materia |
| GET | `/api/materias/{id}/estudiantes` | Estudiantes inscritos |
| GET | `/api/materias/{id}/calificaciones` | Calificaciones de la materia |

#### Estructura de Respuesta:

**GET `/api/fichas`**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "nombre": "Técnico en Desarrollo de Software",
      "codigo": "TDS-001",
      "descripcion": "Programa técnico enfocado...",
      "duracionSemestres": 4,
      "creditosTotales": 120,
      "estado": "activa",
      "fechaCreacion": "2023-01-15",
      "tipoPrograma": "tecnico",
      "modalidad": "presencial",
      "cantidadMaterias": 24,
      "cantidadEstudiantes": 85
    }
  ],
  "total": 32
}
```

**GET `/api/materias?fichaId=1`**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "nombre": "Fundamentos de Programación",
      "codigo": "FP-101",
      "descripcion": "Introducción a los conceptos...",
      "creditos": 4,
      "horas": 64,
      "semestre": 1,
      "fichaId": "1",
      "docenteId": "3",
      "docenteNombre": "Carlos Rodríguez",
      "prerrequisitos": [],
      "estado": "activa",
      "tipoMateria": "teorico-practica",
      "cantidadEstudiantes": 25
    }
  ],
  "total": 24
}
```

---

### 4️⃣ **`/components/FileUploadManagement.tsx`**
**📍 Todo el componente**

#### Datos Quemados:
- Estados de archivos cargados (procesando, validado, rechazado)
- Historial de cargas simuladas
- Validaciones de estructura Excel

#### Endpoints Necesarios:

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/calificaciones/upload` | Subir archivo Excel |
| GET | `/api/calificaciones/uploads` | Historial de cargas |
| GET | `/api/calificaciones/uploads/{id}` | Detalle de una carga |
| POST | `/api/calificaciones/uploads/{id}/approve` | Aprobar carga (coordinador) |
| POST | `/api/calificaciones/uploads/{id}/reject` | Rechazar carga |
| DELETE | `/api/calificaciones/uploads/{id}` | Eliminar carga |
| GET | `/api/cursos/docente` | Cursos del docente actual |
| GET | `/api/periodos` | Períodos académicos |

#### Estructura de Respuesta:

**POST `/api/calificaciones/upload`** (FormData):
```
file: archivo.xlsx
curso_id: 1
periodo_id: 1
tipo_carga: "actualizacion"
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Calificaciones cargadas exitosamente",
  "data": {
    "id": "upload_123",
    "curso_id": 1,
    "periodo_id": 1,
    "docente_id": 3,
    "fecha_carga": "2024-11-23T10:30:00Z",
    "tipo_carga": "actualizacion",
    "estado": "validado",
    "total_procesados": 25,
    "metricas": {
      "total_estudiantes": 25,
      "aprobadas": 120,
      "desaprobadas": 18,
      "no_entregadas": 12,
      "pendientes": 0
    },
    "notificaciones": {
      "debe_notificar": true,
      "estudiantes_notificar": [
        {
          "codigo": "E001",
          "nombre": "García Juan"
        }
      ]
    },
    "warnings": [
      "Fila 5: Email no tiene formato válido"
    ],
    "errores": []
  }
}
```

**GET `/api/calificaciones/uploads?docente_id=3&limit=10`**
```json
{
  "success": true,
  "data": [
    {
      "id": "upload_123",
      "curso": {
        "id": 1,
        "nombre": "Fundamentos de Programación",
        "codigo": "FP-101"
      },
      "periodo": {
        "id": 1,
        "nombre": "2024-1"
      },
      "docente": {
        "id": 3,
        "nombre": "Carlos Rodríguez"
      },
      "fecha_carga": "2024-11-23T10:30:00Z",
      "tipo_carga": "actualizacion",
      "estado": "pendiente_aprobacion",
      "total_registros": 25,
      "archivo_nombre": "calificaciones_matematicas.xlsx"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 10
  }
}
```

---

### 5️⃣ **`/components/dashboards/AdminDashboard.tsx`**
**📍 Líneas 32-106**

#### Datos Quemados:
```typescript
const stats = [
  { title: "Usuarios Activos", value: "247", ... },
  { title: "Fichas Registradas", value: "32", ... },
  { title: "Tareas Cargadas", value: "1,284", ... },
  { title: "Reportes Generados", value: "156", ... }
];

const recentActivity = [ /* actividad simulada */ ];
const pendingTasks = [ /* tareas pendientes */ ];
```

#### Endpoints Necesarios:

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/dashboard/admin/stats` | Estadísticas generales |
| GET | `/api/dashboard/admin/recent-activity` | Actividad reciente |
| GET | `/api/dashboard/admin/pending-tasks` | Tareas pendientes |

#### Estructura de Respuesta:

**GET `/api/dashboard/admin/stats`**
```json
{
  "success": true,
  "data": {
    "usuariosActivos": 247,
    "fichasRegistradas": 32,
    "tareasCargadas": 1284,
    "reportesGenerados": 156,
    "tendencias": {
      "usuarios": "+12%",
      "fichas": "+5%",
      "tareas": "+23%",
      "reportes": "-3%"
    }
  }
}
```

**GET `/api/dashboard/admin/recent-activity?limit=10`**
```json
{
  "success": true,
  "data": [
    {
      "id": "activity_1",
      "action": "Nuevo usuario registrado",
      "user": "María González - Docente",
      "userId": "25",
      "timestamp": "2024-11-23T10:25:00Z",
      "status": "success"
    },
    {
      "id": "activity_2",
      "action": "Carga de calificaciones",
      "user": "Carlos Rodríguez - Matemáticas",
      "userId": "3",
      "timestamp": "2024-11-23T10:15:00Z",
      "status": "success"
    }
  ]
}
```

---

### 6️⃣ **`/components/dashboards/CoordinadorDashboard.tsx`**
**📍 Similar a AdminDashboard**

#### Endpoints Necesarios:

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/dashboard/coordinador/stats` | Estadísticas académicas |
| GET | `/api/dashboard/coordinador/pending-approvals` | Cargas pendientes de aprobar |
| GET | `/api/dashboard/coordinador/at-risk-students` | Estudiantes en riesgo |
| GET | `/api/dashboard/coordinador/performance-by-course` | Rendimiento por curso |

---

### 7️⃣ **`/components/dashboards/DocenteDashboard.tsx`**

#### Endpoints Necesarios:

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/dashboard/docente/stats` | Estadísticas del docente |
| GET | `/api/dashboard/docente/my-courses` | Cursos asignados |
| GET | `/api/dashboard/docente/pending-grades` | Calificaciones pendientes |
| GET | `/api/dashboard/docente/notifications` | Notificaciones |

---

### 8️⃣ **`/hooks/useNotifications.tsx`**
**📍 Líneas 140-150**

#### Datos Quemados:
```typescript
const [notifications, setNotifications] = useState<Notification[]>(() => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : mockNotifications;
});
```

#### Endpoints Necesarios:

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/notifications` | Listar notificaciones del usuario |
| GET | `/api/notifications/unread-count` | Cantidad de no leídas |
| PATCH | `/api/notifications/{id}/read` | Marcar como leída |
| PATCH | `/api/notifications/read-all` | Marcar todas como leídas |
| DELETE | `/api/notifications/{id}` | Eliminar notificación |

#### Estructura de Respuesta:

**GET `/api/notifications?limit=20`**
```json
{
  "success": true,
  "data": [
    {
      "id": "notif_1",
      "userId": "3",
      "tipo": "carga_aprobada",
      "titulo": "Carga Aprobada",
      "mensaje": "Su carga de calificaciones fue aprobada",
      "leida": false,
      "fecha": "2024-11-23T10:30:00Z",
      "prioridad": "media",
      "metadata": {
        "uploadId": "upload_123",
        "cursoNombre": "Matemáticas I"
      }
    }
  ],
  "unreadCount": 5,
  "total": 45
}
```

---

### 9️⃣ **`/components/reports/StudentReport.tsx`**

#### Datos Quemados:
```typescript
const mockStudents = [ /* 50+ estudiantes */ ];
```

#### Endpoints Necesarios:

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/reports/students` | Reporte de estudiantes |
| GET | `/api/reports/students/{id}` | Detalle completo de estudiante |
| GET | `/api/reports/students/export` | Exportar reporte |

---

### 🔟 **`/utils/seedAuditLogs.ts`**

#### Datos Quemados:
Logs de auditoría simulados para demostración

#### Endpoints Necesarios:

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/audit-logs` | Listar logs de auditoría |
| GET | `/api/audit-logs/export` | Exportar logs |
| POST | `/api/audit-logs` | Crear log (automático) |

**GET `/api/audit-logs?page=1&limit=50&action=&userId=&startDate=&endDate=`**
```json
{
  "success": true,
  "data": [
    {
      "id": "log_1",
      "timestamp": "2024-11-23T10:30:00Z",
      "action": "auth.login.success",
      "userId": "3",
      "userName": "Carlos Rodríguez",
      "userRole": "docente",
      "description": "Inicio de sesión exitoso",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "targetType": null,
      "targetId": null,
      "changes": null,
      "success": true,
      "severity": "info"
    }
  ],
  "pagination": {
    "total": 1284,
    "page": 1,
    "limit": 50,
    "totalPages": 26
  }
}
```

---

## 🛠️ Configuración de API Client

### Crear `/utils/api.ts`

```typescript
// utils/api.ts

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiClient {
  private baseURL: string;
  private token: string | null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error en la petición');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // GET
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const queryString = params 
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return this.request<T>(`${endpoint}${queryString}`, { method: 'GET' });
  }

  // POST
  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT
  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // PATCH
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // UPLOAD (para archivos)
  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error en la carga');
      }

      return await response.json();
    } catch (error) {
      console.error('Upload Error:', error);
      throw error;
    }
  }
}

export const api = new ApiClient();
```

### Crear archivo `.env` en la raíz del frontend

```env
VITE_API_URL=http://localhost:8000
```

---

## 📝 Guía de Migración Paso a Paso

### Ejemplo 1: Migrar `useAuth.tsx`

**ANTES (con datos quemados):**
```typescript
const login = async (email: string, password: string): Promise<boolean> => {
  // Simulación de autenticación
  const foundUser = mockUsers.find(u => u.email === email);
  if (foundUser && password === '123456') {
    setUser(foundUser);
    return true;
  }
  return false;
};
```

**DESPUÉS (con API real):**
```typescript
import { api } from '../utils/api';

const login = async (email: string, password: string): Promise<boolean> => {
  try {
    const response = await api.post<{
      success: boolean;
      token: string;
      user: User;
    }>('/api/auth/login', { email, password });

    if (response.success) {
      api.setToken(response.token);
      setUser(response.user);
      
      // Registrar login exitoso en auditoría
      createAuditLog({
        action: 'auth.login.success',
        userId: response.user.id,
        userName: `${response.user.nombre} ${response.user.apellido}`,
        userRole: response.user.rol,
        description: `Inicio de sesión exitoso para ${response.user.email}`,
        success: true
      });
      
      return true;
    }
    return false;
  } catch (error) {
    // Registrar intento fallido
    createAuditLog({
      action: 'auth.login.failed',
      userId: 'anonymous',
      userName: 'Usuario Anónimo',
      userRole: 'guest',
      description: `Intento fallido de inicio de sesión para ${email}`,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Error desconocido',
      severity: 'warning',
      metadata: { email }
    });
    
    return false;
  }
};

const logout = () => {
  if (user) {
    // Registrar logout
    createAuditLog({
      action: 'auth.logout',
      userId: user.id,
      userName: `${user.nombre} ${user.apellido}`,
      userRole: user.rol,
      description: `Cierre de sesión para ${user.email}`,
      success: true
    });

    // Llamar al endpoint de logout
    api.post('/api/auth/logout', {}).catch(console.error);
    api.clearToken();
  }
  
  setUser(null);
};
```

---

### Ejemplo 2: Migrar `UserManagement.tsx`

**ANTES:**
```typescript
const [users, setUsers] = useState<User[]>(mockUsers);
```

**DESPUÉS:**
```typescript
import { api } from '../utils/api';

const [users, setUsers] = useState<User[]>([]);
const [loading, setLoading] = useState(true);
const [pagination, setPagination] = useState({
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0
});

// Cargar usuarios al montar el componente
useEffect(() => {
  loadUsers();
}, [filters, pagination.page]);

const loadUsers = async () => {
  try {
    setLoading(true);
    const response = await api.get<{
      success: boolean;
      data: User[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>('/api/users', {
      page: pagination.page,
      limit: pagination.limit,
      search: filters.search,
      rol: filters.rol,
      estado: filters.estado,
      departamento: filters.departamento
    });

    if (response.success) {
      setUsers(response.data);
      setPagination(response.pagination);
    }
  } catch (error) {
    toast.error('Error al cargar usuarios');
    console.error(error);
  } finally {
    setLoading(false);
  }
};

// Crear usuario
const handleCreateUser = async (userData: Partial<User>) => {
  try {
    const response = await api.post<{
      success: boolean;
      data: User;
    }>('/api/users', userData);

    if (response.success) {
      toast.success('Usuario creado exitosamente');
      loadUsers(); // Recargar lista
      setShowCreateDialog(false);
      
      // Auditoría
      log({
        action: 'user.create',
        description: `Usuario ${userData.nombre} ${userData.apellido} creado`,
        targetType: 'user',
        targetId: response.data.id,
        targetName: `${response.data.nombre} ${response.data.apellido}`,
        success: true
      });
    }
  } catch (error) {
    toast.error('Error al crear usuario');
    console.error(error);
  }
};

// Actualizar usuario
const handleUpdateUser = async (id: string, updates: Partial<User>) => {
  try {
    const response = await api.put<{
      success: boolean;
      data: User;
    }>(`/api/users/${id}`, updates);

    if (response.success) {
      toast.success('Usuario actualizado');
      loadUsers();
      
      // Auditoría
      log({
        action: 'user.update',
        description: `Usuario ${response.data.nombre} actualizado`,
        targetType: 'user',
        targetId: id,
        success: true
      });
    }
  } catch (error) {
    toast.error('Error al actualizar usuario');
  }
};

// Eliminar usuario
const handleDeleteUser = async (id: string) => {
  try {
    await api.delete(`/api/users/${id}`);
    toast.success('Usuario eliminado');
    loadUsers();
    
    // Auditoría
    log({
      action: 'user.delete',
      description: `Usuario eliminado`,
      targetType: 'user',
      targetId: id,
      success: true
    });
  } catch (error) {
    toast.error('Error al eliminar usuario');
  }
};
```

---

### Ejemplo 3: Migrar `FileUploadManagement.tsx`

**ANTES:**
```typescript
const handleFileUpload = (file: File) => {
  // Simulación de carga
  setUploadedFiles(prev => [...prev, mockUploadedFile]);
};
```

**DESPUÉS:**
```typescript
import { api } from '../utils/api';

const handleFileUpload = async (
  file: File,
  cursoId: number,
  periodoId: number,
  tipoCarga: 'inicial' | 'actualizacion'
) => {
  try {
    setUploading(true);

    // Crear FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('curso_id', cursoId.toString());
    formData.append('periodo_id', periodoId.toString());
    formData.append('tipo_carga', tipoCarga);

    // Subir archivo
    const response = await api.upload<{
      success: boolean;
      data: {
        id: string;
        estado: string;
        total_procesados: number;
        metricas: any;
        notificaciones: any;
        warnings: string[];
        errores: string[];
      };
    }>('/api/calificaciones/upload', formData);

    if (response.success) {
      if (response.data.errores.length > 0) {
        // Mostrar errores
        toast.error('Archivo con errores');
        setValidationErrors(response.data.errores);
      } else {
        toast.success('Archivo cargado exitosamente');
        
        if (response.data.warnings.length > 0) {
          setValidationWarnings(response.data.warnings);
        }
        
        // Registrar en auditoría
        createUploadNotification(
          response.data.id,
          cursoId,
          file.name,
          response.data.total_procesados
        );
        
        // Recargar historial
        loadUploadHistory();
      }
    }
  } catch (error) {
    toast.error('Error al cargar archivo');
    console.error(error);
  } finally {
    setUploading(false);
  }
};

// Cargar historial de cargas
const loadUploadHistory = async () => {
  try {
    const response = await api.get<{
      success: boolean;
      data: UploadedFile[];
      pagination: any;
    }>('/api/calificaciones/uploads', {
      docente_id: user?.id,
      limit: 50
    });

    if (response.success) {
      setUploadedFiles(response.data);
    }
  } catch (error) {
    console.error('Error al cargar historial', error);
  }
};
```

---

### Ejemplo 4: Migrar Dashboard (AdminDashboard)

**ANTES:**
```typescript
const stats = [
  { title: "Usuarios Activos", value: "247", ... },
  // ... datos quemados
];
```

**DESPUÉS:**
```typescript
import { api } from '../../utils/api';

const [stats, setStats] = useState<any>(null);
const [recentActivity, setRecentActivity] = useState<any[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadDashboardData();
}, []);

const loadDashboardData = async () => {
  try {
    setLoading(true);

    // Cargar estadísticas
    const statsResponse = await api.get<{
      success: boolean;
      data: {
        usuariosActivos: number;
        fichasRegistradas: number;
        tareasCargadas: number;
        reportesGenerados: number;
        tendencias: any;
      };
    }>('/api/dashboard/admin/stats');

    if (statsResponse.success) {
      setStats(statsResponse.data);
    }

    // Cargar actividad reciente
    const activityResponse = await api.get<{
      success: boolean;
      data: any[];
    }>('/api/dashboard/admin/recent-activity', { limit: 10 });

    if (activityResponse.success) {
      setRecentActivity(activityResponse.data);
    }

    // Registrar acceso al dashboard
    log({
      action: 'dashboard.access',
      description: 'Acceso al Dashboard de Administrador',
      metadata: {
        dashboard: 'admin',
        vistas: ['estadísticas', 'actividad reciente', 'alertas']
      },
      success: true
    });

  } catch (error) {
    toast.error('Error al cargar datos del dashboard');
    console.error(error);
  } finally {
    setLoading(false);
  }
};

// Mostrar loading mientras carga
if (loading) {
  return <div>Cargando...</div>;
}

// Usar los datos cargados
return (
  <div>
    <div className="grid grid-cols-4 gap-6">
      <Card>
        <CardHeader>Usuarios Activos</CardHeader>
        <CardContent>{stats?.usuariosActivos || 0}</CardContent>
      </Card>
      {/* ... más cards */}
    </div>
  </div>
);
```

---

## ✅ Checklist de Migración

### Por Archivo:

#### `hooks/useAuth.tsx`
- [ ] Implementar `POST /api/auth/login`
- [ ] Implementar `POST /api/auth/logout`
- [ ] Implementar `GET /api/auth/me`
- [ ] Implementar `PUT /api/users/{id}`
- [ ] Actualizar manejo de tokens JWT
- [ ] Probar login/logout
- [ ] Probar actualización de perfil

#### `components/UserManagement.tsx`
- [ ] Implementar `GET /api/users`
- [ ] Implementar `POST /api/users`
- [ ] Implementar `PUT /api/users/{id}`
- [ ] Implementar `DELETE /api/users/{id}`
- [ ] Implementar paginación
- [ ] Implementar filtros
- [ ] Implementar búsqueda
- [ ] Probar CRUD completo

#### `components/FichasMateriasManagement.tsx`
- [ ] Implementar `GET /api/fichas`
- [ ] Implementar `POST /api/fichas`
- [ ] Implementar `PUT /api/fichas/{id}`
- [ ] Implementar `DELETE /api/fichas/{id}`
- [ ] Implementar `GET /api/materias`
- [ ] Implementar `POST /api/materias`
- [ ] Implementar `PUT /api/materias/{id}`
- [ ] Implementar `DELETE /api/materias/{id}`
- [ ] Probar relación ficha-materias

#### `components/FileUploadManagement.tsx`
- [ ] Implementar `POST /api/calificaciones/upload`
- [ ] Implementar `GET /api/calificaciones/uploads`
- [ ] Implementar `POST /api/calificaciones/uploads/{id}/approve`
- [ ] Implementar `POST /api/calificaciones/uploads/{id}/reject`
- [ ] Probar carga de Excel
- [ ] Probar validaciones
- [ ] Probar notificaciones

#### Dashboards
- [ ] AdminDashboard: Implementar endpoints de estadísticas
- [ ] CoordinadorDashboard: Implementar endpoints
- [ ] DocenteDashboard: Implementar endpoints
- [ ] Probar actualización en tiempo real

#### `hooks/useNotifications.tsx`
- [ ] Implementar `GET /api/notifications`
- [ ] Implementar `PATCH /api/notifications/{id}/read`
- [ ] Implementar `PATCH /api/notifications/read-all`
- [ ] Probar notificaciones en tiempo real
- [ ] Implementar WebSockets (opcional)

#### Reportes
- [ ] Implementar `GET /api/reports/students`
- [ ] Implementar `GET /api/reports/subjects`
- [ ] Implementar exportación PDF/Excel
- [ ] Probar filtros y búsquedas

---

## 🔍 Testing

### Probar cada endpoint con Postman/Insomnia

1. **Login**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@instituto.edu","password":"123456"}'
```

2. **Obtener usuarios (con token)**
```bash
curl -X GET http://localhost:8000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

3. **Subir archivo**
```bash
curl -X POST http://localhost:8000/api/calificaciones/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@calificaciones.xlsx" \
  -F "curso_id=1" \
  -F "periodo_id=1" \
  -F "tipo_carga=actualizacion"
```

---

## 📚 Recursos Adicionales

### Documentación de FastAPI
Una vez que tengas el backend corriendo:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Variables de Entorno (.env)
```env
# Frontend (.env en raíz del proyecto)
VITE_API_URL=http://localhost:8000

# Backend (si usas .env en Python)
DATABASE_URL=postgresql://user:password@localhost:5432/gestion_academica
JWT_SECRET=tu_secret_key_super_seguro
CORS_ORIGINS=http://localhost:5173
```

---

## 🎯 Orden Sugerido de Implementación

### Fase 1: Autenticación (CRÍTICO)
1. ✅ `/api/auth/login`
2. ✅ `/api/auth/logout`
3. ✅ `/api/auth/me`
4. Migrar `hooks/useAuth.tsx`

### Fase 2: Gestión de Usuarios
1. ✅ Endpoints CRUD de usuarios
2. Migrar `components/UserManagement.tsx`

### Fase 3: Fichas y Materias
1. ✅ Endpoints de fichas
2. ✅ Endpoints de materias
3. Migrar `components/FichasMateriasManagement.tsx`

### Fase 4: Carga de Calificaciones (CORE FUNCIONALIDAD)
1. ✅ `POST /api/calificaciones/upload`
2. ✅ Endpoints de aprobación
3. Migrar `components/FileUploadManagement.tsx`

### Fase 5: Dashboards
1. ✅ Endpoints de estadísticas
2. Migrar dashboards

### Fase 6: Notificaciones y Auditoría
1. ✅ Sistema de notificaciones
2. ✅ Logs de auditoría

### Fase 7: Reportes
1. ✅ Endpoints de reportes
2. ✅ Exportación

---

## 📞 ¿Necesitas Ayuda?

Si encuentras errores al migrar:
1. Revisa la consola del navegador (F12)
2. Revisa los logs del backend FastAPI
3. Usa Postman para probar los endpoints directamente
4. Verifica que los tipos de datos coincidan

**Última actualización:** Noviembre 23, 2024  
**Versión:** 1.0
