# ⚡ INSTRUCCIONES RÁPIDAS - Crear Base de Datos

## 🎯 SOLUCIÓN EN 1 COMANDO

### Windows:
```bash
CREAR_BASE_DATOS.bat
```

### Linux/Mac:
```bash
chmod +x CREAR_BASE_DATOS.sh
./CREAR_BASE_DATOS.sh
```

**Esto crea TODO automáticamente:**
- ✅ Base de datos
- ✅ Usuario admin_academico
- ✅ 6 tablas
- ✅ Datos de prueba

---

## 📋 ¿QUÉ SE CREA?

### Base de Datos
- **Nombre:** `gestion_academica`
- **Usuario:** `admin_academico`
- **Contraseña:** `admin123`

### Tablas
1. `users` - Usuarios del sistema
2. `fichas` - Fichas académicas
3. `materias` - Materias/Asignaturas
4. `calificaciones` - Calificaciones
5. `notifications` - Notificaciones
6. `audit_logs` - Auditoría

### Datos de Prueba
- **7 usuarios** (1 admin, 2 coordinadores, 4 docentes)
- **4 fichas académicas**
- **9 materias**

---

## 🔑 CREDENCIALES

**Para acceder al sistema:**
- Email: `admin@academia.com`
- Contraseña: `Admin123!`

**Para conectar a PostgreSQL:**
```bash
psql -U admin_academico -d gestion_academica -h localhost
# Password: admin123
```

---

## 🚀 DESPUÉS DE CREAR LA BD

### 1. Iniciar Backend (Terminal 1)
```bash
cd backend
npm install
npm run dev
```

### 2. Iniciar Frontend (Terminal 2)
```bash
npm install
npm run dev
```

### 3. Abrir Navegador
```
http://localhost:5173
```

Login: `admin@academia.com` / `Admin123!`

---

## ❌ SI ALGO FALLA

### Opción 1: Volver a ejecutar
```bash
# Eliminar y recrear
psql -U postgres -c "DROP DATABASE gestion_academica;"
./CREAR_BASE_DATOS.bat   # Windows
./CREAR_BASE_DATOS.sh    # Linux/Mac
```

### Opción 2: Manual
```bash
# 1. Crear BD
psql -U postgres -c "CREATE DATABASE gestion_academica;"

# 2. Ejecutar script
psql -U postgres -d gestion_academica -f SETUP_DATABASE_COMPLETO.sql
```

### Opción 3: Lee la guía completa
```bash
# Ver guía detallada
GUIA_BASE_DATOS.md
```

---

## ✅ VERIFICACIÓN RÁPIDA

```bash
# ¿PostgreSQL corriendo?
psql --version

# ¿BD existe?
psql -U postgres -l | grep gestion

# ¿Tablas creadas?
psql -U admin_academico -d gestion_academica -c "\dt"

# ¿Datos cargados?
psql -U admin_academico -d gestion_academica -c "SELECT COUNT(*) FROM users;"
```

---

**¡Listo en 1 comando!** 🎉
