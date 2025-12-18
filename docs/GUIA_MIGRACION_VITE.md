# 🚀 Guía de Migración: De Figma Make a Vite Local

Esta guía te llevará paso a paso para migrar todo el código del proyecto desde Figma Make a tu instalación local de Vite.

## 📋 Pre-requisitos

- ✅ Node.js instalado (v18 o superior)
- ✅ Vite instalado localmente
- ✅ Visual Studio Code (recomendado)
- ✅ Terminal/Command Prompt

---

## 🎯 Paso 1: Preparar la estructura de carpetas

### 1.1 Navegar a tu proyecto

```bash
cd sistema-gestion-academica
```

### 1.2 Eliminar carpeta `src/` (si existe)

Vite crea una carpeta `src/` por defecto, pero nuestro proyecto está configurado para trabajar sin ella.

**En Windows (PowerShell):**
```powershell
Remove-Item -Recurse -Force src
```

**En macOS/Linux:**
```bash
rm -rf src
```

**O manualmente:** Simplemente elimina la carpeta `src/` desde tu explorador de archivos.

### 1.3 Crear las carpetas necesarias

```bash
mkdir components
mkdir components/ui
mkdir components/dashboards
mkdir components/figma
mkdir hooks
mkdir styles
mkdir guidelines
```

---

## 📄 Paso 2: Copiar archivos de configuración

Estos son los archivos más importantes. Cópialos en el orden indicado.

### 2.1 `package.json`

Copia este contenido y **REEMPLAZA** completamente tu `package.json`:

```json
{
  "name": "sistema-gestion-academica",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "description": "Sistema de gestión académica con React, TypeScript y Vite",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.451.0",
    "recharts": "^2.12.7",
    "xlsx": "^0.18.5",
    "sonner": "^1.5.0",
    "date-fns": "^4.1.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.4",
    "@radix-ui/react-accordion": "^1.2.1",
    "@radix-ui/react-alert-dialog": "^1.1.2",
    "@radix-ui/react-aspect-ratio": "^1.1.0",
    "@radix-ui/react-avatar": "^1.1.1",
    "@radix-ui/react-checkbox": "^1.1.2",
    "@radix-ui/react-collapsible": "^1.1.1",
    "@radix-ui/react-context-menu": "^2.2.2",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.2",
    "@radix-ui/react-hover-card": "^1.1.2",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-menubar": "^1.1.2",
    "@radix-ui/react-navigation-menu": "^1.2.1",
    "@radix-ui/react-popover": "^1.1.2",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-radio-group": "^1.2.1",
    "@radix-ui/react-scroll-area": "^1.2.0",
    "@radix-ui/react-select": "^2.1.2",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-slider": "^1.2.1",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.1",
    "@radix-ui/react-tabs": "^1.1.1",
    "@radix-ui/react-toast": "^1.2.2",
    "@radix-ui/react-toggle": "^1.1.0",
    "@radix-ui/react-toggle-group": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.4",
    "react-day-picker": "^8.10.1",
    "react-resizable-panels": "^2.1.4",
    "vaul": "^1.0.0",
    "cmdk": "^1.0.0",
    "embla-carousel-react": "^8.3.0",
    "input-otp": "^1.2.4",
    "next-themes": "^0.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@types/node": "^22.7.5",
    "@typescript-eslint/eslint-plugin": "^8.8.1",
    "@typescript-eslint/parser": "^8.8.1",
    "@vitejs/plugin-react": "^4.3.2",
    "eslint": "^9.12.0",
    "eslint-plugin-react-hooks": "^5.1.0-rc.0",
    "eslint-plugin-react-refresh": "^0.4.12",
    "typescript": "^5.6.2",
    "vite": "^5.4.8",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0"
  }
}
```

### 2.2 Instalar todas las dependencias

Después de copiar el `package.json`, ejecuta:

```bash
npm install
```

⏱️ **Esto tomará varios minutos.** Espera a que termine completamente.

---

### 2.3 `vite.config.ts`

Copia este contenido y **REEMPLAZA** tu `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  server: {
    port: 5173,
    host: true,
    open: true, // Abre automáticamente el navegador
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
```

### 2.4 `tsconfig.json`

Copia este contenido y **REEMPLAZA** tu `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Paths */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### 2.5 `tsconfig.node.json`

Si no existe, créalo:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts"]
}
```

### 2.6 `index.html`

Copia este contenido y **REEMPLAZA** tu `index.html`:

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Sistema de Gestión Académica - Gestión de usuarios, fichas, materias y calificaciones" />
    <title>Sistema de Gestión Académica</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.tsx"></script>
  </body>
</html>
```

---

## 📁 Paso 3: Copiar archivos principales

### 3.1 `main.tsx`

Crea el archivo `main.tsx` en la raíz del proyecto (no en `src/`):

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

### 3.2 `styles/globals.css`

Ya tienes el contenido, pero asegúrate de que esté en `styles/globals.css` (no en `src/styles/`).

---

## 🧩 Paso 4: Copiar archivos del proyecto

Ahora viene la parte donde copias todos los archivos `.tsx` del proyecto. Sigue este orden:

### 4.1 Hooks
1. `hooks/useAuth.tsx`

### 4.2 Componentes UI (ShadCN)
Todos los archivos en `components/ui/`:
- `button.tsx`
- `input.tsx`
- `card.tsx`
- `dialog.tsx`
- `select.tsx`
- `table.tsx`
- `tabs.tsx`
- `badge.tsx`
- `avatar.tsx`
- `sidebar.tsx`
- `sonner.tsx`
- Y todos los demás componentes UI...

### 4.3 Componentes principales
1. `components/figma/ImageWithFallback.tsx`
2. `components/LoginPage.tsx`
3. `components/AppSidebar.tsx`
4. `components/MainLayout.tsx`

### 4.4 Dashboards
1. `components/dashboards/AdminDashboard.tsx`
2. `components/dashboards/CoordinadorDashboard.tsx`
3. `components/dashboards/DocenteDashboard.tsx`

### 4.5 Componentes de gestión
1. `components/UserManagement.tsx`
2. `components/UserForm.tsx`
3. `components/ProfilePage.tsx`
4. `components/ProfileStats.tsx`
5. `components/ProfileActivityLog.tsx`
6. `components/PasswordChangeDialog.tsx`
7. `components/FichasMateriasManagement.tsx`
8. `components/FichaForm.tsx`
9. `components/MateriaForm.tsx`
10. `components/FichaDetail.tsx`
11. `components/FileUploadManagement.tsx`

### 4.6 App principal
1. `App.tsx`

---

## 🎨 Paso 5: Verificar la estructura

Tu proyecto debe verse así:

```
sistema-gestion-academica/
├── components/
│   ├── ui/                    (todos los componentes ShadCN)
│   ├── dashboards/           (AdminDashboard, etc.)
│   ├── figma/                (ImageWithFallback)
│   └── *.tsx                 (componentes principales)
├── hooks/
│   └── useAuth.tsx
├── styles/
│   └── globals.css
├── App.tsx                    (en la raíz, NO en src/)
├── main.tsx                   (en la raíz, NO en src/)
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
└── node_modules/
```

---

## ✅ Paso 6: Probar el proyecto

### 6.1 Ejecutar el servidor de desarrollo

```bash
npm run dev
```

### 6.2 Verificar que funciona

Deberías ver en la terminal algo como:

```
VITE v5.4.8  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.X.X:5173/
```

El navegador debería abrirse automáticamente y mostrar la página de login.

---

## 🐛 Solución de problemas comunes

### Error: "Cannot find module './App.tsx'"

**Causa:** El archivo `App.tsx` está en la carpeta `src/` o no existe.

**Solución:** Asegúrate de que `App.tsx` esté en la raíz del proyecto, no en `src/`.

---

### Error: "Failed to resolve import './styles/globals.css'"

**Causa:** La carpeta `styles` está mal ubicada o no existe.

**Solución:** Crea la carpeta `styles` en la raíz y asegúrate de que contenga `globals.css`.

---

### Error de TypeScript: "Cannot find name 'XXX'"

**Causa:** Falta instalar dependencias.

**Solución:** Ejecuta `npm install` de nuevo.

---

### El navegador muestra una página en blanco

**Causa:** Puede haber errores en la consola del navegador.

**Solución:** 
1. Abre las DevTools del navegador (F12)
2. Ve a la pestaña "Console"
3. Lee los errores y compártelos si necesitas ayuda

---

## 📝 Lista de verificación final

Antes de considerar la migración completa, verifica:

- [ ] `npm install` terminó sin errores
- [ ] Todos los archivos `.tsx` están copiados
- [ ] No hay carpeta `src/`
- [ ] `App.tsx` está en la raíz
- [ ] `main.tsx` está en la raíz
- [ ] `styles/globals.css` existe
- [ ] `npm run dev` funciona sin errores
- [ ] La página de login se muestra correctamente
- [ ] Puedes iniciar sesión con las credenciales de prueba

---

## 🎉 ¡Listo!

Si todos los pasos se completaron correctamente, tu proyecto está listo para desarrollo local.

### Credenciales de prueba:

**Administrador:**
- Usuario: `admin`
- Contraseña: `admin123`

**Coordinador:**
- Usuario: `coord`
- Contraseña: `coord123`

**Docente:**
- Usuario: `docente`
- Contraseña: `docente123`

---

## 📚 Próximos pasos

1. Revisa la documentación en los archivos `.md`
2. Explora la estructura del proyecto
3. Comienza a desarrollar nuevas funcionalidades

---

## 🆘 ¿Necesitas ayuda?

Si encuentras problemas:

1. Revisa la sección de "Solución de problemas"
2. Verifica la consola del navegador (F12)
3. Verifica la terminal donde corre `npm run dev`
4. Consulta los archivos de documentación:
   - `LEEME_PRIMERO.md`
   - `INICIO_RAPIDO.md`
   - `FAQ.md`