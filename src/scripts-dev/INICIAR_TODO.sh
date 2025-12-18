#!/bin/bash

echo "======================================================================"
echo "  🚀 INICIAR PROYECTO COMPLETO"
echo "======================================================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
print_step() {
    echo ""
    echo "${GREEN}==>${NC} $1"
}

print_error() {
    echo "${RED}❌ ERROR:${NC} $1"
}

print_warning() {
    echo "${YELLOW}⚠️  ADVERTENCIA:${NC} $1"
}

print_success() {
    echo "${GREEN}✅${NC} $1"
}

# Verificar Node.js
print_step "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado"
    exit 1
fi
NODE_VERSION=$(node --version)
print_success "Node.js $NODE_VERSION encontrado"

# Verificar npm
print_step "Verificando npm..."
if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado"
    exit 1
fi
NPM_VERSION=$(npm --version)
print_success "npm $NPM_VERSION encontrado"

# Verificar PostgreSQL
print_step "Verificando PostgreSQL..."
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL no está instalado"
    exit 1
fi
PSQL_VERSION=$(psql --version)
print_success "$PSQL_VERSION encontrado"

# Instalar dependencias del frontend
print_step "Instalando dependencias del frontend..."
npm install
if [ $? -eq 0 ]; then
    print_success "Dependencias del frontend instaladas"
else
    print_error "Fallo al instalar dependencias del frontend"
    exit 1
fi

# Instalar dependencias del backend
print_step "Instalando dependencias del backend..."
cd backend
npm install
if [ $? -eq 0 ]; then
    print_success "Dependencias del backend instaladas"
else
    print_error "Fallo al instalar dependencias del backend"
    exit 1
fi

# Verificar archivo .env
print_step "Verificando archivo .env..."
if [ ! -f ".env" ]; then
    print_warning "Archivo .env no encontrado, creando desde .env.example..."
    cp .env.example .env
    print_success "Archivo .env creado"
else
    print_success "Archivo .env encontrado"
fi

# Ejecutar migraciones
print_step "Ejecutando migraciones de base de datos..."
npm run migrate
if [ $? -eq 0 ]; then
    print_success "Migraciones ejecutadas correctamente"
else
    print_warning "Las migraciones fallaron. ¿La base de datos existe?"
    echo ""
    echo "Ejecuta primero:"
    echo "  ./SETUP_DB.sh"
    exit 1
fi

# Ejecutar seeds
print_step "Ejecutando seeds (datos de prueba)..."
npm run seed
if [ $? -eq 0 ]; then
    print_success "Seeds ejecutados correctamente"
else
    print_warning "Los seeds fallaron, pero continuando..."
fi

# Volver a la raíz
cd ..

echo ""
echo "======================================================================"
echo "  ✅ PROYECTO CONFIGURADO EXITOSAMENTE"
echo "======================================================================"
echo ""
echo "Para iniciar el proyecto, abre 2 terminales:"
echo ""
echo "${GREEN}Terminal 1 - Backend:${NC}"
echo "  cd backend"
echo "  npm run dev"
echo ""
echo "${GREEN}Terminal 2 - Frontend:${NC}"
echo "  npm run dev"
echo ""
echo "Luego abre: ${GREEN}http://localhost:5173${NC}"
echo ""
echo "${GREEN}Credenciales de prueba:${NC}"
echo "  Admin:       admin@example.com / admin123"
echo "  Coordinador: coordinador@example.com / coord123"
echo "  Docente:     docente@example.com / doc123"
echo ""
echo "======================================================================"
