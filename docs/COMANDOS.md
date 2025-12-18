# 💻 Comandos Esenciales

Referencia rápida de todos los comandos que necesitas.

---

## 🚀 Comandos Principales

### Instalación
```bash
# Instalar todas las dependencias
npm install
```

### Desarrollo
```bash
# Iniciar servidor de desarrollo (Hot Reload)
npm run dev
```
👉 Abre: http://localhost:5173

### Build de Producción
```bash
# Compilar para producción
npm run build

# Previsualizar build de producción
npm run preview
```

### Calidad de Código
```bash
# Ejecutar linter (ESLint)
npm run lint

# Verificar tipos TypeScript
npm run type-check
```

---

## 🛑 Detener el Servidor

En la terminal donde corre `npm run dev`:
```
Ctrl + C
```
Luego confirma con `Y` si pregunta.

---

## 🔄 Comandos de npm Útiles

### Ver paquetes instalados
```bash
# Listar dependencias principales
npm list --depth=0

# Ver versión de un paquete específico
npm list react
npm list vite
```

### Actualizar dependencias
```bash
# Ver paquetes desactualizados
npm outdated

# Actualizar todos los paquetes
npm update

# Actualizar paquete específico
npm update react
```

### Reinstalar dependencias
```bash
# Limpiar y reinstalar todo
rm -rf node_modules package-lock.json
npm install

# En Windows (PowerShell):
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json
npm install
```

### Instalar paquetes adicionales
```bash
# Instalar nueva dependencia
npm install nombre-paquete

# Instalar dependencia de desarrollo
npm install --save-dev nombre-paquete

# Desinstalar paquete
npm uninstall nombre-paquete
```

---

## 🔍 Comandos de Verificación

### Verificar instalación de Node.js
```bash
# Ver versión de Node.js (debe ser v18+)
node --version
node -v

# Ver versión de npm (debe ser v8+)
npm --version
npm -v
```

### Verificar estructura del proyecto
```bash
# Listar archivos (Linux/Mac)
ls -la

# Listar archivos (Windows)
dir

# Ver árbol de carpetas (si tienes tree instalado)
tree -L 2
```

---

## 🧹 Comandos de Limpieza

### Limpiar caché de npm
```bash
# Limpiar caché
npm cache clean --force

# Verificar caché
npm cache verify
```

### Limpiar archivos de build
```bash
# Eliminar carpeta dist (Linux/Mac)
rm -rf dist

# Eliminar carpeta dist (Windows PowerShell)
Remove-Item dist -Recurse -Force
```

---

## 🐛 Comandos de Diagnóstico

### Verificar puertos en uso
```bash
# Ver qué está usando el puerto 5173 (Linux/Mac)
lsof -i :5173

# Ver qué está usando el puerto 5173 (Windows)
netstat -ano | findstr :5173
```

### Matar proceso en puerto
```bash
# Matar proceso en puerto 5173 (Linux/Mac)
kill -9 $(lsof -t -i:5173)

# Matar proceso en puerto 5173 (Windows)
# Primero ver el PID con netstat, luego:
taskkill /PID <numero-pid> /F

# O usar npx
npx kill-port 5173
```

---

## 📦 Comandos de Git

### Inicializar repositorio
```bash
# Inicializar Git
git init

# Ver estado
git status

# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "Descripción del cambio"
```

### Clonar y actualizar
```bash
# Clonar repositorio
git clone <url-del-repositorio>

# Actualizar desde remoto
git pull

# Subir cambios
git push
```

### Ramas
```bash
# Ver ramas
git branch

# Crear nueva rama
git checkout -b nombre-rama

# Cambiar de rama
git checkout nombre-rama

# Fusionar rama
git merge nombre-rama
```

---

## ⚙️ Comandos de VS Code (Terminal Integrada)

### Abrir proyecto
```bash
# Abrir carpeta actual en VS Code
code .

# Abrir carpeta específica
code /ruta/a/carpeta
```

### Terminal integrada
```bash
# Abrir nueva terminal: Ctrl + Shift + ` (backtick)
# Cerrar terminal: Ctrl + D o escribir "exit"

# Limpiar terminal (Linux/Mac)
clear

# Limpiar terminal (Windows)
cls
```

---

## 🔧 Scripts Personalizados (package.json)

Los scripts disponibles están definidos en `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx",
    "type-check": "tsc --noEmit"
  }
}
```

Para ejecutar cualquier script:
```bash
npm run <nombre-del-script>
```

---

## 🎯 Flujo de Trabajo Típico

### Inicio del día
```bash
# 1. Actualizar código (si usas Git)
git pull

# 2. Instalar nuevas dependencias (si hubo cambios)
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
```

### Durante el desarrollo
```bash
# El servidor está corriendo con npm run dev
# Solo guarda archivos (Ctrl+S) y los cambios aparecen automáticamente
```

### Antes de hacer commit
```bash
# 1. Verificar que no haya errores de linting
npm run lint

# 2. Verificar que no haya errores de TypeScript
npm run type-check

# 3. Probar build de producción
npm run build

# 4. Si todo está bien, hacer commit
git add .
git commit -m "Descripción del cambio"
git push
```

### Fin del día
```bash
# 1. Detener el servidor (Ctrl+C en la terminal)

# 2. Guardar cambios en Git
git add .
git commit -m "Progreso del día"
git push
```

---

## 📱 Comandos Específicos del Proyecto

### Ver logs detallados
```bash
# Vite con logs verbosos
npm run dev -- --debug

# Build con estadísticas
npm run build -- --mode development
```

### Limpiar todo y empezar de cero
```bash
# 1. Eliminar node_modules y lock files
rm -rf node_modules package-lock.json

# 2. Eliminar build
rm -rf dist

# 3. Limpiar caché
npm cache clean --force

# 4. Reinstalar todo
npm install

# 5. Reiniciar servidor
npm run dev
```

---

## 🚨 Comandos de Emergencia

### Si nada funciona
```bash
# OPCIÓN 1: Reinstalar Node.js
# 1. Desinstala Node.js completamente
# 2. Descarga la última versión LTS de nodejs.org
# 3. Instala Node.js
# 4. Reinicia tu computadora
# 5. Abre una nueva terminal
# 6. npm install
# 7. npm run dev

# OPCIÓN 2: Clonar proyecto de nuevo
# 1. Respalda tus cambios
# 2. Elimina la carpeta del proyecto
# 3. Clona el repositorio de nuevo
# 4. npm install
# 5. npm run dev
```

### Si el puerto está ocupado
```bash
# Matar todo lo que use el puerto 5173
npx kill-port 5173

# Reiniciar servidor
npm run dev
```

### Si TypeScript da errores
```bash
# Reinstalar types
npm install @types/react @types/react-dom @types/node --save-dev

# Reiniciar VS Code
# Ctrl+Shift+P → "Developer: Reload Window"
```

---

## 📚 Comandos de Ayuda

### Ver ayuda de npm
```bash
# Ayuda general
npm help

# Ayuda de comando específico
npm help install
npm help run-script
```

### Ver ayuda de Vite
```bash
# Ayuda de Vite
npx vite --help
```

---

## 🎓 Tips de Terminal

### Atajos útiles
- `Ctrl + C` - Detener proceso actual
- `Ctrl + L` - Limpiar terminal (Linux/Mac)
- `Tab` - Autocompletar comandos y rutas
- `↑` / `↓` - Navegar por historial de comandos
- `Ctrl + R` - Buscar en historial de comandos
- `Ctrl + A` - Ir al inicio de la línea
- `Ctrl + E` - Ir al final de la línea

### Navegación
```bash
# Ver directorio actual
pwd

# Listar archivos
ls         # Linux/Mac
dir        # Windows

# Cambiar directorio
cd carpeta
cd ..      # Subir un nivel
cd ~       # Ir a home (Linux/Mac)
cd %USERPROFILE%  # Ir a home (Windows)
```

---

## 📝 Notas Importantes

1. **Siempre ejecuta comandos npm desde la raíz del proyecto** (donde está `package.json`)

2. **Si un comando falla**, lee el mensaje de error completo. A menudo te dice exactamente qué hacer.

3. **No uses `sudo` con npm** (en Linux/Mac) a menos que sea absolutamente necesario.

4. **Si algo no funciona después de instalar dependencias**, intenta reiniciar VS Code o el servidor de desarrollo.

5. **Mantén Node.js actualizado** a la última versión LTS para mejor compatibilidad.

---

## 🔗 Referencias

- [npm CLI docs](https://docs.npmjs.com/cli/)
- [Vite CLI docs](https://vitejs.dev/guide/cli.html)
- [Git cheat sheet](https://education.github.com/git-cheat-sheet-education.pdf)

---

**¡Guarda este archivo como referencia!** 🔖

Puedes consultarlo cada vez que necesites recordar un comando.