/**
 * Sistema de Auditoría - Logger de Acciones
 * Rastrea todas las acciones importantes del sistema
 */

// Tipos de acciones auditables
export type AuditAction =
  // Autenticación
  | 'auth.login.success'
  | 'auth.login.failed'
  | 'auth.logout'
  | 'auth.password_change'
  | 'auth.session_expired'
  // Dashboards
  | 'dashboard.access'
  // Usuarios
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'user.role_change'
  | 'user.status_change'
  // Archivos
  | 'file.upload'
  | 'file.validate'
  | 'file.save'
  | 'file.delete'
  | 'file.download'
  | 'file.export'
  // Archivos (extendidos)
  | 'file.selection'
  | 'file.validation_failed'
  | 'file.process_success'
  | 'file.process_error'
  | 'file.config_load'
  | 'file.grade_update'
  | 'file.validation_error'
  | 'file.config_saved'
  | 'file.grades_saved'
  | 'file.save_error'
  // Fichas y Materias
  | 'ficha.create'
  | 'ficha.update'
  | 'ficha.delete'
  | 'materia.create'
  | 'materia.update'
  | 'materia.delete'
  // Calificaciones
  | 'grade.create'
  | 'grade.update'
  | 'grade.delete'
  | 'grade.bulk_update'
  // Reportes
  | 'report.generate'
  | 'report.export'
  | 'report.view'
  | 'reports.access'
  // Notificaciones
  | 'notifications.access'
  | 'notifications.mark_all_read'
  | 'notifications.clear_all'
  // Perfil y contraseña
  | 'profile.view'
  | 'profile.update'
  | 'password.change_validation_failed'
  | 'password.change_success'
  | 'password.change_error'
  // Seguridad
  | 'security.access_denied'
  | 'security.unauthorized_attempt'
  | 'security.suspicious_activity'
  // Sistema
  | 'system.config_change'
  | 'system.backup'
  | 'system.restore';

// Nivel de severidad
export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

// Categorías de auditoría
export type AuditCategory = 
  | 'authentication'
  | 'user_management'
  | 'file_management'
  | 'academic_data'
  | 'reports'
  | 'security'
  | 'system';

// Interfaz principal de log de auditoría
export interface AuditLog {
  id: string;
  timestamp: string; // ISO string
  action: AuditAction;
  category: AuditCategory;
  severity: AuditSeverity;
  userId: string;
  userName: string;
  userRole: string;
  targetType?: string; // Tipo de entidad afectada (usuario, archivo, etc.)
  targetId?: string; // ID de la entidad afectada
  targetName?: string; // Nombre legible de la entidad
  description: string; // Descripción de la acción
  metadata?: {
    [key: string]: any; // Datos adicionales
  };
  ipAddress?: string; // IP del usuario (simulado)
  userAgent?: string; // Navegador del usuario
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[]; // Cambios específicos (para updates)
  success: boolean; // Si la acción fue exitosa
  errorMessage?: string; // Mensaje de error si falló
}

// Almacenamiento en localStorage
const STORAGE_KEY = 'audit-logs';
const MAX_LOGS = 1000; // Máximo de logs a mantener

/**
 * Obtiene todos los logs de auditoría
 */
export function getAuditLogs(): AuditLog[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading audit logs:', error);
  }
  return [];
}

/**
 * Guarda los logs de auditoría
 */
function saveAuditLogs(logs: AuditLog[]): void {
  try {
    // Mantener solo los últimos MAX_LOGS
    const trimmedLogs = logs.slice(-MAX_LOGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedLogs));
  } catch (error) {
    console.error('Error saving audit logs:', error);
  }
}

/**
 * Genera un ID único para el log
 */
function generateLogId(): string {
  return `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Obtiene categoría según la acción
 */
function getCategoryFromAction(action: AuditAction): AuditCategory {
  if (action.startsWith('auth.')) return 'authentication';
  if (action.startsWith('user.')) return 'user_management';
  if (action.startsWith('file.')) return 'file_management';
  if (action.startsWith('dashboard.')) return 'reports';
  if (action.startsWith('ficha.') || action.startsWith('materia.') || action.startsWith('grade.')) {
    return 'academic_data';
  }
  if (action.startsWith('report.') || action.startsWith('reports.')) return 'reports';
  if (action.startsWith('notifications.')) return 'system';
  if (action.startsWith('profile.')) return 'user_management';
  if (action.startsWith('password.')) return 'authentication';
  if (action.startsWith('security.')) return 'security';
  return 'system';
}

/**
 * Obtiene severidad por defecto según la acción
 */
function getDefaultSeverity(action: AuditAction): AuditSeverity {
  if (action.includes('failed') || action.includes('denied') || action.includes('unauthorized')) {
    return 'error';
  }
  if (action.includes('delete') || action.includes('suspicious')) {
    return 'warning';
  }
  if (action.includes('critical') || action.startsWith('security.')) {
    return 'critical';
  }
  return 'info';
}

/**
 * Simula obtención de IP (en producción vendría del servidor)
 */
function getClientIP(): string {
  // En producción esto vendría del backend
  return '192.168.1.' + Math.floor(Math.random() * 255);
}

/**
 * Obtiene información del navegador
 */
function getUserAgent(): string {
  return navigator.userAgent;
}

/**
 * Crea un nuevo log de auditoría
 */
export function createAuditLog(params: {
  action: AuditAction;
  userId: string;
  userName: string;
  userRole: string;
  description: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  metadata?: any;
  changes?: { field: string; oldValue: any; newValue: any }[];
  success?: boolean;
  errorMessage?: string;
  severity?: AuditSeverity;
}): AuditLog {
  const log: AuditLog = {
    id: generateLogId(),
    timestamp: new Date().toISOString(),
    action: params.action,
    category: getCategoryFromAction(params.action),
    severity: params.severity || getDefaultSeverity(params.action),
    userId: params.userId,
    userName: params.userName,
    userRole: params.userRole,
    description: params.description,
    targetType: params.targetType,
    targetId: params.targetId,
    targetName: params.targetName,
    metadata: params.metadata,
    ipAddress: getClientIP(),
    userAgent: getUserAgent(),
    changes: params.changes,
    success: params.success !== undefined ? params.success : true,
    errorMessage: params.errorMessage
  };

  // Guardar el log
  const logs = getAuditLogs();
  logs.push(log);
  saveAuditLogs(logs);

  // Log en consola en desarrollo
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      console.log('🔍 AUDIT LOG:', log);
    }
  } catch (e) {
    // Silently fail if import.meta is not available
  }

  return log;
}

/**
 * Busca logs por filtros
 */
export function searchAuditLogs(filters: {
  userId?: string;
  action?: AuditAction;
  category?: AuditCategory;
  severity?: AuditSeverity;
  startDate?: Date;
  endDate?: Date;
  searchText?: string;
  success?: boolean;
}): AuditLog[] {
  let logs = getAuditLogs();

  if (filters.userId) {
    logs = logs.filter(log => log.userId === filters.userId);
  }

  if (filters.action) {
    logs = logs.filter(log => log.action === filters.action);
  }

  if (filters.category) {
    logs = logs.filter(log => log.category === filters.category);
  }

  if (filters.severity) {
    logs = logs.filter(log => log.severity === filters.severity);
  }

  if (filters.startDate) {
    logs = logs.filter(log => new Date(log.timestamp) >= filters.startDate!);
  }

  if (filters.endDate) {
    logs = logs.filter(log => new Date(log.timestamp) <= filters.endDate!);
  }

  if (filters.success !== undefined) {
    logs = logs.filter(log => log.success === filters.success);
  }

  if (filters.searchText) {
    const text = filters.searchText.toLowerCase();
    logs = logs.filter(log =>
      log.description.toLowerCase().includes(text) ||
      log.userName.toLowerCase().includes(text) ||
      log.targetName?.toLowerCase().includes(text)
    );
  }

  return logs.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Obtiene estadísticas de auditoría
 */
export function getAuditStatistics(period: 'today' | 'week' | 'month' | 'all' = 'all'): {
  totalLogs: number;
  byCategory: Record<AuditCategory, number>;
  bySeverity: Record<AuditSeverity, number>;
  failedActions: number;
  uniqueUsers: number;
  topUsers: { userId: string; userName: string; count: number }[];
  recentCritical: AuditLog[];
} {
  let logs = getAuditLogs();
  
  // Filtrar por periodo
  const now = new Date();
  if (period !== 'all') {
    const startDate = new Date();
    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    }
    logs = logs.filter(log => new Date(log.timestamp) >= startDate);
  }

  // Contar por categoría
  const byCategory: Record<AuditCategory, number> = {
    authentication: 0,
    user_management: 0,
    file_management: 0,
    academic_data: 0,
    reports: 0,
    security: 0,
    system: 0
  };
  logs.forEach(log => byCategory[log.category]++);

  // Contar por severidad
  const bySeverity: Record<AuditSeverity, number> = {
    info: 0,
    warning: 0,
    error: 0,
    critical: 0
  };
  logs.forEach(log => bySeverity[log.severity]++);

  // Acciones fallidas
  const failedActions = logs.filter(log => !log.success).length;

  // Usuarios únicos
  const uniqueUserIds = new Set(logs.map(log => log.userId));
  const uniqueUsers = uniqueUserIds.size;

  // Top usuarios
  const userCounts = new Map<string, { userName: string; count: number }>();
  logs.forEach(log => {
    const current = userCounts.get(log.userId) || { userName: log.userName, count: 0 };
    current.count++;
    userCounts.set(log.userId, current);
  });
  const topUsers = Array.from(userCounts.entries())
    .map(([userId, data]) => ({ userId, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Logs críticos recientes
  const recentCritical = logs
    .filter(log => log.severity === 'critical')
    .slice(0, 10);

  return {
    totalLogs: logs.length,
    byCategory,
    bySeverity,
    failedActions,
    uniqueUsers,
    topUsers,
    recentCritical
  };
}

/**
 * Exporta logs a JSON
 */
export function exportAuditLogs(filters?: Parameters<typeof searchAuditLogs>[0]): string {
  const logs = filters ? searchAuditLogs(filters) : getAuditLogs();
  return JSON.stringify(logs, null, 2);
}

/**
 * Limpia logs antiguos (mantiene los últimos N días)
 */
export function cleanOldLogs(daysToKeep: number = 90): number {
  const logs = getAuditLogs();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const filteredLogs = logs.filter(log => 
    new Date(log.timestamp) >= cutoffDate
  );
  
  const removed = logs.length - filteredLogs.length;
  saveAuditLogs(filteredLogs);
  
  return removed;
}

/**
 * Limpia todos los logs (usar con precaución)
 */
export function clearAllLogs(): void {
  localStorage.removeItem(STORAGE_KEY);
}
