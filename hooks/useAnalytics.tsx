import { useState, useCallback } from 'react';
import { analyticsApi } from '../utils/api';

// Types (reuse subset from api layer)
export type AprobacionMateria = {
  materiaId: number; codigo: string; materia: string;
  aprobados: number; reprobados: number; noEntregaron: number; total: number;
  porcentajes: { aprobados: number; reprobados: number; noEntregaron: number };
};
export type EstadoGeneral = {
  aprobados: number; reprobados: number; noEntregaron: number; total: number;
  porcentajes: { aprobados: number; reprobados: number; noEntregaron: number };
};
export type TendenciaItem = {
  periodo: string; fechaInicio: string; fechaFin: string; aprobacion: number; totalEvidencias: number; aprobadas: number;
};
export type RendimientoFicha = {
  fichaId: number; numero: string; nombre: string; aprobacion: number; promedio: number | null;
  totalEstudiantes: number; evidenciasAprobadas: number; evidenciasTotales: number;
};
export type RendimientoCompetencia = {
  competencia: string; value: number; materiasIncluidas: string[]; totalEvidencias: number;
};

interface UseAnalyticsResult {
  loading: boolean;
  error: string | null;
  fetchAprobacionPorMateria: (p: { ficha_id?: number; materia_id?: number; from?: string; to?: string }) => Promise<AprobacionMateria[] | null>;
  fetchEstadoGeneral: (p: { ficha_id?: number; materia_id?: number; from?: string; to?: string }) => Promise<EstadoGeneral | null>;
  fetchTendenciaAprobacion: (p: { intervalo?: 'semanal' | 'mensual'; ficha_id?: number; materia_id?: number; from?: string; to?: string }) => Promise<TendenciaItem[] | null>;
  fetchRendimientoPorFicha: (p: { from?: string; to?: string; limit?: number }) => Promise<RendimientoFicha[] | null>;
  fetchRendimientoPorCompetencia: (p: { ficha_id?: number; from?: string; to?: string }) => Promise<RendimientoCompetencia[] | null>;
}

export function useAnalytics(): UseAnalyticsResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wrap = useCallback(async <T,>(fn: () => Promise<{ success: boolean; data: T }>): Promise<T | null> => {
    setLoading(true); setError(null);
    try {
      const res = await fn();
      if (res.success) return res.data;
      return null;
    } catch (e: any) {
      setError(e?.message || 'Error inesperado');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAprobacionPorMateria = useCallback((p: { ficha_id?: number; materia_id?: number; from?: string; to?: string }) =>
    wrap(() => analyticsApi.getAprobacionPorMateria(p)), [wrap]);
  const fetchEstadoGeneral = useCallback((p: { ficha_id?: number; materia_id?: number; from?: string; to?: string }) =>
    wrap(() => analyticsApi.getEstadoGeneral(p).then(r => ({
      success: r.success,
      data: {
        aprobados: r.data.aprobados,
        reprobados: r.data.reprobados,
        noEntregaron: (r.data as any).noEntregaron ?? (r.data as any).no_entregaron ?? 0,
        total: r.data.total,
        porcentajes: r.data.porcentajes,
      }
    }))), [wrap]);
  const fetchTendenciaAprobacion = useCallback((p: { intervalo?: 'semanal' | 'mensual'; ficha_id?: number; materia_id?: number; from?: string; to?: string }) =>
    wrap(() => analyticsApi.getTendenciaAprobacion(p)), [wrap]);
  const fetchRendimientoPorFicha = useCallback((p: { from?: string; to?: string; limit?: number }) =>
    wrap(() => analyticsApi.getRendimientoPorFicha(p)), [wrap]);
  const fetchRendimientoPorCompetencia = useCallback((p: { ficha_id?: number; from?: string; to?: string }) =>
    wrap(() => analyticsApi.getRendimientoPorCompetencia(p)), [wrap]);

  return {
    loading,
    error,
    fetchAprobacionPorMateria,
    fetchEstadoGeneral,
    fetchTendenciaAprobacion,
    fetchRendimientoPorFicha,
    fetchRendimientoPorCompetencia,
  };
}
