-- ============================================================================
-- CONFIGURACIÓN COMPLETA DE BASE DE DATOS
-- Sistema de Gestión Académica
-- ============================================================================
-- Este script configura completamente la base de datos PostgreSQL
-- incluyendo roles, permisos, tablas y datos iniciales
-- ============================================================================

\echo '============================================================================'
\echo 'INICIANDO CONFIGURACIÓN DE BASE DE DATOS'
\echo '============================================================================'
\echo ''

-- ============================================================================
-- PARTE 1: CREAR ROLES Y PERMISOS
-- ============================================================================

\echo '>>> Paso 1: Creando roles y usuarios...'

-- Crear rol de administrador si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'admin_academico') THEN
        CREATE USER admin_academico WITH ENCRYPTED PASSWORD 'admin123';
        RAISE NOTICE 'Usuario admin_academico creado';
    ELSE
        RAISE NOTICE 'Usuario admin_academico ya existe';
    END IF;
END
$$;

-- Dar permisos de superusuario (solo para desarrollo)
ALTER USER admin_academico WITH SUPERUSER CREATEDB CREATEROLE;

\echo '✓ Roles creados correctamente'
\echo ''

-- ============================================================================
-- PARTE 2: CONECTAR A LA BASE DE DATOS
-- ============================================================================

\echo '>>> Paso 2: Configurando base de datos...'

-- Conectar a la base de datos
\c gestion_academica

-- Configurar permisos en el schema
GRANT ALL ON SCHEMA public TO admin_academico;
GRANT ALL ON ALL TABLES IN SCHEMA public TO admin_academico;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO admin_academico;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO admin_academico;

-- Configurar permisos por defecto
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO admin_academico;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO admin_academico;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO admin_academico;

\echo '✓ Permisos configurados correctamente'
\echo ''

-- ============================================================================
-- PARTE 3: ELIMINAR TABLAS EXISTENTES (SI ES NECESARIO)
-- ============================================================================

\echo '>>> Paso 3: Limpiando base de datos existente...'

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS calificaciones CASCADE;
DROP TABLE IF EXISTS evidencias CASCADE;
DROP TABLE IF EXISTS estudiantes CASCADE;
DROP TABLE IF EXISTS materias CASCADE;
DROP TABLE IF EXISTS fichas CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Eliminar funciones existentes
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_calificacion_estado() CASCADE;
DROP FUNCTION IF EXISTS update_notification_leida() CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_audit_logs(INTEGER) CASCADE;

-- Eliminar vistas existentes
DROP VIEW IF EXISTS audit_stats CASCADE;

\echo '✓ Base de datos limpiada'
\echo ''

-- ============================================================================
-- PARTE 4: CREAR FUNCIONES AUXILIARES
-- ============================================================================

\echo '>>> Paso 4: Creando funciones auxiliares...'

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

\echo '✓ Funciones auxiliares creadas'
\echo ''

-- ============================================================================
-- PARTE 5: CREAR TABLA USERS
-- ============================================================================

\echo '>>> Paso 5: Creando tabla users...'

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('Administrador', 'Coordinador', 'Docente')),
  activo BOOLEAN DEFAULT true,
  avatar_url TEXT,
  telefono VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE,
  password_changed_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_rol ON users(rol);
CREATE INDEX idx_users_activo ON users(activo);

-- Trigger
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE users IS 'Tabla de usuarios del sistema';
COMMENT ON COLUMN users.rol IS 'Rol del usuario: Administrador, Coordinador o Docente';

\echo '✓ Tabla users creada'
\echo ''

-- ============================================================================
-- PARTE 6: CREAR TABLA FICHAS
-- ============================================================================

\echo '>>> Paso 6: Creando tabla fichas...'

CREATE TABLE fichas (
  id SERIAL PRIMARY KEY,
  numero VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  coordinador_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  estado VARCHAR(20) DEFAULT 'Activa' CHECK (estado IN ('Activa', 'Inactiva', 'Finalizada')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX idx_fichas_numero ON fichas(numero);
CREATE INDEX idx_fichas_coordinador_id ON fichas(coordinador_id);
CREATE INDEX idx_fichas_estado ON fichas(estado);

-- Trigger
CREATE TRIGGER update_fichas_updated_at
  BEFORE UPDATE ON fichas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE fichas IS 'Tabla de fichas académicas (programas/grupos)';

\echo '✓ Tabla fichas creada'
\echo ''

-- ============================================================================
-- PARTE 6.1: CREAR TABLA ESTUDIANTES
-- ============================================================================

\echo '>>> Paso 6.1: Creando tabla estudiantes...'

CREATE TABLE estudiantes (
  id SERIAL PRIMARY KEY,
  documento VARCHAR(255) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  apellido VARCHAR(255),
  correo VARCHAR(255),
  ficha_id INTEGER REFERENCES fichas(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_estudiantes_documento ON estudiantes(documento);
CREATE INDEX idx_estudiantes_ficha_id ON estudiantes(ficha_id);

-- Trigger
CREATE TRIGGER update_estudiantes_updated_at
  BEFORE UPDATE ON estudiantes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE estudiantes IS 'Tabla de estudiantes (documento=correo en flujos wide)';

\echo '✓ Tabla estudiantes creada'
\echo ''

-- ============================================================================
-- PARTE 6.2: CREAR TABLA EVIDENCIAS (WIDE)
-- ============================================================================

\echo '>>> Paso 6.2: Creando tabla evidencias (wide)...'

CREATE TABLE evidencias (
  id SERIAL PRIMARY KEY,
  documento VARCHAR(255) NOT NULL REFERENCES estudiantes(documento) ON DELETE CASCADE,
  evidencia_nombre VARCHAR(255) NOT NULL,
  letra VARCHAR(1) CHECK (letra IN ('A','D','-') ),
  estado VARCHAR(30) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices y restricciones para upsert
CREATE UNIQUE INDEX ux_evidencias_doc_evidencia ON evidencias(documento, evidencia_nombre);

-- Trigger
CREATE TRIGGER update_evidencias_updated_at
  BEFORE UPDATE ON evidencias
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE evidencias IS 'Tabla de evidencias por estudiante (wide A/D/-/pendiente)';

\echo '✓ Tabla evidencias creada'
\echo ''

-- ============================================================================
-- PARTE 7: CREAR TABLA MATERIAS
-- ============================================================================

\echo '>>> Paso 7: Creando tabla materias...'

CREATE TABLE materias (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  horas_semanales INTEGER DEFAULT 0,
  ficha_id INTEGER REFERENCES fichas(id) ON DELETE CASCADE,
  docente_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  estado VARCHAR(20) DEFAULT 'Activa' CHECK (estado IN ('Activa', 'Inactiva', 'Finalizada')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX idx_materias_codigo ON materias(codigo);
CREATE INDEX idx_materias_ficha_id ON materias(ficha_id);
CREATE INDEX idx_materias_docente_id ON materias(docente_id);
CREATE INDEX idx_materias_ficha_docente ON materias(ficha_id, docente_id);

-- Trigger
CREATE TRIGGER update_materias_updated_at
  BEFORE UPDATE ON materias
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE materias IS 'Tabla de materias/asignaturas';

\echo '✓ Tabla materias creada'
\echo ''

-- ============================================================================
-- PARTE 8: CREAR TABLA CALIFICACIONES
-- ============================================================================

\echo '>>> Paso 8: Creando tabla calificaciones...'

CREATE TABLE calificaciones (
  id SERIAL PRIMARY KEY,
  materia_id INTEGER NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
  ficha_id INTEGER NOT NULL REFERENCES fichas(id) ON DELETE CASCADE,
  estudiante_nombre VARCHAR(255) NOT NULL,
  estudiante_documento VARCHAR(50) NOT NULL,
  trimestre INTEGER NOT NULL CHECK (trimestre BETWEEN 1 AND 4),
  nota DECIMAL(4, 2) CHECK (nota >= 0 AND nota <= 5),
  estado VARCHAR(20) DEFAULT 'Cursando' CHECK (estado IN ('Aprobado', 'Reprobado', 'Cursando')),
  observaciones TEXT,
  fecha_carga DATE DEFAULT CURRENT_DATE,
  cargado_por INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_calificaciones_materia_id ON calificaciones(materia_id);
CREATE INDEX idx_calificaciones_ficha_id ON calificaciones(ficha_id);
CREATE INDEX idx_calificaciones_estudiante_doc ON calificaciones(estudiante_documento);
CREATE INDEX idx_calificaciones_trimestre ON calificaciones(trimestre);
CREATE UNIQUE INDEX idx_calificaciones_unique ON calificaciones(materia_id, estudiante_documento, trimestre);

-- Trigger para updated_at
CREATE TRIGGER update_calificaciones_updated_at
  BEFORE UPDATE ON calificaciones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Función y trigger para actualizar estado basado en nota
CREATE OR REPLACE FUNCTION update_calificacion_estado()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.nota IS NOT NULL THEN
    IF NEW.nota >= 3.0 THEN
      NEW.estado = 'Aprobado';
    ELSE
      NEW.estado = 'Reprobado';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_calificacion_estado
  BEFORE INSERT OR UPDATE OF nota ON calificaciones
  FOR EACH ROW
  EXECUTE FUNCTION update_calificacion_estado();

COMMENT ON TABLE calificaciones IS 'Tabla de calificaciones de estudiantes';

\echo '✓ Tabla calificaciones creada'
\echo ''

-- ============================================================================
-- PARTE 9: CREAR TABLA NOTIFICATIONS
-- ============================================================================

\echo '>>> Paso 9: Creando tabla notifications...'

CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  icono VARCHAR(50),
  color VARCHAR(20),
  leida BOOLEAN DEFAULT false,
  metadata JSONB,
  relacionado_tipo VARCHAR(50),
  relacionado_id INTEGER,
  prioridad VARCHAR(20) DEFAULT 'normal' CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  leida_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_leida ON notifications(leida);
CREATE INDEX idx_notifications_user_leida ON notifications(user_id, leida);
CREATE INDEX idx_notifications_metadata ON notifications USING GIN (metadata);

-- Función y trigger para marcar como leída
CREATE OR REPLACE FUNCTION update_notification_leida()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.leida_at IS NOT NULL AND OLD.leida_at IS NULL THEN
    NEW.leida = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_leida
  BEFORE UPDATE OF leida_at ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_leida();

COMMENT ON TABLE notifications IS 'Tabla de notificaciones del sistema';

\echo '✓ Tabla notifications creada'
\echo ''

-- ============================================================================
-- PARTE 10: CREAR TABLA AUDIT_LOGS
-- ============================================================================

\echo '>>> Paso 10: Creando tabla audit_logs...'

CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  user_rol VARCHAR(20),
  accion VARCHAR(100) NOT NULL,
  modulo VARCHAR(50) NOT NULL,
  entidad_tipo VARCHAR(50),
  entidad_id INTEGER,
  detalles TEXT,
  metadata JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metodo_http VARCHAR(10),
  ruta VARCHAR(255),
  estado_http INTEGER,
  duracion_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_accion ON audit_logs(accion);
CREATE INDEX idx_audit_logs_modulo ON audit_logs(modulo);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_metadata ON audit_logs USING GIN (metadata);

-- Función para limpiar logs antiguos
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(retention_days INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < CURRENT_TIMESTAMP - (retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Vista de estadísticas
CREATE OR REPLACE VIEW audit_stats AS
SELECT 
  DATE(created_at) AS fecha,
  modulo,
  accion,
  COUNT(*) AS total_acciones,
  COUNT(DISTINCT user_id) AS usuarios_unicos,
  AVG(duracion_ms) AS duracion_promedio_ms
FROM audit_logs
WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY DATE(created_at), modulo, accion
ORDER BY fecha DESC, total_acciones DESC;

COMMENT ON TABLE audit_logs IS 'Tabla de auditoría del sistema';

\echo '✓ Tabla audit_logs creada'
\echo ''

-- ============================================================================
-- PARTE 11: INSERTAR DATOS INICIALES - USUARIOS
-- ============================================================================

\echo '>>> Paso 11: Insertando usuarios iniciales...'
\echo 'Contraseña para todos: Admin123!'

-- Usuario Administrador
INSERT INTO users (email, password_hash, nombre, apellido, rol, activo) VALUES
  ('admin@academia.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIeWcHQ0bO', 'Juan', 'Pérez', 'Administrador', true);

-- Coordinadores
INSERT INTO users (email, password_hash, nombre, apellido, rol, activo) VALUES
  ('coord1@academia.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIeWcHQ0bO', 'María', 'García', 'Coordinador', true),
  ('coord2@academia.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIeWcHQ0bO', 'Carlos', 'Rodríguez', 'Coordinador', true);

-- Docentes
INSERT INTO users (email, password_hash, nombre, apellido, rol, activo, telefono) VALUES
  ('docente1@academia.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIeWcHQ0bO', 'Ana', 'Martínez', 'Docente', true, '3001234567'),
  ('docente2@academia.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIeWcHQ0bO', 'Pedro', 'López', 'Docente', true, '3007654321'),
  ('docente3@academia.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIeWcHQ0bO', 'Laura', 'Hernández', 'Docente', true, '3009876543'),
  ('docente4@academia.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIeWcHQ0bO', 'Roberto', 'Sánchez', 'Docente', true, '3005551234');

\echo '✓ Usuarios creados:' 
SELECT COUNT(*) || ' usuarios totales' FROM users;

\echo ''

-- ============================================================================
-- PARTE 12: INSERTAR DATOS INICIALES - FICHAS
-- ============================================================================

\echo '>>> Paso 12: Insertando fichas académicas...'

INSERT INTO fichas (numero, nombre, descripcion, fecha_inicio, fecha_fin, coordinador_id, estado, created_by) VALUES
  (
    '2461957',
    'Análisis y Desarrollo de Software',
    'Programa técnico en desarrollo de software con énfasis en aplicaciones web y móviles',
    '2024-01-15',
    '2025-12-15',
    (SELECT id FROM users WHERE email = 'coord1@academia.com'),
    'Activa',
    (SELECT id FROM users WHERE rol = 'Administrador' LIMIT 1)
  ),
  (
    '2461958',
    'Diseño Gráfico Digital',
    'Programa técnico en diseño gráfico con herramientas digitales',
    '2024-02-01',
-- =========================================================================
-- PARTE 8.1: CREAR TABLA evidencia_definicion
-- =========================================================================

\echo '>>> Paso 8.1: Creando tabla evidencia_definicion...'

CREATE TABLE evidencia_definicion (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  ficha_id INTEGER REFERENCES fichas(id) ON DELETE SET NULL,
  materia_id INTEGER REFERENCES materias(id) ON DELETE CASCADE,
  docente_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  activa BOOLEAN DEFAULT false,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice único para evitar duplicados por materia
CREATE UNIQUE INDEX ux_evidencia_def_materia_nombre ON evidencia_definicion(materia_id, nombre);

-- Trigger
CREATE TRIGGER update_evidencia_def_updated_at
  BEFORE UPDATE ON evidencia_definicion
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE evidencia_definicion IS 'Definiciones de evidencias por materia';

\echo '✓ Tabla evidencia_definicion creada'
\echo ''
    '2025-12-31',
    (SELECT id FROM users WHERE email = 'coord2@academia.com'),
    'Activa',
    (SELECT id FROM users WHERE rol = 'Administrador' LIMIT 1)
  ),
  (
    '2461959',
    'Administración de Empresas',
    'Programa técnico en gestión y administración empresarial',
    '2024-01-20',
    '2025-11-30',
    (SELECT id FROM users WHERE email = 'coord1@academia.com'),
    'Activa',
    (SELECT id FROM users WHERE rol = 'Administrador' LIMIT 1)
  ),
  (
    '2461956',
    'Desarrollo Web Avanzado',
    'Programa finalizado de desarrollo web full-stack',
    '2023-01-15',
    '2024-12-15',
    (SELECT id FROM users WHERE email = 'coord2@academia.com'),
    'Finalizada',
    (SELECT id FROM users WHERE rol = 'Administrador' LIMIT 1)
  );

\echo '✓ Fichas creadas:'
SELECT COUNT(*) || ' fichas totales' FROM fichas;

\echo ''

-- ============================================================================
-- PARTE 13: INSERTAR DATOS INICIALES - MATERIAS
-- ============================================================================

\echo '>>> Paso 13: Insertando materias...'

-- Materias para Análisis y Desarrollo de Software
INSERT INTO materias (codigo, nombre, descripcion, horas_semanales, ficha_id, docente_id, estado, created_by) VALUES
  ('ADSO-001', 'Programación Orientada a Objetos', 'Fundamentos de POO con Java', 6,
   (SELECT id FROM fichas WHERE numero = '2461957'), (SELECT id FROM users WHERE email = 'docente1@academia.com'),
   'Activa', (SELECT id FROM users WHERE rol = 'Administrador' LIMIT 1)),
  ('ADSO-002', 'Bases de Datos', 'Diseño y gestión de bases de datos relacionales', 6,
   (SELECT id FROM fichas WHERE numero = '2461957'), (SELECT id FROM users WHERE email = 'docente2@academia.com'),
   'Activa', (SELECT id FROM users WHERE rol = 'Administrador' LIMIT 1)),
  ('ADSO-003', 'Desarrollo Web Frontend', 'HTML, CSS, JavaScript y React', 8,
   (SELECT id FROM fichas WHERE numero = '2461957'), (SELECT id FROM users WHERE email = 'docente3@academia.com'),
   'Activa', (SELECT id FROM users WHERE rol = 'Administrador' LIMIT 1)),
  ('ADSO-004', 'Desarrollo Web Backend', 'Node.js, Express y APIs REST', 8,
   (SELECT id FROM fichas WHERE numero = '2461957'), (SELECT id FROM users WHERE email = 'docente4@academia.com'),
   'Activa', (SELECT id FROM users WHERE rol = 'Administrador' LIMIT 1));

-- Materias para Diseño Gráfico
INSERT INTO materias (codigo, nombre, descripcion, horas_semanales, ficha_id, docente_id, estado, created_by) VALUES
  ('DG-001', 'Fundamentos de Diseño', 'Principios básicos del diseño gráfico', 4,
   (SELECT id FROM fichas WHERE numero = '2461958'), (SELECT id FROM users WHERE email = 'docente1@academia.com'),
   'Activa', (SELECT id FROM users WHERE rol = 'Administrador' LIMIT 1)),
  ('DG-002', 'Adobe Photoshop', 'Edición y retoque de imágenes', 6,
   (SELECT id FROM fichas WHERE numero = '2461958'), (SELECT id FROM users WHERE email = 'docente2@academia.com'),
   'Activa', (SELECT id FROM users WHERE rol = 'Administrador' LIMIT 1)),
  ('DG-003', 'Adobe Illustrator', 'Diseño vectorial y logotipos', 6,
   (SELECT id FROM fichas WHERE numero = '2461958'), (SELECT id FROM users WHERE email = 'docente3@academia.com'),
   'Activa', (SELECT id FROM users WHERE rol = 'Administrador' LIMIT 1));

-- Materias para Administración de Empresas
INSERT INTO materias (codigo, nombre, descripcion, horas_semanales, ficha_id, docente_id, estado, created_by) VALUES
  ('AE-001', 'Gestión Empresarial', 'Fundamentos de administración', 4,
   (SELECT id FROM fichas WHERE numero = '2461959'), (SELECT id FROM users WHERE email = 'docente4@academia.com'),
   'Activa', (SELECT id FROM users WHERE rol = 'Administrador' LIMIT 1)),
  ('AE-002', 'Contabilidad Básica', 'Principios contables y estados financieros', 5,
   (SELECT id FROM fichas WHERE numero = '2461959'), (SELECT id FROM users WHERE email = 'docente1@academia.com'),
   'Activa', (SELECT id FROM users WHERE rol = 'Administrador' LIMIT 1));

\echo '✓ Materias creadas:'
SELECT COUNT(*) || ' materias totales' FROM materias;

\echo ''

-- ============================================================================
-- RESUMEN FINAL
-- ============================================================================

\echo '============================================================================'
\echo 'CONFIGURACIÓN COMPLETADA EXITOSAMENTE'
\echo '============================================================================'
\echo ''
\echo 'RESUMEN DE LA BASE DE DATOS:'
\echo '----------------------------'

SELECT 
  'Usuarios: ' || (SELECT COUNT(*) FROM users) || 
  ' | Fichas: ' || (SELECT COUNT(*) FROM fichas) ||
  ' | Materias: ' || (SELECT COUNT(*) FROM materias) AS resumen;

\echo ''
\echo 'CREDENCIALES DE ACCESO:'
\echo '----------------------'
\echo 'Administrador:'
\echo '  Email: admin@academia.com'
\echo '  Pass:  Admin123!'
\echo ''
\echo 'Coordinadores:'
\echo '  Email: coord1@academia.com o coord2@academia.com'
\echo '  Pass:  Admin123!'
\echo ''
\echo 'Docentes:'
\echo '  Email: docente1@academia.com (hasta docente4@academia.com)'
\echo '  Pass:  Admin123!'
\echo ''
\echo 'PRÓXIMOS PASOS:'
\echo '---------------'
\echo '1. cd backend'
\echo '2. npm run dev'
\echo '3. En otra terminal: npm run dev (frontend)'
\echo '4. Abrir http://localhost:5173'
\echo ''
\echo '============================================================================'
\echo '¡LA BASE DE DATOS ESTÁ LISTA PARA USAR!'
\echo '============================================================================'
