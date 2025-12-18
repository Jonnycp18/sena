
  # Sistema de Gestión Educativa

  Backend oficial: FastAPI en `backend_fastapi/`. La carpeta `backend/` (Node/Express) quedó deprecada y ha sido retirada del flujo de ejecución. Usa los pasos en `docs/INICIO_BACKEND.md` para levantar el API.

  This is a code bundle for Sistema de Gestión Educativa. The original project is available at https://www.figma.com/design/mzApsaYP0u4T4YCplafaqs/Sistema-de-Gesti%C3%B3n-Educativa.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  
  ## Infraestructura de Correo (Desactivada por defecto)

  Se añadió soporte para generación de correos automáticos sobre evidencias pendientes sin activar el envío real mientras la BD es de prueba.

  ### Variables de entorno

  | Variable | Default | Descripción |
  |----------|---------|-------------|
  | `EMAIL_ENABLED` | `false` | Si `true` envía correos reales. Mantener `false` en pruebas. |
  | `SMTP_HOST` | `localhost` | Host SMTP (Mailhog recomendado para dev). |
  | `SMTP_PORT` | `1025` | Puerto SMTP. 1025 típico Mailhog. |
  | `SMTP_USER` | `` | Usuario opcional si servidor requiere auth. |
  | `SMTP_PASSWORD` | `` | Password opcional. |
  | `EMAIL_FROM` | `noreply@example.local` | Remitente usado en los correos. |

  ### Endpoints mantenimiento (solo Administrador)

  Prefijo: `/api/v1/maintenance/emails`

  - `GET /status` estado configuración.
  - `GET /pending-evidencias/dry-run?limit=50` vista previa sin envío.
  - `POST /pending-evidencias/trigger?limit=50` intenta enviar (solo si `EMAIL_ENABLED=true`).

  ### Lógica de pendientes

  Se consideran pendientes evidencias con `letra` NULL o `'-'`. Se agrupan por estudiante y se incluyen con faltas >= umbral (5). Destinatarios: usuarios activos rol `Coordinador` o `Docente`.

  Activar envío (entorno controlado):

  ```bash
  export EMAIL_ENABLED=true
  export SMTP_HOST=mailhog
  export SMTP_PORT=1025
  export EMAIL_FROM=notificaciones@mi-dominio.local
  ```

  Mientras `EMAIL_ENABLED=false` todo opera en modo seguro (dry). 
