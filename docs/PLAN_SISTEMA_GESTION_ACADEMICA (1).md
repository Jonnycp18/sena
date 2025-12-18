# Plan de Desarrollo - Sistema de Gestión Académica

## 📋 ACTUALIZACIÓN CRÍTICA
**⚠️ TODO EL BACKEND ES FASTAPI (PYTHON) - NO HAY Node.js**

## Índice
1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Lógica de Carga de Excel](#lógica-de-carga-de-excel)
3. [Código Completo con FastAPI](#código-completo-con-fastapi)
4. [Procesador Excel con Pandas](#procesador-excel-con-pandas)
5. [Instalación y Configuración](#instalación-y-configuración)

---

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS v4 + ShadCN UI
- **Backend**: **FastAPI (Python 3.10+)** + PostgreSQL
- **Procesamiento**: Pandas (integrado en FastAPI)
- **Autenticación**: JWT con python-jose + passlib[bcrypt]
- **File Upload**: FastAPI UploadFile (nativo)
- **Base de Datos**: PostgreSQL + psycopg2

### Roles del Sistema

```
┌─────────────────────────────────────────┐
│          ADMINISTRADOR                  │
├─────────────────────────────────────────┤
│ • Gestión de usuarios                   │
│ • Auditoría y logs                      │
│ • Reportes del sistema                  │
│ • Configuración global                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│          COORDINADOR                    │
├─────────────────────────────────────────┤
│ • Gestión de fichas académicas          │
│ • Métricas y KPIs                       │
│ • Aprobación de calificaciones          │
│ • Reportes académicos                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│             DOCENTE                     │
├─────────────────────────────────────────┤
│ • Carga de calificaciones (Excel)       │
│ • Gestión de tareas                     │
│ • Dashboard de progreso                 │
│ • Notificaciones de plazos              │
└─────────────────────────────────────────┘
```

---

## 📊 Lógica de Carga de Excel

### Flujo Completo

```
┌────────────┐
│  DOCENTE   │
│Sube Excel  │
└──────┬─────┘
       │
       ▼
┌─────────────────────────────────────┐
│ 1. FRONTEND VALIDATION              │
│  • Extensión (.xlsx, .xls)          │
│  • Tamaño máximo (20MB)             │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 2. BACKEND FastAPI Upload           │
│  • Recibe UploadFile                │
│  • Guarda temporal                  │
│  • Verifica JWT token               │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 3. PROCESAMIENTO PANDAS             │
│  • Lee Excel                        │
│  • Valida estructura                │
��  • Verifica estados (A, D, -)       │
│  • Detecta duplicados               │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 4. VALIDACIÓN DE NEGOCIO            │
│  • Verifica estudiantes en BD       │
│  • Verifica permisos docente        │
│  • Valida período activo            │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 5. TRANSACCIÓN POSTGRESQL           │
│  • BEGIN                            │
│  • INSERT/UPDATE calificaciones     │
│  • INSERT auditoría                 │
│  • COMMIT o ROLLBACK                │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 6. NOTIFICACIONES                   │
│  • Si tipo = "actualización"        ���
│  • Y hay estado "-" (no entregado)  │
│  • → Notificar estudiantes          │
└─────────────────────────────────────┘
```

### Sistema de Estados

| Estado | Significado | ¿Notifica? |
|--------|-------------|-----------|
| **(vacío)** | Pendiente | ❌ No |
| **A** | Aprobó | ❌ No |
| **D** | Desaprobó | ❌ No |
| **-** | No entregó | ✅ Sí (si pasó fecha límite) |

### Tipos de Carga

#### 1️⃣ Configuración Inicial
- Define estructura de tareas
- No genera notificaciones
- Establece base del curso

#### 2️⃣ Actualización
- Actualiza estados existentes
- **Genera notificaciones** para "-"
- Tracking de cambios

### Formato del Excel

```
| ID | Nombres/Apellidos    | Número de cedula | Correo          |tarea1| tare2 | 6C | ... |
|----|---------------------|---------------------|------------------- |----|----|----|----|
| 1  | GARCÍA LÓPEZ JUAN   | 1000222888      | juan@univ.edu     | A  |    | A  | ... |
| 2  | MARTÍNEZ SILVA ANA  | 1000333777      | ana@univ.edu      | A  | D  |    | ... |
| 3  | RODRÍGUEZ LUIS      | 1000444999      | luis@univ.edu     | -  | A  | A  | ... |
```

**Columnas obligatorias:**
1. ID (secuencial)
2. Nombres/Apellidos (completo)
3. Número de cedula (único)
4. Correo (email válido)
5. Evidencias/Tareas (dinámicas: tarea1, A, tarea2, B, etc.)

---

## 💻 Código Completo con FastAPI

### Estructura del Proyecto

```
backend/
├── app.py                      # ⭐ Aplicación principal
├── requirements.txt
├── .env
├── processors/
│   ├── __init__.py
│   ├── excel_processor.py      # ⭐ Procesador Pandas
│   └── validators.py
├── middleware/
│   ├── __init__.py
│   ├── auth_middleware.py      # ⭐ Verificación JWT
│   └── role_middleware.py
├── controllers/
│   ├── auth_controller.py      # Login, logout
│   ├── user_controller.py      # CRUD usuarios
│   ├── ficha_controller.py     # CRUD fichas
│   └── calificacion_controller.py
├── routes/
│   └── ... (rutas separadas)
├── services/
│   ├── email_service.py
│   ├── notification_service.py
│   └── analytics_service.py
└── utils/
    ├── database.py
    ├── jwt_utils.py
    └��─ password_utils.py
```

### 1. Aplicación Principal (app.py)

```python
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import tempfile
import psycopg2
from psycopg2.extras import RealDictCursor
from processors.excel_processor import procesar_archivo_calificaciones
from middleware.auth_middleware import verify_token

app = FastAPI(title="Sistema de Gestión Académica")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuración BD
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
    "database": os.getenv("DB_NAME", "gestion_academica"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "password")
}

def get_db():
    return psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)

security = HTTPBearer()

@app.post("/api/calificaciones/upload")
async def upload_calificaciones(
    file: UploadFile = File(...),
    curso_id: int = Form(...),
    periodo_id: int = Form(...),
    tipo_carga: str = Form(...),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Endpoint principal para carga de Excel de calificaciones
    """
    # 1. Autenticación
    user = verify_token(credentials.credentials)
    if user["role"] not in ["docente", "coordinador"]:
        raise HTTPException(status_code=403, detail="Sin permisos")
    
    docente_id = user["id"]
    
    # 2. Validar archivo
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Solo .xlsx o .xls")
    
    # 3. Guardar temporalmente
    with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
    
    conn = None
    
    try:
        # 4. Procesar con Pandas
        resultado = procesar_archivo_calificaciones(tmp_path, tipo_carga)
        
        if not resultado['success']:
            return {
                "success": False,
                "errores": resultado['errores'],
                "warnings": resultado['warnings']
            }
        
        # 5. Conexión BD
        conn = get_db()
        cursor = conn.cursor()
        
        # 6. Validar permisos del docente
        cursor.execute(
            "SELECT id FROM cursos WHERE id = %s AND docente_id = %s",
            (curso_id, docente_id)
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=403, detail="Sin permiso en este curso")
        
        # 7. Iniciar transacción
        cursor.execute("BEGIN")
        
        try:
            # 8. Insertar calificaciones
            for registro in resultado['registros']:
                # Buscar estudiante
                cursor.execute(
                    "SELECT id FROM estudiantes WHERE numero_matricula = %s",
                    (registro['dni'],)  # 'dni' contiene número de matrícula
                )
                estudiante = cursor.fetchone()
                if not estudiante:
                    raise Exception(f"Estudiante {registro['dni']} no encontrado")
                
                estudiante_id = estudiante['id']
                
                # Insertar cada tarea/evidencia
                for nombre_tarea, estado in registro['tareas'].items():
                    if estado is not None:  # Solo si tiene valor
                        cursor.execute("""
                            INSERT INTO calificaciones 
                            (estudiante_id, curso_id, periodo_id, tipo_evaluacion, 
                             estado, docente_id, fecha_registro)
                            VALUES (%s, %s, %s, %s, %s, %s, NOW())
                            ON CONFLICT (estudiante_id, curso_id, periodo_id, tipo_evaluacion)
                            DO UPDATE SET 
                                estado = EXCLUDED.estado,
                                docente_id = EXCLUDED.docente_id,
                                fecha_modificacion = NOW()
                        """, (estudiante_id, curso_id, periodo_id, nombre_tarea, 
                              estado, docente_id))
            
            # 9. Registrar auditoría
            cursor.execute("""
                INSERT INTO auditoria 
                (usuario_id, accion, tabla, descripcion, created_at)
                VALUES (%s, %s, %s, %s, NOW())
            """, (
                docente_id,
                'UPLOAD_CALIFICACIONES',
                'calificaciones',
                f"Carga de {resultado['total_registros']} calificaciones para curso {curso_id}"
            ))
            
            # 10. Commit
            conn.commit()
            
            # 11. Respuesta exitosa
            return {
                "success": True,
                "message": "Calificaciones cargadas exitosamente",
                "total_procesados": resultado['total_registros'],
                "metricas": resultado['metricas'],
                "notificaciones": resultado['notificaciones'],
                "warnings": resultado['warnings']
            }
            
        except Exception as e:
            conn.rollback()
            raise e
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Limpiar
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        if conn:
            conn.close()

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "gestion-academica"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 2. Middleware de Autenticación

```python
# middleware/auth_middleware.py

from jose import jwt, JWTError
from fastapi import HTTPException
import os

JWT_SECRET = os.getenv("JWT_SECRET", "cambiar_en_produccion")
JWT_ALGORITHM = "HS256"

def verify_token(token: str) -> dict:
    """
    Verifica y decodifica JWT token
    
    Returns:
        dict: Payload con {id, email, role, nombre}
    
    Raises:
        HTTPException: Si token inválido o expirado
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
```

---

## 🐍 Procesador Excel con Pandas

```python
# processors/excel_processor.py

import pandas as pd
from typing import Dict, List, Any

class ExcelCalificacionesProcessor:
    """
    Procesador de Excel con Pandas
    Estados: Vacío, A (Aprobó), D (Desaprobó), - (No entregó)
    """
    
    REQUIRED_COLUMNS = ['id', 'nombres_apellidos', 'numero_cedula', 'correo']
    ESTADOS_VALIDOS = ['A', 'D', '-', '']
    
    def __init__(self, file_path: str, tipo_carga: str):
        self.file_path = file_path
        self.tipo_carga = tipo_carga  # 'inicial' o 'actualizacion'
        self.df = None
        self.errores = []
        self.warnings = []
        self.metricas = {
            'total_estudiantes': 0,
            'aprobadas': 0,
            'desaprobadas': 0,
            'pendientes': 0,
            'no_entregadas': 0
        }
    
    def procesar(self) -> Dict[str, Any]:
        """Método principal"""
        try:
            self.leer_excel()
            self.normalizar_columnas()
            
            if not self.validar_estructura():
                return self.generar_respuesta_error()
            
            self.limpiar_datos()
            self.validar_estados()
            self.detectar_duplicados()
            self.calcular_metricas()
            
            return self.generar_salida()
            
        except Exception as e:
            self.errores.append(f"Error crítico: {str(e)}")
            return self.generar_respuesta_error()
    
    def leer_excel(self):
        """Lee Excel con pandas"""
        try:
            self.df = pd.read_excel(
                self.file_path,
                engine='openpyxl',
                dtype=str,
                keep_default_na=False
            )
        except:
            try:
                self.df = pd.read_excel(
                    self.file_path,
                    engine='xlrd',
                    dtype=str,
                    keep_default_na=False
                )
            except Exception as e:
                raise Exception(f"No se pudo leer Excel: {str(e)}")
    
    def normalizar_columnas(self):
        """Normaliza nombres de columnas"""
        self.df.columns = (
            self.df.columns
            .str.lower()
            .str.strip()
            .str.replace(' ', '_')
            .str.replace('á', 'a')
            .str.replace('é', 'e')
            .str.replace('í', 'i')
            .str.replace('ó', 'o')
            .str.replace('ú', 'u')
        )
    
    def validar_estructura(self) -> bool:
        """Valida columnas obligatorias"""
        faltantes = [col for col in self.REQUIRED_COLUMNS if col not in self.df.columns]
        
        if faltantes:
            self.errores.append(f"Columnas faltantes: {', '.join(faltantes)}")
            return False
        
        # Detectar columnas de tareas/evidencias
        self.columnas_tareas = [
            col for col in self.df.columns 
            if col not in self.REQUIRED_COLUMNS
        ]
        
        if not self.columnas_tareas:
            self.errores.append("No se encontraron columnas de evidencias")
            return False
        
        return True
    
    def limpiar_datos(self):
        """Limpia datos"""
        # Eliminar filas vacías
        self.df = self.df[self.df.astype(str).ne('').any(axis=1)]
        
        # Limpiar espacios
        for col in self.df.columns:
            if self.df[col].dtype == 'object':
                self.df[col] = self.df[col].str.strip()
        
        # Normalizar estados (mayúsculas)
        for col in self.columnas_tareas:
            self.df[col] = self.df[col].str.upper().str.strip()
    
    def validar_estados(self):
        """Valida que estados sean válidos"""
        for i, row in self.df.iterrows():
            fila_num = i + 2  # Excel empieza en 1 + header
            
            # Validar cédula
            if not row['numero_cedula']:
                self.errores.append(f"Fila {fila_num}: Cédula vacía")
            
            # Validar email
            if row['correo'] and '@' not in row['correo']:
                self.warnings.append(f"Fila {fila_num}: Email inválido")
            
            # Validar estados
            for col_tarea in self.columnas_tareas:
                estado = row[col_tarea]
                if estado not in self.ESTADOS_VALIDOS:
                    self.errores.append(
                        f"Fila {fila_num}, {col_tarea}: Estado '{estado}' inválido. "
                        f"Valores permitidos: vacío, A, D, -"
                    )
    
    def detectar_duplicados(self):
        """Detecta duplicados"""
        # Por ID
        df_con_id = self.df[self.df['id'] != '']
        duplicados = df_con_id[df_con_id.duplicated(subset=['id'], keep=False)]
        if not duplicados.empty:
            ids = duplicados['id'].unique()
            self.errores.append(f"IDs duplicados: {', '.join(ids)}")
        
        # Por cédula
        df_con_ced = self.df[self.df['numero_cedula'] != '']
        duplicados = df_con_ced[df_con_ced.duplicated(subset=['numero_cedula'], keep=False)]
        if not duplicados.empty:
            cedulas = duplicados['numero_cedula'].unique()
            self.errores.append(f"Cédulas duplicadas: {', '.join(cedulas)}")
    
    def calcular_metricas(self):
        """Calcula métricas"""
        self.metricas['total_estudiantes'] = len(self.df)
        
        for col_tarea in self.columnas_tareas:
            for _, row in self.df.iterrows():
                estado = row[col_tarea]
                
                if estado == 'A':
                    self.metricas['aprobadas'] += 1
                elif estado == 'D':
                    self.metricas['desaprobadas'] += 1
                elif estado == '-':
                    self.metricas['no_entregadas'] += 1
                elif estado == '':
                    self.metricas['pendientes'] += 1
    
    def generar_salida(self) -> Dict[str, Any]:
        """Genera respuesta JSON"""
        registros = []
        estudiantes_notificar = []
        
        for _, row in self.df.iterrows():
            registro = {
                'codigo_estudiante': row['id'],
                'nombres': row['nombres_apellidos'],
                'dni': row['numero_cedula'],
                'correo': row['correo'],
                'tareas': {},
                'notificar': False
            }
            
            tiene_no_entregadas = False
            
            for col_tarea in self.columnas_tareas:
                estado = row[col_tarea]
                registro['tareas'][col_tarea] = estado if estado != '' else None
                
                if estado == '-':
                    tiene_no_entregadas = True
            
            # Marcar para notificación
            if self.tipo_carga == 'actualizacion' and tiene_no_entregadas:
                registro['notificar'] = True
                estudiantes_notificar.append({
                    'codigo': row['id'],
                    'nombre': row['nombres_apellidos']
                })
            
            registros.append(registro)
        
        return {
            'success': len(self.errores) == 0,
            'tipo_carga': self.tipo_carga,
            'total_registros': len(registros),
            'registros': registros,
            'metricas': self.metricas,
            'notificaciones': {
                'debe_notificar': len(estudiantes_notificar) > 0,
                'estudiantes_notificar': estudiantes_notificar
            },
            'errores': self.errores,
            'warnings': self.warnings,
            'columnas_detectadas': self.columnas_tareas
        }
    
    def generar_respuesta_error(self) -> Dict[str, Any]:
        """Genera respuesta de error"""
        return {
            'success': False,
            'tipo_carga': self.tipo_carga,
            'total_registros': 0,
            'registros': [],
            'metricas': self.metricas,
            'notificaciones': {'debe_notificar': False, 'estudiantes_notificar': []},
            'errores': self.errores,
            'warnings': self.warnings
        }


def procesar_archivo_calificaciones(file_path: str, tipo_carga: str = 'inicial') -> Dict[str, Any]:
    """Función principal para procesar Excel"""
    processor = ExcelCalificacionesProcessor(file_path, tipo_carga)
    return processor.procesar()
```

---

## 📦 Instalación y Configuración

### 1. Requirements.txt

```txt
# FastAPI
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6

# Base de datos
psycopg2-binary==2.9.9

# Autenticación
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4

# Excel
pandas==2.1.3
openpyxl==3.1.2
xlrd==2.0.1

# Utilities
python-dateutil==2.8.2

# Testing
pytest==7.4.3
httpx==0.25.2
```

### 2. Variables de Entorno (.env)

```env
# Servidor
PORT=8000
ENVIRONMENT=development

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gestion_academica
DB_USER=postgres
DB_PASSWORD=tu_password

# JWT
JWT_SECRET=cambiar_esto_en_produccion_por_algo_muy_seguro
JWT_ALGORITHM=HS256
JWT_EXPIRATION=24h

# CORS
CORS_ORIGINS=http://localhost:5173

# Uploads
MAX_UPLOAD_SIZE=5242880
```

### 3. Comandos de Inicio

```bash
# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Instalar dependencias
pip install -r requirements.txt

# Iniciar servidor
uvicorn app:app --reload --port 8000

# Ver documentación
# Abrir: http://localhost:8000/docs
```

---

## 🎯 Comparación FastAPI vs Node.js

| Característica | FastAPI | Node.js/Express |
|---------------|---------|-----------------|
| Upload de archivos | `UploadFile` nativo | Multer |
| JWT | python-jose | jsonwebtoken |
| Hash passwords | passlib | bcrypt |
| Base de datos | psycopg2 | pg/node-postgres |
| Excel processing | Pandas integrado | Microservicio Python |
| Validación | Pydantic | express-validator |
| Docs automáticas | ✅ Swagger/ReDoc | ❌ Manual |
| Async | async/await Python | async/await JS |

---

## 📝 Próximos Pasos

1. ✅ Implementar autenticación completa (login, register, refresh)
2. ✅ CRUD de usuarios (admin)
3. ✅ CRUD de fichas académicas (coordinador)
4. ⏳ Sistema de notificaciones automáticas
5. ⏳ Dashboard con métricas
6. ⏳ Exportación de reportes PDF/Excel
7. ⏳ Testing completo

---

**Última actualización:** Noviembre 11, 2025  
**Stack:** React 18 + **FastAPI** + PostgreSQL + Pandas  
**Estado:** Fase 1 - Autenticación (En progreso)