# Scripts de Desarrollo (no producción)

Esta carpeta agrupa scripts útiles durante el desarrollo y demos:

- `ARREGLAR_PROYECTO.bat/.sh`: limpia `node_modules` y reinstala dependencias.
- `INICIAR_TODO.sh`: instala y levanta frontend/backend para pruebas locales.
- `SETUP_BACKEND.sh`: asistente para preparar entorno de backend Node (legacy).
- `SETUP_DB.bat/.sh`: crea base y usuario locales en PostgreSQL.
- `CREAR_BASE_DATOS.bat/.sh` + `SETUP_DATABASE_COMPLETO.sql`: crea estructura y datos de ejemplo.
- `extensions.json`, `settings.json`: recomendaciones de VS Code.

No deben incluirse en despliegues de producción.
- Para producción usa el backend FastAPI (`backend_fastapi/`) y el build del frontend (`dist`).
- Para clonar la base real usa los scripts en `database/` y el dump `full_dump_produccion.sql`.
