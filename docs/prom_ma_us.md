Actúa como un redactor técnico especializado en manuales de usuario para sistemas académicos reales en desarrollo.

Necesito que redactes un MANUAL DE USUARIO del proyecto:

“Sistema de Gestión Académica (SIGA) – SENA”

⚠️ CONDICIONES OBLIGATORIAS:
- Documenta ÚNICAMENTE las funcionalidades que estén IMPLEMENTADAS y VISIBLES en la interfaz del sistema.
- NO inventes módulos, pantallas ni flujos que no existan.
- Si una funcionalidad está incompleta, indícalo claramente como:
  “En desarrollo” o “Pendiente”.
- Si una funcionalidad fue eliminada del proyecto, NO la documentes.
- Todo el contenido debe dejar explícito que el sistema está en desarrollo y sujeto a cambios.
- Describe el sistema tal como lo usa el usuario final, no como desarrollador.

📌 CONTEXTO GENERAL DEL SISTEMA (ajustar solo si existe):
- Aplicación web académica interna del SENA.
- Los estudiantes NO ingresan al sistema; solo reciben notificaciones por correo electrónico.
- Roles activos: Docente, Coordinador y Administrador.
- Flujo principal actual basado en la carga de archivos Excel.
- Backend desarrollado con FastAPI.
- Frontend desarrollado con React.
- Entorno principal de uso: navegador web moderno.

📘 EL MANUAL DE USUARIO DEBE INCLUIR:

1. Portada
   - Nombre del sistema
   - Autor
   - Rol (Desarrollador del sistema)
   - Institución
   - Nota aclaratoria indicando que el contenido refleja el estado actual del proyecto.

2. Introducción
   - Descripción general del sistema.
   - Alcance funcional actual (qué hace y qué no hace).

3. Requisitos para acceder al sistema
   - Credenciales
   - Navegador
   - Conectividad
   - Aclarar que el sistema debe estar previamente desplegado.

4. Flujo general de uso
   - Inicio de sesión
   - Acceso a dashboards según rol
   - Cierre de sesión

5. Uso del sistema por rol (SOLO lo implementado):
   - Docente:
     • Funciones disponibles reales
     • Carga de archivos Excel
     • Previsualización y validación
     • Consulta básica de información
   - Coordinador:
     • Acceso al dashboard
     • Visualización de métricas
     • Aclarar carácter consultivo del rol
   - Administrador:
     • Gestión real de usuarios
     • Gestión de fichas y materias
     • Carga de archivos Excel
     • Dashboard administrativo

6. Navegación dentro de la interfaz
   - Menús y accesos principales
   - Aclarar que los nombres pueden variar según versión.

7. Manejo de errores visibles para el usuario
   - Credenciales inválidas
   - Errores de validación de Excel
   - Indisponibilidad del backend
   - Problemas de carga visual

8. Buenas prácticas de uso
   - Preparación correcta de archivos Excel
   - Verificación de datos antes de guardar
   - Cierre de sesión adecuado

9. Funcionalidades pendientes o en desarrollo
   - Listar solo si son visibles o conocidas por el usuario.

10. Glosario de términos
   - Definir conceptos usados en la interfaz.

11. Conclusiones
   - Resumen del alcance actual del sistema.
   - Aclaración de que el sistema continúa en evolución.

🧠 ESTILO Y TONO:
- Lenguaje claro, formal y comprensible.
- No usar lenguaje técnico profundo.
- Redacción académica adecuada para entrega en el SENA.
- Enfoque en el uso real del sistema.

🎯 OBJETIVO FINAL:
Generar un MANUAL DE USUARIO honesto, coherente con la interfaz actual del sistema, listo para entrega académica y explícitamente sujeto a cambios conforme avance el desarrollo.
