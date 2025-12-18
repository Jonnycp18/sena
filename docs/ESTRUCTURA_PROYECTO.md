# 📂 Estructura del Proyecto - Sistema de Gestión Académica

Esta documentación explica la organización completa del proyecto, qué hace cada carpeta, componente y archivo.

---

## 🌳 Árbol de Estructura General

```
sistema-gestion-academica/
├── 📁 components/           # Todos los componentes React
│   ├── 📁 ui/              # Componentes base de ShadCN
│   ├── 📁 dashboards/      # Dashboards por rol
│   ├── 📁 figma/           # Componentes de sistema
│   └── 📄 *.tsx            # Componentes principales
├── 📁 hooks/               # Custom hooks de React
├── 📁 styles/              # Estilos globales CSS
├── 📁 guidelines/          # Documentación del proyecto
├── 📄 App.tsx              # Componente raíz de la aplicación
├── 📄 main.tsx             # Punto de entrada de React
├── 📄 index.html           # HTML base
├── 📄 package.json         # Dependencias del proyecto
├── 📄 vite.config.ts       # Configuración de Vite
└── 📄 tsconfig.json        # Configuración de TypeScript
```

---

## 📁 Descripción Detallada de Carpetas

### 1. `/components` - Componentes React

Esta es la carpeta más importante. Contiene TODOS los componentes de la interfaz.

#### 📂 `/components/ui/` - Componentes Base (ShadCN)

**Propósito:** Componentes reutilizables de bajo nivel para construir la UI.

Son componentes de **ShadCN UI**, una biblioteca de componentes pre-construidos y accesibles.

**Archivos importantes:**

| Archivo | Descripción | Uso |
|---------|-------------|-----|
| `button.tsx` | Botones con diferentes variantes | Login, formularios, acciones |
| `input.tsx` | Campos de texto | Formularios en todo el proyecto |
| `card.tsx` | Tarjetas contenedoras | Dashboards, estadísticas |
| `dialog.tsx` | Modales/diálogos | Formularios emergentes |
| `table.tsx` | Tablas de datos | Listados de usuarios, fichas |
| `select.tsx` | Selectores dropdown | Selección de roles, estados |
| `badge.tsx` | Etiquetas de estado | Estados: activo/inactivo |
| `avatar.tsx` | Avatar de usuario | Perfil, sidebar |
| `sidebar.tsx` | Barra lateral navegable | Menú principal |
| `tabs.tsx` | Pestañas | Cambiar entre secciones |
| `sonner.tsx` | Notificaciones toast | Mensajes de éxito/error |
| `chart.tsx` | Gráficos | Estadísticas en dashboards |

**🔒 IMPORTANTE:** NO modifiques estos archivos a menos que sepas lo que haces. Son componentes base estándar.

---

#### 📂 `/components/dashboards/` - Dashboards por Rol

**Propósito:** Vistas principales que ve cada tipo de usuario al iniciar sesión.

| Archivo | Rol | Descripción |
|---------|-----|-------------|
| `AdminDashboard.tsx` | Administrador | Vista general del sistema, estadísticas de usuarios, métricas globales |
| `CoordinadorDashboard.tsx` | Coordinador | KPIs académicos, seguimiento de fichas, reportes de materias |
| `DocenteDashboard.tsx` | Docente | Resumen de tareas asignadas, calificaciones pendientes |

**Cuándo modificar:**
- Quieres agregar nuevas estadísticas
- Cambiar la distribución de las tarjetas
- Agregar/quitar gráficos

---

#### 📂 `/components/figma/` - Componentes de Sistema

**Propósito:** Componentes internos del sistema. **NO modificar.**

| Archivo | Descripción |
|---------|-------------|
| `ImageWithFallback.tsx` | Maneja imágenes con fallback automático en caso de error |

---

#### 📄 Componentes Principales en `/components/`

Estos son los componentes clave de tu aplicación:

##### **🔐 Autenticación**

| Archivo | Descripción | Cuándo modificar |
|---------|-------------|------------------|
| `LoginPage.tsx` | Página de inicio de sesión | Cambiar diseño del login, agregar "Recordarme" |

##### **🧭 Navegación y Layout**

| Archivo | Descripción | Cuándo modificar |
|---------|-------------|------------------|
| `MainLayout.tsx` | Layout principal con sidebar y área de contenido | Cambiar estructura general de la app |
| `AppSidebar.tsx` | Barra lateral con menú de navegación | Agregar/quitar opciones del menú |

##### **👤 Gestión de Usuarios**

| Archivo | Descripción | Cuándo modificar |
|---------|-------------|------------------|
| `UserManagement.tsx` | Lista y gestión de usuarios (tabla, filtros, acciones) | Agregar columnas, filtros, exportar datos |
| `UserForm.tsx` | Formulario para crear/editar usuarios | Agregar campos al formulario de usuario |

##### **📋 Fichas y Materias**

| Archivo | Descripción | Cuándo modificar |
|---------|-------------|------------------|
| `FichasMateriasManagement.tsx` | Gestión completa de fichas y materias | Cambiar la vista principal de fichas |
| `FichaForm.tsx` | Formulario para crear/editar fichas | Agregar campos a fichas |
| `MateriaForm.tsx` | Formulario para crear/editar materias | Agregar campos a materias |
| `FichaDetail.tsx` | Vista detallada de una ficha específica | Mostrar más información de la ficha |

##### **📤 Carga de Archivos**

| Archivo | Descripción | Cuándo modificar |
|---------|-------------|------------------|
| `FileUploadManagement.tsx` | Sistema avanzado de carga Excel con:<br>• Configuración inicial vs actualización<br>• Estados de evidencias (pendiente/calificada)<br>• Manejo inteligente de notificaciones<br>• Fechas límite por tarea<br>• Historial de cargas | Cambiar validaciones, agregar nuevos estados, modificar lógica de notificaciones |

##### **📊 Reportes y Analytics**

| Archivo | Descripción | Cuándo modificar |
|---------|-------------|------------------|
| `reports/ReportsPage.tsx` | Página principal de reportes con tabs y filtros | Agregar nuevas secciones de reportes |
| `reports/ReportFilters.tsx` | Componente de filtros avanzados (periodo, materia, etc.) | Agregar nuevos filtros o modificar opciones |
| `reports/AnalyticsDashboard.tsx` | Dashboard con gráficas interactivas (Recharts):<br>• KPIs principales<br>• Gráficas de barras, líneas, torta, radar<br>• Resumen por materia | Agregar nuevas gráficas, modificar métricas |
| `reports/StudentReport.tsx` | Reporte individual y listado de estudiantes:<br>• Tabla con búsqueda<br>• Vista detallada por estudiante<br>• Desempeño por materia | Cambiar columnas, agregar filtros específicos |
| `reports/SubjectReport.tsx` | Análisis por materia:<br>• Estadísticas detalladas<br>• Distribución de estudiantes<br>• Comparativa entre materias | Modificar métricas de materia |
| `reports/ComparativeReport.tsx` | Reportes comparativos:<br>• Por fichas<br>• Por docentes<br>• Por periodos<br>• Evolución mensual | Agregar nuevas dimensiones de comparación |

##### **🔔 Sistema de Notificaciones**

| Archivo | Descripción | Cuándo modificar |
|---------|-------------|------------------|
| `NotificationBell.tsx` | Campana con badge en navbar:<br>• Popover con últimas 5<br>• Contador de no leídas<br>• Navegación al centro | Cambiar cantidad de preview o diseño |
| `NotificationList.tsx` | Lista de notificaciones con filtros:<br>• Modo compacto/completo<br>• Scroll área<br>• Estado vacío | Agregar nuevos filtros |
| `NotificationItem.tsx` | Item individual:<br>• 5 tipos (info/success/warning/error/task)<br>• Metadatos<br>• Acciones | Modificar diseño de items |
| `NotificationCenter.tsx` | Página completa de gestión:<br>• 4 KPIs<br>• Tabs de filtrado<br>• Preferencias | Agregar secciones o configuración |

##### **👨‍💼 Perfil de Usuario**

| Archivo | Descripción | Cuándo modificar |
|---------|-------------|------------------|
| `ProfilePage.tsx` | Página de perfil del usuario | Cambiar layout del perfil |
| `ProfileStats.tsx` | Estadísticas del perfil | Agregar/quitar métricas |
| `ProfileActivityLog.tsx` | Historial de actividad del usuario | Cambiar formato del log |
| `PasswordChangeDialog.tsx` | Modal para cambiar contraseña | Agregar validaciones de contraseña |

---

### 2. `/hooks` - Custom Hooks

**Propósito:** Lógica reutilizable de React.

| Archivo | Descripción | Funciones principales |
|---------|-------------|----------------------|
| `useAuth.tsx` | Manejo completo de autenticación | `login()`, `logout()`, `isAuthenticated`, `user`, `userRole` |

**Cuándo modificar:**
- Agregar nuevos roles
- Cambiar la lógica de autenticación
- Agregar persistencia (localStorage, cookies)

---

### 3. `/styles` - Estilos Globales

| Archivo | Descripción |
|---------|-------------|
| `globals.css` | Estilos globales con Tailwind CSS v4, variables CSS, tema claro/oscuro |

**Variables CSS importantes:**
```css
--primary: Color principal del sistema
--background: Color de fondo
--foreground: Color de texto
--radius: Bordes redondeados
--sidebar: Color del sidebar
```

**Cuándo modificar:**
- Cambiar colores del tema
- Ajustar tamaños de fuente
- Personalizar el modo oscuro

---

### 4. `/guidelines` - Documentación

| Archivo | Descripción |
|---------|-------------|
| `Guidelines.md` | Guía de desarrollo y estándares del proyecto |

---

## 📄 Archivos de Configuración (Raíz)

### Archivos de React

| Archivo | Descripción | ¿Modificar? |
|---------|-------------|-------------|
| `App.tsx` | Componente raíz, maneja autenticación y routing básico | ✅ Solo para agregar providers globales |
| `main.tsx` | Punto de entrada de React, inicializa la app | ❌ Raramente |
| `index.html` | HTML base, carga el script principal | ❌ Solo para meta tags o favicons |

### Archivos de Configuración

| Archivo | Descripción | ¿Modificar? |
|---------|-------------|-------------|
| `package.json` | Dependencias del proyecto | ✅ Al instalar nuevos paquetes |
| `vite.config.ts` | Configuración del bundler Vite | ❌ Solo para cambios avanzados |
| `tsconfig.json` | Configuración de TypeScript | ❌ Raramente |

---

## 🔄 Flujo de la Aplicación

### 1️⃣ Inicio de la App

```
index.html
    ↓
main.tsx (carga React y estilos)
    ↓
App.tsx (AuthProvider)
    ↓
¿Usuario autenticado?
    ├─ NO → LoginPage.tsx
    └─ SÍ → MainLayout.tsx
```

### 2️⃣ Después del Login

```
MainLayout.tsx
    ├─ AppSidebar.tsx (menú lateral)
    └─ Contenido principal (según navegación)
        ├─ Dashboard (según rol)
        │   ├─ AdminDashboard.tsx
        │   ├─ CoordinadorDashboard.tsx
        │   └─ DocenteDashboard.tsx
        ├─ UserManagement.tsx (Gestión de usuarios)
        ├─ FichasMateriasManagement.tsx (Fichas y materias)
        ├─ FileUploadManagement.tsx (Carga de Excel)
        └─ ProfilePage.tsx (Perfil del usuario)
```

### 3️⃣ Navegación por Secciones

El usuario navega usando el **AppSidebar**:

```
AppSidebar.tsx → MainLayout.tsx cambia el contenido
```

El sidebar muestra opciones según el **rol del usuario**:

- **Administrador:** Todas las opciones
- **Coordinador:** Dashboard, Fichas, Perfil
- **Docente:** Dashboard, Carga de archivos, Perfil

---

## 🎯 ¿Dónde Hacer Cambios Comunes?

### 🎨 Cambiar Colores del Sistema

**Archivo:** `/styles/globals.css`

Busca la sección `:root` y modifica:
```css
--primary: #030213;        /* Color principal */
--background: #ffffff;      /* Fondo */
```

---

### ➕ Agregar un Nuevo Campo a Usuarios

**Archivos a modificar:**

1. **`hooks/useAuth.tsx`** - Actualizar el tipo `User`:
```typescript
export interface User {
  username: string;
  name: string;
  email: string;
  role: UserRole;
  nuevoCampo: string; // ← Agregar aquí
}
```

2. **`components/UserForm.tsx`** - Agregar el input en el formulario

3. **`components/UserManagement.tsx`** - Agregar columna en la tabla

---

### 📊 Agregar una Nueva Estadística al Dashboard

**Archivo:** Según el rol
- Admin: `components/dashboards/AdminDashboard.tsx`
- Coordinador: `components/dashboards/CoordinadorDashboard.tsx`
- Docente: `components/dashboards/DocenteDashboard.tsx`

**Pasos:**
1. Crear un nuevo componente `Card` con la estadística
2. Usar componentes de `components/ui/` para el diseño
3. Agregar datos mock o conectar con datos reales

---

### 🔐 Agregar un Nuevo Rol de Usuario

**Archivos a modificar:**

1. **`hooks/useAuth.tsx`:**
```typescript
export type UserRole = 'admin' | 'coordinador' | 'docente' | 'nuevoRol';
```

2. **`components/AppSidebar.tsx`:**
```typescript
// Agregar opciones del menú para el nuevo rol
if (userRole === 'nuevoRol') {
  // ... opciones específicas
}
```

3. **`components/UserForm.tsx`:**
```typescript
// Agregar opción en el select de roles
<option value="nuevoRol">Nuevo Rol</option>
```

4. Crear nuevo dashboard: `components/dashboards/NuevoRolDashboard.tsx`

---

### 🧭 Agregar una Nueva Sección al Menú

**Archivo:** `components/AppSidebar.tsx`

**Pasos:**

1. Crear el componente de la nueva sección (ej: `MiNuevaSeccion.tsx`)

2. En `AppSidebar.tsx`, agregar el item del menú:
```typescript
<SidebarMenuItem>
  <SidebarMenuButton onClick={() => setActiveSection('nuevaSeccion')}>
    <IconoRelevante />
    <span>Mi Nueva Sección</span>
  </SidebarMenuButton>
</SidebarMenuItem>
```

3. En `MainLayout.tsx`, agregar el caso:
```typescript
{activeSection === 'nuevaSeccion' && <MiNuevaSeccion />}
```

---

### 📤 Modificar el Formato de Excel Permitido

**Archivo:** `components/FileUploadManagement.tsx`

Busca la función `validateExcelData()` y modifica:
- Columnas requeridas
- Validaciones de datos
- Mensajes de error

---

### 🎨 Cambiar el Diseño del Login

**Archivo:** `components/LoginPage.tsx`

Modifica:
- Layout del formulario
- Colores y estilos
- Agregar logo
- Agregar "Recordarme"

---

## 📚 Componentes Más Importantes

### 🥇 Top 5 - Núcleo del Sistema

1. **`hooks/useAuth.tsx`** - Toda la lógica de autenticación
2. **`App.tsx`** - Punto de entrada, routing básico
3. **`components/MainLayout.tsx`** - Estructura principal post-login
4. **`components/AppSidebar.tsx`** - Navegación principal
5. **`styles/globals.css`** - Estilos y tema del sistema

### 🥈 Componentes de Funcionalidad

6. **`UserManagement.tsx`** - CRUD de usuarios
7. **`FichasMateriasManagement.tsx`** - CRUD de fichas y materias
8. **`FileUploadManagement.tsx`** - Carga de Excel
9. **Dashboards** - Vistas principales por rol

---

## 🔍 Convenciones de Nombres

### Componentes React
- **PascalCase**: `UserManagement.tsx`, `LoginPage.tsx`
- **Terminan en `.tsx`** (TypeScript + JSX)

### Hooks
- **camelCase con prefijo `use`**: `useAuth.tsx`, `useMobile.ts`

### Componentes UI
- **kebab-case**: `input.tsx`, `dropdown-menu.tsx`

### Archivos de configuración
- **kebab-case**: `vite.config.ts`, `package.json`

---

## 📖 Archivos de Documentación

| Archivo | Descripción |
|---------|-------------|
| `LEEME_PRIMERO.md` | Introducción general al proyecto |
| `BIENVENIDA.md` | Mensaje de bienvenida y overview |
| `INICIO_RAPIDO.md` | Guía rápida para empezar |
| `GUIA_VISUAL_STUDIO_CODE.md` | Setup en VS Code |
| `GUIA_MIGRACION_VITE.md` | Guía de migración (la que usaste) |
| `ARQUITECTURA.md` | Arquitectura técnica del sistema |
| `DIAGRAMA_FLUJO.md` | Diagramas de flujo |
| `COMANDOS.md` | Lista de comandos útiles |
| `FAQ.md` | Preguntas frecuentes |
| `VERIFICACION.md` | Checklist de verificación |
| `ESTRUCTURA_PROYECTO.md` | Este archivo |

---

## 🛠️ Herramientas y Tecnologías

### Core
- **React 18** - Framework UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server

### UI y Estilos
- **Tailwind CSS v4** - Framework CSS
- **ShadCN UI** - Componentes base
- **Lucide React** - Iconos

### Librerías Específicas
- **Recharts** - Gráficos y estadísticas
- **XLSX** - Lectura de archivos Excel
- **Sonner** - Notificaciones toast
- **date-fns** - Manejo de fechas
- **Radix UI** - Componentes accesibles (base de ShadCN)

---

## ✅ Checklist de Modificaciones

Antes de hacer cambios, pregúntate:

- [ ] ¿Qué componente necesito modificar?
- [ ] ¿Necesito crear un componente nuevo?
- [ ] ¿Afecta a otros componentes?
- [ ] ¿Necesito actualizar tipos en TypeScript?
- [ ] ¿Necesito modificar el hook de autenticación?
- [ ] ¿Los cambios afectan a todos los roles o solo a uno?

---

## 🎓 Consejos para Modificar el Código

### ✅ Buenas Prácticas

1. **Siempre usa componentes de `components/ui/`**
   - NO crees tus propios botones desde cero
   - Usa: `<Button>` de `components/ui/button.tsx`

2. **Mantén la estructura de carpetas**
   - Componentes nuevos en `/components`
   - Hooks nuevos en `/hooks`

3. **Usa TypeScript correctamente**
   - Define tipos e interfaces
   - No uses `any` a menos que sea absolutamente necesario

4. **Sigue las convenciones de nombres**
   - Componentes: `MiComponente.tsx`
   - Hooks: `useMiHook.tsx`

5. **Importa correctamente**
   ```typescript
   import { Button } from './components/ui/button';  // ✅
   import { useAuth } from './hooks/useAuth';        // ✅
   ```

### ❌ Evita

- ❌ Modificar archivos de `components/ui/` sin razón
- ❌ Crear estilos CSS inline complejos
- ❌ Duplicar componentes en lugar de reutilizar
- ❌ Hardcodear datos que deberían ser dinámicos

---

## 📞 Recursos Adicionales

### Documentación Externa

- **React:** https://react.dev
- **TypeScript:** https://www.typescriptlang.org/docs
- **Tailwind CSS v4:** https://tailwindcss.com
- **ShadCN UI:** https://ui.shadcn.com
- **Vite:** https://vitejs.dev

### Documentación del Proyecto

Lee estos archivos en orden si eres nuevo:

1. `LEEME_PRIMERO.md` - Visión general
2. `INICIO_RAPIDO.md` - Empezar a usar el proyecto
3. `ESTRUCTURA_PROYECTO.md` - Este archivo
4. `ARQUITECTURA.md` - Detalles técnicos
5. `FAQ.md` - Solución de problemas

---

## 🎉 Resumen

| Carpeta | Propósito | ¿Modificas seguido? |
|---------|-----------|---------------------|
| `/components` | Componentes React | ✅ Sí, constantemente |
| `/components/ui` | Componentes base | ❌ Raramente |
| `/components/dashboards` | Dashboards por rol | ✅ Sí, para agregar funcionalidad |
| `/hooks` | Lógica reutilizable | ⚠️ Con cuidado |
| `/styles` | Estilos globales | ⚠️ Solo para temas |

---

**¡Listo!** Ahora tienes una guía completa de la estructura del proyecto. Úsala como referencia cada vez que necesites hacer cambios.

Si tienes dudas específicas sobre algún componente o funcionalidad, revisa el código fuente del archivo correspondiente. Todos los archivos están bien comentados y organizados.