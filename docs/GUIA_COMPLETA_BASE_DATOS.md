# 🗄️ GUÍA COMPLETA: BASE DE DATOS POSTGRESQL
# Sistema de Gestión Académica

---

## 📑 TABLA DE CONTENIDOS

1. [Estructura de la Base de Datos](#estructura)
2. [Paso a Paso en pgAdmin 4](#paso-a-paso)
3. [Verificación](#verificacion)
4. [Configuración del Sistema](#configuracion)
5. [Credenciales](#credenciales)
6. [Solución de Problemas](#problemas)

---

## 📊 ESTRUCTURA DE LA BASE DE DATOS {#estructura}

### **1. INFORMACIÓN GENERAL**

```
Nombre de la BD:  gestion_academica
Usuario Admin:    admin_academico
Contraseña:       admin123
Puerto:           5432 (default PostgreSQL)
Encoding:         UTF8
```

### **2. TABLAS DEL SISTEMA**

#### **2.1 USERS** 👥
Almacena información de usuarios del sistema (Administradores, Coordinadores, Docentes)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL PRIMARY KEY | Identificador único |
| `email` | VARCHAR(255) UNIQUE | Correo electrónico (login) |
| `password_hash` | VARCHAR(255) | Contraseña encriptada (bcrypt) |
| `nombre` | VARCHAR(100) | Nombre del usuario |
| `apellido` | VARCHAR(100) | Apellido del usuario |
| `rol` | VARCHAR(20) | Administrador, Coordinador o Docente |
| `activo` | BOOLEAN | Estado del usuario (true/false) |
| `avatar_url` | TEXT | URL del avatar |
| `telefono` | VARCHAR(20) | Teléfono de contacto |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Última actualización |
| `last_login` | TIMESTAMP | Último inicio de sesión |
| `password_changed_at` | TIMESTAMP | Última modificación de contraseña |

**Índices:**
- `idx_users_email` - Búsqueda rápida por email
- `idx_users_rol` - Filtrado por rol
- `idx_users_activo` - Filtrado por estado

---

#### **2.2 FICHAS** 📚
Representa programas académicos o grupos (ej: ficha 2461957)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL PRIMARY KEY | Identificador único |
| `numero` | VARCHAR(50) UNIQUE | Número de ficha (ej: 2461957) |
| `nombre` | VARCHAR(255) | Nombre del programa |
| `descripcion` | TEXT | Descripción detallada |
| `fecha_inicio` | DATE | Fecha de inicio |
| `fecha_fin` | DATE | Fecha de finalización |
| `coordinador_id` | INTEGER FK → users | Coordinador asignado |
| `estado` | VARCHAR(20) | Activa, Inactiva o Finalizada |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Última actualización |
| `created_by` | INTEGER FK → users | Usuario que creó |
| `updated_by` | INTEGER FK → users | Usuario que modificó |

**Índices:**
- `idx_fichas_numero` - Búsqueda por número de ficha
- `idx_fichas_coordinador_id` - Fichas por coordinador
- `idx_fichas_estado` - Filtrado por estado

---

#### **2.3 MATERIAS** 📖
Asignaturas asociadas a fichas académicas

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL PRIMARY KEY | Identificador único |
| `codigo` | VARCHAR(50) UNIQUE | Código de la materia (ej: ADSO-001) |
| `nombre` | VARCHAR(255) | Nombre de la materia |
| `descripcion` | TEXT | Descripción detallada |
| `creditos` | INTEGER | Número de créditos |
| `horas_semanales` | INTEGER | Horas por semana |
| `ficha_id` | INTEGER FK → fichas | Ficha a la que pertenece |
| `docente_id` | INTEGER FK → users | Docente asignado |
| `estado` | VARCHAR(20) | Activa, Inactiva o Finalizada |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Última actualización |
| `created_by` | INTEGER FK → users | Usuario que creó |
| `updated_by` | INTEGER FK → users | Usuario que modificó |

**Índices:**
- `idx_materias_codigo` - Búsqueda por código
- `idx_materias_ficha_id` - Materias por ficha
- `idx_materias_docente_id` - Materias por docente
- `idx_materias_ficha_docente` - Combinación ficha-docente

---

#### **2.4 CALIFICACIONES** 📊
Notas de estudiantes por materia y trimestre

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL PRIMARY KEY | Identificador único |
| `materia_id` | INTEGER FK → materias | Materia evaluada |
| `ficha_id` | INTEGER FK → fichas | Ficha del estudiante |
| `estudiante_nombre` | VARCHAR(255) | Nombre completo del estudiante |
| `estudiante_documento` | VARCHAR(50) | Documento de identidad |
| `trimestre` | INTEGER (1-4) | Trimestre evaluado |
| `nota` | DECIMAL(4,2) | Nota (0.00 - 5.00) |
| `estado` | VARCHAR(20) | Aprobado, Reprobado o Cursando |
| `observaciones` | TEXT | Comentarios adicionales |
| `fecha_carga` | DATE | Fecha de carga de la nota |
| `cargado_por` | INTEGER FK → users | Usuario que cargó la nota |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Última actualización |

**Índices:**
- `idx_calificaciones_materia_id` - Calificaciones por materia
- `idx_calificaciones_ficha_id` - Calificaciones por ficha
- `idx_calificaciones_estudiante_doc` - Por documento estudiante
- `idx_calificaciones_trimestre` - Por trimestre
- `idx_calificaciones_unique` - UNIQUE(materia_id, estudiante_documento, trimestre)

**Lógica Automática:**
- **Trigger:** Calcula automáticamente el estado:
  - Nota ≥ 3.0 → Aprobado
  - Nota < 3.0 → Reprobado

---

#### **2.5 NOTIFICATIONS** 🔔
Sistema de notificaciones en tiempo real

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL PRIMARY KEY | Identificador único |
| `user_id` | INTEGER FK → users | Usuario destinatario |
| `tipo` | VARCHAR(50) | Tipo de notificación |
| `titulo` | VARCHAR(255) | Título de la notificación |
| `mensaje` | TEXT | Mensaje completo |
| `icono` | VARCHAR(50) | Icono a mostrar |
| `color` | VARCHAR(20) | Color de la notificación |
| `leida` | BOOLEAN | Si fue leída |
| `metadata` | JSONB | Datos adicionales (JSON) |
| `relacionado_tipo` | VARCHAR(50) | Tipo de entidad relacionada |
| `relacionado_id` | INTEGER | ID de entidad relacionada |
| `prioridad` | VARCHAR(20) | baja, normal, alta, urgente |
| `created_at` | TIMESTAMP | Fecha de creación |
| `leida_at` | TIMESTAMP | Fecha de lectura |

**Índices:**
- `idx_notifications_user_id` - Notificaciones por usuario
- `idx_notifications_leida` - Por estado de lectura
- `idx_notifications_user_leida` - Combinación usuario-leída
- `idx_notifications_metadata` - Búsqueda en metadata (GIN)

**Lógica Automática:**
- **Trigger:** Marca automáticamente como leída cuando se establece `leida_at`

---

#### **2.6 AUDIT_LOGS** 🔍
Registro completo de auditoría del sistema

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL PRIMARY KEY | Identificador único |
| `user_id` | INTEGER FK → users | Usuario que realizó la acción |
| `user_email` | VARCHAR(255) | Email del usuario (backup) |
| `user_rol` | VARCHAR(20) | Rol del usuario |
| `accion` | VARCHAR(100) | Acción realizada |
| `modulo` | VARCHAR(50) | Módulo del sistema |
| `entidad_tipo` | VARCHAR(50) | Tipo de entidad afectada |
| `entidad_id` | INTEGER | ID de entidad afectada |
| `detalles` | TEXT | Descripción detallada |
| `metadata` | JSONB | Datos adicionales (JSON) |
| `ip_address` | VARCHAR(45) | IP del usuario |
| `user_agent` | TEXT | Navegador/dispositivo |
| `metodo_http` | VARCHAR(10) | GET, POST, PUT, DELETE |
| `ruta` | VARCHAR(255) | Ruta de la API |
| `estado_http` | INTEGER | Código HTTP (200, 404, 500) |
| `duracion_ms` | INTEGER | Duración de la operación |
| `created_at` | TIMESTAMP | Fecha del evento |

**Índices:**
- `idx_audit_logs_user_id` - Logs por usuario
- `idx_audit_logs_accion` - Por acción
- `idx_audit_logs_modulo` - Por módulo
- `idx_audit_logs_created_at` - Por fecha (DESC)
- `idx_audit_logs_metadata` - Búsqueda en metadata (GIN)

**Funciones Especiales:**
- `cleanup_old_audit_logs(days)` - Limpia logs antiguos
- Vista `audit_stats` - Estadísticas de auditoría de últimos 30 días

---

### **3. FUNCIONES Y TRIGGERS**

#### **3.1 Función: update_updated_at_column()**
```sql
-- Se ejecuta automáticamente en UPDATE de tablas
-- Actualiza el campo updated_at con la fecha/hora actual
```

#### **3.2 Función: update_calificacion_estado()**
```sql
-- Se ejecuta al INSERT/UPDATE de nota en calificaciones
-- Calcula automáticamente estado (Aprobado/Reprobado)
-- Nota >= 3.0 → Aprobado
-- Nota < 3.0 → Reprobado
```

#### **3.3 Función: update_notification_leida()**
```sql
-- Se ejecuta al UPDATE de leida_at en notifications
-- Marca automáticamente leida = true
```

#### **3.4 Función: cleanup_old_audit_logs(retention_days)**
```sql
-- Función de mantenimiento
-- Elimina logs de auditoría más antiguos que N días
-- Uso: SELECT cleanup_old_audit_logs(365); -- Elimina logs de hace más de 1 año
```

---

### **4. VISTAS**

#### **4.1 Vista: audit_stats**
```sql
-- Estadísticas de auditoría de últimos 30 días
-- Agrupa por fecha, módulo y acción
-- Muestra: total_acciones, usuarios_unicos, duracion_promedio_ms
```

---

## 🔧 PASO A PASO EN pgAdmin 4 {#paso-a-paso}

### **PASO 1: Abrir pgAdmin 4 e Iniciar Sesión**

1. **Abre pgAdmin 4** desde tu menú de inicio o aplicaciones
2. **Conecta al servidor PostgreSQL**:
   - En el árbol de la izquierda, verás "Servers"
   - Expande "Servers" → Selecciona tu servidor (ej: "PostgreSQL 15" o "PostgreSQL 16")
   - Si te pide contraseña, ingresa la contraseña del usuario `postgres`

---

### **PASO 2: Crear la Base de Datos**

1. **Click derecho en "Databases"** (dentro de tu servidor PostgreSQL)
2. Selecciona **"Create" → "Database..."**
3. En la ventana que se abre, ingresa:
   ```
   Database:       gestion_academica
   Owner:          postgres
   Encoding:       UTF8
   Template:       template0
   Tablespace:     pg_default
   ```
4. Click en **"Save"**
5. ✅ Deberías ver la nueva base de datos en el árbol

---

### **PASO 3: Abrir el Query Tool**

1. **Expande** en el árbol de la izquierda:
   ```
   Servers → PostgreSQL XX → Databases → gestion_academica
   ```
2. **Click en "gestion_academica"** para seleccionarla
3. **Abre el Query Tool**:
   - Opción 1: Click en el icono ⚡ (rayo) en la barra de herramientas
   - Opción 2: Menú **Tools → Query Tool**
   - Opción 3: Atajo de teclado **Alt + Shift + Q**

---

### **PASO 4: Cargar el Script SQL**

1. En el Query Tool, haz click en el icono **📁 "Open File"**
   - O usa el menú **File → Open**
2. **Navega hasta tu proyecto** y selecciona el archivo:
   ```
   SETUP_DATABASE_COMPLETO.sql
   ```
3. El contenido del archivo se cargará en el editor

---

### **PASO 5: Ejecutar el Script**

1. **Click en el botón ▶️ "Execute/Refresh"**
   - O presiona **F5**
2. **Observa el panel de mensajes** (parte inferior)
3. Verás mensajes como:
   ```
   ============================================================================
   INICIANDO CONFIGURACIÓN DE BASE DE DATOS
   ============================================================================
   
   >>> Paso 1: Creando roles y usuarios...
   ✓ Roles creados correctamente
   
   >>> Paso 2: Configurando base de datos...
   ✓ Permisos configurados correctamente
   
   >>> Paso 3: Limpiando base de datos existente...
   ✓ Base de datos limpiada
   
   >>> Paso 4: Creando funciones auxiliares...
   ✓ Funciones auxiliares creadas
   
   >>> Paso 5: Creando tabla users...
   ✓ Tabla users creada
   
   >>> Paso 6: Creando tabla fichas...
   ✓ Tabla fichas creada
   
   >>> Paso 7: Creando tabla materias...
   ✓ Tabla materias creada
   
   >>> Paso 8: Creando tabla calificaciones...
   ✓ Tabla calificaciones creada
   
   >>> Paso 9: Creando tabla notifications...
   ✓ Tabla notifications creada
   
   >>> Paso 10: Creando tabla audit_logs...
   ✓ Tabla audit_logs creada
   
   >>> Paso 11: Insertando usuarios iniciales...
   Contraseña para todos: Admin123!
   7 usuarios totales
   
   >>> Paso 12: Insertando fichas académicas...
   4 fichas totales
   
   >>> Paso 13: Insertando materias...
   9 materias totales
   
   ============================================================================
   CONFIGURACIÓN COMPLETADA EXITOSAMENTE
   ============================================================================
   
   RESUMEN DE LA BASE DE DATOS:
   ----------------------------
   Usuarios: 7 | Fichas: 4 | Materias: 9
   
   ============================================================================
   ¡LA BASE DE DATOS ESTÁ LISTA PARA USAR!
   ============================================================================
   ```

4. ✅ **Si ves el mensaje final de éxito, todo está listo!**

---

## ✅ VERIFICACIÓN {#verificacion}

### **Verificación 1: Listar Todas las Tablas**

En el Query Tool, ejecuta:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Resultado esperado:**
```
audit_logs
calificaciones
fichas
materias
notifications
users
```

---

### **Verificación 2: Contar Registros en Cada Tabla**

```sql
SELECT 
  'users' AS tabla, COUNT(*) AS registros FROM users
UNION ALL
SELECT 'fichas', COUNT(*) FROM fichas
UNION ALL
SELECT 'materias', COUNT(*) FROM materias
UNION ALL
SELECT 'calificaciones', COUNT(*) FROM calificaciones
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs
ORDER BY tabla;
```

**Resultado esperado:**
```
tabla            | registros
-----------------+----------
audit_logs       | 0
calificaciones   | 0
fichas           | 4
materias         | 9
notifications    | 0
users            | 7
```

---

### **Verificación 3: Ver Usuarios Creados**

```sql
SELECT 
  id, 
  email, 
  nombre, 
  apellido, 
  rol, 
  activo 
FROM users
ORDER BY rol, id;
```

**Resultado esperado:**
```
id | email                    | nombre  | apellido   | rol            | activo
---+--------------------------+---------+------------+----------------+-------
1  | admin@academia.com       | Juan    | Pérez      | Administrador  | true
2  | coord1@academia.com      | María   | García     | Coordinador    | true
3  | coord2@academia.com      | Carlos  | Rodríguez  | Coordinador    | true
4  | docente1@academia.com    | Ana     | Martínez   | Docente        | true
5  | docente2@academia.com    | Pedro   | López      | Docente        | true
6  | docente3@academia.com    | Laura   | Hernández  | Docente        | true
7  | docente4@academia.com    | Roberto | Sánchez    | Docente        | true
```

---

### **Verificación 4: Ver Fichas Creadas**

```sql
SELECT 
  id,
  numero,
  nombre,
  estado,
  TO_CHAR(fecha_inicio, 'DD/MM/YYYY') AS inicio,
  TO_CHAR(fecha_fin, 'DD/MM/YYYY') AS fin
FROM fichas
ORDER BY numero;
```

**Resultado esperado:**
```
id | numero  | nombre                               | estado     | inicio     | fin
---+---------+--------------------------------------+------------+------------+------------
4  | 2461956 | Desarrollo Web Avanzado              | Finalizada | 15/01/2023 | 15/12/2024
1  | 2461957 | Análisis y Desarrollo de Software    | Activa     | 15/01/2024 | 15/12/2025
2  | 2461958 | Diseño Gráfico Digital               | Activa     | 01/02/2024 | 31/12/2025
3  | 2461959 | Administración de Empresas           | Activa     | 20/01/2024 | 30/11/2025
```

---

### **Verificación 5: Ver Materias por Ficha**

```sql
SELECT 
  f.numero AS ficha,
  m.codigo,
  m.nombre AS materia,
  u.nombre || ' ' || u.apellido AS docente,
  m.creditos,
  m.horas_semanales AS horas,
  m.estado
FROM materias m
JOIN fichas f ON m.ficha_id = f.id
LEFT JOIN users u ON m.docente_id = u.id
ORDER BY f.numero, m.codigo;
```

---

### **Verificación 6: Verificar Funciones**

```sql
SELECT 
  routine_name AS funcion,
  routine_type AS tipo
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

**Resultado esperado:**
```
funcion                        | tipo
-------------------------------+-----------
cleanup_old_audit_logs         | FUNCTION
update_calificacion_estado     | FUNCTION
update_notification_leida      | FUNCTION
update_updated_at_column       | FUNCTION
```

---

### **Verificación 7: Verificar Triggers**

```sql
SELECT 
  event_object_table AS tabla,
  trigger_name AS trigger,
  action_timing AS cuando,
  event_manipulation AS evento
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

---

## ⚙️ CONFIGURACIÓN DEL SISTEMA {#configuracion}

### **Configurar Backend (.env)**

1. **Navega a la carpeta backend** de tu proyecto
2. **Crea o edita el archivo `.env`**:

```bash
# En Windows
cd backend
notepad .env

# En Mac/Linux
cd backend
nano .env
```

3. **Agrega este contenido**:

```env
# ===============================================
# CONFIGURACIÓN DE BASE DE DATOS
# ===============================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gestion_academica
DB_USER=admin_academico
DB_PASSWORD=admin123

# ===============================================
# CONFIGURACIÓN DE POOL DE CONEXIONES
# ===============================================
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=5000

# ===============================================
# CONFIGURACIÓN DEL SERVIDOR
# ===============================================
PORT=3001
NODE_ENV=development

# ===============================================
# CONFIGURACIÓN DE JWT
# ===============================================
JWT_SECRET=tu_secreto_super_seguro_cambialo_en_produccion
JWT_EXPIRES_IN=24h

# ===============================================
# CONFIGURACIÓN DE CORS
# ===============================================
FRONTEND_URL=http://localhost:5173
```

4. **Guarda el archivo**

---

### **Iniciar el Sistema**

#### **Terminal 1 - Backend:**

```bash
cd backend
npm install
npm run dev
```

**Salida esperada:**
```
[Backend] Conectando a PostgreSQL...
[Backend] ✅ Conexión a PostgreSQL exitosa
[Backend] 🚀 Servidor backend iniciado en puerto 3001
[Backend] 📊 Base de datos: gestion_academica
[Backend] 👤 Usuario: admin_academico
```

#### **Terminal 2 - Frontend:**

```bash
# Desde la raíz del proyecto
npm install
npm run dev
```

**Salida esperada:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

---

## 🔐 CREDENCIALES {#credenciales}

### **Credenciales de la Base de Datos**

```
Host:         localhost
Puerto:       5432
Base de Datos: gestion_academica
Usuario:      admin_academico
Contraseña:   admin123
```

---

### **Credenciales del Sistema (Frontend)**

| Rol | Email | Contraseña | Permisos |
|-----|-------|------------|----------|
| **Administrador** | admin@academia.com | Admin123! | Acceso completo al sistema |
| **Coordinador** | coord1@academia.com | Admin123! | Seguimiento académico y reportes |
| **Coordinador** | coord2@academia.com | Admin123! | Seguimiento académico y reportes |
| **Docente** | docente1@academia.com | Admin123! | Carga de calificaciones |
| **Docente** | docente2@academia.com | Admin123! | Carga de calificaciones |
| **Docente** | docente3@academia.com | Admin123! | Carga de calificaciones |
| **Docente** | docente4@academia.com | Admin123! | Carga de calificaciones |

---

## 🐛 SOLUCIÓN DE PROBLEMAS {#problemas}

### **Problema 1: "role admin_academico already exists"**

**Causa:** El usuario ya fue creado en ejecuciones anteriores

**Solución:** ✅ No es un problema. El script continúa normalmente.

---

### **Problema 2: "database gestion_academica already exists"**

**Solución 1 - Eliminar y recrear:**

```sql
-- IMPORTANTE: Conectar a la base 'postgres' (no a gestion_academica)
-- Click derecho en "gestion_academica" → "Disconnect"
-- Luego conectar a "postgres" y ejecutar:

DROP DATABASE IF EXISTS gestion_academica;
CREATE DATABASE gestion_academica;

-- Luego ejecutar el script SETUP_DATABASE_COMPLETO.sql
```

**Solución 2 - Usar el script directamente:**
El script ya tiene comandos `DROP TABLE IF EXISTS` que limpian automáticamente las tablas existentes.

---

### **Problema 3: Backend no conecta - "password authentication failed"**

**Causa:** Credenciales incorrectas en el archivo `.env`

**Solución:**
1. Abre `backend/.env`
2. Verifica que tenga:
   ```env
   DB_USER=admin_academico
   DB_PASSWORD=admin123
   ```
3. Guarda el archivo
4. Reinicia el backend: `Ctrl+C` y luego `npm run dev`

---

### **Problema 4: Backend no conecta - "database does not exist"**

**Causa:** La base de datos no fue creada

**Solución:**
1. En pgAdmin 4, ejecuta:
   ```sql
   SELECT datname FROM pg_database WHERE datname = 'gestion_academica';
   ```
2. Si no aparece nada, vuelve al **PASO 2** y crea la base de datos

---

### **Problema 5: "relation does not exist"**

**Causa:** Las tablas no fueron creadas

**Solución:**
1. Verifica que ejecutaste el script completo `SETUP_DATABASE_COMPLETO.sql`
2. Revisa el output en el Query Tool para ver si hubo errores
3. Si es necesario, ejecuta nuevamente el script

---

### **Problema 6: pgAdmin 4 pide contraseña constantemente**

**Solución:**
1. Click derecho en tu servidor PostgreSQL → **"Properties"**
2. Ve a la pestaña **"Connection"**
3. Marca la opción **"Save password"**
4. Click en **"Save"**

---

### **Problema 7: No puedo conectarme a pgAdmin 4**

**Solución:**
1. Verifica que PostgreSQL está corriendo:
   - **Windows:** Busca "Services" → Encuentra "postgresql-x64-XX" → Debe estar "Running"
   - **Mac:** `brew services list` → postgresql debe estar "started"
   - **Linux:** `sudo systemctl status postgresql`
2. Si no está corriendo:
   - **Windows:** Click derecho → "Start"
   - **Mac:** `brew services start postgresql`
   - **Linux:** `sudo systemctl start postgresql`

---

## 📁 ARCHIVOS IMPORTANTES

```
proyecto/
│
├── SETUP_DATABASE_COMPLETO.sql          ← Script principal SQL
├── GUIA_COMPLETA_BASE_DATOS.md          ← Esta guía
├── GUIA_PGADMIN4.md                     ← Guía resumida
│
├── backend/
│   ├── .env                             ← CREAR ESTE ARCHIVO
│   ├── package.json
│   └── src/
│       ├── config/
│       │   └── database.ts              ← Configuración de conexión
│       └── database/
│           └── migrations/              ← Migraciones individuales
│               ├── 001_create_users.sql
│               ├── 002_create_fichas.sql
│               ├── 003_create_materias.sql
│               ├── 004_create_calificaciones.sql
│               ├── 005_create_notifications.sql
│               └── 006_create_audit_logs.sql
│
└── ...
```

---

## 🎯 COMANDOS ÚTILES EN pgAdmin 4

### **Ver estructura de una tabla:**

```sql
SELECT 
  column_name AS columna, 
  data_type AS tipo, 
  is_nullable AS permite_null,
  column_default AS valor_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

---

### **Ver índices de una tabla:**

```sql
SELECT 
  indexname AS indice,
  indexdef AS definicion
FROM pg_indexes
WHERE tablename = 'users'
ORDER BY indexname;
```

---

### **Ver claves foráneas (Foreign Keys):**

```sql
SELECT
  tc.table_name AS tabla,
  kcu.column_name AS columna,
  ccu.table_name AS tabla_referenciada,
  ccu.column_name AS columna_referenciada
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;
```

---

### **Ver tamaño de cada tabla:**

```sql
SELECT 
  schemaname AS esquema,
  tablename AS tabla,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS tamaño_total,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS tamaño_tabla,
  pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS tamaño_indices
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

### **Hacer backup de la base de datos:**

1. **Click derecho en "gestion_academica"**
2. Selecciona **"Backup..."**
3. Configura:
   ```
   Filename:    gestion_academica_backup_2024_11_04.backup
   Format:      Custom
   Encoding:    UTF8
   ```
4. Click en **"Backup"**

---

### **Restaurar backup:**

1. **Click derecho en "gestion_academica"**
2. Selecciona **"Restore..."**
3. Selecciona el archivo de backup
4. Click en **"Restore"**

---

## 🚀 PRÓXIMOS PASOS

Después de configurar la base de datos:

1. ✅ **Iniciar Backend y Frontend**
2. ✅ **Probar Login** con las credenciales proporcionadas
3. ✅ **Explorar Dashboards** según tu rol
4. ✅ **Crear Usuarios** desde el panel de administración
5. ✅ **Gestionar Fichas y Materias**
6. ✅ **Cargar Calificaciones** usando archivos Excel
7. ✅ **Revisar Notificaciones** en tiempo real
8. ✅ **Consultar Auditoría** de acciones del sistema

---

## 📞 ¿NECESITAS AYUDA?

Si algo no funciona:

1. ✅ **Verifica el Output** del Query Tool en pgAdmin 4
2. ✅ **Revisa los logs** del backend en la terminal
3. ✅ **Confirma el archivo .env** está bien configurado
4. ✅ **Verifica PostgreSQL** está corriendo
5. ✅ **Revisa las credenciales** de acceso

---

## 📚 DOCUMENTACIÓN ADICIONAL

- **GUIA_PGADMIN4.md** - Guía resumida de pgAdmin 4
- **GUIA_BASE_DATOS.md** - Documentación técnica de la BD
- **GUIA_BACKEND_SETUP.md** - Configuración detallada del backend
- **INICIO_RAPIDO.md** - Guía para iniciar rápidamente
- **SOLUCION_PROBLEMAS.md** - Más soluciones a problemas comunes

---

## ✅ CHECKLIST FINAL

- [ ] PostgreSQL instalado y corriendo
- [ ] pgAdmin 4 instalado
- [ ] Base de datos `gestion_academica` creada
- [ ] Script `SETUP_DATABASE_COMPLETO.sql` ejecutado exitosamente
- [ ] 6 tablas creadas (users, fichas, materias, calificaciones, notifications, audit_logs)
- [ ] 7 usuarios de prueba insertados
- [ ] 4 fichas académicas creadas
- [ ] 9 materias creadas
- [ ] Archivo `backend/.env` configurado
- [ ] Backend iniciado correctamente
- [ ] Frontend iniciado correctamente
- [ ] Login exitoso en el sistema

---

**🎉 ¡Tu base de datos PostgreSQL está lista para usar!**

*Última actualización: 4 de Noviembre de 2024*
