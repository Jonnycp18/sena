# 🗄️ GUÍA COMPLETA: Configuración de Base de Datos PostgreSQL

## 🚀 OPCIÓN 1: Script Automático (RECOMENDADO)

### Windows
```bash
CREAR_BASE_DATOS.bat
```

### Linux/Mac
```bash
chmod +x CREAR_BASE_DATOS.sh
./CREAR_BASE_DATOS.sh
```

**Esto hace TODO automáticamente:**
- ✅ Crea la base de datos `gestion_academica`
- ✅ Crea el usuario `admin_academico`
- ✅ Crea todas las tablas (users, fichas, materias, calificaciones, notifications, audit_logs)
- ✅ Configura índices y triggers
- ✅ Inserta datos de prueba

---

## 📋 OPCIÓN 2: Manual (paso a paso)

Si prefieres hacerlo manualmente o el script automático falla:

### Paso 1: Conectar a PostgreSQL como superusuario

```bash
psql -U postgres
```

### Paso 2: Crear base de datos y usuario

```sql
-- Crear base de datos
CREATE DATABASE gestion_academica;

-- Crear usuario
CREATE USER admin_academico WITH ENCRYPTED PASSWORD 'admin123';

-- Dar permisos
ALTER USER admin_academico WITH SUPERUSER CREATEDB CREATEROLE;

-- Dar permisos sobre la base de datos
GRANT ALL PRIVILEGES ON DATABASE gestion_academica TO admin_academico;

-- Salir
\q
```

### Paso 3: Ejecutar el script de configuración completa

```bash
psql -U postgres -d gestion_academica -f SETUP_DATABASE_COMPLETO.sql
```

### Paso 4: Verificar que todo se creó correctamente

```bash
# Conectar como admin_academico
psql -U admin_academico -d gestion_academica -h localhost

# Dentro de psql:
\dt                              # Ver tablas
SELECT * FROM users;             # Ver usuarios
SELECT * FROM fichas;            # Ver fichas
SELECT * FROM materias;          # Ver materias
\q                               # Salir
```

---

## 🔍 VERIFICACIÓN

### Verificar que PostgreSQL está corriendo

```bash
# Windows
# Servicios → PostgreSQL → Estado: Ejecutándose

# Linux
sudo service postgresql status

# Mac
brew services list | grep postgresql
```

### Verificar conexión a la base de datos

```bash
psql -U admin_academico -d gestion_academica -h localhost
# Contraseña: admin123
```

Si conecta exitosamente, verás:
```
gestion_academica=#
```

### Verificar tablas creadas

```sql
\dt
```

Deberías ver:
```
                List of relations
 Schema |      Name       | Type  |      Owner      
--------+-----------------+-------+-----------------
 public | audit_logs      | table | admin_academico
 public | calificaciones  | table | admin_academico
 public | fichas          | table | admin_academico
 public | materias        | table | admin_academico
 public | notifications   | table | admin_academico
 public | users           | table | admin_academico
```

### Verificar datos de prueba

```sql
-- Ver usuarios
SELECT email, nombre, apellido, rol FROM users;

-- Ver fichas
SELECT numero, nombre, estado FROM fichas;

-- Ver materias
SELECT codigo, nombre FROM materias;
```

---

## 📊 ESTRUCTURA DE LA BASE DE DATOS

### Tablas Principales

1. **users** - Usuarios del sistema
   - Campos: id, email, password_hash, nombre, apellido, rol, activo
   - Roles: Administrador, Coordinador, Docente

2. **fichas** - Fichas académicas (programas/grupos)
   - Campos: id, numero, nombre, descripcion, fecha_inicio, fecha_fin, coordinador_id, estado

3. **materias** - Materias/Asignaturas
   - Campos: id, codigo, nombre, descripcion, creditos, horas_semanales, ficha_id, docente_id

4. **calificaciones** - Calificaciones de estudiantes
   - Campos: id, materia_id, ficha_id, estudiante_nombre, estudiante_documento, trimestre, nota, estado

5. **notifications** - Notificaciones del sistema
   - Campos: id, user_id, tipo, titulo, mensaje, leida, metadata

6. **audit_logs** - Logs de auditoría
   - Campos: id, user_id, accion, modulo, detalles, metadata, created_at

---

## 🔑 CREDENCIALES

### Conexión a PostgreSQL

```
Host: localhost
Puerto: 5432
Base de datos: gestion_academica
Usuario: admin_academico
Contraseña: admin123
```

### Usuarios del Sistema

| Rol | Email | Contraseña |
|-----|-------|------------|
| **Administrador** | admin@academia.com | Admin123! |
| **Coordinador 1** | coord1@academia.com | Admin123! |
| **Coordinador 2** | coord2@academia.com | Admin123! |
| **Docente 1** | docente1@academia.com | Admin123! |
| **Docente 2** | docente2@academia.com | Admin123! |
| **Docente 3** | docente3@academia.com | Admin123! |
| **Docente 4** | docente4@academia.com | Admin123! |

---

## 🛠️ COMANDOS ÚTILES

### Conectar a PostgreSQL

```bash
# Como superusuario (postgres)
psql -U postgres

# Como admin_academico
psql -U admin_academico -d gestion_academica -h localhost
```

### Dentro de psql

```sql
\l                              -- Listar bases de datos
\c gestion_academica            -- Conectar a base de datos
\dt                             -- Listar tablas
\d users                        -- Describir tabla users
\du                             -- Listar usuarios/roles
\q                              -- Salir

-- Ver datos
SELECT * FROM users;
SELECT * FROM fichas;
SELECT * FROM materias;
```

### Resetear la base de datos

```bash
# Eliminar base de datos
psql -U postgres -c "DROP DATABASE gestion_academica;"

# Volver a ejecutar el script
./CREAR_BASE_DATOS.bat    # Windows
./CREAR_BASE_DATOS.sh     # Linux/Mac
```

---

## ❌ SOLUCIÓN DE PROBLEMAS

### Error: "FATAL: password authentication failed"

```bash
# Verifica la contraseña en /backend/.env
cat backend/.env | grep DB_PASSWORD

# Debe ser: DB_PASSWORD=admin123
```

### Error: "database does not exist"

```bash
# Crear la base de datos
psql -U postgres -c "CREATE DATABASE gestion_academica;"
```

### Error: "role does not exist"

```bash
# Crear el usuario
psql -U postgres -c "CREATE USER admin_academico WITH ENCRYPTED PASSWORD 'admin123';"
```

### Error: "connection refused"

```bash
# Verificar que PostgreSQL esté corriendo
# Windows: Servicios → PostgreSQL
# Linux: sudo service postgresql start
# Mac: brew services start postgresql
```

### Error: "permission denied"

```bash
# Dar permisos al usuario
psql -U postgres << EOF
GRANT ALL PRIVILEGES ON DATABASE gestion_academica TO admin_academico;
\c gestion_academica
GRANT ALL ON SCHEMA public TO admin_academico;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO admin_academico;
EOF
```

---

## 📝 DATOS DE PRUEBA INCLUIDOS

### 7 Usuarios
- 1 Administrador
- 2 Coordinadores
- 4 Docentes

### 4 Fichas Académicas
- 2461957 - Análisis y Desarrollo de Software
- 2461958 - Diseño Gráfico Digital
- 2461959 - Administración de Empresas
- 2461956 - Desarrollo Web Avanzado (Finalizada)

### 9 Materias
- 4 materias para Análisis y Desarrollo de Software
- 3 materias para Diseño Gráfico Digital
- 2 materias para Administración de Empresas

---

## 🔄 ACTUALIZAR EL ARCHIVO .ENV

Después de crear la base de datos, verifica que `/backend/.env` tenga:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gestion_academica
DB_USER=admin_academico
DB_PASSWORD=admin123
```

---

## ✅ PRÓXIMOS PASOS

Después de configurar la base de datos:

1. **Iniciar el backend:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Iniciar el frontend (en otra terminal):**
   ```bash
   npm install
   npm run dev
   ```

3. **Abrir el navegador:**
   - URL: `http://localhost:5173`
   - Login: `admin@academia.com` / `Admin123!`

---

## 📞 ¿Necesitas Ayuda?

Si tienes problemas:

1. **Lee:** `SOLUCION_PROBLEMAS.md`
2. **Verifica:** Que PostgreSQL esté corriendo
3. **Verifica:** Que las credenciales en `.env` sean correctas
4. **Ejecuta:** El script automático `CREAR_BASE_DATOS.bat/sh`

---

**¡Tu base de datos está lista para usar!** 🚀
