import sys
import pandas as pd
from pathlib import Path

"""Uso:
python scripts/inspect_excel.py ruta/al/archivo.xlsx
Muestra:
- Nombre de hojas
- Columnas de la primera hoja
- Primeras 5 filas
"""

def main():
    if len(sys.argv) < 2:
        print("Proporciona ruta al archivo .xlsx")
        sys.exit(1)
    path = Path(sys.argv[1])
    if not path.exists():
        print(f"Archivo no encontrado: {path}")
        sys.exit(1)
    try:
        xl = pd.ExcelFile(path)
        print("Hojas:", xl.sheet_names)
        df = xl.parse(xl.sheet_names[0])
        print("Columnas:", list(df.columns))
        print("Primeras filas:")
        print(df.head())
    except Exception as e:
        print("Error leyendo Excel:", e)
        sys.exit(2)

if __name__ == "__main__":
    main()
