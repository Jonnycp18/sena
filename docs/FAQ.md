# ❓ Preguntas Frecuentes (FAQ)

## 📦 Instalación y Configuración

### ¿Qué es Vite y por qué lo usamos?
**Vite** es una herramienta de desarrollo moderna para aplicaciones web. Es mucho más rápido que Create React App porque:
- ✅ Usa módulos ES nativos del navegador
- ✅ Compila solo lo que cambias (no todo el proyecto)
- ✅ Hot Module Replacement instantáneo
- ✅ Build de producción optimizado

### ¿Necesito instalar algo más aparte de Node.js?
No. Con Node.js instalado, **npm** viene incluido y te permite instalar todas las dependencias del proyecto con un solo comando: `npm install`

### ¿Qué versión de Node.js necesito?
Necesitas **Node.js v18 o superior**. Verifica tu versión con:
```bash
node --version
```

### ¿Puedo usar yarn o pnpm en lugar de npm?
Sí, pero el proyecto está configurado para npm. Si usas otro gestor:
```bash
# Con yarn
yarn install
yarn dev

# Con pnpm
pnpm install
pnpm dev
```

---

## 🚀 Ejecución del Proyecto

### ¿Por qué dice "localhost:5173"?
**5173** es el puerto por defecto de Vite. Puedes cambiarlo en `vite.config.ts`:
```typescript
server: {
  port: 3000, // Cambia a tu puerto preferido
}
```

### ¿Puedo acceder desde otro dispositivo en mi red local?
Sí. Cuando ejecutas `npm run dev`, Vite muestra dos URLs:
- **Local**: `http://localhost:5173` (solo tu computadora)
- **Network**: `http://192.168.x.x:5173` (otros dispositivos en tu red)

Para habilitar el acceso de red, el proyecto ya está configurado con `host: true` en `vite.config.ts`.

### ¿Cómo detengo el servidor?
En la terminal donde corre `npm run dev`, presiona `Ctrl + C` y luego `Y` para confirmar.

### ¿Los cambios se guardan automáticamente?
**Sí y no**:
- ✅ **Hot Reload**: Los cambios aparecen automáticamente en el navegador
- ❌ **Guardado**: Debes guardar el archivo con `Ctrl + S`
- 💡 **Tip**: Activa "Auto Save" en VS Code

---

## 💻 Visual Studio Code

### ¿Qué extensiones son realmente necesarias?
**Esenciales**:
1. **ESLint** - Detecta errores
2. **Tailwind CSS IntelliSense** - Autocompletado de Tailwind
3. **TypeScript Vue Plugin (Volar)** - Mejor soporte TypeScript

**Muy recomendadas**:
4. **Prettier** - Formateo automático
5. **ES7+ React snippets** - Atajos de código

### ¿Por qué VS Code muestra errores rojos si el proyecto funciona?
Posibles causas:
1. **TypeScript no cargó**: Recarga la ventana (`Ctrl+Shift+P` > "Reload Window")
2. **Tipos faltantes**: Ejecuta `npm install`
3. **Caché de VS Code**: Cierra y abre VS Code

### ¿Cómo abro la terminal integrada?
- `Ctrl + ñ` (teclado español)
- `Ctrl + `` ` (teclado inglés)
- O menú **Terminal → New Terminal**

---

## 🎨 Desarrollo y Código

### ¿Dónde edito el código?
Los archivos principales están en:
- `/App.tsx` - Componente raíz
- `/components/` - Todos los componentes React
- `/hooks/` - Custom hooks como `useAuth`
- `/styles/globals.css` - Estilos globales

### ¿Por qué los archivos terminan en .tsx y no .jsx?
**TSX** = TypeScript + JSX. Este proyecto usa TypeScript para:
- ✅ Detección de errores en desarrollo
- ✅ Autocompletado inteligente
- ✅ Documentación en el código
- ✅ Menos bugs en producción

### ¿Puedo usar JavaScript normal (.jsx)?
Técnicamente sí, pero **no es recomendado**. El proyecto está configurado para TypeScript y muchos componentes esperan tipos específicos.

### ¿Cómo agrego una nueva página?
1. Crea un componente en `/components/NuevaPagina.tsx`
2. Importa y usa en `App.tsx` o `MainLayout.tsx`
3. Agrega la ruta en la navegación (si es necesario)

### ¿Cómo agrego íconos?
Usamos **Lucide React**:
```typescript
import { Home, User, Settings } from 'lucide-react';

// En tu componente:
<Home className="w-5 h-5" />
```

Ver todos los iconos: [lucide.dev](https://lucide.dev)

---

## 🎨 Estilos y Diseño

### ¿Por qué no veo cambios de colores al modificar Tailwind?
Este proyecto usa **Tailwind v4** con variables CSS. Los colores se definen en `/styles/globals.css` en las variables `--color-*`.

### ¿Cómo cambio el tema de colores?
Edita las variables en `/styles/globals.css`:
```css
:root {
  --primary: #tu-color-principal;
  --secondary: #tu-color-secundario;
}
```

### ¿Qué es shadcn/ui?
**shadcn/ui** es una colección de componentes React pre-construidos (botones, diálogos, tablas, etc.) que están en `/components/ui/`. Son completamente personalizables.

### ¿Puedo usar CSS normal?
Sí, pero preferimos **Tailwind CSS** para mantener consistencia. Si necesitas CSS custom, agrégalo en `/styles/globals.css`.

---

## 📊 Funcionalidades del Sistema

### ¿Los datos son reales?
No. Este es un prototipo con **datos simulados** (mock data). Los datos se almacenan en:
- LocalStorage del navegador
- Estado de React (se pierden al recargar)

### ¿Cómo conecto una base de datos real?
Necesitarías:
1. Un backend (Node.js + Express, por ejemplo)
2. Una base de datos (PostgreSQL, MySQL, MongoDB)
3. Modificar los hooks y componentes para llamar APIs reales

### ¿Cómo pruebo el sistema de carga de Excel?
1. Inicia sesión como Administrador o Docente
2. Ve a "Carga de Archivos"
3. Crea un archivo Excel con columnas: Cédula, Nombre, Nota
4. Súbelo y mapea las columnas

### ¿Puedo cambiar las credenciales de prueba?
Sí. Edita el archivo `/hooks/useAuth.tsx` en la sección `mockUsers`.

---

## 🐛 Errores Comunes

### "Cannot find module 'react'"
**Solución**: Instala las dependencias
```bash
npm install
```

### "Port 5173 is already in use"
**Solución**: Hay otro servidor corriendo
```bash
# Opción 1: Detén el otro servidor
# Opción 2: Usa otro puerto en vite.config.ts
```

### "npm no se reconoce como comando"
**Solución**: Node.js no está instalado o no está en PATH
1. Reinstala Node.js desde [nodejs.org](https://nodejs.org/)
2. Reinicia tu computadora
3. Abre una nueva terminal

### Errores rojos de TypeScript en VS Code
**Solución**:
```bash
npm install @types/react @types/react-dom @types/node --save-dev
```
Luego recarga VS Code (`Ctrl+Shift+P` > "Reload Window")

### "Module not found: Error: Can't resolve './components/..."
**Solución**: Verifica que el archivo existe y la ruta es correcta. Los imports en React son case-sensitive.

### La página está en blanco
**Solución**:
1. Abre la Consola del navegador (F12)
2. Ve a la pestaña "Console"
3. Lee el error y busca el archivo mencionado
4. Verifica que no haya errores de sintaxis

### Hot Reload no funciona
**Solución**:
1. Guarda el archivo (`Ctrl+S`)
2. Refresca el navegador (`F5`)
3. Si persiste, detén y reinicia el servidor

---

## 🏗️ Build y Producción

### ¿Cómo creo la versión de producción?
```bash
npm run build
```
Esto crea una carpeta `/dist` con archivos optimizados.

### ¿Cómo pruebo la build de producción?
```bash
npm run preview
```
Sirve los archivos de `/dist` en un servidor local.

### ¿Dónde subo la aplicación para producción?
Puedes usar:
- **Vercel** (recomendado para React + Vite)
- **Netlify**
- **GitHub Pages**
- **AWS S3 + CloudFront**
- Cualquier hosting de archivos estáticos

### ¿Qué incluyo en el deploy?
Solo necesitas subir la carpeta `/dist` después de ejecutar `npm run build`.

---

## 📚 Aprendizaje

### ¿Dónde aprendo más sobre React?
- [React.dev](https://react.dev) - Documentación oficial (nueva)
- [React Beta Docs](https://beta.reactjs.org) - Tutoriales interactivos

### ¿Dónde aprendo TypeScript?
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TypeScript for React](https://react-typescript-cheatsheet.netlify.app/)

### ¿Dónde aprendo Tailwind CSS?
- [Tailwind Docs](https://tailwindcss.com/docs)
- [Tailwind Play](https://play.tailwindcss.com/) - Playground online

### ¿Hay tutoriales en español?
Sí:
- **React**: [es.react.dev](https://es.react.dev)
- **YouTube**: Busca "React Tailwind tutorial español"
- **Platzi**: Cursos de React en español

---

## 🔒 Seguridad

### ¿Es seguro el sistema de autenticación?
**No**. Es un sistema de prueba. Para producción necesitas:
- Hash de contraseñas (bcrypt)
- JWT o sesiones seguras
- HTTPS
- Backend real con validaciones

### ¿Puedo usar esto en producción?
Solo como **prototipo**. Para producción necesitas:
- Base de datos real
- Backend con API segura
- Autenticación real
- Validaciones server-side
- Tests automatizados

---

## 💡 Tips y Trucos

### Atajos útiles de VS Code
- `Ctrl + P` - Buscar archivo por nombre
- `Ctrl + Shift + F` - Buscar en todos los archivos
- `Ctrl + D` - Seleccionar siguiente ocurrencia
- `Alt + Click` - Múltiples cursores
- `Ctrl + /` - Comentar línea
- `F2` - Renombrar símbolo

### Snippets de React
Con la extensión ES7+ React snippets:
- `rafce` - React Arrow Function Component Export
- `useState` - useState hook
- `useEffect` - useEffect hook

### Mejores prácticas
1. ✅ Un componente por archivo
2. ✅ Nombres descriptivos en español (dominio) o inglés (técnico)
3. ✅ Componentes pequeños y reutilizables
4. ✅ Usa TypeScript para props
5. ✅ Comenta código complejo

---

## 📞 Soporte

### ¿Dónde obtengo ayuda?
1. Lee el `README.md`
2. Revisa esta FAQ
3. Busca el error en Google
4. Revisa la consola del navegador (F12)

### ¿Cómo reporto un bug?
Abre un issue en GitHub con:
- Descripción del problema
- Pasos para reproducir
- Mensaje de error completo
- Versión de Node.js (`node --version`)

---

**¿Tu pregunta no está aquí?**
Abre un issue en GitHub o consulta la documentación en `README.md` y `GUIA_VISUAL_STUDIO_CODE.md`.