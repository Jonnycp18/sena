# 🏗️ Arquitectura del Sistema

Documentación técnica de la arquitectura del proyecto.

---

## 📂 Estructura de Archivos

```
sistema-gestion-academica/
│
├── 📄 Archivos de Configuración
│   ├── package.json              # Dependencias y scripts npm
│   ├── vite.config.ts            # Configuración de Vite
│   ├── tsconfig.json             # Configuración TypeScript (app)
│   ├── tsconfig.node.json        # Configuración TypeScript (config files)
│   ├── .eslintrc.cjs             # Configuración ESLint
│   └── .gitignore                # Archivos ignorados por Git
│
├── 📄 Archivos de Entrada
│   ├── index.html                # HTML principal (punto de entrada)
│   └── main.tsx                  # JavaScript principal (monta React)
│
├── 🎯 Componente Raíz
│   └── App.tsx                   # Componente principal con routing
│
├── 🎨 Estilos
│   └── styles/
│       └── globals.css           # Tailwind v4 + Variables CSS
│
├── 🧩 Componentes
│   └── components/
│       ├── 🔐 Autenticación
│       │   └── LoginPage.tsx
│       │
│       ├── 🏗️ Layout
│       │   ├── MainLayout.tsx       # Layout principal con sidebar
│       │   └── AppSidebar.tsx       # Navegación lateral dinámica
│       │
│       ├── 📊 Dashboards (por rol)
│       │   ├── AdminDashboard.tsx
│       │   ├── CoordinadorDashboard.tsx
│       │   └── DocenteDashboard.tsx
│       │
│       ├── 👥 Gestión de Usuarios
│       │   ├── UserManagement.tsx   # CRUD de usuarios
│       │   └── UserForm.tsx         # Formulario crear/editar
│       │
│       ├── 📚 Gestión Académica
│       │   ├── FichasMateriasManagement.tsx  # Vista principal
│       │   ├── FichaForm.tsx                 # Formulario de fichas
│       │   ├── FichaDetail.tsx               # Detalles de ficha
│       │   └── MateriaForm.tsx               # Formulario de materias
│       │
│       ├── 📄 Carga de Archivos
│       │   └── FileUploadManagement.tsx  # Sistema de carga Excel
│       │
│       ├── 👤 Perfil
│       │   ├── ProfilePage.tsx           # Página de perfil
│       │   ├── ProfileStats.tsx          # Estadísticas de perfil
│       │   ├── ProfileActivityLog.tsx    # Log de actividad
│       │   └── PasswordChangeDialog.tsx  # Cambio de contraseña
│       │
│       └── 🎨 UI Components (shadcn/ui)
│           └── ui/
│               ├── button.tsx
│               ├── dialog.tsx
│               ├── table.tsx
│               ├── card.tsx
│               ├── input.tsx
│               ├── select.tsx
│               ├── sidebar.tsx
│               └── ... (40+ componentes)
│
├── 🪝 Custom Hooks
│   └── hooks/
│       └── useAuth.tsx           # Autenticación y gestión de roles
│
├── 📁 VS Code
│   └── .vscode/
│       ├── extensions.json       # Extensiones recomendadas
│       └── settings.json         # Configuración del workspace
│
├── 📚 Documentación
│   ├── README.md                     # Documentación principal
│   ├── INICIO_RAPIDO.md              # Guía de inicio rápido
│   ├── GUIA_VISUAL_STUDIO_CODE.md    # Tutorial detallado
│   ├── FAQ.md                        # Preguntas frecuentes
│   ├── VERIFICACION.md               # Checklist de verificación
│   ├── ARQUITECTURA.md               # Este archivo
│   └── guidelines/
│       └── Guidelines.md             # Guías de desarrollo
│
└── 🗂️ Build Output (generado)
    ├── node_modules/             # Dependencias instaladas
    └── dist/                     # Build de producción
```

---

## 🔄 Flujo de la Aplicación

### 1. Inicio de la Aplicación
```
index.html
    ↓ carga
main.tsx
    ↓ monta
App.tsx
    ↓ provee contexto
AuthProvider (useAuth)
    ↓ renderiza
AppContent
    ↓ decide basado en autenticación
¿Usuario autenticado?
    ├─ NO  → LoginPage
    └─ SÍ  → MainLayout
```

### 2. Flujo de Autenticación
```
LoginPage
    ↓ usuario ingresa credenciales
useAuth.login()
    ↓ valida credenciales
mockUsers (datos de prueba)
    ↓ si es válido
actualiza estado: isAuthenticated + currentUser
    ↓ guarda en
LocalStorage (persistencia)
    ↓ redirige a
Dashboard correspondiente (según rol)
```

### 3. Navegación en MainLayout
```
MainLayout
    ├─ AppSidebar (navegación lateral)
    │   ├─ Filtra opciones según rol del usuario
    │   └─ Renderiza links de navegación
    │
    └─ Content Area (área principal)
        ├─ Header con breadcrumbs
        └─ Componente de la vista actual
            ├─ Dashboard (Admin/Coordinador/Docente)
            ├─ UserManagement (solo Admin)
            ├─ FichasMateriasManagement
            ├─ FileUploadManagement
            └─ ProfilePage
```

---

## 🎭 Sistema de Roles y Permisos

### Arquitectura de Roles
```typescript
type UserRole = 'administrador' | 'coordinador' | 'docente';

interface User {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  departamento?: string;
  // ...
}
```

### Matriz de Permisos

| Funcionalidad | Admin | Coordinador | Docente |
|---------------|-------|-------------|---------|
| Ver Dashboard | ✅ | ✅ | ✅ |
| Gestión de Usuarios | ✅ | ❌ | ❌ |
| Fichas y Materias | ✅ | ✅ (solo lectura) | ❌ |
| Carga de Archivos | ✅ | ❌ | ✅ |
| Ver Reportes | ✅ | ✅ | ✅ (limitado) |
| Gestión de Perfil | ✅ | ✅ | ✅ |

### Implementación
```typescript
// En AppSidebar.tsx
const navItems = [
  {
    title: "Gestión de Usuarios",
    url: "/usuarios",
    roles: ['administrador'], // Solo admin
  },
  {
    title: "Carga de Archivos",
    url: "/archivos",
    roles: ['administrador', 'docente'], // Admin y Docente
  },
  // ...
];

// Filtrado dinámico
const filteredItems = navItems.filter(item => 
  item.roles.includes(currentUser.rol)
);
```

---

## 🎨 Sistema de Estilos

### Tailwind CSS v4 + Variables CSS

#### Variables CSS (`styles/globals.css`)
```css
:root {
  /* Colores */
  --background: #ffffff;
  --foreground: oklch(0.145 0 0);
  --primary: #030213;
  --secondary: oklch(0.95 0.0058 264.53);
  
  /* Espaciado */
  --radius: 0.625rem;
  
  /* Tipografía */
  --font-weight-medium: 500;
  --font-weight-normal: 400;
}
```

#### Uso en Componentes
```tsx
// Usando Tailwind classes
<button className="bg-primary text-primary-foreground rounded-lg">
  Botón
</button>

// shadcn/ui components usan las mismas variables
<Button variant="default">Botón</Button>
```

### Sistema de Temas (Claro/Oscuro)
```css
/* Tema claro */
:root { --background: #ffffff; }

/* Tema oscuro */
.dark { --background: oklch(0.145 0 0); }
```

---

## 🔌 Gestión de Estado

### Estado Global (Context API)
```
AuthProvider (useAuth)
    ├─ isAuthenticated: boolean
    ├─ currentUser: User | null
    ├─ login(email, password)
    ├─ logout()
    └─ updateProfile(data)
```

### Estado Local (useState)
- Cada componente maneja su propio estado
- Formularios: estado local para inputs
- Tablas: estado para filtros, búsqueda, paginación
- Modales: estado para abrir/cerrar

### Persistencia
```typescript
// LocalStorage para sesión
localStorage.setItem('user', JSON.stringify(user));
localStorage.setItem('isAuthenticated', 'true');

// Al cargar la app
const savedUser = localStorage.getItem('user');
if (savedUser) {
  // Restaurar sesión
}
```

---

## 📦 Gestión de Dependencias

### Dependencias Principales
```json
{
  "react": "^18.3.1",           // UI Library
  "react-dom": "^18.3.1",       // React DOM
  "lucide-react": "^0.451.0",   // Iconos
  "recharts": "^2.12.7",        // Gráficos
  "xlsx": "^0.18.5",            // Procesamiento Excel
  "sonner": "^1.5.0",           // Notificaciones
  "@radix-ui/*": "^1.x.x"       // Primitivos de shadcn/ui
}
```

### Dependencias de Desarrollo
```json
{
  "@vitejs/plugin-react": "^4.3.2",  // Plugin Vite para React
  "typescript": "^5.6.2",            // TypeScript
  "tailwindcss": "^4.0.0",           // Tailwind v4
  "@types/*": "latest"               // Type definitions
}
```

---

## 🚀 Pipeline de Desarrollo

### Desarrollo Local
```bash
npm run dev
    ↓
Vite Dev Server (puerto 5173)
    ↓
Hot Module Replacement (HMR)
    ↓
Cambios automáticos en el navegador
```

### Build de Producción
```bash
npm run build
    ↓
1. TypeScript Compilation (tsc)
    ↓
2. Vite Build (optimización)
    ↓
3. Tree Shaking + Minification
    ↓
4. Output → dist/
    ├── index.html
    ├── assets/
    │   ├── index-[hash].js
    │   └── index-[hash].css
    └── ...
```

---

## 🗃️ Estructura de Datos

### Usuario
```typescript
interface User {
  id: string;
  nombre: string;
  email: string;
  rol: 'administrador' | 'coordinador' | 'docente';
  departamento: string;
  estado: 'activo' | 'inactivo';
  fechaCreacion: string;
  ultimoAcceso: string;
}
```

### Ficha Académica
```typescript
interface Ficha {
  id: string;
  codigo: string;
  nombre: string;
  tipo: 'tecnica' | 'tecnologica' | 'profesional';
  duracion: number;
  estado: 'activa' | 'inactiva';
  materias: Materia[];
}
```

### Materia
```typescript
interface Materia {
  id: string;
  codigo: string;
  nombre: string;
  creditos: number;
  semestre: number;
  docente: string;
  horasSemanales: number;
  prerequisitos: string[];
}
```

### Archivo Excel
```typescript
interface ExcelData {
  fileName: string;
  rows: ExcelRow[];
  columns: string[];
  errors: ValidationError[];
}

interface ExcelRow {
  cedula: string;
  nombre: string;
  nota: number;
  email?: string;
}
```

---

## 🔒 Seguridad (Prototipo)

### ⚠️ Advertencia
Este es un **sistema de prueba**. No es seguro para producción.

### Limitaciones Actuales
- ❌ Contraseñas en texto plano
- ❌ No hay hash de contraseñas
- ❌ No hay JWT o tokens reales
- ❌ Autenticación solo en cliente
- ❌ Sin validación server-side

### Para Producción Necesitarías
- ✅ Backend real (Node.js + Express/NestJS)
- ✅ Base de datos (PostgreSQL/MySQL)
- ✅ Hash de contraseñas (bcrypt)
- ✅ JWT para sesiones
- ✅ HTTPS
- ✅ Validación server-side
- ✅ Rate limiting
- ✅ CSRF protection

---

## 📊 Performance

### Optimizaciones Implementadas
- ✅ **Code Splitting**: Vite automático
- ✅ **Tree Shaking**: Elimina código no usado
- ✅ **Lazy Loading**: Componentes pesados bajo demanda
- ✅ **Minification**: CSS y JS minificados en build
- ✅ **Caching**: Assets con hash en nombre

### Métricas Objetivo
- 🎯 First Contentful Paint: < 1.5s
- 🎯 Time to Interactive: < 3s
- 🎯 Bundle Size: < 500KB (gzipped)

---

## 🧪 Testing (Futuro)

### Estrategia Recomendada
```
Unit Tests (Vitest)
    ├─ Utilidades
    ├─ Hooks personalizados
    └─ Funciones puras

Integration Tests (React Testing Library)
    ├─ Componentes individuales
    ├─ Flujos de usuario
    └─ Formularios

E2E Tests (Playwright)
    ├─ Login flow
    ├─ CRUD operations
    └─ Critical paths
```

---

## 🔄 Ciclo de Vida de Componentes

### Componente Funcional con Hooks
```tsx
function MiComponente() {
  // 1. Declaración de estado
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 2. Efectos (componentDidMount + componentDidUpdate)
  useEffect(() => {
    // Cargar datos al montar
    loadData();
    
    // Cleanup (componentWillUnmount)
    return () => {
      // Limpiar suscripciones, timers, etc.
    };
  }, []); // [] = solo al montar
  
  // 3. Handlers
  const handleAction = () => {
    // Lógica del evento
  };
  
  // 4. Render
  return (
    <div>
      {loading ? <Spinner /> : <DataTable data={data} />}
    </div>
  );
}
```

---

## 🎯 Patrones de Diseño Utilizados

### 1. **Component Composition**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent>
    Contenido
  </CardContent>
</Card>
```

### 2. **Render Props**
```tsx
<DataTable
  data={users}
  renderRow={(user) => <UserRow user={user} />}
/>
```

### 3. **Higher-Order Components (HOC)**
```tsx
const withAuth = (Component) => {
  return (props) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Component {...props} /> : <Login />;
  };
};
```

### 4. **Custom Hooks**
```tsx
function useAuth() {
  const [user, setUser] = useState(null);
  // Lógica de autenticación
  return { user, login, logout };
}
```

### 5. **Controlled Components**
```tsx
const [value, setValue] = useState('');

<Input 
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

---

## 🔮 Roadmap Técnico

### Fase 1: Prototipo (Actual) ✅
- [x] Autenticación básica
- [x] Dashboards diferenciados
- [x] CRUD de usuarios
- [x] Sistema de carga Excel
- [x] UI con shadcn/ui

### Fase 2: Backend
- [ ] API REST con Express/NestJS
- [ ] Base de datos PostgreSQL
- [ ] Autenticación JWT
- [ ] Validación server-side
- [ ] Migraciones de BD

### Fase 3: Features Avanzadas
- [ ] Sistema de notificaciones en tiempo real
- [ ] Reportes PDF/Excel
- [ ] Dashboard analytics avanzado
- [ ] Sistema de backup automático
- [ ] Auditoría completa

### Fase 4: Producción
- [ ] Testing automatizado
- [ ] CI/CD pipeline
- [ ] Monitoreo y logging
- [ ] Documentación API
- [ ] Deploy en cloud

---

## 📚 Referencias Técnicas

### React
- [React Docs](https://react.dev)
- [React Hooks](https://react.dev/reference/react)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React + TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

### Vite
- [Vite Guide](https://vitejs.dev/guide/)
- [Vite Config Reference](https://vitejs.dev/config/)

### Tailwind CSS
- [Tailwind Docs](https://tailwindcss.com/docs)
- [Tailwind v4 Blog](https://tailwindcss.com/blog/tailwindcss-v4)

### shadcn/ui
- [shadcn/ui Docs](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/)

---

**Última actualización**: Septiembre 2025  
**Versión del proyecto**: 1.0.0  
**Licencia**: MIT