# 🚀 Inicio Rápido - Backend FastAPI (oficial)

Este proyecto consolidó el backend en **FastAPI** (Python). El backend antiguo de Node/Express quedó deprecado. Aquí tienes el setup y cómo abrir la documentación en /docs.

---

## ⚡ Setup

1) Crear/usar entorno virtual (Windows)

```bash
python -m venv .venv
".venv/Scripts/python.exe" -m pip install --upgrade pip
".venv/Scripts/python.exe" -m pip install -r backend_fastapi/requirements.txt
```

2) Variables de entorno

Edita `backend_fastapi/.env` (ya existe un ejemplo) y confirma:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gestion_academica
DB_USER=admin_academico
DB_PASSWORD=admin123
API_VERSION=v1
```

3) Iniciar el servidor

Opción A (Windows):
```bash
./RUN_FASTAPI.bat
```

Opción B (cualquier SO):
```bash
".venv/Scripts/python.exe" -m uvicorn backend_fastapi.app.main:app --host 127.0.0.1 --port 8000 --reload
```

4) Abrir documentación

Visita en el navegador:

- http://127.0.0.1:8000/docs
- http://127.0.0.1:8000/redoc

---

## 🧪 Verificación rápida

Comprobar salud y base de datos:

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/api/v1/db/config
curl http://127.0.0.1:8000/api/v1/db/ping
```

---

## � Si /docs no abre

- Asegúrate de tener el servidor corriendo en la consola (no debe cerrarse).
- Prueba a vincular a todas las interfaces:

```bash
".venv/Scripts/python.exe" -m uvicorn backend_fastapi.app.main:app --host 0.0.0.0 --port 8000 --reload
```

- Revisa que nada use el puerto 8000 y que el firewall no bloquee.
- Si aparece error de `python-multipart`, instala: `pip install python-multipart`.

---

## 📂 Estructura backend FastAPI

```
backend_fastapi/
├── app/
│   ├── main.py                # App FastAPI + routers
│   ├── db.py                  # Pool de conexiones psycopg 3
│   ├── security.py            # JWT, bcrypt, dependencias
│   └── routers/               # auth, users, fichas, materias, calificaciones, db, health, api_info
├── requirements.txt           # Dependencias
├── .env                       # Configuración
└── tests/                     # Pruebas (opcional)
```

---

## ✅ Checklist

- [ ] PostgreSQL disponible y credenciales correctas
- [ ] `.venv` creado e instalado `requirements.txt`
- [ ] Servidor iniciado sin errores (uvicorn)
- [ ] Abre http://127.0.0.1:8000/docs correctamente
- [ ] `/api/v1/db/ping` responde ok

---

## 🔁 Nota de migración

El backend Node/Express en `backend/` quedó deprecado. No lo inicies ni instales sus dependencias. Todo fluye a través de `backend_fastapi`.
