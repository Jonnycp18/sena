#!/bin/bash

echo "============================================================================"
echo "  🗄️  CREACIÓN AUTOMÁTICA DE BASE DE DATOS POSTGRESQL"
echo "============================================================================"
echo ""
echo "Este script creará automáticamente:"
echo "  ✓ Base de datos: gestion_academica"
echo "  ✓ Usuario: admin_academico (contraseña: admin123)"
echo "  ✓ Todas las tablas necesarias"
echo "  ✓ Datos de prueba"
echo ""
echo "============================================================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar si psql está disponible
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ ERROR:${NC} PostgreSQL no está instalado"
    echo ""
    echo "Por favor instala PostgreSQL:"
    echo "  - Mac: brew install postgresql"
    echo "  - Linux: sudo apt-get install postgresql"
    exit 1
fi

echo -e "${GREEN}✓${NC} PostgreSQL encontrado"
echo ""

# Solicitar contraseña de postgres
echo "Por favor ingresa la contraseña del usuario 'postgres':"
read -s -p "Contraseña: " POSTGRES_PASSWORD
export PGPASSWORD=$POSTGRES_PASSWORD
echo ""
echo ""

echo "============================================================================"
echo "  PASO 1/3: Creando base de datos"
echo "============================================================================"
echo ""

# Crear la base de datos
psql -U postgres -c "CREATE DATABASE gestion_academica;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Base de datos 'gestion_academica' creada exitosamente"
else
    echo -e "${YELLOW}⚠️${NC}  La base de datos ya existe o hubo un error"
fi

echo ""
echo "============================================================================"
echo "  PASO 2/3: Ejecutando script de configuración completa"
echo "============================================================================"
echo ""

# Ejecutar el script SQL completo
psql -U postgres -d gestion_academica -f SETUP_DATABASE_COMPLETO.sql

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ ERROR:${NC} Hubo un problema al ejecutar el script SQL"
    echo ""
    exit 1
fi

echo ""
echo "============================================================================"
echo "  PASO 3/3: Verificando instalación"
echo "============================================================================"
echo ""

# Cambiar la contraseña para el usuario admin_academico
export PGPASSWORD=admin123

# Verificar que las tablas se crearon
echo "Verificando tablas creadas..."
psql -U admin_academico -d gestion_academica -c "\dt" -P pager=off

echo ""
echo "Verificando usuarios creados..."
psql -U admin_academico -d gestion_academica -c "SELECT email, nombre, apellido, rol FROM users;" -P pager=off

echo ""
echo "============================================================================"
echo "  ✅ BASE DE DATOS CONFIGURADA EXITOSAMENTE"
echo "============================================================================"
echo ""
echo -e "${BLUE}CONEXIÓN:${NC}"
echo "  Host: localhost"
echo "  Puerto: 5432"
echo "  Base de datos: gestion_academica"
echo "  Usuario: admin_academico"
echo "  Contraseña: admin123"
echo ""
echo -e "${BLUE}CREDENCIALES DE ACCESO AL SISTEMA:${NC}"
echo -e "  ${GREEN}✓${NC} Administrador: admin@academia.com / Admin123!"
echo -e "  ${GREEN}✓${NC} Coordinador:   coord1@academia.com / Admin123!"
echo -e "  ${GREEN}✓${NC} Docente:       docente1@academia.com / Admin123!"
echo ""
echo -e "${BLUE}PRÓXIMOS PASOS:${NC}"
echo "  1. cd backend"
echo "  2. npm install (si no lo has hecho)"
echo "  3. npm run dev"
echo ""
echo "  En otra terminal:"
echo "  4. npm install (en la raíz del proyecto)"
echo "  5. npm run dev"
echo ""
echo "  6. Abrir navegador en: http://localhost:5173"
echo ""
echo "============================================================================"
echo ""

# Limpiar variable de contraseña
unset PGPASSWORD
