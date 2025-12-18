#!/bin/bash

echo "======================================================================"
echo "  🗄️  CONFIGURACIÓN DE BASE DE DATOS POSTGRESQL"
echo "======================================================================"
echo ""
echo "Este script creará la base de datos y el usuario para el proyecto."
echo ""
echo "CREDENCIALES QUE SE CREARÁN:"
echo "  - Base de datos: gestion_academica"
echo "  - Usuario: admin_academico"
echo "  - Contraseña: admin123"
echo ""
echo "======================================================================"
echo ""

# Verificar si PostgreSQL está instalado
if ! command -v psql &> /dev/null; then
    echo "❌ ERROR: PostgreSQL no está instalado"
    echo ""
    echo "Por favor instala PostgreSQL:"
    echo "  - Windows: https://www.postgresql.org/download/windows/"
    echo "  - Mac: brew install postgresql"
    echo "  - Linux: sudo apt-get install postgresql"
    exit 1
fi

echo "✓ PostgreSQL encontrado"
echo ""

# Crear la base de datos y el usuario
echo "Ejecutando comandos SQL..."
echo ""

psql -U postgres << EOF
-- Crear usuario si no existe
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'admin_academico') THEN
        CREATE USER admin_academico WITH ENCRYPTED PASSWORD 'admin123';
        RAISE NOTICE 'Usuario admin_academico creado';
    ELSE
        RAISE NOTICE 'Usuario admin_academico ya existe';
    END IF;
END
\$\$;

-- Crear base de datos si no existe
SELECT 'CREATE DATABASE gestion_academica'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'gestion_academica')\gexec

-- Dar permisos
GRANT ALL PRIVILEGES ON DATABASE gestion_academica TO admin_academico;

-- Conectar a la base de datos y dar permisos en el schema
\c gestion_academica
GRANT ALL ON SCHEMA public TO admin_academico;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO admin_academico;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO admin_academico;

-- Mostrar resultado
\l gestion_academica
EOF

echo ""
echo "======================================================================"
echo "  ✅ BASE DE DATOS CONFIGURADA"
echo "======================================================================"
echo ""
echo "Puedes conectarte con:"
echo "  psql -U admin_academico -d gestion_academica -h localhost"
echo "  Contraseña: admin123"
echo ""
echo "Próximos pasos:"
echo "  1. cd backend"
echo "  2. npm install"
echo "  3. npm run migrate"
echo "  4. npm run seed"
echo "  5. npm run dev"
echo ""
