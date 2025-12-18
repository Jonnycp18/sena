# Sistema de Gestión Académica (SIGA) – SENA

Autor: Jonny Ricardo Guzmán Ramírez  
Institución: Servicio Nacional de Aprendizaje (SENA)

Nota aclaratoria: Este documento refleja el estado actual del sistema y está sujeto a cambios conforme evolucione el proyecto.

## 1. Introducción técnica
Propósito: SIGA centraliza procesos académicos internos con un enfoque actual en carga/validación de datos desde Excel, gestión de usuarios, fichas y materias, y visualización por rol. 

Alcance actual: 
- Frontend React + Vite con componentes para dashboards por rol, gestión de entidades y carga de archivos Excel.
- Backend FastAPI levantable vía `uvicorn` (módulo `backend_fastapi.app.main:app`).
- Autenticación basada en tokens (JWT) y control de acceso por roles en frontend.
- Auditoría de eventos en frontend (registro de acciones) y módulos de notificaciones visibles en UI.

## 2. Estado actual del proyecto
Módulos activos (verificados en la interfaz/código):
- Autenticación: pantalla de login, sesión y cierre de sesión (`components/LoginPage.tsx`, `hooks/useAuth.tsx`).
- Dashboards por rol: Administrador, Coordinador, Docente (`components/dashboards/*`).
- Gestión de usuarios: listado, búsqueda, formularios (`components/UserManagement.tsx`).
- Gestión de fichas y materias: CRUD, detalle, filtros (`components/FichasMateriasManagement.tsx`, `components/FichaForm.tsx`, `components/MateriaForm.tsx`, `components/FichaDetail.tsx`).
- Carga de archivos Excel: mapeo, validación, previsualización, guardado, métricas (`components/FileUploadManagement.tsx`).
- Auditoría: página y tabla (`components/AuditLogPage.tsx`, `components/AuditLogTable.tsx`), `hooks/useAuditLog.tsx`.
- Notificaciones: campana y centro (`components/NotificationBell.tsx`, `components/NotificationCenter.tsx`, `components/NotificationList.tsx`).

Funcionalidades en desarrollo/pendientes (marcadas en código/docs):
- Actualización de perfil y cambio de contraseña con endpoints definitivos (`hooks/useAuth.tsx`: TODO). 
- Reportes/analytics avanzados (sección `components/reports/*` presente, alcance sujeta a evolución).
- Detalles de persistencia de auditoría en backend (visible UI, integración completa sujeta a confirmación).

## 3. Arquitectura del sistema
- Cliente–Servidor: Aplicación SPA (React/Vite) que consume APIs del backend FastAPI.
- Comunicación frontend ↔ backend: módulo `utils/api` para login (tokens), `me`, listados de usuarios, fichas y materias, dashboards y operaciones de carga.
- Base de datos: La UI y endpoints sugieren persistencia real; el tipo/ORM específico no se confirma en el código visible. Estado: Pendiente de documentación final (según `backend_fastapi`).

## 4. Tecnologías utilizadas (verificadas)
- React + Vite: Frontend y desarrollo local.
- FastAPI (Python 3.10+): Backend y APIs.
- TailwindCSS + Shadcn UI: Componentes y estilos (carpeta `components/ui/*`).
- XLSX (SheetJS): Parseo/lectura de archivos Excel en el frontend (`components/FileUploadManagement.tsx`).
- `Web Worker`: Procesamiento de Excel sin bloquear la UI (`utils/excelWorker.ts`).
- Sonner: Notificaciones UI (`toast` en múltiples componentes).

En evaluación/pendiente (no documentado como implementado): 
- ORM SQLAlchemy, Pandas en backend, Docker.

## 5. Estructura del proyecto
Frontend (parcial relevante):
- `components/`  
  - `LoginPage.tsx`, `LogoutButton.tsx`  
  - Dashboards: `dashboards/AdminDashboard.tsx`, `CoordinadorDashboard.tsx`, `DocenteDashboard.tsx`  
  - Gestión: `UserManagement.tsx`, `FichasMateriasManagement.tsx`, `FichaForm.tsx`, `MateriaForm.tsx`, `FichaDetail.tsx`  
  - Carga Excel: `FileUploadManagement.tsx`  
  - Auditoría: `AuditLogPage.tsx`, `AuditLogTable.tsx`  
  - UI: `components/ui/*` (Shadcn)
- `hooks/`  
  - `useAuth.tsx`, `useAuditLog.tsx`, `useNotifications.tsx`
- `utils/`  
  - `api` (APIs de backend), `excelWorker.ts`, `uploadNotifications.ts`, `auditLogger.ts`

Backend:
- `backend_fastapi/`  
  - `app/` (app FastAPI), `requirements.txt`, `migrations/`, `scripts/`, `tests/`
  - Arranque: `uvicorn backend_fastapi.app.main:app`

## 6. Backend (FastAPI)
Organización: aplicación FastAPI dentro de `backend_fastapi/app`. 

Endpoints principales (a partir del consumo en frontend y docs):
- Autenticación: `POST /auth/login`, `GET /auth/me` (tokens y datos de usuario).
- Usuarios: `GET /users` (listado paginado).
- Fichas y Materias: `GET /fichas`, `GET /materias` (listado paginado), operaciones CRUD (según UI).
- Dashboards: métricas y actividad (administrador/coordinador/docente).
- Cargas: endpoints para procesar/guardar información cargada.

Validaciones/errores: el frontend maneja errores de API; el backend debe responder con mensajes y códigos adecuados (detalles específicos sujetos a confirmación en `app/`).

Ejecución:
```bash
.venv\Scripts\activate
".venv\Scripts\python.exe" -m uvicorn backend_fastapi.app.main:app --host 127.0.0.1 --port 8000 --reload
```

## 7. Frontend (React)
Estructura: componentes por dominio (auth, dashboards, gestión, carga, auditoría, notificaciones) y librería UI.

Estados y vistas:
- `useAuth`: usuario, login/logout, `isAuthenticated`, carga inicial con `me`.
- Dashboards: carga de estadísticas/actividad vía `api` y render de tarjetas/tablas.
- Gestión: listados con filtros y formularios, fallback a datos locales cuando el backend no responde.
- Carga Excel: estados de archivo, columnas disponibles, mapeo, preview, resumen y guardado.

Comunicación API: centralizada en `utils/api` (login, tokens, me, listados, dashboards, operaciones). 

Errores de UI: alertas en login, toasts en listados, validaciones visibles en carga Excel.

## 8. Autenticación y control de acceso
- Tokens/JWT: `useAuth` consume `api.login` para obtener tokens y `api.me` para obtener el usuario. Maneja `api.getTokens()` y `api.clearTokens()`.
- Roles: `admin`, `coordinador`, `docente` reflejados en menús y dashboards.
- Estado: Implementado en frontend y consumiendo endpoints básicos. Integración completa de políticas de backend: sujeta a confirmación.

## 9. Carga de archivos Excel (flujo técnico)
- Selección de archivo y lectura con `XLSX` en un `Web Worker` para no bloquear la UI.
- Detección de columnas: documento, nombre, apellido, correo, evidencias.
- Mapeo manual de columnas y previsualización de filas.
- Validación: errores y advertencias por fila/campo/valor.
- Resumen por evidencia: totales, `A`, `D`, pendientes y no entregadas (`-`).
- Guardado: envío de evidencias seleccionadas y/o configuración al backend (según endpoints).
- Notificaciones UI: éxito, errores, advertencias.

## 10. Manejo de errores y logs
- Frontend: 
  - Login: mensajes de credenciales inválidas.
  - Gestión: fallback a datos locales si el backend falla.
  - Carga Excel: visualización de errores de validación por fila/campo.
- Auditoría: `useAuditLog` registra eventos (acciones, rol, estado) y los muestra en `AuditLogPage`.
- Entorno: comportamiento puede variar entre desarrollo y producción (reload, tiempos, disponibilidad).

## 11. Requisitos del entorno de desarrollo
- Windows (desarrollo principal).
- Python 3.10+ (para FastAPI).
- Node.js + npm (para Vite/React).
- Navegador moderno.

## 12. Pasos de arranque (Windows)
Backend FastAPI:
```bash
.venv\Scripts\activate
".venv\Scripts\python.exe" -m uvicorn backend_fastapi.app.main:app --host 127.0.0.1 --port 8000 --reload
```

Frontend Vite:
```bash
npm install
npm run dev
```

Acceso local:
- Abrir `http://localhost:5173/` y verificar login + dashboards.

## 13. Limitaciones actuales
Técnicas:
- Persistencia/ORM en backend no confirmada en este análisis.
- Integración completa de reportes y analytics: parcial.

Funcionales:
- Actualización de perfil/cambio de contraseña: en desarrollo.
- Estudiantes sin acceso.

## 14. Consideraciones de escalabilidad futura (no implementadas)
- Persistencia y optimización de consultas.
- Colas de tareas para procesamiento de cargas.
- Instrumentación y métricas de rendimiento.

## 15. Conclusiones técnicas
SIGA, en su estado actual, ofrece un frontend robusto para autenticación por rol, gestión de entidades y carga/validación de Excel, apoyado por un backend FastAPI operativo. Las áreas pendientes (persistencia detallada, endpoints avanzados, analytics) están sujetas a evolución del proyecto. Este documento se limita a lo verificado en código y UI.
