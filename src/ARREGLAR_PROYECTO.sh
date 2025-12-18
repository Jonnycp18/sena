#!/bin/bash

echo "======================================================================"
echo "  🔧 ARREGLANDO PROYECTO - Limpieza y Reinstalación"
echo "======================================================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() {
    echo -e "${GREEN}==>${NC} $1"
}

print_error() {
    echo -e "${RED}❌ ERROR:${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

# [1/5] Limpiar node_modules del frontend
print_step "[1/5] Eliminando node_modules del frontend..."
if [ -d "node_modules" ]; then
    rm -rf node_modules
    print_success "node_modules eliminado"
else
    print_success "node_modules no existe"
fi
echo ""

# [2/5] Limpiar package-lock.json del frontend
print_step "[2/5] Eliminando package-lock.json..."
if [ -f "package-lock.json" ]; then
    rm package-lock.json
    print_success "package-lock.json eliminado"
else
    print_success "package-lock.json no existe"
fi
echo ""

# [3/5] Instalar dependencias del frontend
print_step "[3/5] Instalando dependencias del frontend..."
npm install
if [ $? -eq 0 ]; then
    print_success "Dependencias del frontend instaladas"
else
    print_error "Fallo al instalar dependencias del frontend"
    exit 1
fi
echo ""

# [4/5] Limpiar backend
print_step "[4/5] Limpiando backend..."
cd backend
if [ -d "node_modules" ]; then
    rm -rf node_modules
    print_success "Backend node_modules eliminado"
fi
if [ -f "package-lock.json" ]; then
    rm package-lock.json
    print_success "Backend package-lock.json eliminado"
fi
echo ""

# [5/5] Instalar dependencias del backend
print_step "[5/5] Instalando dependencias del backend..."
npm install
if [ $? -eq 0 ]; then
    print_success "Dependencias del backend instaladas"
else
    print_error "Fallo al instalar dependencias del backend"
    cd ..
    exit 1
fi
cd ..
echo ""

echo "======================================================================"
echo "  ✅ PROYECTO ARREGLADO"
echo "======================================================================"
echo ""
echo "Próximos pasos:"
echo ""
echo "1. Configurar PostgreSQL:"
echo "   ./SETUP_DB.sh"
echo ""
echo "2. Ejecutar migraciones:"
echo "   cd backend"
echo "   npm run migrate"
echo "   npm run seed"
echo ""
echo "3. Iniciar backend (Terminal 1):"
echo "   cd backend"
echo "   npm run dev"
echo ""
echo "4. Iniciar frontend (Terminal 2):"
echo "   npm run dev"
echo ""
