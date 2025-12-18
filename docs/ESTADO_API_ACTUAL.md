# 📘 Estado Actual de la API - Sistema de Gestión Académica

> Última actualización: 2025-11-08

## ✅ Resumen General
Backend FastAPI levantado con conexión a PostgreSQL. El backend Node/Express fue deprecado y ya no se usa. Endpoints implementados hasta ahora:
- Autenticación básica (login temporal con password fijo "123456", me, refresh, logout, change-password stub).
- CRUD completo de Usuarios (incluye stats, toggle activo, hashing bcrypt para almacenamiento).
- CRUD completo de Fichas (incluye materias de la ficha, estudiantes derivados de calificaciones, stats).
- CRUD completo de Materias (incluye calificaciones de la materia, materias por docente, stats).
- Endpoints de listado de Fichas y Materias ya integrados con filtros y paginación.
- Health y DB ping.
- OpenAPI/Swagger/Redoc funcionando tras fijar versiones de Pydantic.

## 🧱 Stack Técnico
- FastAPI 0.115.0
- Uvicorn (dev reload)
- Pydantic 2.9.2 + pydantic-core 2.23.4 (pin por compatibilidad con Python 3.9.0)
- psycopg3 (PostgreSQL)
- python-dotenv
- jose (JWT) / passlib[bcrypt]
- Modelo de BD definido en `SETUP_DATABASE_COMPLETO.sql`

## 🔐 Autenticación
- Tipo: JWT (HS256)
- Endpoints implementados:
  - POST `/api/v1/auth/login` (password temporal, pendiente verificación real contra `password_hash`)
  - GET  `/api/v1/auth/me`
  - POST `/api/v1/auth/refresh`
  - POST `/api/v1/auth/logout`
  - POST `/api/v1/auth/change-password` (stub)
- Headers requeridos para rutas protegidas: `Authorization: Bearer <access_token>`
- Tokens: access (1h configurable), refresh (7d configurable).

## 📦 Formatos de Respuesta
Listas:
```json
{
  "success": true,
  "data": [ ...items ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 42,
    "totalPages": 5
  }
}
```
Detalle / Mutación:
```json
{ "success": true, "data": { ...object } }
```
Errores:
```json
{ "detail": "Mensaje de error" }
```

## 🔄 Paginación y Filtros
- Parámetros: `page` (>=1), `pageSize` (límite por recurso), `search` (búsqueda básica). Materias: filtros extra `fichaId`, `estado`.

## 📂 Estructura Principal (Backend FastAPI)
```
backend_fastapi/app/
  main.py            # Bootstrap FastAPI, CORS, routers, docs
  db.py              # Conexión y settings PostgreSQL
  security.py        # JWT y hashing bcrypt
  routers/
    auth.py          # Auth endpoints
    users.py         # CRUD usuarios + stats + toggle
    fichas.py        # CRUD fichas + materias + estudiantes + stats
    materias.py      # CRUD materias + calificaciones + por docente + stats
    db.py            # ping y config
    health.py        # health check
    api_info.py      # índice dinámico de endpoints
```

## 📑 Endpoints Implementados

### Health / Info
| Método | Endpoint                | Descripción              |
|--------|-------------------------|--------------------------|
| GET    | `/health`              | Estado rápido            |
| GET    | `/api/v1/db/ping`      | Ping DB + versión        |
| GET    | `/api/v1`              | Índice de endpoints      |

### Autenticación
| Método | Endpoint                        | Notas |
|--------|----------------------------------|-------|
| POST   | `/api/v1/auth/login`             | Password temporal "123456" |
| GET    | `/api/v1/auth/me`                | Requiere JWT |
| POST   | `/api/v1/auth/refresh`           | Refresh token |
| POST   | `/api/v1/auth/logout`            | Sin estado |
| POST   | `/api/v1/auth/change-password`   | Stub |

### Usuarios
| Método | Endpoint                              | Descripción |
|--------|----------------------------------------|-------------|
| GET    | `/api/v1/users`                        | Lista con filtros y paginación |
| GET    | `/api/v1/users/{id}`                  | Detalle usuario |
| POST   | `/api/v1/users`                       | Crear (JWT) |
| PUT    | `/api/v1/users/{id}`                  | Actualizar (JWT) |
| DELETE | `/api/v1/users/{id}`                  | Baja lógica (JWT) |
| PATCH  | `/api/v1/users/{id}/toggle`           | Cambiar activo (JWT) |
| GET    | `/api/v1/users/stats`                 | Estadísticas (JWT) |

### Fichas
| Método | Endpoint                                    | Descripción |
|--------|----------------------------------------------|-------------|
| GET    | `/api/v1/fichas`                            | Lista fichas |
| GET    | `/api/v1/fichas/{id}`                      | Detalle ficha |
| POST   | `/api/v1/fichas`                           | Crear ficha (JWT) |
| PUT    | `/api/v1/fichas/{id}`                      | Actualizar ficha (JWT) |
| DELETE | `/api/v1/fichas/{id}`                      | Eliminar ficha (JWT) |
| GET    | `/api/v1/fichas/{id}/materias`             | Materias de la ficha |
| GET    | `/api/v1/fichas/{id}/estudiantes`          | Estudiantes (derivados de calificaciones) |
| GET    | `/api/v1/fichas/stats`                     | Estadísticas fichas |

### Materias
| Método | Endpoint                                         | Descripción |
|--------|--------------------------------------------------|-------------|
| GET    | `/api/v1/materias`                               | Lista con filtros |
| GET    | `/api/v1/materias/{id}`                         | Detalle materia |
| POST   | `/api/v1/materias`                              | Crear materia (JWT) |
| PUT    | `/api/v1/materias/{id}`                         | Actualizar materia (JWT) |
| DELETE | `/api/v1/materias/{id}`                         | Eliminar materia (JWT) |
| GET    | `/api/v1/materias/{id}/calificaciones`          | Calificaciones de la materia |
| GET    | `/api/v1/materias/docente/{docenteId}`          | Materias por docente |
| GET    | `/api/v1/materias/stats`                        | Estadísticas materias |

## 🧪 Ejemplos Rápidos (curl)
```bash
# Login (temporal)
curl -s -X POST http://127.0.0.1:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@academia.com","password":"123456"}'

# Listar usuarios
curl -s http://127.0.0.1:8000/api/v1/users?page=1&pageSize=5

# Crear ficha (requiere token)
TOKEN="<ACCESS_TOKEN>"
curl -s -X POST http://127.0.0.1:8000/api/v1/fichas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"numero":"3000","nombre":"Prueba","fecha_inicio":"2025-01-01","fecha_fin":"2025-12-31"}'
```

## ⚠️ Pendientes / Advertencias
- Login aún no verifica `password_hash` real (usar hash almacenado en BD con bcrypt).
- Falta implementar Calificaciones (CRUD completo + upload Excel).
- Falta Sistema de Notificaciones, Auditoría y Reportes.
- No hay control de permisos por rol todavía (sólo JWT genérico).
- Falta integración frontend con las nuevas rutas de Fichas/Materias.

## 🔜 Próximos Pasos Recomendados
1. Reemplazar password temporal por verificación bcrypt (`verify_password`).
2. CRUD Calificaciones (incluye trigger de estado ya creado en BD).
3. Integrar fichas y materias en frontend (hooks + páginas existentes).
4. Añadir auditoría (middleware) para registrar acciones sensibles.
5. Introducir sistema de permisos por rol para mutaciones.

## 🗄️ Referencias de BD (Resumen Tablas Clave)
| Tabla        | Campos principales |
|--------------|--------------------|
| users        | id, email, password_hash, rol, activo, created_at, updated_at |
| fichas       | id, numero, nombre, fecha_inicio, fecha_fin, coordinador_id, estado |
| materias     | id, codigo, nombre, creditos, horas_semanales, ficha_id, docente_id, estado |
| calificaciones (pendiente API) | id, materia_id, ficha_id, estudiante_documento, nota, estado, trimestre |

## 🧪 Calidad / Estado
- OpenAPI estable (pydantic pin fijado).
- Respuestas uniformes `{success, data, pagination}` para listas.
- Hashing de passwords activo al crear/actualizar usuario.

---
Si necesitas ampliar con ejemplos específicos (frontend fetch, modelos TS, etc.) avísame y generamos una segunda sección.
