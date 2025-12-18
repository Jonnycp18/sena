# �️ Solución de Problemas

## /docs no abre (ERR_CONNECTION_REFUSED)

- Asegúrate de que el servidor FastAPI esté corriendo y la ventana no se haya cerrado.
- Usa el script:
```bash
./RUN_FASTAPI.bat
```
- O ejecuta Uvicorn con reload:
```bash
".venv/Scripts/python.exe" -m uvicorn backend_fastapi.app.main:app --host 127.0.0.1 --port 8000 --reload
```
- Si sigue fallando, intenta escuchar en todas las interfaces:
```bash
".venv/Scripts/python.exe" -m uvicorn backend_fastapi.app.main:app --host 0.0.0.0 --port 8000 --reload
```
- Verifica el puerto:
```bash
netstat -ano | findstr 8000
```

## Error: "Form data requires python-multipart"
```bash
".venv/Scripts/python.exe" -m pip install python-multipart
```

## Error: "No module named psycopg_pool"
```bash
".venv/Scripts/python.exe" -m pip install psycopg-pool==3.2.2
```

## Error al generar OpenAPI en Python 3.9
Usar versiones fijadas de pydantic en `backend_fastapi/requirements.txt` ya incluidas.
# �🔧 SOLUCIÓN DE PROBLEMAS

## ❌ Problema: "No tiene estilos" / La página se ve sin formato

### Causa
Los estilos de Tailwind no se están cargando correctamente.

### Solución

1. **Verifica que el archivo de estilos esté importado en `main.tsx`:**
   ```tsx
   import './styles/globals.css'  // ← Esta línea debe existir
   ```

2. **Limpia la caché de Vite y reinstala:**
   ```bash
   # Detén el servidor (Ctrl+C)
   
   # Elimina node_modules y package-lock.json
   rm -rf node_modules package-lock.json
   
   # Reinstala
   npm install
   
   # Reinicia el servidor
   npm run dev
   ```

3. **Fuerza recarga completa en el navegador:**
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

---

## ❌ Problema: "Could not find a declaration file for module 'react'"

### Causa
TypeScript no encuentra los tipos de React.

### Solución

```bash
# Instalar tipos de React
npm install --save-dev @types/react @types/react-dom

# O reinstalar todo
./ARREGLAR_PROYECTO.bat    # Windows
./ARREGLAR_PROYECTO.sh     # Linux/Mac
```

---

## ❌ Problema: "No inputs were found in config file 'tsconfig.json'"

### Causa
Hay archivos `tsconfig.json` conflictivos o el proyecto está buscando en carpetas incorrectas.

### Solución

1. **Verifica que NO exista `/docs/src/tsconfig.json`:**
   ```bash
   # Eliminar si existe
   rm -rf docs/src
   ```

2. **El `tsconfig.json` correcto debe tener:**
   ```json
   {
     "include": ["*.ts", "*.tsx", "components/**/*", "hooks/**/*", "utils/**/*"],
     "exclude": ["node_modules", "dist", "backend", "docs"]
   }
   ```

3. **Reinicia VS Code:**
   - Cierra VS Code completamente
   - Abre de nuevo el proyecto
   - Presiona `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

---

## ❌ Problema: El servidor no inicia / Puerto en uso

### Puerto 5173 en uso (Frontend)
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5173 | xargs kill -9
```

### Puerto 3000 en uso (Backend)
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

---

## ❌ Problema: PostgreSQL no conecta

### Verificar que PostgreSQL esté corriendo
```bash
# Windows
# Services → PostgreSQL → Start

# Linux
sudo service postgresql start

# Mac
brew services start postgresql
```

### Verificar credenciales en `/backend/.env`
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gestion_academica
DB_USER=admin_academico
DB_PASSWORD=admin123
```

### Crear base de datos manualmente
```bash
# Conectar como superusuario
psql -U postgres

# Dentro de psql
CREATE DATABASE gestion_academica;
CREATE USER admin_academico WITH ENCRYPTED PASSWORD 'admin123';
GRANT ALL PRIVILEGES ON DATABASE gestion_academica TO admin_academico;
\q
```

---

## ❌ Problema: Errores al ejecutar migraciones

### Error: "relation already exists"
```bash
# La tabla ya existe, resetea la BD
cd backend
psql -U postgres -d gestion_academica -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npm run migrate
npm run seed
```

### Error: "password authentication failed"
```bash
# Verificar password en .env
cat backend/.env | grep DB_PASSWORD

# Cambiar password del usuario PostgreSQL
psql -U postgres
ALTER USER admin_academico WITH PASSWORD 'admin123';
\q
```

---

## 🔄 SOLUCIÓN UNIVERSAL: Reinstalación Completa

Si nada funciona, ejecuta esto:

### Windows
```bash
ARREGLAR_PROYECTO.bat
```

### Linux/Mac
```bash
chmod +x ARREGLAR_PROYECTO.sh
./ARREGLAR_PROYECTO.sh
```

Este script:
1. ✅ Elimina `node_modules` del frontend y backend
2. ✅ Elimina `package-lock.json` del frontend y backend
3. ✅ Reinstala todas las dependencias
4. ✅ Te indica los próximos pasos

---

## 📋 Checklist de Verificación

Antes de reportar un error, verifica:

- [ ] ¿Node.js >= 18.0.0? (`node --version`)
- [ ] ¿npm >= 9.0.0? (`npm --version`)
- [ ] ¿PostgreSQL instalado? (`psql --version`)
- [ ] ¿PostgreSQL corriendo? (`psql -U postgres`)
- [ ] ¿Base de datos existe? (`psql -U postgres -l | grep gestion`)
- [ ] ¿Archivo `/backend/.env` existe?
- [ ] ¿Credenciales correctas en `.env`?
- [ ] ¿Dependencias instaladas? (`ls node_modules`)
- [ ] ¿Puerto 5173 libre?
- [ ] ¿Puerto 3000 libre?
- [ ] ¿VS Code reiniciado?
- [ ] ¿Navegador con cache limpia? (`Ctrl+Shift+R`)

---

## 🆘 Ayuda Adicional

Si sigues teniendo problemas:

1. **Lee la documentación completa:** `/docs/`
2. **Revisa el FAQ:** `/docs/FAQ.md`
3. **Guía backend:** `/docs/GUIA_BACKEND_SETUP.md`
4. **Comandos disponibles:** `/docs/COMANDOS.md`

---

## 🎯 Flujo Correcto para Iniciar

```bash
# 1. Limpiar e instalar
./ARREGLAR_PROYECTO.bat    # Windows
./ARREGLAR_PROYECTO.sh     # Linux/Mac

# 2. Configurar PostgreSQL
./SETUP_DB.bat             # Windows
./SETUP_DB.sh              # Linux/Mac

# 3. Migrar base de datos
cd backend
npm run migrate
npm run seed

# 4. Iniciar backend (Terminal 1)
npm run dev

# 5. Iniciar frontend (Terminal 2 - nueva terminal)
cd ..
npm run dev
```

---

**¡Con estos pasos tu proyecto debería funcionar correctamente!** 🚀
