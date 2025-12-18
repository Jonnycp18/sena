# 📊 Guía Completa: Crear Base de Datos con pgAdmin4

## ✅ Ventajas de usar pgAdmin4
- Interfaz visual e intuitiva
- Control total del proceso
- Fácil verificación de resultados
- Ideal para desarrollo y testing

---

## 📋 PASO A PASO COMPLETO

### **PASO 1: Crear la Base de Datos** 🗄️

1. **Abre pgAdmin4**
2. **Conéctate a tu servidor PostgreSQL** (usualmente "PostgreSQL 15" o "PostgreSQL 16")
   - Si te pide contraseña, usa la contraseña de `postgres`
3. **Click derecho en "Databases"** → **"Create" → "Database..."**
4. **Configura la base de datos:**
   ```
   Database name: gestion_academica
   Owner: postgres
   Encoding: UTF8
   ```
5. **Click en "Save"** ✅

---

### **PASO 2: Ejecutar el Script SQL Completo** 📝

1. **En el árbol de la izquierda**, expande:
   ```
   Servers → PostgreSQL XX → Databases → gestion_academica
   ```

2. **Click en "gestion_academica"** para seleccionarla

3. **Haz click en el icono de Query Tool** (⚡ rayo) o:
   - Menú: **Tools → Query Tool**
   - Atajo: **Alt + Shift + Q**

4. **Abre el archivo SQL:**
   - Click en el icono de **"Open File"** (📁 carpeta)
   - O menú: **File → Open**
   - Navega hasta tu proyecto y selecciona: `SETUP_DATABASE_COMPLETO.sql`

5. **Ejecuta el script:**
   - Click en el botón **"Execute/Refresh"** (▶️ play)
   - O presiona **F5**

6. **Observa la salida:**
   - En el panel inferior verás mensajes como:
     ```
     >>> Paso 1: Creando roles y usuarios...
     ✓ Roles creados correctamente
     >>> Paso 2: Configurando base de datos...
     ✓ Permisos configurados correctamente
     ...
     ```

7. **Verifica que finalice con:**
   ```
   ✅ LA BASE DE DATOS ESTÁ LISTA PARA USAR!
   ```

---

### **PASO 3: Verificar que Todo Funcionó** ✅

#### **3.1 Verificar Tablas Creadas**

En el Query Tool, ejecuta:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Deberías ver:**
- audit_logs
- calificaciones
- fichas
- materias
- notifications
- users

#### **3.2 Verificar Usuarios de Prueba**

Ejecuta:

```sql
SELECT id, email, nombre, apellido, rol, activo 
FROM users
ORDER BY rol, id;
```

**Deberías ver:**
- 1 Administrador
- 2 Coordinadores
- 4 Docentes

#### **3.3 Verificar Fichas**

Ejecuta:

```sql
SELECT numero, nombre, estado 
FROM fichas
ORDER BY numero;
```

**Deberías ver:**
- 4 fichas académicas

#### **3.4 Verificar Materias**

Ejecuta:

```sql
SELECT codigo, nombre, estado 
FROM materias
ORDER BY codigo;
```

**Deberías ver:**
- 9 materias distribuidas en las fichas

---

### **PASO 4: Configurar el Backend** ⚙️

1. **En la raíz del proyecto**, crea o edita el archivo `.env` en la carpeta `backend`:

   ```
   backend/.env
   ```

2. **Agrega estas variables:**

   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=gestion_academica
   DB_USER=admin_academico
   DB_PASSWORD=admin123

   # Pool Configuration (opcional)
   DB_POOL_MIN=2
   DB_POOL_MAX=10
   DB_IDLE_TIMEOUT=30000
   DB_CONNECTION_TIMEOUT=5000

   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # JWT Configuration
   JWT_SECRET=tu_secreto_super_seguro_cambialo_en_produccion
   JWT_EXPIRES_IN=24h
   ```

3. **Guarda el archivo**

---

### **PASO 5: Iniciar el Sistema** 🚀

#### **Terminal 1 - Backend:**

```bash
cd backend
npm install
npm run dev
```

**Deberías ver:**
```
✅ Conexión a PostgreSQL exitosa
🚀 Servidor backend iniciado en puerto 3001
```

#### **Terminal 2 - Frontend:**

```bash
npm install
npm run dev
```

**Deberías ver:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

---

## 🔐 Credenciales de Acceso

### **Para el Sistema (Frontend)**

| Rol | Email | Contraseña |
|-----|-------|------------|
| **Administrador** | admin@academia.com | Admin123! |
| **Coordinador** | coord1@academia.com | Admin123! |
| **Coordinador** | coord2@academia.com | Admin123! |
| **Docente** | docente1@academia.com | Admin123! |
| **Docente** | docente2@academia.com | Admin123! |
| **Docente** | docente3@academia.com | Admin123! |
| **Docente** | docente4@academia.com | Admin123! |

### **Para PostgreSQL (pgAdmin4)**

| Campo | Valor |
|-------|-------|
| Host | localhost |
| Puerto | 5432 |
| Base de datos | gestion_academica |
| Usuario | admin_academico |
| Contraseña | admin123 |

---

## 🐛 Solución de Problemas

### ❌ Error: "role admin_academico already exists"

**No es un problema**, significa que el usuario ya fue creado. El script continúa normalmente.

### ❌ Error: "database gestion_academica already exists"

**Solución 1 - Eliminar y recrear:**

```sql
-- En Query Tool conectado a 'postgres' (no a gestion_academica)
DROP DATABASE IF EXISTS gestion_academica;
CREATE DATABASE gestion_academica;
```

Luego ejecuta el script completo nuevamente.

**Solución 2 - Limpiar la base existente:**

El script ya tiene comandos `DROP TABLE IF EXISTS` que limpian automáticamente.

### ❌ Backend no conecta: "password authentication failed"

1. **Verifica el archivo `.env`** en la carpeta backend
2. **Confirma que DB_PASSWORD=admin123**
3. **Reinicia el backend:** Ctrl+C y luego `npm run dev`

### ❌ Backend no conecta: "database does not exist"

Verifica que la base de datos se creó:

```sql
SELECT datname FROM pg_database WHERE datname = 'gestion_academica';
```

Si no aparece, vuelve al PASO 1.

### ❌ pgAdmin4 pide contraseña constantemente

**Solución:**
1. Click derecho en el servidor → **Properties**
2. Pestaña **Connection**
3. Marca **"Save password"**
4. Click **Save**

---

## 📁 Estructura de Archivos Importante

```
proyecto/
├── SETUP_DATABASE_COMPLETO.sql  ← Script principal
├── backend/
│   ├── .env                     ← CREAR ESTE ARCHIVO
│   ├── package.json
│   └── src/
│       └── config/
│           └── database.ts      ← Configuración de conexión
└── ...
```

---

## ✨ Comandos Útiles en pgAdmin4

### Ver todas las tablas con conteo:

```sql
SELECT 
  schemaname,
  tablename,
  (SELECT COUNT(*) FROM (SELECT 1 FROM quote_ident(schemaname) || '.' || quote_ident(tablename) LIMIT 1) x) as row_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Ver estructura completa de una tabla:

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

### Hacer backup de la base de datos:

1. **Click derecho en "gestion_academica"**
2. **Backup...**
3. **Selecciona formato y ubicación**
4. **Click "Backup"**

---

## 🎯 Próximos Pasos

Después de tener la base de datos funcionando:

1. ✅ Probar login con las credenciales
2. ✅ Navegar por los diferentes dashboards
3. ✅ Crear nuevos usuarios desde el panel de administración
4. ✅ Crear fichas y materias
5. ✅ Probar carga de calificaciones (sistema de Excel)
6. ✅ Revisar notificaciones y auditoría

---

## 📞 ¿Necesitas Ayuda?

Si algo no funciona:

1. **Verifica el Output del Query Tool** en pgAdmin4
2. **Revisa los logs del backend** en la terminal
3. **Confirma que el .env está bien configurado**
4. **Verifica que PostgreSQL está corriendo** (pgAdmin4 conectado)

---

**¡Tu base de datos está lista! 🎉**
