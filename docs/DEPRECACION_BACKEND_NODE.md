# Deprecación del Backend Node/Express

El backend basado en Node/Express (carpeta `backend/`) ha sido deprecado y reemplazado por el backend en FastAPI (`backend_fastapi/`).

- No instales dependencias en `backend/` ni inicies sus scripts.
- Toda la configuración y ejecución del API se hace desde `backend_fastapi/`.
- Si necesitas revisar el código antiguo con fines históricos, mantén la carpeta sin ejecutarla. Podemos eliminarla definitivamente en un commit si lo deseas.

## Razones
- Homogeneizar el stack y simplificar despliegue.
- Mejor integración con los planes de carga de Excel (pandas) y auditoría.
- Unificar pool de conexiones a PostgreSQL con psycopg3.

## Próximos pasos
- Mantener actualizados los requirements.
- Migrar autenticación a verificación real con bcrypt.
- Implementar carga/export de calificaciones con pandas/openpyxl.
