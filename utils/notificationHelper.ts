/**
 * Helper para gestionar notificaciones de tareas no entregadas
 * con sistema de alertas escalonadas
 */

// Interfaz para contador de faltas por estudiante
export interface StudentAbsence {
  cedula: string;
  nombre: string;
  apellido: string;
  email?: string;
  faltas: number; // Conteo de tareas no entregadas
  ultimaActualizacion: string; // ISO date
  materias: {
    [materiaNombre: string]: {
      tareas: string[]; // Nombres de tareas no entregadas
      faltas: number;
    };
  };
}

// Tipo de notificación a enviar
export type NotificationLevel = 'warning_3' | 'critical_5';

// Almacenamiento en localStorage
const STORAGE_KEY = 'student-absences';

/**
 * Obtiene el registro de faltas desde localStorage
 */
export function getStudentAbsences(): Map<string, StudentAbsence> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return new Map(Object.entries(data));
    }
  } catch (error) {
    console.error('Error loading student absences:', error);
  }
  return new Map();
}

/**
 * Guarda el registro de faltas en localStorage
 */
export function saveStudentAbsences(absences: Map<string, StudentAbsence>): void {
  try {
    const obj = Object.fromEntries(absences);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch (error) {
    console.error('Error saving student absences:', error);
  }
}

/**
 * Registra faltas para un estudiante y retorna si debe notificar
 */
export function registerStudentAbsence(
  cedula: string,
  nombre: string,
  apellido: string,
  materia: string,
  tarea: string,
  email?: string
): { shouldNotify: boolean; level?: NotificationLevel; previousCount: number; newCount: number } {
  const absences = getStudentAbsences();
  
  let studentRecord = absences.get(cedula);
  
  if (!studentRecord) {
    // Crear nuevo registro
    studentRecord = {
      cedula,
      nombre,
      apellido,
      email,
      faltas: 0,
      ultimaActualizacion: new Date().toISOString(),
      materias: {}
    };
  }

  // Actualizar registro de materia
  if (!studentRecord.materias[materia]) {
    studentRecord.materias[materia] = {
      tareas: [],
      faltas: 0
    };
  }

  // Si la tarea ya está registrada, no incrementar
  if (studentRecord.materias[materia].tareas.includes(tarea)) {
    return {
      shouldNotify: false,
      previousCount: studentRecord.faltas,
      newCount: studentRecord.faltas
    };
  }

  const previousCount = studentRecord.faltas;

  // Agregar tarea a la lista
  studentRecord.materias[materia].tareas.push(tarea);
  studentRecord.materias[materia].faltas++;
  studentRecord.faltas++;
  studentRecord.ultimaActualizacion = new Date().toISOString();

  // Guardar cambios
  absences.set(cedula, studentRecord);
  saveStudentAbsences(absences);

  const newCount = studentRecord.faltas;

  // Determinar si debe notificar
  let shouldNotify = false;
  let level: NotificationLevel | undefined;

  // Notificar en 3ra falta (docente + estudiante)
  if (newCount === 3 && previousCount < 3) {
    shouldNotify = true;
    level = 'warning_3';
  }
  
  // Notificar en 5ta falta (coordinador + estudiante)
  else if (newCount === 5 && previousCount < 5) {
    shouldNotify = true;
    level = 'critical_5';
  }

  return {
    shouldNotify,
    level,
    previousCount,
    newCount
  };
}

/**
 * Obtiene el conteo de faltas de un estudiante
 */
export function getStudentAbsenceCount(cedula: string): number {
  const absences = getStudentAbsences();
  const student = absences.get(cedula);
  return student?.faltas || 0;
}

/**
 * Obtiene detalles completos de un estudiante
 */
export function getStudentAbsenceDetails(cedula: string): StudentAbsence | null {
  const absences = getStudentAbsences();
  return absences.get(cedula) || null;
}

/**
 * Limpia el registro de un estudiante (cuando aprueba o reseteo manual)
 */
export function clearStudentAbsences(cedula: string): void {
  const absences = getStudentAbsences();
  absences.delete(cedula);
  saveStudentAbsences(absences);
}

/**
 * Obtiene lista de estudiantes con más de N faltas
 */
export function getStudentsWithAbsencesAbove(threshold: number): StudentAbsence[] {
  const absences = getStudentAbsences();
  return Array.from(absences.values())
    .filter(student => student.faltas >= threshold)
    .sort((a, b) => b.faltas - a.faltas);
}

/**
 * Genera mensaje detallado para notificación
 */
export function generateNotificationMessage(
  student: StudentAbsence,
  level: NotificationLevel
): string {
  const { nombre, apellido, faltas } = student;
  
  if (level === 'warning_3') {
    return `${nombre} ${apellido} acumula ${faltas} tareas no entregadas. Se requiere atención del docente.`;
  } else if (level === 'critical_5') {
    return `${nombre} ${apellido} acumula ${faltas} tareas no entregadas. Situación crítica que requiere intervención del coordinador.`;
  }
  
  return `${nombre} ${apellido} tiene ${faltas} tareas sin entregar.`;
}

/**
 * Obtiene estadísticas generales de faltas
 */
export function getAbsenceStatistics(): {
  totalStudentsWithAbsences: number;
  studentsWithWarning: number; // >= 3
  studentsWithCritical: number; // >= 5
  totalAbsences: number;
} {
  const absences = getStudentAbsences();
  const students = Array.from(absences.values());
  
  return {
    totalStudentsWithAbsences: students.length,
    studentsWithWarning: students.filter(s => s.faltas >= 3 && s.faltas < 5).length,
    studentsWithCritical: students.filter(s => s.faltas >= 5).length,
    totalAbsences: students.reduce((sum, s) => sum + s.faltas, 0)
  };
}
