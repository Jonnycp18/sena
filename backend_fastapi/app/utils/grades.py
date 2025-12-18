# Utility: central mapping for academic letter grades to numeric scores
# Supports legacy 'D' and current 'F' usage for reprobado states.

LETTER_SCORE_HEURISTIC = {
    'A': 9.0,  # aprobado alto (heurística dashboards históricos)
    'D': 6.0,  # legacy desaprobado
    'F': 6.0,  # reprobado actual (equivalente a D en heurística)
}

LETTER_SCORE_NOTA = {
    'A': 5.0,  # nota máxima por defecto en carga masiva
    'F': 2.0,  # reprobado bajo
    'D': 2.0,  # legacy mapping si aparece
}

DEFAULT_SCHEME = 'heuristic'  # or 'nota'

from typing import Optional, List

def letter_to_score(letra: Optional[str], scheme: str = DEFAULT_SCHEME) -> float:
    if not letra:
        return 0.0
    letra = letra.strip().upper()
    mapping = LETTER_SCORE_HEURISTIC if scheme == 'heuristic' else LETTER_SCORE_NOTA
    return mapping.get(letra, 0.0)

def average_letters(letras: Optional[List[Optional[str]]], scheme: str = DEFAULT_SCHEME) -> float:
    if not letras:
        return 0.0
    scores = [letter_to_score(l, scheme) for l in letras if l]
    if not scores:
        return 0.0
    return round(sum(scores) / len(scores), 2)
