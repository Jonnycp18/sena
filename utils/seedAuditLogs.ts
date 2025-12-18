/**
 * Genera logs de auditoría de ejemplo para demostración
 */

import { createAuditLog } from './auditLogger';

export function seedAuditLogs() {
  // Verificar si ya hay logs
  const existing = localStorage.getItem('audit-logs');
  if (existing && JSON.parse(existing).length > 0) {
    return; // Ya hay logs, no generar más
  }

  console.log('🌱 Generando logs de auditoría de ejemplo...');

  const now = new Date();
  const users = [
    { id: '1', nombre: 'Juan Pérez', rol: 'administrador' },
    { id: '2', nombre: 'María García', rol: 'coordinador' },
    { id: '3', nombre: 'Carlos Rodríguez', rol: 'docente' }
  ];

  // Logins exitosos
  createAuditLog({
    action: 'auth.login.success',
    userId: '1',
    userName: 'Juan Pérez',
    userRole: 'administrador',
    description: 'Inicio de sesión exitoso para admin@instituto.edu',
    success: true
  });

  createAuditLog({
    action: 'auth.login.success',
    userId: '2',
    userName: 'María García',
    userRole: 'coordinador',
    description: 'Inicio de sesión exitoso para coordinador@instituto.edu',
    success: true
  });

  // Login fallido
  createAuditLog({
    action: 'auth.login.failed',
    userId: 'anonymous',
    userName: 'Usuario Anónimo',
    userRole: 'guest',
    description: 'Intento fallido de inicio de sesión para hacker@malicious.com',
    success: false,
    errorMessage: 'Credenciales inválidas',
    severity: 'warning',
    metadata: { email: 'hacker@malicious.com' }
  });

  // Creación de usuario
  createAuditLog({
    action: 'user.create',
    userId: '1',
    userName: 'Juan Pérez',
    userRole: 'administrador',
    description: 'Nuevo usuario creado: Ana Martínez',
    targetType: 'user',
    targetId: '4',
    targetName: 'Ana Martínez',
    success: true,
    metadata: {
      email: 'ana@instituto.edu',
      rol: 'docente',
      departamento: 'Matemáticas'
    }
  });

  // Actualización de usuario
  createAuditLog({
    action: 'user.update',
    userId: '1',
    userName: 'Juan Pérez',
    userRole: 'administrador',
    description: 'Actualización de información del usuario Carlos Rodríguez',
    targetType: 'user',
    targetId: '3',
    targetName: 'Carlos Rodríguez',
    changes: [
      { field: 'telefono', oldValue: '+57 302 456 7890', newValue: '+57 302 999 8888' },
      { field: 'departamento', oldValue: 'Ciencias de la Computación', newValue: 'Ingeniería de Software' }
    ],
    success: true
  });

  // Cambio de rol (crítico)
  createAuditLog({
    action: 'user.role_change',
    userId: '1',
    userName: 'Juan Pérez',
    userRole: 'administrador',
    description: 'Cambio de rol para usuario María García',
    targetType: 'user',
    targetId: '2',
    targetName: 'María García',
    changes: [
      { field: 'rol', oldValue: 'docente', newValue: 'coordinador' }
    ],
    success: true,
    severity: 'warning'
  });

  // Carga de archivo exitosa
  createAuditLog({
    action: 'file.upload',
    userId: '3',
    userName: 'Carlos Rodríguez',
    userRole: 'docente',
    description: 'Archivo de calificaciones cargado exitosamente: calificaciones_mayo.xlsx',
    targetType: 'file',
    targetName: 'calificaciones_mayo.xlsx',
    success: true,
    metadata: {
      materia: 'Fundamentos de Programación',
      registros: 55,
      evidencias: 8
    }
  });

  // Guardado de calificaciones
  createAuditLog({
    action: 'grade.bulk_update',
    userId: '3',
    userName: 'Carlos Rodríguez',
    userRole: 'docente',
    description: 'Guardado masivo de 55 calificaciones para Fundamentos de Programación',
    targetType: 'grades',
    success: true,
    metadata: {
      materia: 'Fundamentos de Programación',
      totalRegistros: 55,
      calificadas: 42,
      noEntregadas: 8
    }
  });

  // Error en validación de archivo
  createAuditLog({
    action: 'file.validate',
    userId: '3',
    userName: 'Carlos Rodríguez',
    userRole: 'docente',
    description: 'Error en validación de archivo: datos_incorrectos.xlsx',
    targetType: 'file',
    targetName: 'datos_incorrectos.xlsx',
    success: false,
    errorMessage: 'Formato de archivo inválido: faltan columnas requeridas',
    severity: 'error',
    metadata: {
      erroresEncontrados: 5,
      filasAfectadas: [2, 5, 8, 12, 15]
    }
  });

  // Creación de ficha
  createAuditLog({
    action: 'ficha.create',
    userId: '2',
    userName: 'María García',
    userRole: 'coordinador',
    description: 'Nueva ficha académica creada: ADSO-2024-1',
    targetType: 'ficha',
    targetId: 'ficha-001',
    targetName: 'ADSO-2024-1',
    success: true,
    metadata: {
      programa: 'Análisis y Desarrollo de Software',
      jornada: 'Diurna',
      estudiantes: 30
    }
  });

  // Generación de reporte
  createAuditLog({
    action: 'report.generate',
    userId: '2',
    userName: 'María García',
    userRole: 'coordinador',
    description: 'Generación de reporte mensual de desempeño académico',
    targetType: 'report',
    success: true,
    metadata: {
      periodo: 'Mayo 2024',
      fichas: 5,
      estudiantes: 150
    }
  });

  // Exportación de datos
  createAuditLog({
    action: 'file.export',
    userId: '1',
    userName: 'Juan Pérez',
    userRole: 'administrador',
    description: 'Exportación de datos de usuarios a Excel',
    targetType: 'export',
    success: true,
    severity: 'warning',
    metadata: {
      formato: 'Excel',
      registros: 50,
      columnas: ['nombre', 'email', 'rol', 'estado']
    }
  });

  // Acceso denegado (seguridad)
  createAuditLog({
    action: 'security.access_denied',
    userId: '3',
    userName: 'Carlos Rodríguez',
    userRole: 'docente',
    description: 'Intento de acceso denegado a sección de gestión de usuarios',
    success: false,
    severity: 'warning',
    metadata: {
      seccionSolicitada: '/usuarios',
      rolRequerido: 'administrador',
      rolActual: 'docente'
    }
  });

  // Actividad sospechosa (crítico)
  createAuditLog({
    action: 'security.suspicious_activity',
    userId: 'unknown',
    userName: 'IP Desconocida',
    userRole: 'guest',
    description: 'Múltiples intentos fallidos de inicio de sesión desde IP sospechosa',
    success: false,
    severity: 'critical',
    metadata: {
      intentos: 10,
      periodo: '5 minutos',
      ipAddress: '192.168.1.999'
    }
  });

  // Cambio de contraseña
  createAuditLog({
    action: 'auth.password_change',
    userId: '2',
    userName: 'María García',
    userRole: 'coordinador',
    description: 'Cambio de contraseña realizado exitosamente',
    success: true,
    severity: 'info'
  });

  // Eliminación de materia
  createAuditLog({
    action: 'materia.delete',
    userId: '1',
    userName: 'Juan Pérez',
    userRole: 'administrador',
    description: 'Materia eliminada: Matemáticas Discretas',
    targetType: 'materia',
    targetId: 'mat-005',
    targetName: 'Matemáticas Discretas',
    success: true,
    severity: 'warning',
    metadata: {
      estudiantesAfectados: 25,
      razon: 'Materia descontinuada'
    }
  });

  // Backup del sistema
  createAuditLog({
    action: 'system.backup',
    userId: 'system',
    userName: 'Sistema Automático',
    userRole: 'system',
    description: 'Backup automático del sistema ejecutado',
    success: true,
    metadata: {
      size: '250 MB',
      duracion: '45 segundos',
      tablas: ['usuarios', 'fichas', 'materias', 'calificaciones']
    }
  });

  console.log('✅ Logs de auditoría de ejemplo generados correctamente');
}
