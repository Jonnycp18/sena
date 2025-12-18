# 📊 Diagrama de Flujo del Sistema

Visualización completa del funcionamiento del sistema.

---

## 🚀 Flujo de Inicio de la Aplicación

```
┌─────────────────────────────────────────────────────────────┐
│                    INICIO DE LA APLICACIÓN                  │
└─────────────────────────────────────────────────────────────┘

1. Usuario abre navegador
   └─ http://localhost:5173
        │
        ↓
2. Se carga index.html
        │
        ↓
3. Se ejecuta main.tsx
        │
        ↓
4. Se monta App.tsx
        │
        ↓
5. AuthProvider envuelve la aplicación
        │
        ├─ Verifica si hay sesión guardada
        │  └─ localStorage.getItem('user')
        │
        ↓
6. AppContent decide qué mostrar
        │
        ├─────┬─────────────────────────┐
        │     │                         │
        ↓     ↓                         ↓
   ¿Hay sesión?                    ¿No hay sesión?
        │                               │
        ↓                               ↓
   MainLayout                      LoginPage
```

---

## 🔐 Flujo de Autenticación

```
┌─────────────────────────────────────────────────────────────┐
│                      LOGIN DE USUARIO                       │
└─────────────────────────────────────────────────────────────┘

Usuario en LoginPage
        │
        ↓
Ingresa credenciales
├─ Email: admin@instituto.edu
└─ Password: 123456
        │
        ↓
Hace clic en "Iniciar Sesión"
        │
        ↓
useAuth.login(email, password)
        │
        ├─ 1. Busca usuario en mockUsers
        │     │
        │     ├─ ✅ Usuario encontrado
        │     │    ├─ Password correcto
        │     │    │   └─ Continuar ↓
        │     │    │
        │     │    └─ Password incorrecto
        │     │        └─ Error: "Credenciales inválidas"
        │     │
        │     └─ ❌ Usuario no encontrado
        │          └─ Error: "Usuario no existe"
        │
        ├─ 2. Actualiza estado
        │     ├─ setIsAuthenticated(true)
        │     └─ setCurrentUser(usuario)
        │
        ├─ 3. Guarda en LocalStorage
        │     ├─ localStorage.setItem('isAuthenticated', 'true')
        │     └─ localStorage.setItem('user', JSON.stringify(usuario))
        │
        └─ 4. Registra actividad
              └─ "Usuario inició sesión"
        │
        ↓
App detecta cambio de autenticación
        │
        ↓
Renderiza MainLayout con el Dashboard correspondiente
        │
        └─ Según rol del usuario:
           ├─ Administrador → AdminDashboard
           ├─ Coordinador → CoordinadorDashboard
           └─ Docente → DocenteDashboard
```

---

## 🏗️ Flujo de Navegación Principal

```
┌─────────────────────────────────────────────────────────────┐
│                     MAINLAYOUT STRUCTURE                    │
└─────────────────────────────────────────────────────────────┘

MainLayout
│
├─── AppSidebar (Navegación lateral)
│    │
│    ├─ Header
│    │  ├─ Logo del sistema
│    │  └─ Botón minimizar
│    │
│    ├─ Navegación Principal
│    │  │
│    │  ├─ Dashboard
│    │  │  └─ visible para: todos
│    │  │
│    │  ├─ Gestión de Usuarios
│    │  │  └─ visible para: administrador
│    │  │
│    │  ├─ Fichas y Materias
│    │  │  └─ visible para: administrador
│    │  │
│    │  └─ Carga de Archivos
│    │     └─ visible para: administrador, docente
│    │
│    └─ Footer
│       ├─ Perfil de usuario
│       └─ Cerrar sesión
│
└─── Content Area (Área principal)
     │
     ├─ Breadcrumbs (navegación de migas)
     │
     └─ Vista actual
        ├─ Dashboard
        ├─ Gestión de Usuarios
        ├─ Fichas y Materias
        ├─ Carga de Archivos
        └─ Perfil
```

---

## 👥 Flujo de Gestión de Usuarios (Admin)

```
┌─────────────────────────────────────────────────────────────┐
│                   GESTIÓN DE USUARIOS                       │
└─────────────────────────────────────────────────────────────┘

UserManagement Component
        │
        ├─── Estado inicial
        │    ├─ users: [] (lista de usuarios)
        │    ├─ filteredUsers: [] (usuarios filtrados)
        │    ├─ searchTerm: "" (término de búsqueda)
        │    └─ filters: { rol, estado, departamento }
        │
        ├─── useEffect (al montar)
        │    └─ Carga usuarios desde mockUsers
        │       └─ setUsers(mockUsers)
        │
        └─── Renderiza
             │
             ├─── Header
             │    ├─ Título: "Gestión de Usuarios"
             │    └─ Botón: "Crear Usuario"
             │         │
             │         └─ onClick → Abre UserForm (modo crear)
             │
             ├─── Barra de búsqueda y filtros
             │    │
             │    ├─ Input de búsqueda
             │    │  └─ onChange → filtra por nombre/email
             │    │
             │    └─ Filtros (dropdowns)
             │       ├─ Por rol
             │       ├─ Por estado
             │       └─ Por departamento
             │
             └─── Tabla de usuarios
                  │
                  ├─ Para cada usuario:
                  │  ├─ Avatar
                  │  ├─ Nombre
                  │  ├─ Email
                  │  ├─ Rol (badge)
                  │  ├─ Estado (badge)
                  │  └─ Acciones
                  │     ├─ Editar
                  │     │  └─ Abre UserForm (modo editar)
                  │     └─ Eliminar
                  │        └─ Confirmación → elimina usuario
                  │
                  └─ Paginación (si hay muchos usuarios)

┌─────────────────────────────────────────────────────────────┐
│                    CREAR/EDITAR USUARIO                     │
└─────────────────────────────────────────────────────────────┘

UserForm Component (Dialog/Modal)
        │
        ├─── Formulario con validación
        │    │
        │    ├─ Nombre completo (requerido)
        │    ├─ Email (requerido, formato email)
        │    ├─ Rol (select: admin/coordinador/docente)
        │    ├─ Departamento (requerido)
        │    ├─ Estado (switch: activo/inactivo)
        │    └─ Contraseña (solo al crear)
        │
        ├─── Validación en tiempo real
        │    ├─ Email único (no duplicado)
        │    ├─ Campos requeridos
        │    └─ Formato correcto
        │
        └─── Acciones
             ├─ Guardar
             │  │
             │  ├─ Valida formulario
             │  │  ├─ ✅ Válido
             │  │  │   ├─ Modo crear: agrega usuario
             │  │  │   └─ Modo editar: actualiza usuario
             │  │  │
             │  │  └─ ❌ Inválido
             │  │      └─ Muestra errores
             │  │
             │  ├─ Actualiza lista de usuarios
             │  ├─ Muestra toast de éxito
             │  └─ Cierra modal
             │
             └─ Cancelar
                └─ Cierra modal sin guardar
```

---

## 📚 Flujo de Gestión de Fichas y Materias

```
┌─────────────────────────────────────────────────────────────┐
│                 FICHAS Y MATERIAS                           │
└─────────────────────────────────────────────────────────────┘

FichasMateriasManagement Component
        │
        ├─── Tabs Component
        │    │
        │    ├─── Tab 1: Fichas
        │    │    │
        │    │    ├─ Header con "Crear Ficha"
        │    │    │
        │    │    ├─ Tabla de fichas
        │    │    │  ├─ Código
        │    │    │  ├─ Nombre
        │    │    │  ├─ Tipo (técnica/tecnológica/profesional)
        │    │    │  ├─ Duración
        │    │    │  └─ Acciones
        │    │    │     ├─ Ver detalles → FichaDetail
        │    │    │     ├─ Editar → FichaForm
        │    │    │     └─ Eliminar
        │    │    │
        │    │    └─ FichaDetail (modal)
        │    │       └─ Muestra materias por semestre
        │    │
        │    └─── Tab 2: Materias
        │         │
        │         ├─ Header con "Crear Materia"
        │         │
        │         └─ Tabla de materias
        │            ├─ Código
        │            ├─ Nombre
        │            ├─ Créditos
        │            ├─ Semestre
        │            ├─ Docente
        │            └─ Acciones
        │               ├─ Editar → MateriaForm
        │               └─ Eliminar
        │
        └─── Estado
             ├─ fichas: []
             └─ materias: []
```

---

## 📄 Flujo de Carga de Archivos Excel

```
┌─────────────────────────────────────────────────────────────┐
│              PROCESAMIENTO DE ARCHIVOS EXCEL                │
└─────────────────────────────────────────────────────────────┘

FileUploadManagement Component
        │
        ├─── Paso 1: Selección de Archivo
        │    │
        │    ├─ Usuario hace clic en "Seleccionar Archivo"
        │    ├─ Input type="file" acepta: .xlsx, .xls
        │    └─ Usuario selecciona archivo
        │         │
        │         ↓
        │    onFileSelect(file)
        │         │
        │         └─ Guarda archivo en estado
        │
        ├─── Paso 2: Lectura del Archivo
        │    │
        │    ├─ FileReader lee el archivo
        │    │   └─ readAsArrayBuffer(file)
        │    │
        │    ├─ XLSX parsea el buffer
        │    │   └─ XLSX.read(data, { type: 'array' })
        │    │
        │    ├─ Obtiene la primera hoja
        │    │   └─ workbook.Sheets[sheetName]
        │    │
        │    └─ Convierte a JSON
        │        └─ XLSX.utils.sheet_to_json(worksheet)
        │             │
        │             └─ Detecta columnas automáticamente
        │
        ├─── Paso 3: Mapeo de Columnas
        │    │
        │    ├─ Muestra preview de datos
        │    │
        │    ├─ Usuario mapea columnas:
        │    │  ├─ ¿Qué columna es "Cédula"?
        │    │  ├─ ¿Qué columna es "Nombre"?
        │    │  └─ ¿Qué columna es "Nota"?
        │    │
        │    └─ Confirmación de mapeo
        │         │
        │         ↓
        │    Procesar archivo
        │
        ├─── Paso 4: Validación de Datos
        │    │
        │    ├─ Para cada fila:
        │    │  │
        │    │  ├─ Valida Cédula
        │    │  │  ├─ No vacía
        │    │  │  ├─ Solo números
        │    │  │  └─ 7-10 dígitos
        │    │  │
        │    │  ├─ Valida Nombre
        │    │  │  └─ No vacío
        │    │  │
        │    │  ├─ Valida Nota
        │    │  │  ├─ Es número
        │    │  │  └─ Entre 0 y 5
        │    │  │
        │    │  └─ Valida Email (opcional)
        │    │     └─ Formato válido
        │    │
        │    └─ Genera reporte:
        │       ├─ Filas válidas: []
        │       └─ Filas con errores: []
        │          └─ { fila, campo, error }
        │
        ├─── Paso 5: Resultados
        │    │
        │    ├─ Muestra resumen:
        │    │  ├─ Total de filas procesadas
        │    │  ├─ Filas válidas
        │    │  └─ Filas con errores
        │    │
        │    ├─ Si hay errores:
        │    │  └─ Tabla de errores detallados
        │    │     ├─ Número de fila
        │    │     ├─ Campo problemático
        │    │     └─ Descripción del error
        │    │
        │    └─ Acciones:
        │       ├─ Descargar errores (CSV)
        │       └─ Procesar solo filas válidas
        │
        └─── Paso 6: Guardado
             │
             ├─ Guarda datos válidos
             ├─ Muestra toast de éxito
             └─ Actualiza estadísticas
```

---

## 👤 Flujo de Perfil de Usuario

```
┌─────────────────────────────────────────────────────────────┐
│                     PERFIL DE USUARIO                       │
└─────────────────────────────────────────────────────────────┘

ProfilePage Component
        │
        ├─── Header
        │    ├─ Avatar del usuario
        │    ├─ Nombre completo
        │    ├─ Rol (badge)
        │    └─ Botón "Editar Perfil"
        │
        ├─── Tabs
        │    │
        │    ├─── Tab 1: Información Personal
        │    │    ├─ Email
        │    │    ├─ Departamento
        │    │    ├─ Fecha de registro
        │    │    ├─ Último acceso
        │    │    └─ Botón "Cambiar Contraseña"
        │    │       └─ Abre PasswordChangeDialog
        │    │
        │    ├─── Tab 2: Estadísticas
        │    │    ├─ ProfileStats Component
        │    │    │  ├─ Tareas completadas
        │    │    │  ├─ Archivos subidos
        │    │    │  ├─ Usuarios gestionados (admin)
        │    │    │  └─ Gráficos de actividad
        │    │    │
        │    │    └─ Cards con métricas
        │    │
        │    ├─── Tab 3: Actividad Reciente
        │    │    └─ ProfileActivityLog Component
        │    │       └─ Lista de actividades:
        │    │          ├─ "Inicio de sesión"
        │    │          ├─ "Usuario creado"
        │    │          ├─ "Archivo subido"
        │    │          └─ "Perfil actualizado"
        │    │
        │    └─── Tab 4: Configuración
        │         ├─ Preferencias de notificaciones
        │         ├─ Tema (claro/oscuro)
        │         └─ Idioma
        │
        └─── PasswordChangeDialog (modal)
             │
             ├─ Contraseña actual
             ├─ Nueva contraseña
             ├─ Confirmar contraseña
             │
             ├─ Validación:
             │  ├─ Contraseña actual correcta
             │  ├─ Nueva contraseña ≥ 6 caracteres
             │  └─ Contraseñas coinciden
             │
             └─ Guardar
                ├─ Actualiza contraseña
                ├─ Muestra toast de éxito
                └─ Cierra modal
```

---

## 🎨 Flujo de Renderizado de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│            CICLO DE VIDA DE UN COMPONENTE                   │
└─────────────────────────────────────────────────────────────┘

Componente React (ej: UserManagement)
        │
        ├─── 1. INICIALIZACIÓN
        │    │
        │    ├─ Declaración de estado
        │    │  ├─ useState() hooks
        │    │  └─ Valores iniciales
        │    │
        │    └─ Declaración de efectos
        │       └─ useEffect() hooks
        │
        ├─── 2. MONTAJE (componentDidMount)
        │    │
        │    └─ useEffect(() => {...}, [])
        │       ├─ Carga datos iniciales
        │       ├─ Suscripciones
        │       └─ Listeners
        │
        ├─── 3. RENDERIZADO
        │    │
        │    ├─ Evalúa JSX
        │    ├─ React Virtual DOM
        │    └─ Compara con DOM anterior
        │       │
        │       ├─ ¿Hay cambios?
        │       │  ├─ Sí → Actualiza solo lo necesario
        │       │  └─ No → No hace nada
        │       │
        │       └─ Actualiza DOM real
        │
        ├─── 4. ACTUALIZACIÓN (componentDidUpdate)
        │    │
        │    ├─ Cambio en props
        │    ├─ Cambio en estado
        │    │  └─ setState() llamado
        │    │     └─ Re-renderiza
        │    │
        │    └─ useEffect(() => {...}, [deps])
        │       └─ Se ejecuta si deps cambian
        │
        └─── 5. DESMONTAJE (componentWillUnmount)
             │
             └─ useEffect cleanup
                ├─ Cancelar suscripciones
                ├─ Limpiar timers
                └─ Remover listeners
```

---

## 🔄 Flujo de Datos en la Aplicación

```
┌─────────────────────────────────────────────────────────────┐
│                   FLUJO DE DATOS                            │
└─────────────────────────────────────────────────────────────┘

                    AuthProvider
                         │
                         ├─ Estado Global
                         │  ├─ currentUser
                         │  ├─ isAuthenticated
                         │  └─ funciones: login, logout
                         │
                         └─ Context API
                            │
                            ↓
                ┌──────────────────────┐
                │   useAuth() hook     │
                └──────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ↓               ↓               ↓
       LoginPage      MainLayout      AppSidebar
            │               │               │
            │               ↓               │
            │       ┌───────────────┐       │
            │       │  Componentes  │       │
            │       │   Hijos       │       │
            │       └───────────────┘       │
            │               │               │
            └───────────────┴───────────────┘
                            │
                            ↓
                    Actualiza contexto
                            │
                            ↓
                Todos los componentes
                    se re-renderizan
```

---

## 📊 Diagrama de Arquitectura General

```
┌──────────────────────────────────────────────────────────────┐
│                      ARQUITECTURA                            │
└──────────────────────────────────────────────────────────────┘

     USUARIO
        │
        ↓
┌──────────────────┐
│   NAVEGADOR      │
│  (localhost:5173)│
└──────────────────┘
        │
        ↓
┌──────────────────┐
│  VITE DEV SERVER │ ← Servidor de desarrollo
└──────────────────┘
        │
        ├─ Hot Module Replacement (HMR)
        ├─ TypeScript Compilation
        └─ CSS Processing
        │
        ↓
┌──────────────────────────────────────────┐
│        APLICACIÓN REACT                  │
│  ┌────────────────────────────────────┐  │
│  │  App.tsx (Componente raíz)         │  │
│  │  ├─ AuthProvider (contexto)        │  │
│  │  │  ├─ LoginPage                   │  │
│  │  │  └─ MainLayout                  │  │
│  │  │     ├─ AppSidebar               │  │
│  │  │     └─ Content                  │  │
│  │  │        ├─ Dashboards            │  │
│  │  │        ├─ UserManagement        │  │
│  │  │        ├─ FichasMaterias        │  │
│  │  │        ├─ FileUpload            │  │
│  │  │        └─ Profile               │  │
│  │  │                                 │  │
│  │  └─ shadcn/ui Components           │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
        │
        ├─── Hooks
        │    └─ useAuth()
        │
        ├─── Estilos
        │    └─ Tailwind CSS v4
        │
        └─── Datos (Mock)
             ├─ LocalStorage (sesión)
             └─ Estado de React
```

---

## ✨ Resumen del Flujo Completo

```
1. Usuario accede → http://localhost:5173
   ↓
2. Vite sirve la aplicación
   ↓
3. React monta App.tsx
   ↓
4. AuthProvider verifica sesión
   ↓
5. ¿Sesión válida?
   ├─ NO → Muestra LoginPage
   │        ↓
   │     Usuario inicia sesión
   │        ↓
   │     Guarda en LocalStorage
   │        ↓
   └─ SÍ → Muestra MainLayout
            ↓
        Dashboard según rol
            ↓
        Usuario navega por el sistema
            ↓
        Realiza acciones (CRUD)
            ↓
        Estado se actualiza
            ↓
        UI se re-renderiza automáticamente
```

---

**Este flujo se mantiene activo mientras el usuario usa la aplicación!**

Cada acción del usuario desencadena este ciclo de actualizaciones de estado y re-renderizado.

---

*Sistema de Gestión Académica - Diagrama de Flujo v1.0*