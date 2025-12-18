# 🚀 CÓMO INICIAR EL PROYECTO

## 🎯 Opción Rápida (3 pasos)

### 1️⃣ Configurar PostgreSQL
```bash
# Linux/Mac
./SETUP_DB.sh

# Windows
SETUP_DB.bat
```

### 2️⃣ Instalar todo automáticamente
```bash
# Linux/Mac
chmod +x INICIAR_TODO.sh
./INICIAR_TODO.sh
```

### 3️⃣ Iniciar servidores (2 terminales)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

---

## 📖 Opción Manual (paso a paso)

Si prefieres hacerlo manualmente, lee: **`INICIAR_PROYECTO.md`**

---

## 🔑 Credenciales de Prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| **Administrador** | admin@example.com | admin123 |
| **Coordinador** | coordinador@example.com | coord123 |
| **Docente** | docente@example.com | doc123 |

---

## 📊 URLs

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Health Check:** http://localhost:3000/health

---

## ❓ Problemas?

Revisa: **`INICIAR_PROYECTO.md`** → Sección "Solución de Problemas Comunes"

---

## 📚 Documentación Completa

Toda la documentación está en `/docs/`:
- `docs/ARQUITECTURA.md` - Arquitectura del sistema
- `docs/FAQ.md` - Preguntas frecuentes
- `docs/GUIA_BACKEND_SETUP.md` - Configuración detallada del backend
- `docs/COMANDOS.md` - Lista de todos los comandos
- Y más...

---

**¡Listo! 🎉 En 3 pasos tu proyecto estará funcionando.**
