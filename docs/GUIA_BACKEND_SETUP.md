# 🚀 Guía de Setup del Backend - PostgreSQL + Node.js + Express + TypeScript

## 📋 Índice
1. [Requisitos Previos](#requisitos-previos)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Instalación](#instalación)
4. [Configuración de Base de Datos](#configuración-de-base-de-datos)
5. [Variables de Entorno](#variables-de-entorno)
6. [Scripts Disponibles](#scripts-disponibles)
7. [Arquitectura del Backend](#arquitectura-del-backend)
8. [Migración desde localStorage](#migración-desde-localstorage)

---

## ✅ Requisitos Previos

- **Node.js**: v18 o superior
- **PostgreSQL**: v14 o superior
- **npm** o **pnpm**: Gestor de paquetes
- **Git**: Para control de versiones

---

## 📁 Estructura del Proyecto (Monorepo)

```
proyecto/
├── frontend/                    # Código React (mover aquí)
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                     # Código Node.js + Express (NUEVO)
│   ├── src/
│   │   ├── config/             # Configuraciones
│   │   │   ├── database.ts
│   │   │   ├── jwt.ts
│   │   │   └── environment.ts
│   │   ├── controllers/        # Controladores de rutas
│   │   │   ├── auth.controller.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── fichas.controller.ts
│   │   │   ├── materias.controller.ts
│   │   │   ├── calificaciones.controller.ts
│   │   │   ├── reports.controller.ts
│   │   │   ├── notifications.controller.ts
│   │   │   └── audit.controller.ts
│   │   ├── middleware/         # Middlewares
│   │   │   ├── auth.middleware.ts
│   │   │   ├── rbac.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   ├── errorHandler.middleware.ts
│   │   │   └── auditLogger.middleware.ts
│   │   ├── models/             # Modelos de datos
│   │   │   ├── user.model.ts
│   │   │   ├── ficha.model.ts
│   │   │   ├── materia.model.ts
│   │   │   ├── calificacion.model.ts
│   │   │   ├── notification.model.ts
│   │   │   └── auditLog.model.ts
│   │   ├── routes/             # Definición de rutas
│   │   │   ├── auth.routes.ts
│   │   │   ├── users.routes.ts
│   │   │   ├── fichas.routes.ts
│   │   │   ├── materias.routes.ts
│   │   │   ├── calificaciones.routes.ts
│   │   │   ├── reports.routes.ts
│   │   │   ├── notifications.routes.ts
│   │   │   ├── audit.routes.ts
│   │   │   └── index.ts
│   │   ├── services/           # Lógica de negocio
│   │   │   ├── auth.service.ts
│   │   │   ├── user.service.ts
│   │   │   ├── ficha.service.ts
│   │   │   ├── materia.service.ts
│   │   │   ├── calificacion.service.ts
│   │   │   ├── report.service.ts
│   │   │   ├── notification.service.ts
│   │   │   └── audit.service.ts
│   │   ├── database/           # Migraciones y seeds
│   │   │   ├── migrations/
│   │   │   │   ├── 001_create_users.sql
│   │   │   │   ├── 002_create_fichas.sql
│   │   │   │   ├── 003_create_materias.sql
│   │   │   │   ├── 004_create_calificaciones.sql
│   │   │   │   ├── 005_create_notifications.sql
│   │   │   │   └── 006_create_audit_logs.sql
│   │   │   ├── seeds/
│   │   │   │   ├── 001_seed_users.sql
│   │   │   │   ├── 002_seed_fichas.sql
│   │   │   │   └── 003_seed_materias.sql
│   │   │   └── migrate.ts
│   │   ├── types/              # Tipos compartidos
│   │   │   ├── auth.types.ts
│   │   │   ├── user.types.ts
│   │   │   ├── ficha.types.ts
│   │   │   └── common.types.ts
│   │   ├── utils/              # Utilidades
│   │   │   ├── bcrypt.utils.ts
│   │   │   ├── jwt.utils.ts
│   │   │   ├── validation.utils.ts
│   │   │   └── logger.ts
│   │   ├── app.ts              # Configuración de Express
│   │   └── server.ts           # Punto de entrada
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── shared/                      # Tipos compartidos entre frontend y backend
│   ├── types/
│   │   ├── user.types.ts
│   │   ├── ficha.types.ts
│   │   ├── materia.types.ts
│   │   ├── notification.types.ts
│   │   └── audit.types.ts
│   └── constants/
│       └── roles.ts
│
├── package.json                 # Root package.json para scripts comunes
├── .gitignore
└── README.md
```

---

## 📦 Instalación

### Paso 1: Reestructurar el Proyecto Actual

```bash
# 1. Crear carpetas principales
mkdir -p frontend backend shared

# 2. Mover archivos del frontend a la carpeta frontend/
# (Esto lo haremos con scripts)

# 3. Crear estructura del backend
mkdir -p backend/src/{config,controllers,middleware,models,routes,services,database/{migrations,seeds},types,utils}
mkdir -p shared/{types,constants}
```

### Paso 2: Instalar Dependencias del Backend

```bash
cd backend

# Dependencias principales
npm init -y
npm install express cors helmet morgan dotenv pg bcrypt jsonwebtoken express-validator
npm install multer xlsx

# Dependencias de desarrollo
npm install -D typescript @types/node @types/express @types/cors @types/bcrypt @types/jsonwebtoken @types/pg ts-node-dev nodemon @types/multer
```

### Paso 3: Instalar PostgreSQL

**En Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**En macOS (con Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**En Windows:**
- Descargar desde: https://www.postgresql.org/download/windows/

---

## 🗄️ Configuración de Base de Datos

### Paso 1: Crear Base de Datos

```bash
# Conectar a PostgreSQL
sudo -u postgres psql

# Crear base de datos y usuario
CREATE DATABASE gestion_academica;
CREATE USER admin_academico WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE gestion_academica TO admin_academico;

# Salir
\q
```

### Paso 2: Configurar Variables de Entorno

Crear archivo `.env` en la carpeta `backend/`:

```env
# Server
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gestion_academica
DB_USER=admin_academico
DB_PASSWORD=tu_password_seguro
DB_POOL_MIN=2
DB_POOL_MAX=10

# JWT
JWT_SECRET=tu_jwt_secret_super_seguro_cambiar_en_produccion
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=tu_refresh_token_secret_super_seguro
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Logs
LOG_LEVEL=debug
```

---

## 🔧 Scripts Disponibles

Agregar al `package.json` del backend:

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "migrate": "ts-node src/database/migrate.ts",
    "seed": "ts-node src/database/seed.ts",
    "db:reset": "npm run migrate && npm run seed",
    "lint": "eslint . --ext .ts",
    "test": "jest"
  }
}
```

---

## 🏗️ Arquitectura del Backend

### Capas de la Aplicación

1. **Routes**: Define endpoints y vincula con controladores
2. **Controllers**: Maneja requests/responses HTTP
3. **Services**: Contiene lógica de negocio
4. **Models**: Interactúa con la base de datos
5. **Middleware**: Autenticación, validación, logging

### Flujo de una Request

```
Client Request
    ↓
Middleware (Auth, Validation)
    ↓
Router
    ↓
Controller
    ↓
Service (Business Logic)
    ↓
Model (Database)
    ↓
Response to Client
```

---

## 🔄 Migración desde localStorage

### Plan de Migración

1. **Crear esquema de base de datos** (migraciones SQL)
2. **Implementar APIs REST** para cada módulo
3. **Actualizar hooks del frontend** para usar APIs en lugar de localStorage
4. **Migrar datos existentes** (script de migración)
5. **Testing exhaustivo** de cada endpoint
6. **Despliegue gradual** por módulos

### Orden de Implementación

1. ✅ Configuración inicial y base de datos
2. ✅ Sistema de autenticación (JWT)
3. ✅ Gestión de usuarios
4. ✅ Fichas y materias
5. ✅ Calificaciones
6. ✅ Notificaciones
7. ✅ Auditoría
8. ✅ Reportes y analytics

---

## 🔐 Seguridad

- **Bcrypt** para hashear passwords (salt rounds: 12)
- **JWT** con tokens de acceso y refresh
- **CORS** configurado correctamente
- **Helmet** para headers de seguridad
- **Validación** de inputs con express-validator
- **Rate limiting** en endpoints críticos
- **SQL Injection** prevenido con queries parametrizadas
- **RBAC** (Role-Based Access Control) implementado

---

## 📊 Endpoints Principales

### Autenticación
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/change-password` - Cambiar password

### Usuarios
- `GET /api/v1/users` - Listar usuarios
- `POST /api/v1/users` - Crear usuario
- `GET /api/v1/users/:id` - Obtener usuario
- `PUT /api/v1/users/:id` - Actualizar usuario
- `DELETE /api/v1/users/:id` - Eliminar usuario

### Fichas
- `GET /api/v1/fichas` - Listar fichas
- `POST /api/v1/fichas` - Crear ficha
- `GET /api/v1/fichas/:id` - Obtener ficha
- `PUT /api/v1/fichas/:id` - Actualizar ficha
- `DELETE /api/v1/fichas/:id` - Eliminar ficha

### Materias
- Similar a fichas...

### Calificaciones
- `POST /api/v1/calificaciones/upload` - Cargar Excel
- `GET /api/v1/calificaciones/ficha/:fichaId` - Por ficha
- `PUT /api/v1/calificaciones/:id` - Actualizar

### Notificaciones
- `GET /api/v1/notifications` - Listar notificaciones
- `PUT /api/v1/notifications/:id/read` - Marcar como leída
- `DELETE /api/v1/notifications/:id` - Eliminar

### Auditoría
- `GET /api/v1/audit` - Logs de auditoría (solo Admin)
- `GET /api/v1/audit/user/:userId` - Por usuario

### Reportes
- `GET /api/v1/reports/student/:id` - Reporte de estudiante
- `GET /api/v1/reports/subject/:id` - Reporte de materia
- `GET /api/v1/reports/comparative` - Reporte comparativo
- `GET /api/v1/reports/analytics` - Analytics dashboard

---

## 🚀 Próximos Pasos

1. ✅ Ejecutar script de reestructuración
2. ✅ Instalar dependencias
3. ✅ Configurar base de datos
4. ✅ Ejecutar migraciones
5. ✅ Ejecutar seeds
6. ✅ Probar endpoints con Postman/Thunder Client
7. ✅ Actualizar frontend para usar APIs
8. ✅ Testing completo
9. ✅ Despliegue

---

## 📞 Soporte

Para cualquier duda, consulta la documentación adicional o revisa los archivos de configuración.
