# 🚀 GUÍA RÁPIDA: Iniciar el Proyecto

## ✅ Pre-requisitos

Asegúrate de tener instalado:
- ✅ **Node.js** >= 18.0.0 (verifica: `node --version`)
- ✅ **npm** >= 9.0.0 (verifica: `npm --version`)
- ✅ **PostgreSQL** >= 14.0 (verifica: `psql --version`)

---

## 📋 PASO 1: Configurar PostgreSQL

### 1.1. Iniciar PostgreSQL
```bash
# Windows (si usas PostgreSQL instalado localmente)
# Abrir "Services" y asegurarte que PostgreSQL esté corriendo

# Linux/Mac
sudo service postgresql start
# O
brew services start postgresql
```

### 1.2. Crear la base de datos y usuario
```bash
# Conectarse a PostgreSQL como superusuario
psql -U postgres

# Dentro de psql, ejecutar:
CREATE DATABASE gestion_academica;
CREATE USER admin_academico WITH ENCRYPTED PASSWORD 'admin123';
GRANT ALL PRIVILEGES ON DATABASE gestion_academica TO admin_academico;
\q
```

### 1.3. Verificar conexión
```bash
psql -U admin_academico -d gestion_academica -h localhost
# Contraseña: admin123
```

---

## 📋 PASO 2: Configurar Backend

### 2.1. Navegar al directorio backend
```bash
cd backend
```

### 2.2. Instalar dependencias
```bash
npm install
```

### 2.3. Crear archivo .env
```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Verificar que tiene la configuración correcta
cat .env
```

**IMPORTANTE:** El archivo `.env` debe tener:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gestion_academica
DB_USER=admin_academico
DB_PASSWORD=admin123
```

### 2.4. Ejecutar migraciones (crear tablas)
```bash
npm run migrate
```

Deberías ver:
```
✅ Migración 001_create_users.sql ejecutada
✅ Migración 002_create_fichas.sql ejecutada
✅ Migración 003_create_materias.sql ejecutada
✅ Migración 004_create_calificaciones.sql ejecutada
✅ Migración 005_create_notifications.sql ejecutada
✅ Migración 006_create_audit_logs.sql ejecutada
```

### 2.5. Ejecutar seeds (datos de prueba)
```bash
npm run seed
```

Deberías ver:
```
✅ Seed 001_seed_users.sql ejecutado
✅ Seed 002_seed_fichas.sql ejecutado
✅ Seed 003_seed_materias.sql ejecutado
```

### 2.6. Iniciar el servidor backend
```bash
npm run dev
```

Deberías ver:
```
🚀 Servidor corriendo en http://localhost:3000
📊 Base de datos conectada: gestion_academica
```

**✅ DEJA ESTA TERMINAL ABIERTA** - el backend debe seguir corriendo.

---

## 📋 PASO 3: Configurar Frontend

### 3.1. Abrir NUEVA TERMINAL y navegar a la raíz del proyecto
```bash
# Asegúrate de estar en la raíz (no en /backend/)
cd ..
```

### 3.2. Instalar dependencias del frontend
```bash
npm install
```

### 3.3. Iniciar el servidor de desarrollo
```bash
npm run dev
```

Deberías ver:
```
  VITE v5.4.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

---

## 🎉 PASO 4: Acceder a la Aplicación

1. **Abre tu navegador** en: `http://localhost:5173`

2. **Credenciales de prueba:**

   **Administrador:**
   - Email: `admin@example.com`
   - Contraseña: `admin123`

   **Coordinador:**
   - Email: `coordinador@example.com`
   - Contraseña: `coord123`

   **Docente:**
   - Email: `docente@example.com`
   - Contraseña: `doc123`

---

## 🔥 COMANDOS RÁPIDOS

### Backend (desde `/backend/`)
```bash
npm run dev          # Iniciar servidor de desarrollo
npm run migrate      # Ejecutar migraciones
npm run seed         # Ejecutar seeds
npm run db:reset     # Resetear BD (migrar + seed)
npm run build        # Compilar a producción
npm start            # Iniciar versión compilada
```

### Frontend (desde raíz `/`)
```bash
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Compilar a producción
npm run preview      # Preview de la build
npm run lint         # Verificar errores
npm run type-check   # Verificar tipos TypeScript
```

---

## 🐛 Solución de Problemas Comunes

### ❌ Error: "PostgreSQL no está corriendo"
```bash
# Windows: Abrir Services y iniciar PostgreSQL
# Linux: sudo service postgresql start
# Mac: brew services start postgresql
```

### ❌ Error: "FATAL: password authentication failed"
```bash
# Verificar el archivo /backend/.env
# Asegurarte que DB_PASSWORD coincide con el password del usuario
```

### ❌ Error: "Cannot connect to database"
```bash
# Verificar que la BD existe:
psql -U postgres -l | grep gestion_academica

# Si no existe, crearla:
psql -U postgres -c "CREATE DATABASE gestion_academica;"
```

### ❌ Error: "Port 3000 already in use"
```bash
# Cambiar puerto en /backend/.env
PORT=3001

# O matar el proceso que usa el puerto 3000
# Windows: netstat -ano | findstr :3000
# Linux/Mac: lsof -ti:3000 | xargs kill -9
```

### ❌ Error: "Port 5173 already in use"
```bash
# Cambiar puerto en vite.config.ts o matar proceso
lsof -ti:5173 | xargs kill -9
```

---

## 📊 Verificar que todo funciona

### Backend
```bash
curl http://localhost:3000/health
# Debería responder: {"status":"ok"}
```

### Frontend
- Abrir `http://localhost:5173`
- Deberías ver la página de login
- Iniciar sesión con `admin@example.com` / `admin123`
- Deberías ver el dashboard de administrador

---

## 🎯 Próximos Pasos

Una vez que todo esté funcionando:

1. ✅ Explora los diferentes dashboards (Admin, Coordinador, Docente)
2. ✅ Prueba crear usuarios desde User Management
3. ✅ Prueba cargar archivos Excel en File Upload
4. ✅ Revisa los reportes en Analytics Dashboard
5. ✅ Verifica las notificaciones
6. ✅ Revisa los logs de auditoría

---

## 📞 ¿Necesitas ayuda?

Si encuentras algún problema, revisa:
- `/docs/FAQ.md` - Preguntas frecuentes
- `/docs/GUIA_BACKEND_SETUP.md` - Guía detallada del backend
- `/docs/VERIFICACION.md` - Checklist de verificación

---

**¡Listo! 🚀 Tu sistema de gestión académica está funcionando.**
