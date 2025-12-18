# Exportar e Importar Base de Datos (PostgreSQL)

Este directorio contiene scripts para exportar la base de datos actual (estructura, triggers, funciones y datos) y restaurarla en otro equipo.

## Requisitos
- PostgreSQL instalado (incluya `psql`, `pg_dump`, `pg_dumpall` en el PATH)
- Credenciales de la BD actual (host, puerto, base, usuario)

## Exportar desde el PC origen

### Windows
1. Abra una terminal (CMD o PowerShell) en la raíz del proyecto.
2. Ejecute:

```bat
database\EXPORT_BD.bat
```

Esto generará en `database/` los archivos:
- `roles_dump.sql` (roles y privilegios globales)
- `schema_dump.sql` (estructura + triggers + funciones)
- `data_dump.sql` (solo datos)
- `full_dump_produccion.sql` (roles + schema + datos en un único archivo)

### Linux / macOS
1. Dé permisos y ejecute:

```bash
chmod +x database/EXPORT_BD.sh
database/EXPORT_BD.sh
```

Archivos generados: iguales a Windows.

## Restaurar en el PC destino (producción)

1. Copie el archivo `database/full_dump_produccion.sql` al equipo destino.
2. Ejecute (con un superusuario como `postgres`):

```bash
psql -U postgres -f database/full_dump_produccion.sql
```

Esto creará roles (si aplica), base de datos, funciones, triggers, tablas e insertará datos.

Si desea restaurar por partes:
- Roles: `psql -U postgres -f database/roles_dump.sql`
- Estructura: `psql -U postgres -d <DB_DESTINO> -f database/schema_dump.sql`
- Datos: `psql -U postgres -d <DB_DESTINO> -f database/data_dump.sql`

## Alternativa: Script de configuración incluido

El proyecto ya incluye un script integral con estructura, triggers e índices base: consulte
`src/SETUP_DATABASE_COMPLETO.sql`.

- Para ejecutarlo en Windows: `src/CREAR_BASE_DATOS.bat`
- En Linux/macOS: `src/CREAR_BASE_DATOS.sh`

Nota: ese script crea estructura e inserta datos de ejemplo. Si necesita la copia fiel de la BD actual (incluyendo cambios y triggers vigentes), use los scripts de exportación anteriores.

## Variables y conexión

Los scripts de exportación intentan leer `backend_fastapi/.env`. Si no se encuentra o faltan variables, solicitarán los datos de conexión.

Variables soportadas:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

## Consejos
- Para incluir/excluir datos, ejecute de nuevo los scripts y elija la opción correspondiente.
- Para un volcado “solo estructura” para producción limpia, utilice `schema_dump.sql`.
