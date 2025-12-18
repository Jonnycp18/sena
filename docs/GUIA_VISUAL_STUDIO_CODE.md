# 🚀 Guía Completa: Cómo Ejecutar el Proyecto en Visual Studio Code

Esta guía te llevará paso a paso desde cero hasta tener el proyecto corriendo en tu computadora usando Visual Studio Code.

## 📋 ¿Qué es este proyecto?

Este es un **sistema de gestión académica** construido con:
- **React 18** (biblioteca de JavaScript para interfaces)
- **TypeScript** (JavaScript con tipos)
- **Vite** (herramienta de desarrollo moderna y rápida)
- **Tailwind CSS** (framework de estilos)

**¿Qué hace Vite?** Vite es el servidor que:
- Compila tu código React + TypeScript en tiempo real
- Actualiza automáticamente el navegador cuando guardas cambios (Hot Reload)
- Es MUY rápido (más que Create React App)

---

## 🎯 PASO 1: Instalar Node.js y npm

### ¿Por qué necesito Node.js?
Node.js es el entorno que permite ejecutar JavaScript fuera del navegador. Vite y React necesitan Node.js para funcionar.

### Verificar si ya tienes Node.js
1. Abre una terminal (Command Prompt, PowerShell, o Terminal)
2. Escribe estos comandos:

```bash
node --version
npm --version
```

**Si ves versiones (ej: v18.17.0 y 9.6.7):** ✅ Ya tienes Node.js instalado
- Necesitas **Node.js v18 o superior**
- Si tu versión es menor, actualiza Node.js

**Si ves un error:** ❌ Necesitas instalar Node.js

### Instalar Node.js (si no lo tienes)
1. Ve a [https://nodejs.org/](https://nodejs.org/)
2. Descarga la versión **LTS** (Long Term Support) - recomendada
3. Ejecuta el instalador
4. Sigue el asistente de instalación (acepta las opciones por defecto)
5. Reinicia tu computadora
6. Verifica la instalación con `node --version`

**npm viene incluido con Node.js**, así que no necesitas instalarlo por separado.

---

## 🎯 PASO 2: Instalar Visual Studio Code

### ¿Ya tienes VS Code instalado?
Si ya tienes Visual Studio Code, salta al **PASO 3**.

### Instalar VS Code
1. Ve a [https://code.visualstudio.com/](https://code.visualstudio.com/)
2. Descarga VS Code para tu sistema operativo
3. Instala el programa
4. Abre Visual Studio Code

### Extensiones Recomendadas (IMPORTANTE)
Estas extensiones mejorarán mucho tu experiencia:

1. **Abre VS Code**
2. Ve a la sección de **Extensiones** (icono de cuadrados en la barra lateral izquierda, o `Ctrl+Shift+X`)
3. Busca e instala estas extensiones:

   - ✅ **ES7+ React/Redux/React-Native snippets** (por dsznajder)
     - Atajos para escribir código React rápidamente
   
   - ✅ **Tailwind CSS IntelliSense** (por Tailwind Labs)
     - Autocompletado para clases de Tailwind
   
   - ✅ **TypeScript Vue Plugin (Volar)** (opcional pero útil)
     - Mejor soporte para TypeScript
   
   - ✅ **ESLint** (por Microsoft)
     - Detecta errores en tu código
   
   - ✅ **Prettier - Code formatter** (por Prettier)
     - Formatea tu código automáticamente

---

## 🎯 PASO 3: Abrir el Proyecto en VS Code

### Opción A: Si ya tienes el proyecto descargado
1. Abre Visual Studio Code
2. Ve a **File → Open Folder** (Archivo → Abrir Carpeta)
3. Navega a la carpeta del proyecto `sistema-gestion-academica`
4. Haz clic en **Seleccionar carpeta**

### Opción B: Si tienes el proyecto en Git
1. Abre Visual Studio Code
2. Presiona `Ctrl+Shift+P` (o `Cmd+Shift+P` en Mac)
3. Escribe `Git: Clone` y presiona Enter
4. Pega la URL del repositorio
5. Selecciona una carpeta donde guardarlo
6. Cuando termine, haz clic en **Open** para abrir el proyecto

---

## 🎯 PASO 4: Abrir la Terminal Integrada en VS Code

Visual Studio Code tiene una terminal integrada muy útil:

1. **Opción 1**: Presiona `Ctrl+ñ` (o `Ctrl+`` en teclados en inglés)
2. **Opción 2**: Ve al menú **Terminal → New Terminal**
3. **Opción 3**: Presiona `Ctrl+Shift+P` y escribe "Terminal: Create New Terminal"

**Verás una terminal en la parte inferior de VS Code**. Esta terminal ya está en la carpeta de tu proyecto.

---

## 🎯 PASO 5: Instalar las Dependencias del Proyecto

Ahora necesitas descargar todas las bibliotecas que usa el proyecto (React, Vite, Tailwind, etc.)

### En la terminal de VS Code, escribe:

```bash
npm install
```

**¿Qué hace este comando?**
- Lee el archivo `package.json` (lista de dependencias)
- Descarga TODAS las bibliotecas necesarias
- Las guarda en una carpeta llamada `node_modules`
- Puede tomar 2-5 minutos dependiendo de tu internet

**Verás algo como esto:**
```
added 347 packages, and audited 348 packages in 2m
```

**Si ves errores:**
- Asegúrate de tener buena conexión a internet
- Verifica que Node.js esté instalado correctamente
- Intenta borrar `node_modules` y ejecutar `npm install` de nuevo

---

## 🎯 PASO 6: Instalar Dependencias Específicas (Solo si faltan)

Algunas dependencias específicas que usa este proyecto:

```bash
# Para procesar archivos Excel
npm install xlsx
npm install @types/xlsx --save-dev

# Para notificaciones toast
npm install sonner

# Para iconos
npm install lucide-react

# Para tipos de Node.js
npm install @types/node --save-dev
```

**Nota:** Si `npm install` del paso anterior funcionó bien, probablemente ya estén instaladas.

---

## 🎯 PASO 7: ¡EJECUTAR EL PROYECTO! 🚀

Este es el momento que esperabas. En la terminal de VS Code:

```bash
npm run dev
```

**¿Qué pasa ahora?**
- Vite inicia el servidor de desarrollo
- Compila tu código React + TypeScript
- Abre un puerto en tu computadora (usualmente 5173)

**Verás algo como esto en la terminal:**
```
  VITE v5.0.0  ready in 342 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

---

## 🎯 PASO 8: Abrir el Proyecto en el Navegador

### Opción 1: Hacer clic en el enlace
- En la terminal, **mantén presionado `Ctrl`** y **haz clic** en `http://localhost:5173/`
- Se abrirá automáticamente en tu navegador

### Opción 2: Copiar y pegar
1. Copia `http://localhost:5173/`
2. Abre tu navegador (Chrome, Firefox, Edge)
3. Pega la URL en la barra de direcciones
4. Presiona Enter

### ¡Deberías ver la pantalla de LOGIN! 🎉

---

## 🔑 PASO 9: Iniciar Sesión (Credenciales de Prueba)

El sistema tiene usuarios de prueba configurados:

### 👨‍💼 Administrador
- **Email**: `admin@instituto.edu`
- **Contraseña**: `123456`

### 👨‍🏫 Coordinador
- **Email**: `coordinador@instituto.edu`
- **Contraseña**: `123456`

### 👨‍🎓 Docente
- **Email**: `docente@instituto.edu`
- **Contraseña**: `123456`

---

## 📝 PASO 10: Trabajar con el Código

### Editar archivos
1. En VS Code, en el panel izquierdo, verás la estructura de carpetas
2. Navega a cualquier archivo `.tsx` (por ejemplo, `App.tsx`)
3. Haz cambios en el código
4. **Guarda el archivo** (`Ctrl+S`)
5. **¡El navegador se actualizará automáticamente!** (Hot Reload)

### Estructura de carpetas principales:
```
├── App.tsx                    # ← Componente principal
├── components/                # ← Todos tus componentes React
│   ├── LoginPage.tsx         # ← Página de login
│   ├── MainLayout.tsx        # ← Layout principal
│   ├── dashboards/           # ← Dashboards por rol
│   └── ui/                   # ← Componentes de shadcn/ui
├── hooks/                     # ← Custom hooks (como useAuth)
├── styles/                    # ← Estilos CSS
│   └── globals.css           # ← Estilos globales + Tailwind
└── README.md                  # ← Documentación principal
```

---

## 🛑 PASO 11: Detener el Servidor

Cuando termines de trabajar:

1. Ve a la terminal en VS Code
2. Presiona `Ctrl+C`
3. Confirma con `Y` si pregunta
4. El servidor se detendrá

**Para volver a iniciar:**
```bash
npm run dev
```

---

## 🐛 Solución de Problemas Comunes

### ❌ "npm no se reconoce como comando"
**Problema:** Node.js no está instalado correctamente
**Solución:**
1. Reinstala Node.js desde [nodejs.org](https://nodejs.org/)
2. Reinicia tu computadora
3. Abre una nueva terminal
4. Verifica con `node --version`

### ❌ "Cannot find module 'react'"
**Problema:** Las dependencias no están instaladas
**Solución:**
```bash
npm install
```

### ❌ "Port 5173 is already in use"
**Problema:** Ya hay un servidor corriendo en ese puerto
**Solución:**
1. Cierra todos los servidores Vite
2. O mata el proceso: `npx kill-port 5173`
3. Reinicia con `npm run dev`

### ❌ Errores de TypeScript rojos en VS Code
**Problema:** TypeScript no encuentra los tipos
**Solución:**
```bash
npm install @types/react @types/react-dom @types/node --save-dev
```

### ❌ "EACCES: permission denied"
**Problema:** Permisos de carpeta (común en Mac/Linux)
**Solución:**
```bash
sudo chown -R $USER ~/.npm
npm install
```

### ❌ La página no carga o está en blanco
**Problema:** Error en el código
**Solución:**
1. Abre la **Consola del Navegador** (F12)
2. Ve a la pestaña "Console"
3. Busca errores en rojo
4. Lee el error y ve al archivo mencionado

### ❌ Cambios no se reflejan en el navegador
**Problema:** Hot Reload no funciona
**Solución:**
1. Guarda el archivo (`Ctrl+S`)
2. Refresca manualmente el navegador (`F5`)
3. Si persiste, detén el servidor (`Ctrl+C`) y reinícialo (`npm run dev`)

---

## 📚 Comandos Útiles

### Comandos de npm
```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Previsualizar build de producción
npm run preview

# Ejecutar linter
npm run lint

# Ver lista de dependencias
npm list --depth=0

# Actualizar dependencias
npm update
```

### Comandos de Git (si usas control de versiones)
```bash
# Ver estado de cambios
git status

# Añadir cambios
git add .

# Hacer commit
git commit -m "Descripción de cambios"

# Subir cambios
git push
```

---

## 🎓 Recursos Adicionales

### Documentación Oficial
- **React**: [https://react.dev/](https://react.dev/)
- **Vite**: [https://vitejs.dev/](https://vitejs.dev/)
- **TypeScript**: [https://www.typescriptlang.org/](https://www.typescriptlang.org/)
- **Tailwind CSS**: [https://tailwindcss.com/](https://tailwindcss.com/)
- **shadcn/ui**: [https://ui.shadcn.com/](https://ui.shadcn.com/)

### Aprender más sobre el proyecto
- Lee el `README.md` para conocer todas las funcionalidades
- Revisa `guidelines/Guidelines.md` para guías de desarrollo
- Explora los componentes en la carpeta `components/`

---

## ✅ Checklist de Verificación

Marca cada paso cuando lo completes:

- [ ] Node.js instalado (v18+)
- [ ] VS Code instalado
- [ ] Extensiones de VS Code instaladas
- [ ] Proyecto abierto en VS Code
- [ ] Terminal integrada abierta
- [ ] `npm install` ejecutado exitosamente
- [ ] `npm run dev` funcionando
- [ ] Navegador muestra `http://localhost:5173`
- [ ] Puedo iniciar sesión con credenciales de prueba
- [ ] Hot Reload funciona (cambios se reflejan automáticamente)

---

## 🎉 ¡Felicidades!

Si completaste todos los pasos, ahora tienes:

✅ Un entorno de desarrollo funcional
✅ El proyecto corriendo en tu computadora
✅ Visual Studio Code configurado correctamente
✅ Conocimiento de cómo iniciar y detener el servidor

### Próximos pasos:
1. **Explora el sistema** con los diferentes roles (admin, coordinador, docente)
2. **Revisa el código** en los archivos `.tsx`
3. **Haz cambios pequeños** para familiarizarte
4. **Lee la documentación** en `README.md` y `Guidelines.md`

---

## 📞 ¿Necesitas más ayuda?

Si tienes problemas:

1. **Lee el README.md** - Tiene mucha información útil
2. **Busca el error en Google** - Copia el mensaje de error
3. **Revisa la consola del navegador** (F12) - Muestra errores detallados
4. **Verifica la terminal de VS Code** - Muestra errores de compilación

---

**¡Disfruta desarrollando! 🚀**

*Última actualización: Septiembre 2025*