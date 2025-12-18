# 📘 Comandos del Backend (FastAPI)

Backend oficial: `backend_fastapi`.

---

## 🚀 Setup

Instalar dependencias en venv:
```bash
python -m venv .venv
".venv/Scripts/python.exe" -m pip install --upgrade pip
".venv/Scripts/python.exe" -m pip install -r backend_fastapi/requirements.txt
```

Variables de entorno: editar `backend_fastapi/.env`.

---

## 🔧 Desarrollo

Iniciar servidor (Windows):
```bash
./RUN_FASTAPI.bat
```

Iniciar servidor (cualquier SO):
```bash
".venv/Scripts/python.exe" -m uvicorn backend_fastapi.app.main:app --host 127.0.0.1 --port 8000 --reload
```

Abrir documentación:
```text
http://127.0.0.1:8000/docs
http://127.0.0.1:8000/redoc
```

---

## 🗄️ Base de datos

Ping a DB y ver config:
```bash
curl http://127.0.0.1:8000/api/v1/db/ping
curl http://127.0.0.1:8000/api/v1/db/config
```

Conectar por psql:
```bash
psql -h localhost -U admin_academico -d gestion_academica
```

---

## 🧪 Testing rápido

Health:
```bash
curl http://127.0.0.1:8000/health
```

OpenAPI JSON:
```bash
curl http://127.0.0.1:8000/openapi.json
```

---

## 🐛 Troubleshooting

- Si /docs no abre, asegúrate de que el proceso de Uvicorn está corriendo.
- Prueba a escuchar en todas las interfaces:
```bash
".venv/Scripts/python.exe" -m uvicorn backend_fastapi.app.main:app --host 0.0.0.0 --port 8000 --reload
```
- Verifica que el puerto 8000 esté libre:
```bash
netstat -ano | findstr 8000
```
- Si falta `python-multipart` o `psycopg_pool`, instala con pip:
```bash
".venv/Scripts/python.exe" -m pip install python-multipart psycopg-pool
```

---

## � Nota

El backend de Node/Express (carpeta `backend/`) quedó deprecado y ya no se usa. Evita ejecutarlo o instalar sus dependencias.
