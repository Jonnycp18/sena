# 🚀 Próximos Pasos - Implementación del Backend

## ✅ Completado Hasta Ahora

### 1. Estructura Base
- ✅ Configuración de TypeScript
- ✅ Package.json con todas las dependencias
- ✅ Estructura de carpetas organizada (MVC + Services)
- ✅ Variables de entorno (.env)

### 2. Configuración
- ✅ Database config (PostgreSQL con pool de conexiones)
- ✅ Environment config (variables centralizadas)
- ✅ Logger utility (logs a consola y archivo)

### 3. Base de Datos
- ✅ 6 migraciones SQL completas:
  - 001: Tabla users
  - 002: Tabla fichas
  - 003: Tabla materias
  - 004: Tabla calificaciones
  - 005: Tabla notifications
  - 006: Tabla audit_logs
- ✅ Script de migración con control de versiones
- ✅ 3 seeds con datos de prueba
- ✅ Script de seeding

### 4. Servidor
- ✅ Express app configurado
- ✅ Servidor con inicio graceful
- ✅ Middlewares básicos (CORS, Helmet, Morgan)
- ✅ Health check endpoint

### 5. Documentación
- ✅ Guía completa de setup
- ✅ Comandos útiles
- ✅ Script de setup automático
- ✅ README del backend

---

## 📋 Siguiente Fase: Implementar APIs REST

### Fase 1: Autenticación (PRIORIDAD ALTA)

#### 1.1 Utilities
```typescript
// backend/src/utils/bcrypt.utils.ts
- hashPassword(password: string)
- comparePassword(password: string, hash: string)

// backend/src/utils/jwt.utils.ts
- generateAccessToken(userId, email, rol)
- generateRefreshToken(userId)
- verifyToken(token)
- decodeToken(token)
```

#### 1.2 Middleware
```typescript
// backend/src/middleware/auth.middleware.ts
- authenticateToken() - Verifica JWT en headers
- optionalAuth() - Auth opcional

// backend/src/middleware/rbac.middleware.ts
- requireRole(['Administrador'])
- requireRole(['Administrador', 'Coordinador'])
```

#### 1.3 Models
```typescript
// backend/src/models/user.model.ts
- findByEmail(email)
- findById(id)
- create(userData)
- update(id, userData)
- delete(id)
- updateLastLogin(id)
- updatePassword(id, newPasswordHash)
```

#### 1.4 Services
```typescript
// backend/src/services/auth.service.ts
- login(email, password)
- refreshToken(refreshToken)
- logout(userId)
- changePassword(userId, oldPassword, newPassword)
- validatePassword(password) - Validar fuerza
```

#### 1.5 Controllers
```typescript
// backend/src/controllers/auth.controller.ts
- POST /login
- POST /refresh
- POST /logout
- POST /change-password
- GET /me (obtener usuario actual)
```

#### 1.6 Routes
```typescript
// backend/src/routes/auth.routes.ts
- Configurar todas las rutas de autenticación
- Agregar validaciones con express-validator
```

---

### Fase 2: Gestión de Usuarios

#### 2.1 Services
```typescript
// backend/src/services/user.service.ts
- getAllUsers(filters, pagination)
- getUserById(id)
- createUser(userData)
- updateUser(id, userData)
- deleteUser(id)
- toggleUserStatus(id)
```

#### 2.2 Controllers
```typescript
// backend/src/controllers/users.controller.ts
- GET /users (con filtros y paginación)
- POST /users
- GET /users/:id
- PUT /users/:id
- DELETE /users/:id
- PATCH /users/:id/toggle-status
```

#### 2.3 Validaciones
```typescript
// backend/src/middleware/validation.middleware.ts
- validateCreateUser
- validateUpdateUser
- validateId
```

---

### Fase 3: Fichas Académicas

```typescript
// backend/src/models/ficha.model.ts
// backend/src/services/ficha.service.ts
// backend/src/controllers/fichas.controller.ts
// backend/src/routes/fichas.routes.ts

Endpoints:
- GET /fichas
- POST /fichas
- GET /fichas/:id
- PUT /fichas/:id
- DELETE /fichas/:id
- GET /fichas/:id/materias (materias de una ficha)
- GET /fichas/:id/calificaciones (calificaciones de una ficha)
```

---

### Fase 4: Materias

```typescript
// backend/src/models/materia.model.ts
// backend/src/services/materia.service.ts
// backend/src/controllers/materias.controller.ts
// backend/src/routes/materias.routes.ts

Endpoints:
- GET /materias
- POST /materias
- GET /materias/:id
- PUT /materias/:id
- DELETE /materias/:id
- GET /materias/docente/:docenteId (materias de un docente)
```

---

### Fase 5: Calificaciones

```typescript
// backend/src/models/calificacion.model.ts
// backend/src/services/calificacion.service.ts
// backend/src/controllers/calificaciones.controller.ts
// backend/src/routes/calificaciones.routes.ts

Endpoints:
- GET /calificaciones
- POST /calificaciones
- PUT /calificaciones/:id
- POST /calificaciones/upload (Excel)
- GET /calificaciones/estudiante/:documento
- GET /calificaciones/materia/:materiaId
- GET /calificaciones/ficha/:fichaId

// backend/src/utils/excelParser.ts
- parseExcelFile(file)
- validateExcelStructure(data)
```

---

### Fase 6: Notificaciones

```typescript
// backend/src/models/notification.model.ts
// backend/src/services/notification.service.ts
// backend/src/controllers/notifications.controller.ts
// backend/src/routes/notifications.routes.ts

Endpoints:
- GET /notifications (del usuario actual)
- PUT /notifications/:id/read
- PUT /notifications/read-all
- DELETE /notifications/:id

// Sistema automático de notificaciones
- Crear notificación al crear usuario
- Crear notificación al cargar calificaciones
- Crear notificación al cambiar estado de ficha
```

---

### Fase 7: Auditoría

```typescript
// backend/src/models/auditLog.model.ts
// backend/src/services/audit.service.ts
// backend/src/controllers/audit.controller.ts
// backend/src/routes/audit.routes.ts

Endpoints:
- GET /audit (solo Admin)
- GET /audit/user/:userId
- GET /audit/module/:module
- GET /audit/stats

// backend/src/middleware/auditLogger.middleware.ts
- Middleware para logging automático de todas las requests
```

---

### Fase 8: Reportes y Analytics

```typescript
// backend/src/services/report.service.ts
// backend/src/controllers/reports.controller.ts
// backend/src/routes/reports.routes.ts

Endpoints:
- GET /reports/student/:documento
- GET /reports/subject/:materiaId
- GET /reports/comparative
- GET /reports/analytics
- GET /reports/export/pdf/:tipo/:id
- GET /reports/export/excel/:tipo/:id
```

---

## 🔄 Integración Frontend-Backend

### Actualizar Hooks del Frontend

#### 1. useAuth.tsx
```typescript
// Cambiar de localStorage a API calls
- login() -> POST /api/v1/auth/login
- logout() -> POST /api/v1/auth/logout
- refreshToken() automático con interceptor
- Guardar token en localStorage o HttpOnly cookie
```

#### 2. Crear API Client
```typescript
// frontend/src/utils/apiClient.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  timeout: 10000,
});

// Interceptor para agregar token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para refresh token automático
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Intentar refresh
      // Si falla, logout
    }
    return Promise.reject(error);
  }
);
```

#### 3. Servicios del Frontend
```typescript
// frontend/src/services/
- auth.service.ts
- users.service.ts
- fichas.service.ts
- materias.service.ts
- calificaciones.service.ts
- notifications.service.ts
- audit.service.ts
- reports.service.ts
```

---

## 📦 Orden de Implementación Recomendado

### Sprint 1: Fundamentos (1-2 semanas)
1. ✅ Setup inicial y migraciones
2. ⏳ Sistema de autenticación completo
3. ⏳ Gestión de usuarios
4. ⏳ Middleware de auditoría
5. ⏳ Integrar autenticación en frontend

### Sprint 2: Core Features (2 semanas)
6. ⏳ CRUD de fichas
7. ⏳ CRUD de materias
8. ⏳ Sistema de notificaciones
9. ⏳ Integrar fichas y materias en frontend

### Sprint 3: Calificaciones (2 semanas)
10. ⏳ CRUD de calificaciones
11. ⏳ Upload de Excel
12. ⏳ Validaciones de negocio
13. ⏳ Integrar calificaciones en frontend

### Sprint 4: Reportes y Polish (1-2 semanas)
14. ⏳ Sistema de reportes
15. ⏳ Analytics dashboard
16. ⏳ Exportar PDF/Excel
17. ⏳ Testing completo
18. ⏳ Optimización y performance

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
// Ejemplo: backend/src/services/__tests__/auth.service.test.ts
describe('AuthService', () => {
  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      // Test
    });
    
    it('should throw error for invalid credentials', async () => {
      // Test
    });
  });
});
```

### Integration Tests
```typescript
// Ejemplo: backend/src/routes/__tests__/auth.routes.test.ts
describe('POST /auth/login', () => {
  it('should return 200 and tokens', async () => {
    // Test con supertest
  });
});
```

---

## 🚀 Comandos para Empezar

```bash
# 1. Ejecutar setup automático
chmod +x SETUP_BACKEND.sh
./SETUP_BACKEND.sh

# 2. Iniciar backend en desarrollo
cd backend
npm run dev

# 3. En otra terminal, iniciar frontend
npm run dev

# 4. Probar endpoint de salud
curl http://localhost:3000/health

# 5. Comenzar a implementar autenticación
# Crear archivos en orden:
# - backend/src/utils/bcrypt.utils.ts
# - backend/src/utils/jwt.utils.ts
# - backend/src/models/user.model.ts
# - backend/src/services/auth.service.ts
# - backend/src/middleware/auth.middleware.ts
# - backend/src/controllers/auth.controller.ts
# - backend/src/routes/auth.routes.ts
# - backend/src/routes/index.ts
```

---

## 📚 Recursos Útiles

- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT.io](https://jwt.io/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## ✅ Checklist de Validación

Antes de pasar a producción:

- [ ] Todas las migraciones ejecutadas
- [ ] Seeds de datos iniciales
- [ ] Autenticación funcionando
- [ ] RBAC implementado
- [ ] Todas las APIs CRUD completas
- [ ] Validaciones de inputs
- [ ] Manejo de errores
- [ ] Auditoría completa
- [ ] Tests unitarios (>80% cobertura)
- [ ] Tests de integración
- [ ] Documentación API (Swagger/Postman)
- [ ] Frontend integrado con backend
- [ ] Performance optimizada
- [ ] Seguridad revisada
- [ ] Logs configurados
- [ ] Backup automático de DB
- [ ] Despliegue configurado

---

¿Listo para empezar? 🚀

**Siguiente paso:** Implementar el sistema de autenticación (Fase 1)
