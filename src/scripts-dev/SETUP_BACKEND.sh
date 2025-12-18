#!/bin/bash

# ====================================
# Script de Setup Automático del Backend
# Sistema de Gestión Académica
# ====================================

set -e  # Detener en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
    echo ""
}

# Banner
clear
print_header "🎓 Setup del Backend - Sistema de Gestión Académica"

# 1. Verificar Node.js
print_info "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado. Por favor instala Node.js v18 o superior."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js versión $NODE_VERSION detectada. Se requiere v18 o superior."
    exit 1
fi

print_success "Node.js $(node -v) detectado"

# 2. Verificar npm
print_info "Verificando npm..."
if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado."
    exit 1
fi
print_success "npm $(npm -v) detectado"

# 3. Verificar PostgreSQL
print_info "Verificando PostgreSQL..."
if ! command -v psql &> /dev/null; then
    print_warning "PostgreSQL no está instalado o no está en PATH"
    echo ""
    echo "Instala PostgreSQL:"
    echo "  Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
    echo "  macOS: brew install postgresql@14"
    echo "  Windows: Descarga desde https://www.postgresql.org/download/windows/"
    echo ""
    read -p "¿Deseas continuar sin PostgreSQL? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    print_success "PostgreSQL detectado"
fi

# 4. Crear estructura de carpetas
print_header "📁 Creando estructura de carpetas"

mkdir -p backend/src/{config,controllers,middleware,models,routes,services,database/{migrations,seeds},types,utils}
mkdir -p backend/uploads
mkdir -p backend/logs
mkdir -p shared/{types,constants}

print_success "Estructura de carpetas creada"

# 5. Instalar dependencias del backend
print_header "📦 Instalando dependencias del backend"

cd backend

if [ -f "package.json" ]; then
    print_info "Instalando dependencias..."
    npm install
    print_success "Dependencias instaladas"
else
    print_error "package.json no encontrado en /backend"
    exit 1
fi

cd ..

# 6. Configurar variables de entorno
print_header "🔧 Configurando variables de entorno"

if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        print_success "Archivo .env creado desde .env.example"
        print_warning "IMPORTANTE: Edita backend/.env con tus valores reales"
        
        # Generar JWT secrets automáticamente
        JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
        JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
        
        # Reemplazar en .env (solo en Linux/macOS)
        if [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i.bak "s/JWT_SECRET=.*/JWT_SECRET=${JWT_SECRET}/" backend/.env
            sed -i.bak "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}/" backend/.env
            rm backend/.env.bak
            print_success "JWT secrets generados automáticamente"
        fi
    else
        print_error ".env.example no encontrado"
    fi
else
    print_info "Archivo .env ya existe, saltando..."
fi

# 7. Configurar PostgreSQL (opcional)
print_header "🗄️  Configuración de PostgreSQL"

read -p "¿Deseas configurar la base de datos ahora? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Configurando base de datos..."
    
    read -p "Nombre de la base de datos [gestion_academica]: " DB_NAME
    DB_NAME=${DB_NAME:-gestion_academica}
    
    read -p "Usuario de PostgreSQL [admin_academico]: " DB_USER
    DB_USER=${DB_USER:-admin_academico}
    
    read -sp "Contraseña para el usuario: " DB_PASSWORD
    echo
    
    # Intentar crear la base de datos
    print_info "Creando base de datos..."
    
    sudo -u postgres psql <<EOF
CREATE DATABASE ${DB_NAME};
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
\q
EOF
    
    if [ $? -eq 0 ]; then
        print_success "Base de datos configurada"
        
        # Actualizar .env
        if [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i.bak "s/DB_NAME=.*/DB_NAME=${DB_NAME}/" backend/.env
            sed -i.bak "s/DB_USER=.*/DB_USER=${DB_USER}/" backend/.env
            sed -i.bak "s/DB_PASSWORD=.*/DB_PASSWORD=${DB_PASSWORD}/" backend/.env
            rm backend/.env.bak
        fi
    else
        print_warning "Hubo un problema al crear la base de datos"
        print_info "Puedes crearla manualmente más tarde"
    fi
else
    print_info "Saltando configuración de base de datos"
    print_warning "Recuerda configurar manualmente antes de ejecutar migraciones"
fi

# 8. Ejecutar migraciones
print_header "🚀 Ejecutando migraciones"

read -p "¿Deseas ejecutar las migraciones ahora? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd backend
    npm run migrate
    
    if [ $? -eq 0 ]; then
        print_success "Migraciones ejecutadas correctamente"
    else
        print_error "Error al ejecutar migraciones"
        print_info "Verifica la configuración de la base de datos en backend/.env"
    fi
    cd ..
else
    print_info "Saltando migraciones"
fi

# 9. Ejecutar seeds
print_header "🌱 Ejecutando seeds (datos de prueba)"

read -p "¿Deseas cargar datos de prueba? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd backend
    npm run seed
    
    if [ $? -eq 0 ]; then
        print_success "Datos de prueba cargados"
        echo ""
        echo "Usuarios de prueba creados (password: Admin123!):"
        echo "  👤 admin@academia.com (Administrador)"
        echo "  👤 coord1@academia.com (Coordinador)"
        echo "  👤 docente1@academia.com (Docente)"
    else
        print_warning "Error al cargar seeds"
    fi
    cd ..
else
    print_info "Saltando seeds"
fi

# 10. Resumen final
print_header "✅ Setup Completado"

echo ""
echo "📋 Próximos pasos:"
echo ""
echo "1. Verifica la configuración en backend/.env"
echo "2. Inicia el servidor de desarrollo:"
echo "   cd backend && npm run dev"
echo ""
echo "3. El servidor estará disponible en:"
echo "   http://localhost:3000"
echo ""
echo "4. Endpoints disponibles:"
echo "   • GET  http://localhost:3000/health - Health check"
echo "   • GET  http://localhost:3000/api/v1 - API base"
echo ""
echo "5. Revisa la documentación:"
echo "   • GUIA_BACKEND_SETUP.md - Guía completa"
echo "   • COMANDOS_BACKEND.md - Comandos útiles"
echo ""
print_success "¡Todo listo para empezar a desarrollar!"
echo ""
