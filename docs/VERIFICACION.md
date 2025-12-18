# ✅ Lista de Verificación del Sistema

Usa este checklist para verificar que todo está funcionando correctamente.

---

## 📦 Instalación Básica

### Verificar requisitos previos
```bash
# Verificar Node.js (debe ser v18+)
node --version

# Verificar npm (debe ser v8+)
npm --version
```

- [ ] Node.js v18 o superior instalado
- [ ] npm v8 o superior instalado
- [ ] Visual Studio Code instalado (opcional pero recomendado)

---

## 🚀 Instalación del Proyecto

### Ejecutar en la terminal:
```bash
# 1. Instalar dependencias
npm install

# 2. Verificar que no haya errores
# Deberías ver: "added XXX packages"
```

### Verificar:
- [ ] `npm install` completado sin errores
- [ ] Carpeta `node_modules` creada
- [ ] Archivos `package-lock.json` generado

---

## 🏃 Ejecución del Servidor

### Iniciar el servidor de desarrollo:
```bash
npm run dev
```

### Verificar en la terminal:
- [ ] Mensaje "VITE v5.x.x ready" aparece
- [ ] URL `http://localhost:5173/` mostrada
- [ ] No hay errores rojos en la terminal

### Verificar en el navegador:
- [ ] Página carga en `http://localhost:5173/`
- [ ] Se muestra la pantalla de login
- [ ] No hay errores en la consola del navegador (F12 → Console)
- [ ] Estilos se aplican correctamente (no texto sin formato)

---

## 🔐 Prueba de Autenticación

### Probar cada rol:

#### Administrador
- [ ] Login con `admin@instituto.edu` / `123456`
- [ ] Dashboard de administrador se muestra
- [ ] Sidebar muestra opciones de administrador
- [ ] Puede acceder a "Gestión de Usuarios"
- [ ] Puede acceder a "Fichas y Materias"
- [ ] Puede acceder a "Carga de Archivos"

#### Coordinador
- [ ] Logout y login con `coordinador@instituto.edu` / `123456`
- [ ] Dashboard de coordinador se muestra
- [ ] Sidebar muestra opciones limitadas
- [ ] NO puede acceder a "Gestión de Usuarios"

#### Docente
- [ ] Logout y login con `docente@instituto.edu` / `123456`
- [ ] Dashboard de docente se muestra
- [ ] Puede acceder a "Carga de Archivos"
- [ ] NO puede acceder a "Gestión de Usuarios"

---

## 🎨 Prueba de UI/UX

### Navegación
- [ ] Sidebar se abre y cierra correctamente
- [ ] Links de navegación funcionan
- [ ] Botones responden al click
- [ ] Hover states funcionan

### Responsive Design
- [ ] Redimensionar ventana a móvil (< 768px)
- [ ] Sidebar se oculta automáticamente
- [ ] Contenido se adapta al tamaño
- [ ] Tablas son scrolleables horizontalmente

### Componentes UI
- [ ] Diálogos/modales se abren y cierran
- [ ] Dropdowns funcionan
- [ ] Inputs aceptan texto
- [ ] Botones muestran estados (hover, active)
- [ ] Toast notifications aparecen

---

## 📊 Funcionalidades Principales

### Gestión de Usuarios (Admin)
- [ ] Tabla de usuarios carga
- [ ] Botón "Crear Usuario" funciona
- [ ] Modal de creación se abre
- [ ] Formulario tiene validaciones
- [ ] Puede crear un usuario de prueba
- [ ] Usuario aparece en la tabla
- [ ] Puede editar un usuario
- [ ] Puede eliminar un usuario
- [ ] Filtros funcionan (rol, estado)
- [ ] Búsqueda funciona

### Fichas y Materias (Admin)
- [ ] Tabs "Fichas" y "Materias" funcionan
- [ ] Tabla de fichas carga
- [ ] Puede crear una ficha
- [ ] Tabla de materias carga
- [ ] Puede crear una materia
- [ ] Modal de detalles funciona

### Carga de Archivos (Admin/Docente)
- [ ] Vista de carga de archivos abre
- [ ] Puede seleccionar un archivo Excel
- [ ] Sistema detecta columnas
- [ ] Puede mapear columnas
- [ ] Validación funciona
- [ ] Errores se muestran correctamente

### Perfil de Usuario
- [ ] Página de perfil carga
- [ ] Información del usuario se muestra
- [ ] Tabs funcionan (Información, Actividad, Configuración)
- [ ] Modal de cambio de contraseña funciona
- [ ] Estadísticas se muestran

---

## 🔧 Herramientas de Desarrollo

### Hot Module Replacement (HMR)
1. Abre `/App.tsx` en VS Code
2. Cambia algo (ej: un texto)
3. Guarda (`Ctrl+S`)
4. Verifica:
   - [ ] Cambio aparece automáticamente en el navegador
   - [ ] Sin necesidad de refresh manual
   - [ ] Terminal no muestra errores

### TypeScript
- [ ] VS Code muestra autocompletado
- [ ] VS Code detecta errores de tipos
- [ ] No hay errores rojos en archivos `.tsx`

### Tailwind CSS
- [ ] Autocompletado de clases Tailwind funciona
- [ ] Cambios en clases se reflejan inmediatamente
- [ ] Variables CSS en `globals.css` funcionan

---

## 🏗️ Build de Producción

### Compilar para producción:
```bash
npm run build
```

### Verificar:
- [ ] Comando completa sin errores
- [ ] Carpeta `dist` se crea
- [ ] Archivos `.html`, `.js`, `.css` en `dist`

### Previsualizar build:
```bash
npm run preview
```

### Verificar:
- [ ] Servidor preview inicia
- [ ] Aplicación funciona igual que en desarrollo
- [ ] No hay errores en consola

---

## 🧹 Limpieza y Mantenimiento

### Linter
```bash
npm run lint
```
- [ ] No hay errores críticos
- [ ] Warnings son aceptables o se corrigen

### Type Check
```bash
npm run type-check
```
- [ ] No hay errores de TypeScript
- [ ] Todos los tipos están correctos

---

## 🎯 Checklist Final

### Funcionalidad Core
- [ ] ✅ Autenticación funciona
- [ ] ✅ Roles y permisos funcionan
- [ ] ✅ Navegación funciona
- [ ] ✅ Dashboards cargan
- [ ] ✅ CRUD de usuarios funciona
- [ ] ✅ Gestión de fichas funciona
- [ ] ✅ Carga de archivos funciona
- [ ] ✅ Perfil de usuario funciona

### Performance
- [ ] ✅ Página carga en < 3 segundos
- [ ] ✅ Hot reload es instantáneo
- [ ] ✅ No hay lag en la UI
- [ ] ✅ No hay memory leaks (verificar en Chrome DevTools)

### Experiencia de Usuario
- [ ] ✅ Diseño es atractivo
- [ ] ✅ Navegación es intuitiva
- [ ] ✅ Feedback visual en acciones (toasts, loading states)
- [ ] ✅ Responsive en móvil y desktop
- [ ] ✅ No hay elementos rotos o desalineados

### Código y Desarrollo
- [ ] ✅ No hay errores en consola
- [ ] ✅ No hay warnings importantes
- [ ] ✅ TypeScript sin errores
- [ ] ✅ Linter pasa
- [ ] ✅ Build de producción funciona

---

## 🐛 ¿Encontraste problemas?

### Si algo no funciona:
1. **Consulta FAQ.md** - Problemas comunes y soluciones
2. **Revisa la consola** - F12 en el navegador
3. **Revisa la terminal** - Errores de compilación
4. **Lee README.md** - Instrucciones detalladas
5. **Lee GUIA_VISUAL_STUDIO_CODE.md** - Tutorial paso a paso

### Errores comunes:
- "npm no reconocido" → Node.js no instalado
- "Cannot find module" → Ejecutar `npm install`
- "Port in use" → Cerrar otros servidores Vite
- Página en blanco → Revisar consola del navegador
- Estilos no cargan → Verificar `globals.css` importado

---

## ✨ ¡Todo Funciona!

Si marcaste todos los checkboxes:

🎉 **¡Felicidades!** Tu sistema está completamente funcional y listo para desarrollo.

### Próximos pasos:
1. Explora el código en `/components`
2. Lee la documentación técnica
3. Haz tus primeras modificaciones
4. Prueba crear nuevos componentes
5. ¡Empieza a desarrollar!

---

**Fecha de verificación**: __________  
**Versión de Node.js**: __________  
**Sistema Operativo**: __________  
**Resultado**: ✅ Funcionando / ❌ Problemas encontrados