Actúa como un ingeniero de software senior encargado de documentar un proyecto académico real en desarrollo.

Necesito que redactes un MANUAL TÉCNICO del proyecto:

“Sistema de Gestión Académica (SIGA) – SENA”

⚠️ CONDICIONES OBLIGATORIAS:
- Documenta ÚNICAMENTE lo que esté IMPLEMENTADO y VERIFICABLE en el proyecto.
- NO inventes módulos, flujos, integraciones ni funcionalidades futuras.
- Si una funcionalidad está incompleta, márcala claramente como:
  “En desarrollo” o “Pendiente”.
- Si una funcionalidad fue eliminada del proyecto, NO la documentes.
- Todo el contenido debe dejar explícito que el sistema está en desarrollo y sujeto a cambios.

📌 CONTEXTO GENERAL DEL PROYECTO (ajustar solo si existe en el código):
- Backend: Python 3.10+, FastAPI
- Frontend: React + Vite
- Base de datos: MySQL o PostgreSQL (según configuración real)
- ORM: SQLAlchemy (si existe)
- Autenticación: JWT por roles (si está implementada)
- Carga masiva de Excel con Pandas (si existe)
- Control de versiones: Git / GitHub
- Estilos UI: TailwindCSS / Shadcn UI (si existen)
- Contenedores: Docker (solo si existe)
- Entorno principal: Windows (desarrollo)

📘 EL MANUAL TÉCNICO DEBE INCLUIR:

1. Portada
   - Nombre del sistema
   - Autor
   - Institución
   - Nota aclaratoria: “Este documento refleja el estado actual del sistema y está sujeto a cambios.”

2. Introducción técnica
   - Propósito del sistema desde el punto de vista técnico.
   - Alcance actual del proyecto.

3. Estado actual del proyecto
   - Qué módulos están activos.
   - Qué funcionalidades están incompletas o pendientes.

4. Arquitectura del sistema
   - Descripción general cliente–servidor.
   - Comunicación frontend ↔ backend.
   - Manejo de la base de datos (si aplica).

5. Tecnologías utilizadas
   - Describir solo tecnologías realmente usadas.
   - Explicar brevemente para qué se usa cada una.

6. Estructura del proyecto
   - Backend:
     • Estructura de carpetas
     • Responsabilidad de cada módulo
   - Frontend:
     • Estructura del proyecto
     • Componentes principales
     • Manejo de vistas y rutas

7. Backend (FastAPI)
   - Organización del proyecto
   - Endpoints principales (sin listar código completo)
   - Manejo de validaciones y errores (si existe)
   - Configuración básica de ejecución

8. Frontend (React)
   - Estructura general
   - Manejo de estados y vistas
   - Comunicación con la API
   - Manejo de errores de UI (si existe)

9. Autenticación y control de acceso
   - Describir JWT y roles SOLO si está implementado.
   - Si está parcial, indicarlo claramente.

10. Carga de archivos Excel
   - Flujo técnico real de carga, validación y guardado.
   - Manejo de errores y previsualización.

11. Manejo de errores y logs
   - Comportamiento actual del sistema ante fallos.
   - Diferencias entre entorno de desarrollo y producción (si aplica).

12. Requisitos del entorno de desarrollo
   - Software necesario
   - Versiones recomendadas

13. Pasos de arranque (entorno de desarrollo – Windows)
   - Backend FastAPI
   - Frontend Vite / React
   - Acceso local

14. Limitaciones actuales del sistema
   - Técnicas
   - Funcionales

15. Consideraciones de escalabilidad futura
   - Aclarando que son proyecciones, no funcionalidades actuales.

16. Conclusiones técnicas

🧠 ESTILO Y TONO:
- Técnico, claro y profesional.
- Lenguaje académico adecuado para el SENA.
- Sin exageraciones ni promesas futuras.
- Fiel al código existente.

🎯 OBJETIVO FINAL:
Generar un MANUAL TÉCNICO realista, coherente con el proyecto actual, listo para entrega académica y sujeto a cambios conforme evolucione el sistema.
