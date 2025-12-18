# 🎉 ¡Bienvenido al Sistema de Gestión Académica!

---

## 👋 ¡Hola!

Gracias por interesarte en este proyecto. Este es un sistema completo de gestión académica construido con tecnologías modernas (React + TypeScript + Vite).

---

## 🗺️ ¿Por Dónde Empezar?

Dependiendo de tu experiencia, elige tu camino:

### 🟢 **Soy Principiante** (Nunca he usado React/Vite)
👉 **Lee primero**: `GUIA_VISUAL_STUDIO_CODE.md`

Esta guía te lleva paso a paso desde cero:
- ✅ Cómo instalar Node.js
- ✅ Cómo configurar Visual Studio Code
- ✅ Cómo ejecutar el proyecto
- ✅ Solución de problemas comunes

---

### 🟡 **Tengo algo de experiencia** (Conozco React pero no Vite)
👉 **Lee primero**: `INICIO_RAPIDO.md`

Una guía rápida de 3 pasos:
```bash
npm install
npm run dev
# Abre http://localhost:5173
```

Si tienes problemas, consulta `FAQ.md`

---

### 🔴 **Soy Desarrollador Experimentado** (Conozco React + Vite)
👉 **Directo al grano**:

```bash
# 1. Instalar
npm install

# 2. Ejecutar
npm run dev

# 3. Login
Email: admin@instituto.edu
Password: 123456
```

Para arquitectura técnica, lee `ARQUITECTURA.md`

---

## 📚 Mapa de Documentación

```
┌─────────────────────────────────────────────────┐
│          DOCUMENTACIÓN DISPONIBLE              │
└─────────────────────────────────────────────────┘

🚀 INICIO_RAPIDO.md
   └─ 3 comandos para empezar
   └─ Credenciales de acceso
   └─ Comandos útiles

🎓 GUIA_VISUAL_STUDIO_CODE.md
   └─ Tutorial completo paso a paso
   └─ Instalación de Node.js
   └─ Configuración de VS Code
   └─ Solución de problemas

❓ FAQ.md
   └─ Preguntas frecuentes
   └─ Errores comunes
   └─ Tips y trucos
   └─ Recursos de aprendizaje

✅ VERIFICACION.md
   └─ Checklist de funcionamiento
   └─ Verificar instalación
   └─ Probar todas las features
   └─ Confirmar que todo funciona

🏗️ ARQUITECTURA.md
   └─ Documentación técnica
   └─ Estructura de archivos
   └─ Flujo de datos
   └─ Patrones de diseño

📖 README.md
   └─ Documentación principal
   └─ Features del sistema
   └─ Stack tecnológico
   └─ Instrucciones de instalación

📋 guidelines/Guidelines.md
   └─ Guías de desarrollo
   └─ Estándares de código
   └─ Convenciones del proyecto
```

---

## 🎯 Flujo Recomendado

### Primera Vez
```
1. Lee README.md (5 min)
   └─ Entiende qué es el proyecto

2. Decide tu nivel:
   ├─ Principiante → GUIA_VISUAL_STUDIO_CODE.md
   └─ Experimentado → INICIO_RAPIDO.md

3. Ejecuta el proyecto
   └─ Sigue las instrucciones de tu guía

4. Usa VERIFICACION.md
   └─ Confirma que todo funciona

5. ¡Empieza a explorar el código!
```

### Desarrollo Diario
```
1. npm run dev
   └─ Inicia el servidor

2. Haz cambios en el código
   └─ Los cambios aparecen automáticamente

3. ¿Tienes un problema?
   └─ Revisa FAQ.md

4. ¿Quieres entender la arquitectura?
   └─ Lee ARQUITECTURA.md
```

---

## 🔑 Credenciales Rápidas

### Administrador (acceso completo)
```
Email: admin@instituto.edu
Password: 123456
```

### Coordinador (reportes)
```
Email: coordinador@instituto.edu
Password: 123456
```

### Docente (carga de archivos)
```
Email: docente@instituto.edu
Password: 123456
```

---

## 🚀 Comandos Esenciales

```bash
# Instalar dependencias
npm install

# Iniciar desarrollo
npm run dev

# Construir para producción
npm run build

# Verificar código
npm run lint

# Verificar tipos TypeScript
npm run type-check
```

---

## 🎨 Características Principales

### ✅ Sistema de Autenticación
3 roles con permisos diferenciados

### ✅ Dashboards Personalizados
Cada rol ve información relevante

### ✅ Gestión de Usuarios
CRUD completo (solo administradores)

### ✅ Fichas y Materias
Gestión de programas académicos

### ✅ Carga de Archivos Excel
Procesamiento inteligente de calificaciones

### ✅ Sistema de Perfiles
Configuración personal de usuarios

---

## 🛠️ Stack Tecnológico

```
┌─────────────────────────────────────┐
│  Frontend                           │
│  ├─ React 18                        │
│  ├─ TypeScript                      │
│  └─ Tailwind CSS v4                 │
├─────────────────────────────────────┤
│  Build Tool                         │
│  └─ Vite (rápido y moderno)         │
├─────────────────────────────────────┤
│  UI Components                      │
│  ├─ shadcn/ui                       │
│  ├─ Radix UI                        │
│  └─ Lucide Icons                    │
├─────────────────────────────────────┤
│  Libraries                          │
│  ├─ Recharts (gráficos)             │
│  ├─ xlsx (procesamiento Excel)      │
│  └─ Sonner (notificaciones)         │
└─────────────────────────────────────┘
```

---

## 💡 Tips Iniciales

### 1. **Hot Reload**
Al guardar (`Ctrl+S`), los cambios aparecen automáticamente en el navegador. ¡No necesitas refrescar!

### 2. **Consola del Navegador**
Si algo no funciona, presiona `F12` y revisa la pestaña "Console" para ver errores.

### 3. **Terminal de VS Code**
Usa `Ctrl+ñ` para abrir/cerrar la terminal integrada rápidamente.

### 4. **Extensiones de VS Code**
Instala las extensiones recomendadas (VS Code te sugerirá automáticamente).

### 5. **TypeScript**
No te preocupes por los tipos al inicio. TypeScript te ayudará a detectar errores automáticamente.

---

## 🐛 Problemas Comunes

### "npm no se reconoce como comando"
→ Node.js no está instalado. Lee `GUIA_VISUAL_STUDIO_CODE.md`

### "Cannot find module 'react'"
→ Ejecuta `npm install`

### "Port 5173 is already in use"
→ Ya hay un servidor corriendo. Ciérralo o usa otro puerto

### Página en blanco
→ Abre la consola del navegador (F12) y revisa errores

### Más problemas
→ Consulta `FAQ.md`

---

## 📞 ¿Necesitas Ayuda?

### Orden de consulta:
1. **FAQ.md** - Preguntas frecuentes
2. **README.md** - Documentación completa
3. **GUIA_VISUAL_STUDIO_CODE.md** - Tutorial paso a paso
4. **Google** - Busca el mensaje de error
5. **GitHub Issues** - Reporta el problema

---

## 🎓 Recursos de Aprendizaje

### React
- [React.dev](https://react.dev) - Documentación oficial
- [es.react.dev](https://es.react.dev) - En español

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

### Vite
- [Vite Guide](https://vitejs.dev/guide/)

### Tailwind CSS
- [Tailwind Docs](https://tailwindcss.com/docs)

---

## ✨ Próximos Pasos

```
┌─────────────────────────────────────────────────┐
│  1. ✅ Instalar Node.js                         │
│  2. ✅ Clonar/descargar el proyecto             │
│  3. ✅ Ejecutar npm install                     │
│  4. ✅ Ejecutar npm run dev                     │
│  5. ✅ Abrir http://localhost:5173              │
│  6. ✅ Iniciar sesión con credenciales de prueba│
│  7. ✅ Explorar el sistema                      │
│  8. ✅ Revisar el código                        │
│  9. ✅ Hacer tus primeros cambios               │
│  10. ✅ ¡Seguir aprendiendo!                    │
└─────────────────────────────────────────────────┘
```

---

## 🎉 ¡Listo para Empezar!

Ahora que conoces la estructura de documentación, elige tu camino:

### 👉 Principiante
```bash
Abre: GUIA_VISUAL_STUDIO_CODE.md
```

### 👉 Intermedio
```bash
Abre: INICIO_RAPIDO.md
```

### 👉 Experto
```bash
npm install && npm run dev
```

---

## 🌟 ¡Disfruta Desarrollando!

Este proyecto ha sido diseñado para ser fácil de usar y aprender. Si tienes sugerencias o encuentras problemas, no dudes en reportarlos.

**¡Feliz coding!** 🚀

---

*Sistema de Gestión Académica v1.0.0*  
*Construido con ❤️ usando React + TypeScript + Vite*