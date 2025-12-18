import { 
  registerStudentAbsence, 
  generateNotificationMessage,
  getStudentAbsenceDetails,
  NotificationLevel 
} from './notificationHelper';

/**
 * Procesa las tareas no entregadas y genera notificaciones apropiadas
 */
export function processAbsencesAndNotify(
  estudiantes: Array<{
    cedula: string; // Documento único (puede ser correo)
    nombre: string;
    apellido: string;
    email?: string;
    evidencias: Array<{
      nombre: string;
      calificacion?: string;
      fechaLimite?: string;
    }>;
  }>,
  materia: string,
  addNotification: (notification: any) => void
) {
  const now = new Date();
  const notificationsToSend: Array<{
    type: string;
    student: any;
    level: NotificationLevel;
    count: number;
  }> = [];

  // Procesar cada estudiante
  estudiantes.forEach(estudiante => {
    estudiante.evidencias.forEach(evidencia => {
      // Detectar tarea no entregada ("-")
      if (evidencia.calificacion === '-') {
        // Verificar si la fecha límite ya pasó
        let fechaLimitePasada = true;
        if (evidencia.fechaLimite) {
          const fechaLimite = new Date(evidencia.fechaLimite);
          fechaLimitePasada = now > fechaLimite;
        }

        // Solo notificar si la fecha límite pasó
        if (fechaLimitePasada) {
          const result = registerStudentAbsence(
            estudiante.cedula,
            estudiante.nombre,
            estudiante.apellido,
            materia,
            evidencia.nombre,
            estudiante.email
          );

          // Si debe notificar, agregar a la cola
          if (result.shouldNotify && result.level) {
            notificationsToSend.push({
              type: 'absence',
              student: estudiante,
              level: result.level,
              count: result.newCount
            });
          }
        }
      }
    });
  });

  // Enviar notificaciones
  notificationsToSend.forEach(({ student, level, count }) => {
    const studentDetails = getStudentAbsenceDetails(student.cedula);
    
    if (!studentDetails) return;

    const message = generateNotificationMessage(studentDetails, level);

    if (level === 'warning_3') {
      // 3 faltas: Notificar a DOCENTE y ESTUDIANTE
      
      // Notificación para el docente
      addNotification({
        tipo: 'warning',
        titulo: `⚠️ Alerta de Ausentismo - ${student.nombre} ${student.apellido}`,
        mensaje: `El estudiante acumula 3 tareas no entregadas en ${materia}. Se recomienda contactarlo.`,
        importante: true,
        accion: {
          label: 'Ver Detalles',
          url: '/carga-archivos'
        },
        metadatos: {
          estudiante: `${student.nombre} ${student.apellido}`,
          cedula: student.cedula,
          materia: materia,
          tipo: 'ausentismo',
          nivel: 'warning_3',
          faltas: count.toString()
        }
      });

      // Notificación simulada para el estudiante (en producción iría por email)
      console.log(`📧 Email a estudiante ${student.email || student.cedula}:`, {
        asunto: 'Alerta: Tareas Pendientes',
        mensaje: `Hola ${student.nombre}, tienes 3 tareas sin entregar en ${materia}. Por favor comunícate con tu docente.`
      });

    } else if (level === 'critical_5') {
      // 5 faltas: Notificar a COORDINADOR y ESTUDIANTE
      
      // Notificación para el coordinador
      addNotification({
        tipo: 'error',
        titulo: `🚨 CRÍTICO: Ausentismo Alto - ${student.nombre} ${student.apellido}`,
        mensaje: `El estudiante acumula 5 tareas no entregadas en ${materia}. Requiere intervención urgente.`,
        importante: true,
        accion: {
          label: 'Intervenir Ahora',
          url: '/carga-archivos'
        },
        metadatos: {
          estudiante: `${student.nombre} ${student.apellido}`,
          cedula: student.cedula,
          materia: materia,
          tipo: 'ausentismo_critico',
          nivel: 'critical_5',
          faltas: count.toString()
        }
      });

      // Notificación simulada para el estudiante (email urgente)
      console.log(`📧 Email URGENTE a estudiante ${student.email || student.cedula}:`, {
        asunto: '🚨 URGENTE: Situación Académica Crítica',
        mensaje: `Hola ${student.nombre}, tienes 5 tareas sin entregar en ${materia}. Tu situación académica es crítica. El coordinador será notificado. Por favor contacta urgentemente a tu docente o coordinador.`
      });
    }
  });

  return notificationsToSend.length;
}

/**
 * Genera notificación de carga exitosa
 */
export function notifySuccessfulUpload(
  materia: string,
  totalRegistros: number,
  evidenciasActualizadas: number,
  addNotification: (notification: any) => void
) {
  addNotification({
    tipo: 'success',
    titulo: '✅ Carga Exitosa',
    mensaje: `Se cargaron ${totalRegistros} registros y ${evidenciasActualizadas} calificaciones para "${materia}"`,
    importante: false,
    accion: {
      label: 'Ver Reporte',
      url: '/reportes'
    },
    metadatos: {
      materia: materia,
      registros: totalRegistros.toString(),
      evidencias: evidenciasActualizadas.toString(),
      tipo: 'carga_exitosa'
    }
  });
}

/**
 * Genera notificación de error en carga
 */
export function notifyFailedUpload(
  archivo: string,
  errorMensaje: string,
  errores: number,
  addNotification: (notification: any) => void
) {
  addNotification({
    tipo: 'error',
    titulo: '❌ Error en Carga de Archivo',
    mensaje: `El archivo "${archivo}" tiene ${errores} error(es): ${errorMensaje}`,
    importante: true,
    accion: {
      label: 'Revisar Archivo',
      url: '/carga-archivos'
    },
    metadatos: {
      archivo: archivo,
      errores: errores.toString(),
      tipo: 'error_carga'
    }
  });
}

/**
 * Genera notificación de advertencias
 */
export function notifyUploadWarnings(
  archivo: string,
  advertencias: number,
  mensaje: string,
  addNotification: (notification: any) => void
) {
  addNotification({
    tipo: 'warning',
    titulo: '⚠️ Advertencias en Carga',
    mensaje: `El archivo "${archivo}" generó ${advertencias} advertencia(s): ${mensaje}`,
    importante: false,
    accion: {
      label: 'Ver Detalles',
      url: '/carga-archivos'
    },
    metadatos: {
      archivo: archivo,
      advertencias: advertencias.toString(),
      tipo: 'advertencia_carga'
    }
  });
}

/**
 * Resumen de todas las tareas no entregadas en una carga
 */
export function notifyAbsenceSummary(
  materia: string,
  totalNoEntregadas: number,
  estudiantesAfectados: number,
  addNotification: (notification: any) => void
) {
  if (totalNoEntregadas === 0) return;

  addNotification({
    tipo: 'warning',
    titulo: `📋 Resumen de Tareas No Entregadas`,
    mensaje: `En ${materia}: ${estudiantesAfectados} estudiante(s) con ${totalNoEntregadas} tarea(s) sin entregar`,
    importante: totalNoEntregadas > 5,
    accion: {
      label: 'Ver Detalle',
      url: '/reportes'
    },
    metadatos: {
      materia: materia,
      noEntregadas: totalNoEntregadas.toString(),
      estudiantes: estudiantesAfectados.toString(),
      tipo: 'resumen_ausencias'
    }
  });
}
