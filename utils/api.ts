// Simple API client for the frontend to talk to the backend
// Uses native fetch; adjust base URL via Vite env: VITE_API_BASE_URL

import type { User, UserRole } from '../types/user';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

type DbUser = {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  rol: string; // e.g., "Administrador", "Coordinador", "Docente"
  activo: boolean;
  avatar_url?: string | null;
  telefono?: string | null;
  created_at?: string;
  updated_at?: string;
};

type PaginatedResult<T> = {
  success: boolean;
  data: T[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

function mapRole(rol: string): UserRole {
  const normalized = rol.trim().toLowerCase();
  if (normalized.startsWith('admin')) return 'administrador';
  if (normalized.startsWith('coord')) return 'coordinador';
  return 'docente';
}

function mapUser(u: DbUser): User {
  return {
    id: String(u.id),
    nombre: u.nombre,
    apellido: u.apellido,
    email: u.email,
    telefono: u.telefono ?? undefined,
    cedula: '',
    rol: mapRole(u.rol),
    departamento: undefined,
    especialidad: undefined,
    fechaIngreso: (u.created_at ?? new Date().toISOString()).slice(0, 10),
    estado: u.activo ? 'activo' : 'inactivo',
    avatar: u.avatar_url ?? undefined,
    biografia: undefined,
    configuraciones: {
      notificacionesEmail: true,
      notificacionesPush: true,
      tema: 'sistema',
      idioma: 'es',
    },
  };
}

// ===== Auth token storage and helpers =====
type TokenPair = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
};

const TOKEN_KEY = 'auth_tokens_v1';

function saveTokens(tokens: TokenPair) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

export function getTokens(): TokenPair | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as TokenPair) : null;
  } catch {
    return null;
  }
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
}

function getAuthHeader(): Record<string, string> {
  const tokens = getTokens();
  if (tokens?.access_token) {
    return { Authorization: `Bearer ${tokens.access_token}` };
  }
  return {}; // always plain object with string values
}

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

async function httpAuth<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const mergedHeaders: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  Object.assign(mergedHeaders, getAuthHeader());
  if (init?.headers) {
    Object.assign(mergedHeaders, init.headers as Record<string, string>);
  }
  const res = await fetch(url, { ...init, headers: mergedHeaders });
  if (res.status === 401) {
    // try refresh once
    const tokens = getTokens();
    if (tokens?.refresh_token) {
      try {
        const newTokens = await refresh(tokens.refresh_token);
        saveTokens(newTokens);
        const retryHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
        Object.assign(retryHeaders, getAuthHeader());
        if (init?.headers) Object.assign(retryHeaders, init.headers as Record<string, string>);
        const retry = await fetch(url, { ...init, headers: retryHeaders });
        if (!retry.ok) {
          const text = await retry.text().catch(() => '');
          throw new Error(`HTTP ${retry.status}: ${text || retry.statusText}`);
        }
        return retry.json() as Promise<T>;
      } catch (e) {
        clearTokens();
        throw e;
      }
    }
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function getUsers(params?: { page?: number; pageSize?: number; search?: string }) {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 50;
  const search = params?.search ? `&search=${encodeURIComponent(params.search)}` : '';
  const url = `${API_BASE_URL}/users?page=${page}&pageSize=${pageSize}${search}`;
  const json = await http<PaginatedResult<DbUser>>(url);
  return {
    users: (json.data ?? []).map(mapUser),
    pagination: json.pagination,
  };
}

// Users CRUD (requires auth)
export async function createUser(payload: {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  rol: 'Administrador' | 'Coordinador' | 'Docente';
  activo?: boolean;
  telefono?: string;
  avatar_url?: string;
}) {
  const res = await httpAuth<{ success: boolean; data: DbUser }>(`/users`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return mapUser(res.data);
}

export async function updateUser(id: number, payload: Partial<{
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  rol: 'Administrador' | 'Coordinador' | 'Docente';
  activo: boolean;
  telefono: string;
  avatar_url: string;
}>) {
  const res = await httpAuth<{ success: boolean; data: DbUser }>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return mapUser(res.data);
}

export async function toggleUser(id: number) {
  const res = await httpAuth<{ success: boolean; data: DbUser }>(`/users/${id}/toggle`, {
    method: 'PATCH',
  });
  return mapUser(res.data);
}

export async function deleteUser(id: number) {
  const res = await httpAuth<{ success: boolean; data: DbUser }>(`/users/${id}`, {
    method: 'DELETE',
  });
  return mapUser(res.data);
}

// ===== Auth endpoints =====

export async function login(email: string, password: string): Promise<TokenPair> {
  const url = `${API_BASE_URL}/auth/login`;
  const tokens = await http<TokenPair>(url, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  saveTokens(tokens);
  return tokens;
}

export async function me(): Promise<User> {
  const url = `/auth/me`;
  const dbUser = await httpAuth<DbUser>(url, { method: 'GET' });
  return mapUser(dbUser);
}

export async function refresh(refresh_token: string): Promise<TokenPair> {
  const url = `${API_BASE_URL}/auth/refresh`;
  const tokens = await http<TokenPair>(url, {
    method: 'POST',
    body: JSON.stringify({ refresh_token }),
  });
  return tokens;
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<{ ok: boolean; message?: string }> {
  return httpAuth<{ ok: boolean; message?: string }>(`/auth/change-password`, {
    method: 'POST',
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
  });
}

// ===== Fichas =====
type DbFicha = {
  id: number;
  numero: string;
  nombre: string;
  descripcion?: string | null;
  estado: string; // e.g., 'Activa', 'Finalizada'
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  created_at?: string;
};

export interface FichaUI {
  id: string;
  nombre: string;
  codigo: string;
  descripcion: string;
  estado: 'activa' | 'inactiva';
  fechaCreacion: string;
  tipoPrograma: 'tecnico' | 'tecnologico' | 'profesional';
  modalidad: 'presencial' | 'virtual' | 'mixta';
}

function mapFicha(f: DbFicha): FichaUI {
  const estado = f.estado?.toLowerCase().startsWith('act') ? 'activa' : 'inactiva';
  return {
    id: String(f.id),
    nombre: f.nombre,
    codigo: f.numero,
    descripcion: f.descripcion ?? '',
    estado,
    fechaCreacion: (f.created_at ?? new Date().toISOString()).slice(0, 10),
    tipoPrograma: 'tecnico',
    modalidad: 'presencial',
  };
}

export async function getFichas(params?: { page?: number; pageSize?: number; search?: string }) {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 50;
  const search = params?.search ? `&search=${encodeURIComponent(params.search)}` : '';
  const url = `${API_BASE_URL}/fichas?page=${page}&pageSize=${pageSize}${search}`;
  const json = await http<PaginatedResult<DbFicha>>(url);
  return {
    fichas: (json.data ?? []).map(mapFicha),
    pagination: json.pagination,
  };
}

// Crear/Actualizar fichas en backend
export async function createFicha(payload: { numero: string; nombre: string; descripcion?: string; estado?: string; fecha_inicio?: string; fecha_fin?: string }) {
  const res = await httpAuth<{ success: boolean; data: DbFicha }>(`/fichas`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return mapFicha(res.data);
}

export async function updateFicha(id: number, payload: Partial<{ numero: string; nombre: string; descripcion?: string; estado?: string; fecha_inicio?: string; fecha_fin?: string }>) {
  const res = await httpAuth<{ success: boolean; data: DbFicha }>(`/fichas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return mapFicha(res.data);
}

export async function deleteFicha(id: number) {
  await httpAuth<{ success: boolean }>(`/fichas/${id}`, { method: 'DELETE' });
  return true;
}

export async function setFichaEstado(id: number, estado: 'Activa' | 'Inactiva' | 'Finalizada') {
  const res = await httpAuth<{ success: boolean; data: DbFicha }>(`/fichas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  });
  return mapFicha(res.data);
}

// Lookup de ficha por numero exacto. Intenta endpoint con query numero=...
export async function findFichaByNumero(numero: string): Promise<{ id: number; numero: string; nombre: string } | null> {
  const n = (numero || '').trim();
  if (!n) return null;
  const url = `${API_BASE_URL}/fichas?numero=${encodeURIComponent(n)}`;
  const json: any = await http<any>(url).catch(() => null);
  if (!json) return null;
  const data = Array.isArray(json.data) ? json.data : (json.data ? [json.data] : []);
  if (!data.length) return null;
  // Preferir coincidencia exacta por numero (case-insensitive)
  const exact = data.find((f: DbFicha) => (f.numero || '').toLowerCase() === n.toLowerCase());
  const f: DbFicha | undefined = exact || data[0];
  return f ? { id: f.id, numero: f.numero, nombre: f.nombre } : null;
}

// ===== Materias =====
type DbMateria = {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  horas_semanales?: number; // esquema actual
  horas?: number; // compat para respuestas antiguas
  ficha_id: number;
  docente_id?: number | null;
  estado: string; // 'Activa' | 'Inactiva'
};

export interface MateriaUI {
  id: string;
  nombre: string;
  codigo: string;
  descripcion: string;
  horas: number;
  fichaId: string;
  docenteId?: string;
  prerrequisitos: string[];
  estado: 'activa' | 'inactiva';
  tipoMateria: 'teorica' | 'practica' | 'teorico-practica';
}

function mapMateria(m: DbMateria): MateriaUI {
  const estado = m.estado?.toLowerCase().startsWith('act') ? 'activa' : 'inactiva';
  const horas = (m.horas_semanales ?? m.horas ?? 0);
  return {
    id: String(m.id),
    nombre: m.nombre,
    codigo: m.codigo,
    descripcion: m.descripcion ?? '',
    horas,
    fichaId: String(m.ficha_id),
    docenteId: m.docente_id != null ? String(m.docente_id) : undefined,
    prerrequisitos: [],
    estado,
    tipoMateria: 'teorico-practica',
  };
}

export async function getMaterias(params?: { page?: number; pageSize?: number; search?: string; fichaId?: string; estado?: string }) {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 50;
  const search = params?.search ? `&search=${encodeURIComponent(params.search)}` : '';
  const ficha = params?.fichaId ? `&fichaId=${encodeURIComponent(params.fichaId)}` : '';
  const estado = params?.estado ? `&estado=${encodeURIComponent(params.estado)}` : '';
  const url = `${API_BASE_URL}/materias?page=${page}&pageSize=${pageSize}${search}${ficha}${estado}`;
  const json = await http<PaginatedResult<DbMateria>>(url);
  return {
    materias: (json.data ?? []).map(mapMateria),
    pagination: json.pagination,
  };
}

// Crear/Actualizar materias en backend
export async function createMateria(payload: { codigo: string; nombre: string; descripcion?: string; horas_semanales: number; ficha_id: number; docente_id?: number; estado?: string }) {
  const res = await httpAuth<{ success: boolean; data: DbMateria }>(`/materias`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return mapMateria(res.data);
}

export async function updateMateria(id: number, payload: Partial<{ codigo: string; nombre: string; descripcion?: string; horas_semanales: number; ficha_id: number; docente_id?: number; estado?: string }>) {
  const res = await httpAuth<{ success: boolean; data: DbMateria }>(`/materias/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return mapMateria(res.data);
}

export async function deleteMateria(id: number) {
  await httpAuth<{ success: boolean }>(`/materias/${id}`, { method: 'DELETE' });
  return true;
}

export async function setMateriaEstado(id: number, estado: 'Activa' | 'Inactiva' | 'Finalizada') {
  const res = await httpAuth<{ success: boolean; data: DbMateria }>(`/materias/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  });
  return mapMateria(res.data);
}

async function getAdminDashboardStats() {
  return httpAuth<{ success: boolean; data: any }>(`/dashboard/admin/stats`, { method: 'GET' });
}
async function getAdminDashboardActivity(limit = 10) {
  return httpAuth<{ success: boolean; data: any[] }>(`/dashboard/admin/activity?limit=${limit}`, { method: 'GET' });
}
async function getAdminPendingTasks() {
  return httpAuth<{ success: boolean; data: any }>(`/dashboard/admin/pending-tasks`, { method: 'GET' });
}

export const api = { getUsers, createUser, updateUser, toggleUser, deleteUser, getFichas, createFicha, updateFicha, deleteFicha, setFichaEstado, findFichaByNumero, getMaterias, createMateria, updateMateria, deleteMateria, setMateriaEstado, login, me, refresh, changePassword, getTokens, clearTokens, getAdminDashboardStats, getAdminDashboardActivity, getAdminPendingTasks };
// Coordinador dashboard endpoints
async function getCoordinadorDashboardStats() {
  return httpAuth<{ success: boolean; data: any }>(`/dashboard/coordinador/stats`, { method: 'GET' });
}
async function getCoordinadorAtRiskStudents(limit = 10) {
  return httpAuth<{ success: boolean; data: any[] }>(`/dashboard/coordinador/at-risk-students?limit=${limit}`, { method: 'GET' });
}
async function getCoordinadorPerformanceByCourse(limit = 10) {
  return httpAuth<{ success: boolean; data: any[] }>(`/dashboard/coordinador/performance-by-course?limit=${limit}`, { method: 'GET' });
}
async function getCoordinadorPendingApprovals() {
  return httpAuth<{ success: boolean; data: any }>(`/dashboard/coordinador/pending-approvals`, { method: 'GET' });
}

export const coordinadorApi = { getCoordinadorDashboardStats, getCoordinadorAtRiskStudents, getCoordinadorPerformanceByCourse, getCoordinadorPendingApprovals };
// Docente dashboard endpoints
async function getDocenteStats() {
  return httpAuth<{ success: boolean; data: any }>(`/dashboard/docente/stats`, { method: 'GET' });
}
async function getDocenteCourses(limit=10) {
  return httpAuth<{ success: boolean; data: any[] }>(`/dashboard/docente/my-courses?limit=${limit}`, { method: 'GET' });
}
async function getDocentePendingGrades(limit=20) {
  return httpAuth<{ success: boolean; data: any[] }>(`/dashboard/docente/pending-grades?limit=${limit}`, { method: 'GET' });
}
async function getDocenteRecentUploads(limit=10) {
  return httpAuth<{ success: boolean; data: any[] }>(`/dashboard/docente/recent-uploads?limit=${limit}`, { method: 'GET' });
}

// Upload calificaciones Excel (with optional dryRun and ficha)
async function uploadCalificaciones(file: File, dryRun = false, ficha?: string) {
  const url = `${API_BASE_URL}/calificaciones/upload?dryRun=${dryRun ? 'true' : 'false'}`;
  const tokens = getTokens();
  const form = new FormData();
  form.append('file', file);
  if (ficha && ficha.trim()) {
    form.append('ficha', ficha.trim());
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...(tokens?.access_token ? { Authorization: `Bearer ${tokens.access_token}` } : {}) },
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.detail || `Error upload (${res.status})`);
  }
  return json as { success: boolean; dryRun?: boolean; stats?: any; errors?: string[] };
}

export const docenteApi = { getDocenteStats, getDocenteCourses, getDocentePendingGrades, getDocenteRecentUploads, uploadCalificaciones };
// Evidencias definiciones endpoints
async function listEvidenciaDefiniciones(params: { materiaId?: number; fichaId?: number; docenteId?: number }) {
  const q = new URLSearchParams();
  if (params.materiaId) q.append('materiaId', String(params.materiaId));
  if (params.fichaId) q.append('fichaId', String(params.fichaId));
  if (params.docenteId) q.append('docenteId', String(params.docenteId));
  return httpAuth<{ success: boolean; data: any[] }>(`/evidencias/definiciones${q.toString() ? '?' + q.toString() : ''}`, { method: 'GET' });
}
async function resumenEvidenciaDefiniciones(materiaId: number) {
  return httpAuth<{ success: boolean; data: any[] }>(`/evidencias/definiciones/resumen?materiaId=${materiaId}`, { method: 'GET' });
}
async function crearEvidenciaDefinicion(payload: any) {
  return httpAuth<{ success: boolean; data: any }>(`/evidencias/definiciones`, { method: 'POST', body: JSON.stringify(payload) });
}
async function actualizarEvidenciaDefinicion(id: number, payload: any) {
  return httpAuth<{ success: boolean; data: any }>(`/evidencias/definiciones/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}
async function activarDefiniciones(ids: number[]) {
  return httpAuth<{ success: boolean; actualizados: number[] }>(`/evidencias/definiciones/activar`, { method: 'PATCH', body: JSON.stringify({ ids }) });
}
async function desactivarDefiniciones(ids: number[]) {
  return httpAuth<{ success: boolean; actualizados: number[] }>(`/evidencias/definiciones/desactivar`, { method: 'PATCH', body: JSON.stringify({ ids }) });
}

export const evidenciasDefApi = { listEvidenciaDefiniciones, resumenEvidenciaDefiniciones, crearEvidenciaDefinicion, actualizarEvidenciaDefinicion, activarDefiniciones, desactivarDefiniciones };

// ===== Evidencias Wide (Excel con columnas por evidencia) =====
async function uploadEvidenciasWide(
  file: File,
  options?: { dryRun?: boolean; fichaId?: number; fichaNumero?: string; materiaId?: number; docenteId?: number }
) {
  const { dryRun = false, fichaId = 0, fichaNumero = '', materiaId = 0, docenteId = 0 } = options || {};
  const tokens = getTokens();
  const url = `${API_BASE_URL}/evidencias-wide/${dryRun ? 'upload-wide?dryRun=true' : 'upload'}`;
  const form = new FormData();
  form.append('file', file);
  form.append('ficha_id', String(fichaId || 0));
  if (fichaNumero.trim()) form.append('ficha_numero', fichaNumero.trim());
  form.append('materia_id', String(materiaId || 0));
  form.append('docente_id', String(docenteId || 0));
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...(tokens?.access_token ? { Authorization: `Bearer ${tokens.access_token}` } : {}) },
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.detail || `Error evidencias-wide (${res.status})`);
  }
  return json as { success: boolean; insertados?: number; counts?: any; errores?: string[]; dryRun?: boolean; total?: number };
}

export const evidenciasWideApi = { uploadEvidenciasWide };
// Historial de cargas evidencias wide
async function getEvidenciasWideUploadsHistory(limit = 25) {
  return httpAuth<{ success: boolean; data: any[] }>(`/evidencias-wide/uploads-history?limit=${limit}`, { method: 'GET' });
}
export const evidenciasWideHistoryApi = { getEvidenciasWideUploadsHistory };

// ===== Evidencias: carga por evidencia (una columna) =====
// Envía solo una evidencia seleccionada por el docente, no todas.
export async function uploadEvidenciaColumna(payload: {
  materia_id: number;
  ficha_id: number;
  evidencia_nombre: string;
  rows: Array<{ documento?: string; correo?: string; valor: 'A' | 'D' | '-' | '' }>;
}) {
  const res = await httpAuth<{ success: boolean; data?: any }>(`/evidencias/upload-columna`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res;
}

// ===== Maintenance: correos por inasistencias =====
// Dispara correos de ausencia por materia y ficha
export async function triggerAbsenceEmails(params: {
  materiaId: number;
  fichaId: number;
  studentThreshold?: number;
  escalationThreshold?: number;
  includePending?: boolean;
}) {
  const q = new URLSearchParams();
  q.append('materia_id', String(params.materiaId));
  q.append('ficha_id', String(params.fichaId));
  if (params.studentThreshold !== undefined) q.append('student_threshold', String(params.studentThreshold));
  if (params.escalationThreshold !== undefined) q.append('escalation_threshold', String(params.escalationThreshold));
  if (params.includePending !== undefined) q.append('include_pending', String(params.includePending));
  return httpAuth<{ success: boolean; sent?: number; details?: any }>(
    `/maintenance/emails/absence/by-materia-ficha?${q.toString()}`,
    { method: 'POST' }
  );
}

// ===== Analytics endpoints =====
interface AprobacionMateriaRow {
  materiaId: number; codigo: string; materia: string;
  aprobados: number; reprobados: number; noEntregaron: number; total: number;
  porcentajes: { aprobados: number; reprobados: number; noEntregaron: number };
}
interface EstadoGeneralRow {
  aprobados: number; reprobados: number; no_entregaron?: number; noEntregaron?: number; total: number;
  porcentajes: { aprobados: number; reprobados: number; noEntregaron: number };
}
interface TendenciaRow {
  periodo: string; fechaInicio: string; fechaFin: string; aprobacion: number; totalEvidencias: number; aprobadas: number;
}
interface RendimientoFichaRow {
  fichaId: number; numero: string; nombre: string; aprobacion: number; promedio: number | null;
  totalEstudiantes: number; evidenciasAprobadas: number; evidenciasTotales: number;
}
interface RendimientoCompetenciaRow {
  competencia: string; value: number; materiasIncluidas: string[]; totalEvidencias: number;
}

function buildQuery(params: Record<string, any>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k,v]) => {
    if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

async function getAprobacionPorMateria(params: { ficha_id?: number; materia_id?: number; from?: string; to?: string }) {
  return httpAuth<{ success: boolean; data: AprobacionMateriaRow[] }>(`/analytics/aprobacion-por-materia${buildQuery(params)}`);
}
async function getEstadoGeneral(params: { ficha_id?: number; materia_id?: number; from?: string; to?: string }) {
  return httpAuth<{ success: boolean; data: EstadoGeneralRow }>(`/analytics/estado-general${buildQuery(params)}`);
}
async function getTendenciaAprobacion(params: { intervalo?: 'semanal' | 'mensual'; ficha_id?: number; materia_id?: number; from?: string; to?: string }) {
  return httpAuth<{ success: boolean; data: TendenciaRow[] }>(`/analytics/tendencia-aprobacion${buildQuery(params)}`);
}
async function getRendimientoPorFicha(params: { from?: string; to?: string; limit?: number }) {
  return httpAuth<{ success: boolean; data: RendimientoFichaRow[] }>(`/analytics/rendimiento-por-ficha${buildQuery(params)}`);
}
async function getRendimientoPorCompetencia(params: { ficha_id?: number; from?: string; to?: string }) {
  return httpAuth<{ success: boolean; data: RendimientoCompetenciaRow[] }>(`/analytics/rendimiento-por-competencia${buildQuery(params)}`);
}

export const analyticsApi = {
  getAprobacionPorMateria,
  getEstadoGeneral,
  getTendenciaAprobacion,
  getRendimientoPorFicha,
  getRendimientoPorCompetencia,
};

// ===== Calificaciones: list & export =====
async function listCalificaciones(params: { page?: number; pageSize?: number; search?: string; materiaId?: number; fichaId?: number; trimestre?: number; estado?: string }) {
  const q = new URLSearchParams();
  if (params.page) q.append('page', String(params.page));
  if (params.pageSize) q.append('pageSize', String(params.pageSize));
  if (params.search) q.append('search', params.search);
  if (params.materiaId !== undefined) q.append('materiaId', String(params.materiaId));
  if (params.fichaId !== undefined) q.append('fichaId', String(params.fichaId));
  if (params.trimestre !== undefined) q.append('trimestre', String(params.trimestre));
  if (params.estado) q.append('estado', params.estado);
  return httpAuth<{ success: boolean; data: any[]; pagination?: any }>(`/calificaciones${q.toString() ? '?' + q.toString() : ''}`, { method: 'GET' });
}
async function exportCalificaciones(params: { materiaId?: number; fichaId?: number; trimestre?: number; estado?: string }) {
  const q = new URLSearchParams();
  if (params.materiaId !== undefined) q.append('materiaId', String(params.materiaId));
  if (params.fichaId !== undefined) q.append('fichaId', String(params.fichaId));
  if (params.trimestre !== undefined) q.append('trimestre', String(params.trimestre));
  if (params.estado) q.append('estado', params.estado);
  return httpAuth<Blob>(`/calificaciones/export${q.toString() ? '?' + q.toString() : ''}`, { method: 'GET' });
}

export const calificacionesApi = { list: listCalificaciones, export: exportCalificaciones };

// ===== Evidencias: list & export =====
interface EvidenciaRow {
  id: number;
  documento: string;
  evidencia_nombre: string;
  letra?: string | null;
  estado?: string | null;
  observaciones?: string | null;
  created_at?: string;
  updated_at?: string;
}

async function listEvidencias(params: { page?: number; pageSize?: number; search?: string; estado?: string }) {
  const q = new URLSearchParams();
  if (params.page) q.append('page', String(params.page));
  if (params.pageSize) q.append('pageSize', String(params.pageSize));
  if (params.search) q.append('search', params.search);
  if (params.estado) q.append('estado', params.estado);
  return httpAuth<{ success: boolean; data: EvidenciaRow[]; pagination?: any }>(`/evidencias${q.toString() ? '?' + q.toString() : ''}`, { method: 'GET' });
}

async function exportEvidencias(params: { search?: string; estado?: string }) {
  const q = new URLSearchParams();
  if (params.search) q.append('search', params.search);
  if (params.estado) q.append('estado', params.estado);
  return httpAuth<Blob>(`/evidencias/export${q.toString() ? '?' + q.toString() : ''}`, { method: 'GET' });
}

export const evidenciasApi = { list: listEvidencias, export: exportEvidencias };

// ===== Students Analytics (per-student report) =====
interface StudentAnalyticsRow {
  id: string;
  documento: string;
  nombre: string;
  apellido: string;
  email?: string;
  fichaNumero?: string;
  evidenciasTotal?: number;
  aprobadas?: number;
  desaprobadas?: number;
  noEntregadas?: number;
  porcentaje?: number;
  tendencia?: 'up' | 'down' | 'stable';
}

export async function getStudentsAnalytics(params: { materia?: string; ficha?: string; docente?: string; from?: string; to?: string; search?: string; limit?: number }) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k,v]) => { if (v !== undefined && v !== null && String(v).trim() !== '') q.append(k, String(v)); });
  const url = `/analytics/estudiantes${q.toString() ? `?${q.toString()}` : ''}`;
  return httpAuth<{ success: boolean; data: StudentAnalyticsRow[] }>(url, { method: 'GET' });
}
