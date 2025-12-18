import sys
import re
import pandas as pd
from pathlib import Path
import argparse

"""Convierte el archivo amplio (zajuna.xlsx estilo Moodle) en:
1) calificaciones_base.xlsx -> formato que acepta /calificaciones/upload
2) evidencias_detalle.xlsx -> filas por evidencia (para futura tabla detalle)

Uso:
python backend_fastapi/scripts/convert_zajuna.py zajuna.xlsx --outdir ./salida \
    --materia-codigo COD123 --ficha-numero FICHA01 \
    --map A=4.8 B=4.3 C=3.5 D=3.0 E=2.0 -=

Si no se provee --map se usa un mapa por defecto.
"""

def parse_mapping(map_items):
    default = {'A':4.5,'B':4.0,'C':3.5,'D':3.0,'E':2.0,'-':None}
    if not map_items:
        return default
    result = {}
    for item in map_items:
        if '=' not in item:
            continue
        k,v = item.split('=',1)
        k = k.strip().upper()
        v = v.strip()
        if v == '':
            result[k] = None
        else:
            try:
                result[k] = float(v)
            except ValueError:
                result[k] = None
    return {**default, **result}

PHASE_COLUMNS = {
    1: re.compile(r'Total Fase 1', re.I),
    2: re.compile(r'Total Fase 2', re.I),
    3: re.compile(r'Total Fase 3', re.I),
    4: re.compile(r'Total Fase 4', re.I),
}

EVIDENCIA_PREFIXES = [
    'Evidencia:', 'Foro:', 'Prueba de Conocimiento:', 'Total Fase', 'Última descarga'
]

def clean_documento(username:str)->str:
    # Ej: 1053858595cc -> extraer parte numérica inicial
    if not isinstance(username,str):
        return ''
    m = re.match(r'(\d+)', username)
    return m.group(1) if m else username


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('excel')
    ap.add_argument('--outdir', default='.')
    ap.add_argument('--materia-codigo', dest='materia_codigo', default='CODIGO')
    ap.add_argument('--ficha-numero', dest='ficha_numero', default='FICHA')
    ap.add_argument('--map', nargs='*', help='Items formato A=4.5 B=4.0 -= (vacío significa None)')
    ap.add_argument('--af-only', action='store_true', help='Colapsa todas las letras a A (aprobado) o F (reprobado)')
    ap.add_argument('--af-flat', action='store_true', help='Genera archivo calificaciones_af.xlsx con columna letra A/F para /upload-af')
    args = ap.parse_args()

    mapping = parse_mapping(args.map)
    if args.af_only:
        # Ignorar mapeo personalizado; solo A y F.
        # A -> nota 5.0, F (todo lo demás) -> nota 2.0
        mapping = {'A':5.0,'F':2.0,'-':None}

    path = Path(args.excel)
    if not path.exists():
        print('Archivo no encontrado:', path)
        sys.exit(1)

    xl = pd.ExcelFile(path)
    df = xl.parse(xl.sheet_names[0])

    # Construir calificaciones_base
    base_rows = []
    for i,row in df.iterrows():
        nombre = f"{row.get('Nombre(s)','').strip()} {row.get('Apellido(s)','').strip()}".strip()
        documento = clean_documento(row.get('Nombre de usuario',''))
        for trimestre, regex in PHASE_COLUMNS.items():
            phase_cols = [c for c in df.columns if regex.search(str(c))]
            if not phase_cols:
                continue
            val_letra = row.get(phase_cols[0])
            if pd.isna(val_letra):
                continue
            val_letra = str(val_letra).strip().upper()
            if args.af_only:
                letra_clas = 'A' if val_letra == 'A' else 'F'
                nota_num = mapping.get(letra_clas)
                estado = 'Aprobado' if letra_clas == 'A' else 'Reprobado'
                observ = letra_clas
            else:
                nota_num = mapping.get(val_letra)
                estado = None
                observ = val_letra
            base_rows.append({
                'materia_codigo': args.materia_codigo,
                'ficha_numero': args.ficha_numero,
                'estudiante_nombre': nombre,
                'estudiante_documento': documento,
                'trimestre': trimestre,
                'nota': nota_num,
                'estado': estado,
                'observaciones': observ,
            })
    base_df = pd.DataFrame(base_rows)
    if base_df.empty:
        print('Advertencia: no se generaron filas para calificaciones_base')
    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)

    base_file = outdir / 'calificaciones_base.xlsx'
    with pd.ExcelWriter(base_file, engine='openpyxl') as w:
        base_df.to_excel(w, index=False, sheet_name='calificaciones')

    # Evidencias detalle (wide -> long) para referencia futura
    detalle_rows = []
    evidencia_cols = [c for c in df.columns if any(c.startswith(p) for p in EVIDENCIA_PREFIXES) and 'Total Fase' not in c]
    for i,row in df.iterrows():
        nombre = f"{row.get('Nombre(s)','').strip()} {row.get('Apellido(s)','').strip()}".strip()
        documento = clean_documento(row.get('Nombre de usuario',''))
        for col in evidencia_cols:
            val = row.get(col)
            if pd.isna(val):
                continue
            detalle_rows.append({
                'estudiante_documento': documento,
                'estudiante_nombre': nombre,
                'evidencia': col,
                'valor_letra': str(val).strip().upper(),
            })
    detalle_df = pd.DataFrame(detalle_rows)
    detalle_file = outdir / 'evidencias_detalle.xlsx'
    with pd.ExcelWriter(detalle_file, engine='openpyxl') as w:
        detalle_df.to_excel(w, index=False, sheet_name='evidencias')

    if args.af_flat:
        # Construir archivo plano letra A/F (si af_only no, convertir letras distintas de A a F)
        flat_rows = []
        for r in base_rows:
            letra = r['observaciones'].upper()
            if letra != 'A':
                letra = 'F'
            flat_rows.append({
                'materia_codigo': r['materia_codigo'],
                'ficha_numero': r['ficha_numero'],
                'estudiante_nombre': r['estudiante_nombre'],
                'estudiante_documento': r['estudiante_documento'],
                'trimestre': r['trimestre'],
                'letra': letra,
            })
        flat_df = pd.DataFrame(flat_rows)
        flat_file = outdir / 'calificaciones_af.xlsx'
        with pd.ExcelWriter(flat_file, engine='openpyxl') as w:
            flat_df.to_excel(w, index=False, sheet_name='calificaciones')
    print('Generados:')
    print(' -', base_file)
    if args.af_flat:
        print(' -', flat_file)
    print(' -', detalle_file)
    print('Filas calificaciones:', len(base_df))
    if args.af_flat:
        print('Filas calificaciones_af:', len(flat_df))
    print('Filas evidencias:', len(detalle_df))

if __name__ == '__main__':
    main()
