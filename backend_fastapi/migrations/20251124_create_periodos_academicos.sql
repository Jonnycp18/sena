-- Migration: create table periodos_academicos for academic periods
-- Date: 2025-11-24
-- Idempotent creation with IF NOT EXISTS

CREATE TABLE IF NOT EXISTS periodos_academicos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(30) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado VARCHAR(20) DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Basic indexes to support range lookups and active filtering
CREATE INDEX IF NOT EXISTS idx_periodos_estado ON periodos_academicos(estado);
CREATE INDEX IF NOT EXISTS idx_periodos_fecha_inicio ON periodos_academicos(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_periodos_fecha_fin ON periodos_academicos(fecha_fin);

-- Optional seed (commented out). Uncomment and adjust as needed.
-- INSERT INTO periodos_academicos (codigo, nombre, fecha_inicio, fecha_fin)
-- SELECT '2025-1', 'Periodo 2025-1', '2025-01-15', '2025-06-30'
-- WHERE NOT EXISTS (SELECT 1 FROM periodos_academicos WHERE codigo='2025-1');

-- Verification:
-- SELECT * FROM periodos_academicos ORDER BY fecha_inicio;
