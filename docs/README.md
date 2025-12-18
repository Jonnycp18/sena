# Sistema de Gestión Académica

Un sistema completo de gestión académica desarrollado con React, TypeScript y Tailwind CSS, diseñado para instituciones educativas. Permite gestionar usuarios, programas académicos, materias, calificaciones y generar reportes detallados.

## 🚀 Características Principales

### 🔐 Sistema de Autenticación
- **3 roles diferenciados**: Administrador, Coordinador y Docente
- **Dashboards personalizados** según el rol del usuario
- **Gestión de perfiles** con configuraciones personalizables

### 👥 Gestión de Usuarios
- **CRUD completo** de usuarios del sistema
- **Filtros avanzados** por rol, estado y departamento
- **Asignación de roles** y gestión de permisos
- **Importación/exportación** de datos de usuarios

### 📚 Fichas y Materias
- **Gestión de programas académicos** (fichas técnicas, tecnológicas, profesionales)
- **Administración de materias** con sistema de prerrequisitos
- **Asignación de docentes** a materias específicas
- **Vista de pensum académico** organizada por tipo de materia

### 📊 Carga de Archivos Excel
- **Procesamiento automático** de archivos Excel con calificaciones
- **Mapeo inteligente** de columnas con detección automática
- **Validación robusta** de datos tipo pandas
- **Gestión de errores** detallada por fila

### 📈 Sistema de Reportes
- **Dashboards interactivos** con métricas en tiempo real
- **Estadísticas por rol** y área de conocimiento
- **Seguimiento de progreso** académico

## 🛠️ Stack Tecnológico

- **Frontend Framework**: React 18 con TypeScript
- **Build Tool**: Vite (desarrollo y build de producción)
- **Styling**: Tailwind CSS v4 (con tema personalizado)
- **UI Components**: shadcn/ui (componentes accesibles)
- **Icons**: Lucide React
- **File Processing**: xlsx (procesamiento de archivos Excel)
- **Notifications**: Sonner (toast notifications)
- **Charts**: Recharts (para dashboards)
- **Package Manager**: npm
- **Lenguaje**: TypeScript estricto (.tsx files)

## 📋 Prerrequisitos

Asegúrate de tener instalado en tu sistema:

- **Node.js** (versión 18 o superior) - Para ejecutar Vite y el proyecto
- **npm** (versión 8 o superior) - Gestor de paquetes incluido con Node.js

Verifica las versiones instaladas:
```bash
node --version    # Debe ser v18+ 
npm --version     # Debe ser v8+
```

**¿No tienes Node.js?** Descárgalo desde [nodejs.org](https://nodejs.org/)

---

## 📚 Documentación Disponible

Este proyecto incluye documentación completa y detallada:

### 🎯 Guías de Inicio
- **📄 LEEME_PRIMERO.md** - ⭐ **EMPIEZA AQUÍ** - Instrucciones ultra rápidas
- **🎉 BIENVENIDA.md** - Guía de orientación y mapa de documentación
- **🚀 INICIO_RAPIDO.md** - 3 comandos para arrancar el proyecto
- **🎓 GUIA_VISUAL_STUDIO_CODE.md** - Tutorial completo paso a paso para principiantes

### 🛠️ Soporte y Referencia
- **❓ FAQ.md** - Preguntas frecuentes y solución de problemas comunes
- **✅ VERIFICACION.md** - Checklist para verificar que todo funciona
- **🏗️ ARQUITECTURA.md** - Documentación técnica detallada
- **📊 DIAGRAMA_FLUJO.md** - Diagramas visuales del sistema

### 📖 Documentación Técnica
- **📋 README.md** - Este archivo (documentación principal)
- **📝 guidelines/Guidelines.md** - Guías de desarrollo y estándares de código

---

### 🗺️ ¿Qué documento leer?

| Tu Situación | Lee Este Documento |
|--------------|-------------------|
| 🆕 **Nunca he usado React/Vite** | `LEEME_PRIMERO.md` → `GUIA_VISUAL_STUDIO_CODE.md` |
| 🟢 **Sé React pero no Vite** | `INICIO_RAPIDO.md` |
| 🔴 **Soy desarrollador experimentado** | `npm install && npm run dev` |
| 🐛 **Tengo un problema** | `FAQ.md` |
| ✅ **Quiero verificar instalación** | `VERIFICACION.md` |
| 🏗️ **Quiero entender la arquitectura** | `ARQUITECTURA.md` + `DIAGRAMA_FLUJO.md` |
| 📚 **Quiero explorar el sistema** | `BIENVENIDA.md` |

---

## ⚡ Instalación

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd sistema-gestion-academica
```

### 2. Instalar dependencias principales
```bash
npm install
```

### 3. Instalar dependencias específicas del proyecto
```bash
# Para procesamiento de archivos Excel
npm install xlsx
npm install @types/xlsx --save-dev

# Para notificaciones (si no está instalado)
npm install sonner

# Para iconos (si no está instalado)
npm install lucide-react

# TypeScript types adicionales
npm install @types/node --save-dev
```

### 4. Verificar instalación
Ejecuta el proyecto en modo desarrollo:
```bash
npm run dev
```

El proyecto debería estar disponible en `http://localhost:5173`

## 🚀 Cómo Ejecutar

### Modo Desarrollo (Vite Dev Server)
```bash
npm run dev
```
- Servidor de desarrollo Vite con Hot Module Replacement (HMR)
- TypeScript compilation en tiempo real
- Disponible en `http://localhost:5173`

### Modo Producción
```bash
# Construir el proyecto con Vite
npm run build

# Previsualizar la build de producción
npm run preview
```

### Linting y Formato
```bash
# Ejecutar ESLint
npm run lint

# Revisar tipos de TypeScript
npm run type-check
```

## 🔑 Credenciales de Prueba

El sistema incluye usuarios de prueba para cada rol:

### 👨‍💼 Administrador
- **Email**: `admin@instituto.edu`
- **Contraseña**: `123456`
- **Permisos**: Acceso completo al sistema

### 👨‍🏫 Coordinador
- **Email**: `coordinador@instituto.edu`
- **Contraseña**: `123456`
- **Permisos**: Reportes e indicadores académicos

### 👨‍🎓 Docente
- **Email**: `docente@instituto.edu`
- **Contraseña**: `123456`
- **Permisos**: Carga de archivos y gestión de calificaciones

## 📁 Estructura del Proyecto

```
├── 📄 Archivos de Configuración
│   ├── package.json                # Dependencias y scripts npm
│   ├── vite.config.ts             # Configuración de Vite
│   ├── tsconfig.json              # Configuración TypeScript
│   ├── index.html                 # HTML principal
│   └── main.tsx                   # Punto de entrada JavaScript
│
├── 📚 Documentación (¡EMPIEZA AQUÍ!)
│   ├── README.md                  # 📖 Documentación principal (este archivo)
│   ├── INICIO_RAPIDO.md           # 🚀 Guía de 3 pasos
│   ├── GUIA_VISUAL_STUDIO_CODE.md # 🎓 Tutorial completo paso a paso
│   ├── FAQ.md                     # ❓ Preguntas frecuentes
│   ├── VERIFICACION.md            # ✅ Checklist de funcionamiento
│   ├── ARQUITECTURA.md            # 🏗️ Documentación técnica
│   └── guidelines/
│       └── Guidelines.md          # Guías de desarrollo
│
├── 🎯 Aplicación
│   ├── App.tsx                    # 🚀 Componente principal
│   ├── components/                # 📁 Componentes React
│   │   ├── ui/                   # 🎨 Componentes shadcn/ui (40+)
│   │   ├── dashboards/           # 📊 Dashboards por rol
│   │   ├── LoginPage.tsx         # 🔐 Autenticación
│   │   ├── MainLayout.tsx        # 🏗️ Layout principal
│   │   ├── AppSidebar.tsx        # 🧭 Navegación lateral
│   │   ├── UserManagement.tsx    # 👥 CRUD de usuarios
│   │   ├── FichasMateriasManagement.tsx # 📚 Gestión académica
│   │   ├── FileUploadManagement.tsx # 📄 Carga de archivos Excel
│   │   └── ProfilePage.tsx       # 👤 Perfil de usuario
│   ├── hooks/                    # 🪝 Custom React Hooks
│   │   └── useAuth.tsx           # Hook de autenticación
│   └── styles/                   # 🎨 Estilos
│       └── globals.css           # Tailwind v4 + Variables CSS
│
└── ⚙️ Configuración VS Code
    └── .vscode/
        ├── extensions.json       # Extensiones recomendadas
        └── settings.json         # Configuración del workspace
```

## 🎯 Funcionalidades por Rol

### 🔴 Administrador
- ✅ Dashboard con estadísticas generales del sistema
- ✅ Gestión completa de usuarios (crear, editar, eliminar)
- ✅ Administración de fichas académicas y materias
- ✅ Carga y procesamiento de archivos Excel
- ✅ Acceso a reportes y auditoría
- ✅ Configuración del sistema

### 🔵 Coordinador
- ✅ Dashboard con métricas académicas
- ✅ Visualización de reportes e indicadores
- ✅ Seguimiento de progreso académico
- ✅ Análisis de rendimiento por programa

### 🟢 Docente
- ✅ Dashboard personal con sus materias
- ✅ Carga de archivos Excel con calificaciones
- ✅ Gestión de sus calificaciones
- ✅ Vista de estudiantes asignados

### 🟡 Todos los Roles
- ✅ Gestión de perfil personal
- ✅ Configuración de preferencias
- ✅ Historial de actividad
- ✅ Cambio de contraseña

## 📊 Características Técnicas

### Procesamiento de Archivos Excel
- **Detección automática** de estructura de columnas
- **Mapeo inteligente** de campos (cédula, nombre, calificación)
- **Validación de datos** similar a pandas:
  - Formato de cédulas (7-10 dígitos)
  - Rangos de calificaciones (0-5)
  - Emails válidos
  - Campos requeridos
- **Gestión de errores** con reporte detallado por fila

### UI/UX
- **Diseño responsive** para desktop y móvil
- **Tema claro y oscuro** configurable
- **Componentes accesibles** con shadcn/ui
- **Notificaciones toast** para feedback del usuario
- **Carga progresiva** con estados de loading

### Seguridad
- **Autenticación basada en roles**
- **Rutas protegidas** según permisos
- **Validación de formularios** en cliente y servidor simulado
- **Gestión de sesiones** persistente

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo
npm run build        # Construir para producción
npm run preview      # Previsualizar build de producción

# Calidad de código
npm run lint         # Ejecutar ESLint
npm run type-check   # Verificar tipos TypeScript

# Utilidades
npm run clean        # Limpiar node_modules y reinstalar
```

## 🐛 Solución de Problemas

### Error de dependencias
```bash
# Limpiar caché e instalar de nuevo
rm -rf node_modules package-lock.json
npm install
```

### Errores de TypeScript
```bash
# Verificar tipos
npm run type-check

# Instalar types faltantes
npm install @types/node @types/react @types/react-dom --save-dev
```

### Problemas con archivos Excel
```bash
# Verificar instalación de xlsx
npm list xlsx

# Reinstalar si es necesario
npm uninstall xlsx
npm install xlsx
npm install @types/xlsx --save-dev
```

## 🚧 Próximas Funcionalidades

- [ ] **Sistema de Notificaciones** automáticas
- [ ] **Reportes Avanzados** con gráficos interactivos
- [ ] **Auditoría de Seguridad** completa
- [ ] **API REST** para integración externa
- [ ] **Base de datos** real (PostgreSQL/MySQL)
- [ ] **Autenticación OAuth** 
- [ ] **Exportación de reportes** (PDF/Excel)
- [ ] **Sistema de backup** automático

## 📝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Estándares de Código
- Usar TypeScript estricto
- Seguir convenciones de nombres en español para el dominio
- Componentes funcionales con hooks
- Tailwind CSS para estilos
- Comentarios en español para lógica de negocio

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Equipo de Desarrollo

- **Arquitectura**: Sistema modular con React + TypeScript
- **UI/UX**: shadcn/ui + Tailwind CSS v4
- **Funcionalidades**: Gestión académica completa
- **Testing**: Usuarios de prueba incluidos

## 📞 Soporte

Para soporte técnico o preguntas sobre el proyecto:

1. **Issues**: Crear un issue en GitHub
2. **Documentación**: Revisar `guidelines/Guidelines.md`
3. **Wiki**: Consultar la documentación técnica

---

## 🎉 ¡Gracias por usar el Sistema de Gestión Académica!

Este sistema ha sido diseñado específicamente para instituciones educativas que buscan digitalizar y optimizar sus procesos administrativos y académicos.

**¿Listo para comenzar?** 
```bash
npm install && npm run dev
```

¡Y accede a `http://localhost:5173` para empezar a explorar todas las funcionalidades!