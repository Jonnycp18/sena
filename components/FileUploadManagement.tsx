import { useState, useCallback, useRef, useEffect } from 'react';
import { api, docenteApi, evidenciasWideApi, evidenciasWideHistoryApi, uploadEvidenciaColumna, triggerAbsenceEmails } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { useAuditLog } from '../hooks/useAuditLog';
import { 
  processAbsencesAndNotify,
  notifySuccessfulUpload,
  notifyFailedUpload,
  notifyUploadWarnings,
  notifyAbsenceSummary
} from '../utils/uploadNotifications';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { 
  Upload, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Download,
  Eye,
  Save,
  RefreshCw,
  MoreHorizontal,
  Trash2,
  Calendar,
  Clock,
  FileText,
  AlertCircle,
  Settings
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { ScrollArea } from './ui/scroll-area';
import * as XLSX from 'xlsx';
import { toast } from 'sonner@2.0.3';
import { format } from 'date-fns';

// ==================== WORKER PARSE EXCEL (NO BLOQUEO UI) ====================
// Se instancia bajo demanda para evitar cargarlo si no se suben archivos.
let excelWorkerFactory: (() => Worker) | null = null;
function getExcelWorker(): Worker {
  if (!excelWorkerFactory) {
    excelWorkerFactory = () => new Worker(new URL('../utils/excelWorker.ts', import.meta.url), { type: 'module' });
  }
  return excelWorkerFactory();
}

// ==================== INTERFACES ====================

// Tipos de carga
type UploadType = 'configuracion' | 'actualizacion';

// Estados de evidencias/tareas
type EvidenceStatus = 'no_configurada' | 'pendiente' | 'calificada' | 'no_entregada';

// Interfaz para una evidencia/tarea individual
interface Evidence {
  nombre: string; // Nombre de la columna (ej: "Evidencia 1", "Taller 2")
  estado: EvidenceStatus;
  calificacion?: string; // Puede ser "A" (aprobó), "D" (desaprobó), "-" (no entregó), o vacío
  fechaLimite?: string; // ISO string
}

// Interfaz para un estudiante con todas sus evidencias
interface StudentData {
  fila: number;
  cedula: string;
  nombre: string;
  apellido: string;
  email?: string;
  evidencias: Evidence[];
  estado: 'valido' | 'error' | 'advertencia';
  errores: string[];
  advertencias: string[];
}

// Interfaz para archivo cargado
interface UploadedFile {
  id: string;
  nombre: string;
  archivo: File;
  fechaSubida: string;
  tipoSubida: UploadType;
  estado: 'procesando' | 'validado' | 'error' | 'guardado';
  filasProcesadas: number;
  totalFilas: number;
  totalEvidencias: number;
  evidenciasPendientes: number;
  evidenciasCalificadas: number;
  evidenciasNoEntregadas: number; // Nueva métrica
  errores: ValidationError[];
  datos?: StudentData[];
  materia?: string;
  ficha?: string;
  fechasLimite?: { [evidencia: string]: string }; // Mapeo de evidencia a fecha límite
  seleccionEvidenciasCount?: number; // Conteo de evidencias seleccionadas para guardar
  seleccionEvidenciasNames?: string[]; // Nombres de evidencias seleccionadas
}

// Interfaz para errores de validación
interface ValidationError {
  fila: number;
  campo: string;
  valor: any;
  error: string;
  tipo: 'error' | 'advertencia';
}

// Interfaz para mapeo de columnas
interface ColumnMapping {
  cedula: string;
  nombre: string;
  apellido: string;
  email?: string;
  evidencias: string[]; // Array de nombres de columnas que son evidencias
}

// Historial de cargas
interface LoadHistory {
  id: string;
  fecha: string;
  tipoSubida: UploadType;
  archivo: string;
  materia: string;
  evidenciasActualizadas: number;
  registros: number;
  fichaNumero?: string;
  fichaId?: number | string;
  modo?: 'single-column' | 'wide';
  evidenciaNombre?: string;
}

// ==================== DATOS MOCK ====================

const mockMaterias = [
  { id: '1', nombre: 'Fundamentos de Programación', codigo: 'FP-101' },
  { id: '2', nombre: 'Bases de Datos', codigo: 'BD-201' },
  { id: '3', nombre: 'Desarrollo Web', codigo: 'DW-301' },
];

// Eliminado: mockEstudiantes. Las filas del Excel son la fuente de verdad.

// ==================== COMPONENTE PRINCIPAL ====================

export function FileUploadManagement() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { log } = useAuditLog();
  
  // Estados principales
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [currentFile, setCurrentFile] = useState<UploadedFile | null>(null);
  const [uploadType, setUploadType] = useState<UploadType>('configuracion');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [backendResult, setBackendResult] = useState<any | null>(null);
  
  // Estados para mapeo y configuración
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    cedula: '',
    nombre: '',
    apellido: '',
    email: '',
    evidencias: []
  });
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [selectedMateria, setSelectedMateria] = useState<string>('');
  const [selectedFicha, setSelectedFicha] = useState<string>('');
  const [materias, setMaterias] = useState<{ id: string; nombre: string; codigo: string }[]>([]);
  // Evidencias manuales (selección una a una)
  const [selectedEvidencias, setSelectedEvidencias] = useState<string[]>([]);
  const [evidenciaPreviewRows, setEvidenciaPreviewRows] = useState<Array<{ estudiante: string; documento: string; correo?: string; valor: string }>>([]);
  const [evidenciaSummary, setEvidenciaSummary] = useState<{ total: number; A: number; D: number; pendientes: number; noEntregadas: number }>({ total: 0, A: 0, D: 0, pendientes: 0, noEntregadas: 0 });
  const [expandedPreview, setExpandedPreview] = useState(false);
  const [multiPreview, setMultiPreview] = useState<Record<string, Array<{ estudiante: string; documento: string; correo?: string; valor: string }>>>({});
  const [multiSummary, setMultiSummary] = useState<Record<string, { total: number; A: number; D: number; pendientes: number; noEntregadas: number }>>({});
  const [selectionTotals, setSelectionTotals] = useState<{ total: number; A: number; D: number; pendientes: number; noEntregadas: number } | null>(null);
  
  // Estados para fechas de entrega
  const [evidenceDates, setEvidenceDates] = useState<{ [key: string]: string }>({});
  const [showDateConfig, setShowDateConfig] = useState(false);
  
  // Estados para vista de detalles
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedFileDetails, setSelectedFileDetails] = useState<UploadedFile | null>(null);
  const [showEvidenceDialog, setShowEvidenceDialog] = useState(false);
  // Evidencias ya guardadas en backend (por nombre), para badges/contador
  const [savedEvidences, setSavedEvidences] = useState<string[]>([]);
  const [pendingEvidenceSaves, setPendingEvidenceSaves] = useState<string[]>([]);
    // Calcula métricas por archivo basadas exclusivamente en la selección
    const getSelectionMetricsForFile = (file: UploadedFile) => {
      if (!file || !file.datos || !Array.isArray(file.seleccionEvidenciasNames) || file.seleccionEvidenciasNames.length === 0) {
        return null;
      }
      let A = 0, D = 0, pendientes = 0, noEntregadas = 0, total = 0;
      for (const est of file.datos) {
        for (const ev of est.evidencias) {
          if (!file.seleccionEvidenciasNames!.includes(ev.nombre)) continue;
          total++;
          const v = String(ev.calificacion || '').trim().toUpperCase();
          if (v === 'A') A++; else if (v === 'D') D++; else if (v === '-') noEntregadas++; else pendientes++;
        }
      }
      return { A, D, pendientes, noEntregadas, total };
    };
  
  // Historial de cargas
  const [loadHistory, setLoadHistory] = useState<LoadHistory[]>([]);
  // Cargar historial persistente (audit_logs) al montar
  useEffect(() => {
    (async () => {
      try {
        // Primero, cargar historial local (persistente en localStorage)
        try {
          const raw = localStorage.getItem('load_history_v1');
          const localItems: LoadHistory[] = raw ? JSON.parse(raw) : [];
          if (Array.isArray(localItems) && localItems.length > 0) {
            setLoadHistory(prev => {
              const existing = new Set(prev.map(p => p.id));
              const merged = [...localItems.filter(m => !existing.has(m.id)), ...prev];
              return merged.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
            });
          }
        } catch {}
        const res = await evidenciasWideHistoryApi.getEvidenciasWideUploadsHistory(50);
        if (res.success) {
          const mapped: LoadHistory[] = res.data.map((h: any) => ({
            id: String(h.id),
            fecha: h.fecha ? new Date(h.fecha).toISOString() : new Date().toISOString(),
            // Si backend indica modo 'single-column', tratamos como 'actualizacion' (visualmente distinto)
            tipoSubida: (h.modo === 'single-column') ? 'actualizacion' : 'configuracion',
            archivo: 'Carga Evidencias',
            materia: '',
            evidenciasActualizadas: (h.counts?.A || 0) + (h.counts?.D || 0),
            registros: h.registros || h.counts?.tot_registros || 0,
            fichaNumero: h.fichaNumero || undefined,
            fichaId: h.fichaId || undefined,
            modo: h.modo || (h.evidenciaNombre ? 'single-column' : 'wide'),
            evidenciaNombre: h.evidenciaNombre || undefined,
          }));
          setLoadHistory(prev => {
            const existing = new Set(prev.map(p => p.id));
            const merged = [...mapped.filter(m => !existing.has(m.id)), ...prev];
            return merged.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
          });
        }
      } catch {/* silencioso */}
    })();
  }, []);

  // Persistir historial en localStorage ante cambios
  useEffect(() => {
    try {
      localStorage.setItem('load_history_v1', JSON.stringify(loadHistory));
    } catch {}
  }, [loadHistory]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar materias reales (fallback a mock si falla)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.getMaterias({ pageSize: 200 });
        const opts = (res.materias || []).map(m => ({ id: m.id, nombre: m.nombre, codigo: m.codigo }));
        if (mounted) setMaterias(opts);
      } catch (e) {
        if (mounted) setMaterias(mockMaterias);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ==================== VERIFICACIÓN DE PERMISOS ====================
  
  if (!user || (user.rol !== 'docente' && user.rol !== 'administrador')) {
    // 🔐 Registrar intento de acceso denegado
    log({
      action: 'security.access_denied',
      description: 'Intento de acceso denegado a Carga de Archivos',
      success: false,
      severity: 'warning',
      metadata: {
        seccionSolicitada: 'FileUploadManagement',
        rolRequerido: 'docente o administrador',
        rolActual: user?.rol || 'guest'
      }
    });

    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h3>Acceso Denegado</h3>
          <p className="text-muted-foreground">
            Solo los docentes y administradores pueden acceder a la carga de archivos.
          </p>
        </div>
      </div>
    );
  }

  // ==================== FUNCIONES DE DRAG & DROP ====================

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileSelection(files);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFileSelection(files);
  };

  // ==================== PROCESAMIENTO DE ARCHIVOS ====================

  const handleFileSelection = (files: File[]) => {
    const excelFiles = files.filter(file => 
      file.type.includes('spreadsheet') || 
      file.name.endsWith('.xlsx') || 
      file.name.endsWith('.xls')
    );

    if (excelFiles.length === 0) {
      // ⚠️ Registrar rechazo de archivos inválidos
      log({
        action: 'file.validation_failed',
        description: 'Archivos rechazados: formato no válido',
        success: false,
        severity: 'info',
        metadata: {
          archivosRechazados: files.length,
          archivosSeleccionados: files.map(f => f.name)
        }
      });

      toast.error('Por favor selecciona archivos Excel válidos (.xlsx, .xls)');
      return;
    }

    // ℹ️ Registrar inicio de selección
    log({
      action: 'file.selection',
      description: `${excelFiles.length} archivo(s) Excel seleccionado(s)`,
      success: true,
      metadata: {
        archivos: excelFiles.map(f => ({ nombre: f.name, tamaño: f.size })),
        tipoSubida: uploadType
      }
    });

    // Procesar secuencialmente para evitar picos de CPU y congelamientos
    (async () => {
      for (const f of excelFiles) {
        // eslint-disable-next-line no-await-in-loop
        await processFile(f);
      }
    })();
  };

  const processFile = async (file: File) => {
    const fileId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    const newFile: UploadedFile = {
      id: fileId,
      nombre: file.name,
      archivo: file,
      fechaSubida: new Date().toISOString(),
      tipoSubida: uploadType,
      estado: 'procesando',
      filasProcesadas: 0,
      totalFilas: 0,
      totalEvidencias: 0,
      evidenciasPendientes: 0,
      evidenciasCalificadas: 0,
      evidenciasNoEntregadas: 0,
      errores: [],
      ficha: ''
    };

    setUploadedFiles(prev => [...prev, newFile]);
    setIsProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      // Intentar parse en Web Worker (no bloquea UI); fallback síncrono
      let jsonData: any[] = [];
      try {
        const worker = getExcelWorker();
        jsonData = await new Promise<any[]>((resolve, reject) => {
          const timeout = setTimeout(() => {
            worker.terminate();
            reject(new Error('Timeout parseando Excel'));
          }, 30000);
          worker.onmessage = (ev) => {
            if (ev.data?.type === 'complete') {
              clearTimeout(timeout);
              resolve(ev.data.rows);
              worker.terminate();
            } else if (ev.data?.type === 'error') {
              clearTimeout(timeout);
              reject(new Error(ev.data.message || 'Error worker Excel'));
              worker.terminate();
            }
          };
          worker.postMessage({ buffer: arrayBuffer });
        });
      } catch (workerErr) {
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });
      }

      if (jsonData.length < 2) {
        throw new Error('El archivo debe tener al menos una fila de encabezados y una fila de datos');
      }

  const headers = jsonData[0] as string[];
  const dataRows = jsonData.slice(1) as any[][];

      // Filtrar encabezados vacíos y columnas automáticas no relevantes (p.ej. exportadas por LMS)
      const denyList = [
        'nombre de usuario',
        'última descarga de este curso',
        'ultima descarga de este curso'
      ];
      const cleanedHeaders = headers.filter(h => {
        const s = String(h || '').trim();
        if (!s) return false;
        const sLower = s.toLowerCase();
        return !denyList.some(d => sLower.startsWith(d));
      });
      setAvailableColumns(cleanedHeaders);
      setPreviewData(dataRows.slice(0, 5));
      
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { 
              ...f, 
              estado: 'validado',
              totalFilas: dataRows.length,
              filasProcesadas: 0 
            }
          : f
      ));

      setCurrentFile(newFile);
      
      // Auto-detectar mapeo de columnas usando encabezados limpios
      detectColumnMapping(cleanedHeaders);
      
      setShowMappingDialog(true);

      // ✅ Registrar procesamiento exitoso
      log({
        action: 'file.process_success',
        description: `Archivo procesado exitosamente: ${file.name}`,
        targetType: 'file',
        targetId: fileId,
        targetName: file.name,
        metadata: {
          totalFilas: dataRows.length,
          columnas: headers.length,
          tamaño: file.size,
          tipoSubida: uploadType
        },
        success: true
      });
      
    } catch (error) {
      console.error('Error procesando archivo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { 
              ...f, 
              estado: 'error',
              errores: [{ 
                fila: 0, 
                campo: 'archivo', 
                valor: file.name, 
                error: errorMessage,
                tipo: 'error' 
              }]
            }
          : f
      ));
      
      toast.error(`Error al procesar ${file.name}: ${errorMessage}`);
      
      // Notificación de error
      notifyFailedUpload(
        file.name,
        errorMessage,
        1,
        addNotification
      );

      // ❌ Registrar error de procesamiento
      log({
        action: 'file.process_error',
        description: `Error al procesar archivo: ${file.name}`,
        targetType: 'file',
        targetId: fileId,
        targetName: file.name,
        success: false,
        errorMessage,
        severity: 'error',
        metadata: {
          tamaño: file.size,
          tipoSubida: uploadType
        }
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // (El upload al backend se realiza al guardar, no al seleccionar)

  // ==================== DETECCIÓN AUTOMÁTICA DE COLUMNAS ====================

  const detectColumnMapping = (columns: string[]) => {
    const mapping: Partial<ColumnMapping> = {
      evidencias: []
    };
    
    const patterns = {
      cedula: ['cedula', 'cédula', 'cc', 'documento', 'id'],
      nombre: ['nombre', 'nombres', 'first_name', 'firstname'],
      apellido: ['apellido', 'apellidos', 'last_name', 'lastname'],
      email: ['email', 'correo', 'mail', 'e-mail', 'e_mail']
    };

    // Detectar columnas básicas
    Object.entries(patterns).forEach(([field, keywords]) => {
      const matchedColumn = columns.find(col => 
        keywords.some(keyword => 
          col.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      if (matchedColumn) {
        mapping[field as keyof Omit<ColumnMapping, 'evidencias'>] = matchedColumn;
      }
    });

    // Detectar columnas de evidencias (todas las que no sean datos básicos)
    const basicColumns = Object.values(mapping).filter(Boolean) as string[];
    const evidenceColumns = columns.filter(col => !basicColumns.includes(col) && col.trim() !== '');
    
    mapping.evidencias = evidenceColumns;

    setColumnMapping(prev => ({ 
      ...prev, 
      ...mapping,
      evidencias: evidenceColumns
    }));

    // Inicializar fechas de entrega vacías para cada evidencia
    const dates: { [key: string]: string } = {};
    evidenceColumns.forEach(ev => {
      dates[ev] = '';
    });
    setEvidenceDates(dates);
    setSelectedEvidencias([]);
    setEvidenciaPreviewRows([]);
    setEvidenciaSummary({ total: 0, A: 0, D: 0, pendientes: 0, noEntregadas: 0 });
  };

  // ==================== VALIDACIÓN Y PROCESAMIENTO DE DATOS ====================

  const validateAndProcessData = async () => {
    if (!currentFile || !selectedMateria || !selectedFicha) {
      toast.error('Selecciona Materia y Ficha antes de procesar');
      return;
    }

    if (!columnMapping.cedula || !columnMapping.nombre || !columnMapping.apellido || columnMapping.evidencias.length === 0) {
      toast.error('Debes mapear al menos las columnas de Documento (ID), Nombre, Apellido y al menos una Evidencia');
      return;
    }

    try {
      setIsProcessing(true);
      
      const arrayBuffer = await currentFile.archivo.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      
  const headers = (jsonData[0] as string[]).filter(h => h && String(h).trim() !== '');
  const dataRows = jsonData.slice(1) as any[][];
      
      const processedData: StudentData[] = [];
      const errors: ValidationError[] = [];
      
      // Encontrar índices de columnas
      const columnIndices = {
        cedula: headers.indexOf(columnMapping.cedula),
        nombre: headers.indexOf(columnMapping.nombre),
        apellido: headers.indexOf(columnMapping.apellido),
        email: columnMapping.email ? headers.indexOf(columnMapping.email) : -1,
        evidencias: columnMapping.evidencias.map(ev => headers.indexOf(ev))
      };

      let totalEvidenciasPendientes = 0;
      let totalEvidenciasCalificadas = 0;
      let totalEvidenciasNoEntregadas = 0;

      // Procesamiento chunked para evitar bloquear la UI
      const CHUNK_SIZE = 300; // Ajustable según rendimiento
      const fileId = currentFile.id;
      const processChunk = (start: number) => {
        const end = Math.min(start + CHUNK_SIZE, dataRows.length);
        for (let i = start; i < end; i++) {
          const row = dataRows[i];
          const rowNumber = i + 2;
          const rowErrors: string[] = [];
          const rowWarnings: string[] = [];

          // "cedula" funciona como Documento único (puede ser correo)
          const cedula = String(row[columnIndices.cedula] || '').trim();
          const nombre = String(row[columnIndices.nombre] || '').trim();
          const apellido = String(row[columnIndices.apellido] || '').trim();
          const email = columnIndices.email >= 0 ? String(row[columnIndices.email] || '').trim() : '';

          if (!cedula) {
            rowErrors.push('Documento es requerido');
          }
          if (!nombre) rowErrors.push('Nombre es requerido');
          if (!apellido) rowErrors.push('Apellido es requerido');
          if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) rowWarnings.push('Email no es válido');

          const evidencias: Evidence[] = columnMapping.evidencias.map((evidenciaName, idx) => {
            const colIndex = columnIndices.evidencias[idx];
            const valorRaw = row[colIndex];
            const valor = String(valorRaw || '').trim().toUpperCase();
            let estado: EvidenceStatus = 'pendiente';
            let calificacion: string | undefined = undefined;
            if (valor === '') {
              estado = 'pendiente';
              totalEvidenciasPendientes++;
            } else if (valor === 'A') {
              estado = 'calificada';
              calificacion = 'A';
              totalEvidenciasCalificadas++;
            } else if (valor === 'D') {
              estado = 'calificada';
              calificacion = 'D';
              totalEvidenciasCalificadas++;
            } else if (valor === '-') {
              estado = 'no_entregada';
              calificacion = '-';
              totalEvidenciasNoEntregadas++;
            } else {
              rowErrors.push(`${evidenciaName}: Valor inválido "${valor}". Use A, D, -, o vacío`);
            }
            return { nombre: evidenciaName, estado, calificacion, fechaLimite: evidenceDates[evidenciaName] || undefined };
          });

          // Evitar duplicación de correo: si documento parece correo y es igual a email, no guardar email aparte
          const emailValue = email && email.toLowerCase() === cedula.toLowerCase() ? undefined : (email || undefined);

          processedData.push({
            fila: rowNumber,
            cedula,
            nombre,
            apellido,
            email: emailValue,
            evidencias,
            estado: rowErrors.length > 0 ? 'error' : (rowWarnings.length > 0 ? 'advertencia' : 'valido'),
            errores: rowErrors,
            advertencias: rowWarnings
          });

          rowErrors.forEach(error => errors.push({ fila: rowNumber, campo: 'varios', valor: `${nombre} ${apellido}`, error, tipo: 'error' }));
          rowWarnings.forEach(warning => errors.push({ fila: rowNumber, campo: 'varios', valor: `${nombre} ${apellido}`, error: warning, tipo: 'advertencia' }));
        }
        // Actualizar progreso parcial
        setUploadedFiles(prev => prev.map(f => f.id === fileId ? { ...f, filasProcesadas: Math.min(end, dataRows.length) } : f));
        if (end < dataRows.length) {
          // Liberar el hilo antes de siguiente chunk
          setTimeout(() => processChunk(end), 0);
        } else {
          finalize();
        }
      };

      const finalize = () => {
        // Al terminar todos los chunks, actualizar archivo y continuar con lógica existente
        setUploadedFiles(prev => prev.map(f => f.id === fileId ? {
          ...f,
          estado: errors.filter(e => e.tipo === 'error').length === 0 ? 'validado' : 'error',
          datos: processedData,
          errores: errors,
          filasProcesadas: processedData.length,
          materia: (materias.find(m => m.id === selectedMateria) || mockMaterias.find(m => m.id === selectedMateria))?.nombre,
          ficha: selectedFicha,
          totalEvidencias: columnMapping.evidencias.length,
          evidenciasPendientes: totalEvidenciasPendientes,
          evidenciasCalificadas: totalEvidenciasCalificadas,
          evidenciasNoEntregadas: totalEvidenciasNoEntregadas,
          fechasLimite: evidenceDates
        } : f));

        setShowMappingDialog(false);
        const errorCount = errors.filter(e => e.tipo === 'error').length;
        const warningCount = errors.filter(e => e.tipo === 'advertencia').length;
        const materiaNombre = (materias.find(m => m.id === selectedMateria) || mockMaterias.find(m => m.id === selectedMateria))?.nombre || 'Desconocida';
        log({
          action: uploadType === 'configuracion' ? 'file.config_load' : 'file.grade_update',
          description: `Datos procesados: ${processedData.length} estudiantes, ${(pendingEvidenceSaves && pendingEvidenceSaves.length > 0) ? pendingEvidenceSaves.length : columnMapping.evidencias.length} evidencias`,
          targetType: 'file',
          targetId: fileId,
          targetName: currentFile?.nombre || 'archivo',
          metadata: {
            materia: materiaNombre,
            ficha: selectedFicha,
            tipoSubida: uploadType,
            estudiantesProcesados: processedData.length,
            evidenciasConfiguradas: columnMapping.evidencias.length,
            evidenciasPendientes: totalEvidenciasPendientes,
            evidenciasCalificadas: totalEvidenciasCalificadas,
            evidenciasNoEntregadas: totalEvidenciasNoEntregadas,
            errores: errorCount,
            advertencias: warningCount
          },
          success: errorCount === 0
        });

        // Aplicar pre-guardado de evidencias seleccionadas tras procesar
        (async () => {
          if (pendingEvidenceSaves.length > 0) {
            try {
              const materiaIdNum = Number(selectedMateria);
              const fichaIdNum = Number(selectedFicha);
              // Usar los datos recién procesados en memoria para evitar condición de carrera
              const sourceData = processedData;
              if (sourceData && sourceData.length > 0) {
                for (const evidenciaNombre of pendingEvidenceSaves) {
                  const rows = sourceData.map((est: any) => {
                    const ev = est.evidencias.find((e: any) => e.nombre === evidenciaNombre);
                    const valor = (ev?.calificacion || '').toUpperCase();
                    const v = (valor === 'A' || valor === 'D' || valor === '-') ? valor : '';
                    return { documento: est.cedula, correo: est.email, valor: v as 'A'|'D'|'-'|'' };
                  });
                  await uploadEvidenciaColumna({ materia_id: materiaIdNum, ficha_id: fichaIdNum, evidencia_nombre: evidenciaNombre, rows });
                  setSavedEvidences(prev => prev.includes(evidenciaNombre) ? prev : [...prev, evidenciaNombre]);
                }
                toast.success(`Guardadas ${pendingEvidenceSaves.length} evidencias tras procesar archivo`);
              } else {
                toast.error('No hay datos procesados para aplicar la selección de evidencias.');
              }
            } catch (err) {
              toast.error('Error al aplicar la selección de evidencias');
            } finally {
              setPendingEvidenceSaves([]);
            }
          }
        })();

        // Replicar mensajes originales (resumido, se mantienen ramas)
        if (uploadType === 'configuracion') {
          toast.success(`Configuración inicial cargada: ${processedData.length} estudiantes, ${(pendingEvidenceSaves && pendingEvidenceSaves.length > 0) ? pendingEvidenceSaves.length : columnMapping.evidencias.length} evidencias configuradas.`, { duration: 5000 });
        } else {
          // Procesar ausentismo y notificaciones
          const estudiantesConAusencias = processedData.filter(est => est.evidencias.some(ev => ev.calificacion === '-')).length;
          const materiaNombre2 = materiaNombre;
          const notificacionesEnviadas = processAbsencesAndNotify(
            processedData.map(est => ({ cedula: est.cedula, nombre: est.nombre, apellido: est.apellido, email: est.email, evidencias: est.evidencias })),
            materiaNombre2,
            addNotification
          );
          if (totalEvidenciasNoEntregadas > 0) {
            notifyAbsenceSummary(materiaNombre2, totalEvidenciasNoEntregadas, estudiantesConAusencias, addNotification);
          }
          let mensaje = `Calificaciones actualizadas: ${totalEvidenciasCalificadas} calificadas`;
          if (totalEvidenciasNoEntregadas > 0) mensaje += `, ${totalEvidenciasNoEntregadas} no entregadas`;
          const errorCount2 = errorCount; const warningCount2 = warningCount;
          if (errorCount2 === 0 && warningCount2 === 0) {
            toast.success(mensaje, { duration: 5000 });
            if (notificacionesEnviadas > 0) toast.info(`🔔 ${notificacionesEnviadas} notificación(es) de alerta por ausentismo`, { duration: 6000 });
            // Abrir selector de evidencias para continuar con flujo manual
            setShowEvidenceDialog(true);
          } else if (errorCount2 === 0) {
            toast.success(`${mensaje} con ${warningCount2} advertencias.`, { duration: 5000 });
            notifyUploadWarnings(currentFile?.nombre || 'archivo', warningCount2, 'Revisa el archivo para más detalles', addNotification);
            // Aún permitir continuar con selección manual
            setShowEvidenceDialog(true);
          } else {
            toast.error(`Archivo procesado con ${errorCount2} errores. Revisa los detalles.`);
            notifyFailedUpload(currentFile?.nombre || 'archivo', `Se encontraron ${errorCount2} error(es) de validación`, errorCount2, addNotification);
          }
        }

        setIsProcessing(false);
      };

      // Iniciar procesamiento incremental
      processChunk(0);
      return; // Salir para no ejecutar lógica posterior duplicada

      // Actualizar archivo con datos procesados
      setUploadedFiles(prev => prev.map(f => 
        f.id === (currentFile?.id || '') 
          ? { 
              ...f, 
              estado: errors.filter(e => e.tipo === 'error').length === 0 ? 'validado' : 'error',
              datos: processedData,
              errores: errors,
              filasProcesadas: processedData.length,
              materia: (materias.find(m => m.id === selectedMateria) || mockMaterias.find(m => m.id === selectedMateria))?.nombre,
              totalEvidencias: columnMapping.evidencias.length,
              evidenciasPendientes: totalEvidenciasPendientes,
              evidenciasCalificadas: totalEvidenciasCalificadas,
              evidenciasNoEntregadas: totalEvidenciasNoEntregadas,
              fechasLimite: evidenceDates
            }
          : f
      ));

      setShowMappingDialog(false);
      
      const errorCount = errors.filter(e => e.tipo === 'error').length;
      const warningCount = errors.filter(e => e.tipo === 'advertencia').length;
      const materiaNombre = (materias.find(m => m.id === selectedMateria) || mockMaterias.find(m => m.id === selectedMateria))?.nombre || 'Desconocida';

      // ✅ Registrar validación y procesamiento exitoso
      log({
        action: uploadType === 'configuracion' ? 'file.config_load' : 'file.grade_update',
        description: `Datos procesados: ${processedData.length} estudiantes, ${(pendingEvidenceSaves && pendingEvidenceSaves.length > 0) ? pendingEvidenceSaves.length : columnMapping.evidencias.length} evidencias`,
        targetType: 'file',
        targetId: currentFile?.id || fileId,
        targetName: currentFile?.nombre || 'archivo',
        metadata: {
          materia: materiaNombre,
          ficha: selectedFicha,
          tipoSubida: uploadType,
          estudiantesProcesados: processedData.length,
          evidenciasConfiguradas: columnMapping.evidencias.length,
          evidenciasPendientes: totalEvidenciasPendientes,
          evidenciasCalificadas: totalEvidenciasCalificadas,
          evidenciasNoEntregadas: totalEvidenciasNoEntregadas,
          errores: errorCount,
          advertencias: warningCount
        },
        success: errorCount === 0
      });
      
      if (uploadType === 'configuracion') {
        toast.success(
          `Configuración inicial cargada: ${processedData.length} estudiantes, ${(pendingEvidenceSaves && pendingEvidenceSaves.length > 0) ? pendingEvidenceSaves.length : columnMapping.evidencias.length} evidencias configuradas. No se enviarán notificaciones.`,
          { duration: 5000 }
        );
      } else {
        // MODO ACTUALIZACIÓN: Procesar notificaciones de ausentismo
        
        // Contar estudiantes con tareas no entregadas
        const estudiantesConAusencias = processedData.filter(est => 
          est.evidencias.some(ev => ev.calificacion === '-')
        ).length;
        
        // Procesar ausentismo y enviar notificaciones escalonadas (3 y 5 faltas)
        const notificacionesEnviadas = processAbsencesAndNotify(
          processedData.map(est => ({
            cedula: est.cedula,
            nombre: est.nombre,
            apellido: est.apellido,
            email: est.email,
            evidencias: est.evidencias
          })),
          materiaNombre,
          addNotification
        );
        
        // Enviar resumen de ausencias si hay
        if (totalEvidenciasNoEntregadas > 0) {
          notifyAbsenceSummary(
            materiaNombre,
            totalEvidenciasNoEntregadas,
            estudiantesConAusencias,
            addNotification
          );
        }
        
        // Mensajes de resultado
        let mensaje = `Calificaciones actualizadas: ${totalEvidenciasCalificadas} calificadas`;
        if (totalEvidenciasNoEntregadas > 0) {
          mensaje += `, ${totalEvidenciasNoEntregadas} no entregadas`;
        }
        
        if (errorCount === 0 && warningCount === 0) {
          toast.success(mensaje, { duration: 5000 });
          
          if (notificacionesEnviadas > 0) {
            toast.info(
              `🔔 Se enviaron ${notificacionesEnviadas} notificación(es) de alerta por ausentismo`,
              { duration: 6000 }
            );
          }
        } else if (errorCount === 0) {
          toast.success(
            `${mensaje} con ${warningCount} advertencias.`,
            { duration: 5000 }
          );
          
          // Notificar advertencias
          notifyUploadWarnings(
            currentFile?.nombre || 'archivo',
            warningCount,
            'Revisa el archivo para más detalles',
            addNotification
          );
        } else {
          toast.error(`Archivo procesado con ${errorCount} errores. Revisa los detalles.`);
          
          // Notificar error en carga
          notifyFailedUpload(
            currentFile?.nombre || 'archivo',
            `Se encontraron ${errorCount} error(es) de validación`,
            errorCount,
            addNotification
          );
        }
      }

    } catch (error) {
      console.error('Error validando datos:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

      // ❌ Registrar error de validación
      log({
        action: 'file.validation_error',
        description: `Error validando datos del archivo: ${currentFile?.nombre}`,
        targetType: 'file',
        targetId: currentFile?.id || 'unknown',
        targetName: currentFile?.nombre || 'unknown',
        success: false,
        errorMessage,
        severity: 'error',
        metadata: {
          materia: (materias.find(m => m.id === selectedMateria) || mockMaterias.find(m => m.id === selectedMateria))?.nombre,
          ficha: selectedFicha
        }
      });

      toast.error(`Error validando datos: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ==================== SELECCIÓN Y PREVISUALIZACIÓN DE UNA EVIDENCIA ====================
  const buildEvidenciaPreview = (evidenciaNombre: string) => {
    if (!evidenciaNombre) {
      setEvidenciaPreviewRows([]);
      setEvidenciaSummary({ total: 0, A: 0, D: 0, pendientes: 0, noEntregadas: 0 });
      return;
    }
    // Preferir datos completos; si no existen, usar previewData + mapping/headers
    const selectedFile = uploadedFiles.find(f => f.id === (currentFile?.id || '')) || null;
    const hasFullData = !!(selectedFile && selectedFile.datos && selectedFile.datos.length > 0);

    let rows: Array<{ estudiante: string; documento: string; correo?: string; valor: string }> = [];
    if (hasFullData) {
      rows = (selectedFile!.datos as any[]).map((est: any) => {
        const ev = est.evidencias.find((e: any) => e.nombre === evidenciaNombre);
        const valor = (ev?.calificacion || '').toUpperCase();
        return {
          estudiante: `${est.nombre} ${est.apellido}`.trim(),
          documento: est.cedula,
          correo: est.email,
          valor: valor || (ev?.estado === 'no_entregada' ? '-' : ''),
        };
      });
    } else if (previewData.length > 0 && availableColumns.length > 0) {
      const h = availableColumns;
      const idxCed = h.indexOf(columnMapping.cedula || '');
      const idxNom = h.indexOf(columnMapping.nombre || '');
      const idxApe = h.indexOf(columnMapping.apellido || '');
      const idxMail = columnMapping.email ? h.indexOf(columnMapping.email) : -1;
      const idxEv = h.indexOf(evidenciaNombre);
      rows = previewData.map((row: any[]) => ({
        estudiante: `${String(row[idxNom] || '').trim()} ${String(row[idxApe] || '').trim()}`.trim(),
        documento: String(row[idxCed] || '').trim(),
        correo: idxMail >= 0 ? String(row[idxMail] || '').trim() : '',
        valor: String(row[idxEv] || '').trim().toUpperCase(),
      }));
    } else {
      rows = [];
    }
    const summary = rows.reduce((acc, r) => {
      acc.total++;
      if (r.valor === 'A') acc.A++;
      else if (r.valor === 'D') acc.D++;
      else if (r.valor === '-') acc.noEntregadas++;
      else acc.pendientes++;
      return acc;
    }, { total: 0, A: 0, D: 0, pendientes: 0, noEntregadas: 0 });
    setEvidenciaPreviewRows(rows.slice(0, 5));
    setEvidenciaSummary(summary);
  };

  const handleSelectEvidencia = (nombre: string) => {
    setSelectedEvidencias(prev => {
      const exists = prev.includes(nombre);
      const next = exists ? prev.filter(e => e !== nombre) : [...prev, nombre];
      return next;
    });
    buildEvidenciaPreview(nombre);
    // construir multi preview/summary para todas las seleccionadas
    const fileWithData = uploadedFiles.find(f => f.id === (currentFile?.id || ''));
    const sourceData = (fileWithData && fileWithData.datos) ? fileWithData.datos : [];
    const currentSelected = (selectedEvidencias.includes(nombre) ? selectedEvidencias.filter(e=>e!==nombre) : [...selectedEvidencias, nombre]);
    const mp: Record<string, Array<{ estudiante: string; documento: string; correo?: string; valor: string }>> = {};
    const ms: Record<string, { total: number; A: number; D: number; pendientes: number; noEntregadas: number }> = {};
    for (const evName of currentSelected) {
      const rowsEv: Array<{ estudiante: string; documento: string; correo?: string; valor: string }> = [];
      let Aev = 0, Dev = 0, penev = 0, noEntEv = 0, totev = 0;
      for (const est of (sourceData||[])) {
        const evx = est.evidencias.find((e: any) => e.nombre === evName);
        if (!evx) continue;
        totev++;
        const valx = (evx.calificacion || '').trim().toUpperCase();
        if (valx === 'A') Aev++; else if (valx === 'D') Dev++; else if (valx === '-') noEntEv++; else penev++;
        if (expandedPreview || rowsEv.length < 5) rowsEv.push({ estudiante: `${est.nombre} ${est.apellido}`.trim(), documento: est.cedula, correo: est.email, valor: valx });
      }
      mp[evName] = rowsEv;
      ms[evName] = { total: totev, A: Aev, D: Dev, pendientes: penev, noEntregadas: noEntEv };
    }
    setMultiPreview(mp);
    setMultiSummary(ms);
    // Totales de selección (suma de todas las evidencias seleccionadas)
    const agg = Array.from(currentSelected).reduce((acc, evn) => {
      const s = ms[evn];
      if (s) {
        acc.total += s.total || 0;
        acc.A += s.A || 0;
        acc.D += s.D || 0;
        acc.pendientes += s.pendientes || 0;
        acc.noEntregadas += s.noEntregadas || 0;
      }
      return acc;
    }, { total: 0, A: 0, D: 0, pendientes: 0, noEntregadas: 0 });
    setSelectionTotals(agg);
  };

  const handleSaveSelectedEvidencia = () => {
    if (!selectedEvidencias.length) {
      toast.error('Selecciona al menos una evidencia');
      return;
    }
    setPendingEvidenceSaves(selectedEvidencias);
    // Actualizar el archivo actual con el conteo de selección
    if (currentFile) {
      setUploadedFiles(prev => prev.map(f => 
        f.id === currentFile.id ? {
          ...f,
          seleccionEvidenciasCount: selectedEvidencias.length,
          seleccionEvidenciasNames: [...selectedEvidencias],
          // Recalcular métricas a partir de la selección actual
          evidenciasCalificadas: selectionTotals.A ?? f.evidenciasCalificadas,
          evidenciasPendientes: selectionTotals.pendientes ?? f.evidenciasPendientes,
          evidenciasNoEntregadas: selectionTotals.noEntregadas ?? f.evidenciasNoEntregadas,
          totalEvidencias: selectionTotals.total ?? f.totalEvidencias
        } : f
      ));
    }
    setShowEvidenceDialog(false);
    toast.success(`Selección aplicada: ${selectedEvidencias.length} evidencia(s). Continúa con "Procesar Archivo"`);
  };

  // ==================== GUARDAR CALIFICACIONES ====================

  const saveGrades = async (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (!file || !file.datos) return;

    // Validación obligatoria de ficha ingresada por el docente
    if (!selectedFicha || !selectedFicha.trim()) {
      toast.error('Debes ingresar el número de ficha antes de guardar.');
      return;
    }
    // Validación obligatoria de materia seleccionada
    if (!selectedMateria || selectedMateria.trim() === '') {
      toast.error('Debes seleccionar la materia antes de guardar.');
      return;
    }

    const validData = file.datos.filter(d => d.estado === 'valido' || d.estado === 'advertencia');
    
    try {
      setIsProcessing(true);
      // Resolver ficha_id por número si es posible
      let fichaIdNum = 0;
      if (selectedFicha && selectedFicha.trim()) {
        try {
          const ficha = await api.findFichaByNumero(selectedFicha.trim());
          fichaIdNum = ficha?.id ?? 0;
          if (!fichaIdNum) {
            toast.error(`La ficha ${selectedFicha} no existe. Debes crearla primero antes de cargar evidencias.`);
            return; // detener proceso
          }
        } catch {
          // fallback silencioso
        }
      }
      const materiaIdNum = parseInt(selectedMateria, 10);
      let result: any = { success: true };
      const perColumnErrors: Array<{ evidencia: string; message: string }> = [];
      let perColumnSuccessCount = 0;
      const selectionUsed = Array.isArray(file.seleccionEvidenciasNames) && file.seleccionEvidenciasNames.length > 0;
      // Si hay selección de evidencias, guardar solo esas columnas usando el endpoint por columna
      if (selectionUsed) {
        for (const evidenciaNombre of file.seleccionEvidenciasNames) {
          const rows = validData.map(est => {
            const ev = est.evidencias.find(e => e.nombre === evidenciaNombre);
            const valor = (ev?.calificacion || '').trim();
            return { estudiante: `${est.nombre} ${est.apellido}`.trim(), documento: est.cedula, correo: est.email || '', valor };
          });
          try {
            // eslint-disable-next-line no-await-in-loop
            const r = await uploadEvidenciaColumna({ materia_id: materiaIdNum, ficha_id: fichaIdNum, evidencia_nombre: evidenciaNombre, rows });
            result = r; // mantener último resultado para métricas básicas
            const insertedCount = (r as any)?.insertados ?? 0;
            const successFlag = (r as any)?.success;
            if (successFlag === false || insertedCount === 0) {
              const msg = (r as any)?.errores?.[0] || 'Sin cambios aplicados en el backend';
              perColumnErrors.push({ evidencia: evidenciaNombre, message: msg });
            } else {
              perColumnSuccessCount += 1;
            }
          } catch (err: any) {
            const msg = (err?.message || err?.detail || 'Fallo desconocido') as string;
            perColumnErrors.push({ evidencia: evidenciaNombre, message: msg });
          }
        }
        if (perColumnErrors.length > 0) {
          const first = perColumnErrors[0];
          toast.error(`Error guardando evidencia "${first.evidencia}": ${first.message}`);
          notifyFailedUpload(
            file.nombre,
            `Error en ${perColumnErrors.length} evidencia(s). Primera: ${first.evidencia}`,
            perColumnErrors.length,
            addNotification
          );
          // Si todas fallaron, abortar; si hubo alguna exitosa, continuar sin lanzar error
          if (perColumnSuccessCount === 0) {
            throw new Error(first.message);
          }
        }
      } else {
        // Sin selección, usar el flujo wide tradicional
        result = await evidenciasWideApi.uploadEvidenciasWide(file.archivo, {
          dryRun: false,
          fichaId: fichaIdNum,
          fichaNumero: selectedFicha.trim(),
          materiaId: isNaN(materiaIdNum) ? 0 : materiaIdNum,
          docenteId: 0
        });
      }
      setBackendResult(result);
      // Tratar como éxito parcial si hubo inserciones/actualizaciones aunque existan errores no fatales
      const inserted = selectionUsed ? perColumnSuccessCount : ((result as any)?.insertados ?? (result as any)?.insertados_actualizados ?? 0);
      const hasErrors = selectionUsed ? (perColumnErrors.length > 0) : (Array.isArray((result as any)?.errores) && ((result as any).errores.length > 0));
      if (!selectionUsed && result.success === false && inserted === 0) {
        // Fallo real (sin cambios aplicados). Lanza error para que UI registre save_error
        throw new Error((result as any).detail || 'El backend reportó fallo al guardar');
      }
      if (hasErrors) {
        // Éxito parcial: mostrar advertencia y continuar flujo de guardado
        const warnCount = (result as any).errores.length;
        const msg = (result as any).errores[0] || 'Se presentaron advertencias durante el guardado';
        toast.warning(`Guardado parcial con ${warnCount} advertencia(s).`);
        notifyUploadWarnings(file.nombre, warnCount, msg, addNotification);
      }
      
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, estado: 'guardado' }
          : f
      ));

      // Resumen final cuando se usa selección
      if (selectionUsed) {
        const totalSel = file.seleccionEvidenciasNames?.length || 0;
        const ok = perColumnSuccessCount;
        const failed = perColumnErrors.length;
        if (failed === 0) {
          toast.success(`Guardadas ${ok} de ${totalSel} evidencias seleccionadas.`);
        } else {
          toast.warning(`Guardadas ${ok} de ${totalSel} evidencias seleccionadas (${failed} con error).`);
        }
        // Disparar envío de correos por umbrales de 'D' (server-side) inmediatamente después del guardado
        if (fichaIdNum && materiaIdNum && ok > 0) {
          const role = (user?.rol || '').toLowerCase();
          const canSend = role === 'docente' || role === 'administrador';
          if (!canSend) {
            toast.info('Correos de ausentismo no autorizados para este usuario. (Se requiere Docente/Administrador)');
          }
          try {
            const resp = canSend ? await triggerAbsenceEmails({ materiaId: materiaIdNum, fichaId: fichaIdNum, studentThreshold: 3, escalationThreshold: 5 }) : { success: false, error: 'No autorizado' } as any;
            if (resp.success) {
              const sentAny = resp.data?.sent_any ? 'con correos enviados' : 'sin correos (deshabilitado o sin casos)';
              toast.info(`Verificación de ausentismo ${sentAny}.`);
            } else {
              const err = (resp as any)?.error || 'fallo desconocido';
              if (String(err).toLowerCase().includes('no autorizado')) {
                toast.info('Correos de ausentismo no autorizados para este usuario. (Se requiere Docente/Administrador)');
              } else {
                toast.warning(`No se pudo disparar correos de ausentismo: ${err}`);
              }
            }
          } catch (e:any) {
            toast.warning(`Fallo al verificar ausentismo: ${e.message || 'error'}`);
          }
        }
      }

      // Agregar al historial
      const newHistoryItem: LoadHistory = {
        id: Date.now().toString(),
        fecha: new Date().toISOString(),
        tipoSubida: selectionUsed ? 'actualizacion' : file.tipoSubida,
        archivo: file.nombre,
        materia: file.materia || '',
        evidenciasActualizadas: selectionUsed 
          ? perColumnSuccessCount 
          : ((result as any)?.counts ? ((result as any).counts.A || 0) + ((result as any).counts.D || 0) : (file.evidenciasCalificadas || 0)),
        registros: validData.length,
        fichaNumero: (result as any)?.ficha_numero || selectedFicha.trim() || undefined,
        fichaId: (result as any)?.ficha_id || undefined
      };
      setLoadHistory(prev => [newHistoryItem, ...prev]);

      if (file.tipoSubida === 'configuracion') {
        // ✅ Registrar guardado de configuración
        log({
          action: 'file.config_saved',
          description: `Configuración guardada: ${validData.length} estudiantes, ${(file.seleccionEvidenciasCount ?? file.totalEvidencias)} evidencias`,
          targetType: 'file',
          targetId: fileId,
          targetName: file.nombre,
          metadata: {
            materia: file.materia,
            ficha: selectedFicha,
            estudiantes: validData.length,
            evidencias: (file.seleccionEvidenciasCount ?? file.totalEvidencias)
          },
          success: true
        });

        toast.success(
          `Configuración guardada: ${validData.length} estudiantes, ${(file.seleccionEvidenciasCount ?? file.totalEvidencias)} evidencias configuradas.`,
          { duration: 5000 }
        );
      } else {
        // ✅ Registrar guardado de calificaciones
        log({
          action: 'file.grades_saved',
          description: `Calificaciones guardadas: ${validData.length} registros, ${file.evidenciasCalificadas} evidencias`,
          targetType: 'file',
          targetId: fileId,
          targetName: file.nombre,
          metadata: {
            materia: file.materia,
            ficha: selectedFicha,
            registros: validData.length,
            evidenciasCalificadas: file.evidenciasCalificadas,
            evidenciasNoEntregadas: file.evidenciasNoEntregadas
          },
          success: true
        });

        const savedCalif = (result as any)?.counts ? ((result as any).counts.A || 0) + ((result as any).counts.D || 0) : file.evidenciasCalificadas;
        const savedRegs = validData.length;
        toast.success(`${savedCalif} calificaciones guardadas para ${savedRegs} estudiantes.`, { duration: 5000 });
        
        // Notificación de carga exitosa
        notifySuccessfulUpload(
          file.materia || 'Materia',
          savedRegs,
          savedCalif || 0,
          addNotification
        );
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

      // ❌ Registrar error al guardar
      log({
        action: 'file.save_error',
        description: `Error guardando datos del archivo: ${file.nombre}`,
        targetType: 'file',
        targetId: fileId,
        targetName: file.nombre,
        success: false,
        errorMessage,
        severity: 'error',
        metadata: {
          materia: file.materia,
          registros: validData.length
        }
      });

      toast.error(`Error guardando datos: ${errorMessage}`);
      
      // Notificación de error
      notifyFailedUpload(
        file.nombre,
        errorMessage,
        1,
        addNotification
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // ==================== FUNCIONES AUXILIARES ====================

  const deleteFile = (fileId: string) => {
    const fileToDelete = uploadedFiles.find(f => f.id === fileId);
    if (!fileToDelete) return;

    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));

    // ⚠️ Registrar eliminación de archivo
    log({
      action: 'file.delete',
      description: `Archivo eliminado: ${fileToDelete.nombre}`,
      targetType: 'file',
      targetId: fileId,
      targetName: fileToDelete.nombre,
      metadata: {
        materia: fileToDelete.materia,
        estado: fileToDelete.estado,
        registros: fileToDelete.datos?.length || 0
      },
      success: true,
      severity: 'warning'
    });

    toast.success('Archivo eliminado');
  };

  const viewFileDetails = (file: UploadedFile) => {
    setSelectedFileDetails(file);
    setShowDetailsDialog(true);
  };

  const getStatusBadge = (estado: UploadedFile['estado']) => {
    switch (estado) {
      case 'procesando':
        return <Badge variant="outline"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Procesando</Badge>;
      case 'validado':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Validado</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Error</Badge>;
      case 'guardado':
        return <Badge variant="secondary"><Save className="w-3 h-3 mr-1" />Guardado</Badge>;
    }
  };

  const getEvidenceStatusBadge = (estado: EvidenceStatus) => {
    switch (estado) {
      case 'no_configurada':
        return <Badge variant="outline" className="text-xs">No Config.</Badge>;
      case 'pendiente':
        return <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">Pendiente</Badge>;
      case 'calificada':
        return <Badge variant="default" className="text-xs bg-green-50 text-green-700 border-green-300">Calificada</Badge>;
      case 'no_entregada':
        return <Badge variant="destructive" className="text-xs">No Entregada</Badge>;
    }
  };

  const getUploadTypeBadge = (tipo: UploadType) => {
    if (tipo === 'configuracion') {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300"><Settings className="w-3 h-3 mr-1" />Configuración Inicial</Badge>;
    } else {
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300"><RefreshCw className="w-3 h-3 mr-1" />Actualización</Badge>;
    }
  };

  // ==================== ESTADÍSTICAS ====================

  const stats = {
    totalArchivos: uploadedFiles.length,
    archivosValidados: uploadedFiles.filter(f => f.estado === 'validado').length,
    archivosGuardados: uploadedFiles.filter(f => f.estado === 'guardado').length,
    totalEstudiantes: uploadedFiles.reduce((sum, f) => sum + (f.datos?.length || 0), 0),
    evidenciasCalificadas: uploadedFiles.reduce((sum, f) => sum + (f.evidenciasCalificadas || 0), 0),
    evidenciasPendientes: uploadedFiles.reduce((sum, f) => sum + (f.evidenciasPendientes || 0), 0),
    evidenciasNoEntregadas: uploadedFiles.reduce((sum, f) => sum + (f.evidenciasNoEntregadas || 0), 0)
  };

  // ==================== RENDER ====================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Carga de Archivos - Calificaciones</h1>
          <p className="text-muted-foreground">
            Sube archivos Excel con la estructura de tareas o actualiza calificaciones semanalmente
          </p>
          {backendResult && (
            <div className="mt-2 text-sm p-3 border rounded bg-accent/30">
              <strong>Resultado Backend Evidencias Wide:</strong>{' '}
              Insertados: {backendResult.insertados ?? backendResult.insertados_actualizados ?? 0} | A:{backendResult.counts?.A ?? backendResult.detalle?.A ?? 0} D:{backendResult.counts?.D ?? backendResult.detalle?.D ?? 0} -:{backendResult.counts?.['-'] ?? backendResult.detalle?.['-'] ?? 0}
              {backendResult.errores?.length > 0 && (
                <div className="mt-1 text-red-600">Errores: {backendResult.errores.length}</div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Descargar Plantilla
          </Button>
        </div>
      </div>

      {/* Alert informativo */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Valores permitidos en el Excel (sistema externo):</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• <strong>Vacío:</strong> Pendiente (aún no calificado) - No notifica</li>
            <li>• <strong>A:</strong> Aprobó la tarea (calificación final) - No notifica</li>
            <li>• <strong>D:</strong> Desaprobó/Reprobó (calificación final) - No notifica</li>
            <li>• <strong>- (guion):</strong> No entregó - Notifica si pasó fecha límite</li>
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">Nota: El sistema externo solo envía estos valores. No se aceptan calificaciones numéricas.</p>
        </AlertDescription>
      </Alert>

      {/* Tabs para separar gestión y historial */}
      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="upload">Cargar Archivo</TabsTrigger>
          <TabsTrigger value="history">Historial ({loadHistory.length})</TabsTrigger>
        </TabsList>

        {/* Tab: Cargar Archivo */}
        <TabsContent value="upload" className="space-y-6">
          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Archivos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalArchivos}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Validados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.archivosValidados}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Guardados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.archivosGuardados}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Estudiantes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEstudiantes}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Calificadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.evidenciasCalificadas}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pendientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.evidenciasPendientes}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">No Entregadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.evidenciasNoEntregadas}</div>
              </CardContent>
            </Card>
          </div>

          {/* Selector de tipo de carga */}
          <Card>
            <CardHeader>
              <CardTitle>Tipo de Carga</CardTitle>
              <CardDescription>
                Selecciona el tipo de carga antes de subir el archivo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={uploadType} onValueChange={(value) => setUploadType(value as UploadType)}>
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="configuracion" id="configuracion" />
                  <div className="space-y-1 flex-1">
                    <Label htmlFor="configuracion" className="cursor-pointer flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Configuración Inicial
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Carga inicial de la estructura de tareas/evidencias. Los valores vacíos se consideran pendientes. 
                      <strong> No genera notificaciones.</strong>
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="actualizacion" id="actualizacion" />
                  <div className="space-y-1 flex-1">
                    <Label htmlFor="actualizacion" className="cursor-pointer flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Actualización de Calificaciones
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Actualización semanal de calificaciones. Solo se notifica si hay tareas marcadas con "-" (no entregadas) después de fecha límite.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Zona de carga */}
          <Card>
            <CardContent className="pt-6">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="mb-2">Arrastra archivos Excel aquí</h3>
                <p className="text-muted-foreground mb-2">
                  O haz clic para seleccionar archivos (.xlsx, .xls)
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Tipo de carga seleccionado: {getUploadTypeBadge(uploadType)}
                </p>
                <Button 
                  onClick={async () => {
                    // Intentar File System Access API para evitar freezes del antiguo diálogo
                    if ('showOpenFilePicker' in window) {
                      try {
                        const picker: any = await (window as any).showOpenFilePicker({
                          multiple: true,
                          types: [
                            {
                              description: 'Excel Files',
                              accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] }
                            }
                          ]
                        });
                        const fileHandles = Array.isArray(picker) ? picker : [picker];
                        const files: File[] = [];
                        for (const handle of fileHandles) {
                          try {
                            const f = await handle.getFile();
                            files.push(f);
                          } catch {}
                        }
                        if (files.length) {
                          handleFileSelection(files);
                          return;
                        }
                      } catch (err) {
                        // Si el usuario cancela o falla, usar input tradicional
                      }
                    }
                    fileInputRef.current?.click();
                  }}
                  disabled={isProcessing}
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Seleccionar Archivos
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".xlsx,.xls"
                  onClick={(e) => {
                    // Permitir seleccionar el mismo archivo consecutivamente
                    (e.currentTarget as HTMLInputElement).value = '';
                  }}
                  onChange={(e) => {
                    // Copiar FileList antes de diferir; no usar SyntheticEvent asíncronamente
                    const list = e.target.files;
                    if (!list || list.length === 0) return;
                    const arr = Array.from(list);
                    const run = () => handleFileSelection(arr);
                    if ('requestIdleCallback' in window) {
                      (window as any).requestIdleCallback(run);
                    } else {
                      setTimeout(run, 0);
                    }
                  }}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          {/* Lista de archivos subidos */}
          {uploadedFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Archivos Subidos</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Archivo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Materia</TableHead>
                      <TableHead>Ficha</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Estudiantes</TableHead>
                      <TableHead>Evidencias</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploadedFiles.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-green-600" />
                            <span className="font-medium">{file.nombre}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getUploadTypeBadge(file.tipoSubida)}
                        </TableCell>
                        <TableCell>
                          {file.materia || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell>
                          {file.ficha || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(file.estado)}
                        </TableCell>
                        <TableCell>
                          {file.datos ? (
                            <div className="text-sm">
                              <div>{file.datos.filter(d => d.estado === 'valido').length} válidos</div>
                              <div className="text-muted-foreground">de {file.totalFilas} total</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {file.totalEvidencias > 0 ? (
                            <div className="text-sm space-y-0.5">
                              {typeof file.seleccionEvidenciasCount === 'number' && (
                                <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium mb-1">
                                  Selección: {file.seleccionEvidenciasCount}
                                </div>
                              )}
                              {Array.isArray(file.seleccionEvidenciasNames) && file.seleccionEvidenciasNames.length > 0 ? (
                                (() => {
                                  const m = getSelectionMetricsForFile(file);
                                  return m ? (
                                    <>
                                      <div className="text-green-600">{m.A} calificadas</div>
                                      <div className="text-yellow-600">{m.pendientes} pendientes</div>
                                      {m.noEntregadas > 0 && (
                                        <div className="text-red-600">{m.noEntregadas} no entregadas</div>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  );
                                })()
                              ) : (
                                <>
                                  <div className="text-green-600">{file.evidenciasCalificadas} calificadas</div>
                                  <div className="text-yellow-600">{file.evidenciasPendientes} pendientes</div>
                                  {file.evidenciasNoEntregadas > 0 && (
                                    <div className="text-red-600">{file.evidenciasNoEntregadas} no entregadas</div>
                                  )}
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(file.fechaSubida), 'dd/MM/yyyy')}
                            <div className="text-muted-foreground text-xs">
                              {format(new Date(file.fechaSubida), 'HH:mm')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {file.datos && (
                                <DropdownMenuItem 
                                  onClick={() => viewFileDetails(file)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver Detalles
                                </DropdownMenuItem>
                              )}
                              {file.estado === 'validado' && file.datos && (
                                <DropdownMenuItem 
                                  onClick={() => saveGrades(file.id)}
                                  disabled={
                                    isProcessing ||
                                    !selectedFicha || !selectedFicha.trim() ||
                                    !selectedMateria || selectedMateria.trim() === ''
                                  }
                                >
                                  <Save className="mr-2 h-4 w-4" />
                                  Guardar Calificaciones
                                </DropdownMenuItem>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive"
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar archivo?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción eliminará permanentemente el archivo "{file.nombre}" 
                                      y todos sus datos procesados.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => deleteFile(file.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Historial */}
        <TabsContent value="history" className="space-y-6">
          {loadHistory.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="mb-2">No hay historial</h3>
                  <p className="text-muted-foreground">
                    El historial de cargas aparecerá aquí después de guardar archivos
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Historial de Cargas</CardTitle>
                <CardDescription>Registro de todas las cargas guardadas en el sistema</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Archivo</TableHead>
                      <TableHead>Materia</TableHead>
                      <TableHead>Ficha</TableHead>
                      <TableHead>Evidencias Actualizadas</TableHead>
                      <TableHead>Estudiantes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm">{format(new Date(item.fecha), 'dd/MM/yyyy')}</div>
                              <div className="text-xs text-muted-foreground">{format(new Date(item.fecha), 'HH:mm')}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getUploadTypeBadge(item.tipoSubida)}
                            {item.modo === 'single-column' ? (
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">Por Columna{item.evidenciaNombre ? `: ${item.evidenciaNombre}` : ''}</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Wide</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-green-600" />
                            <span className="text-sm">{item.archivo}</span>
                          </div>
                        </TableCell>
                        <TableCell>{item.materia}</TableCell>
                        <TableCell>{item.fichaNumero ? item.fichaNumero : (item.fichaId ? `#${item.fichaId}` : '—')}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                            {item.evidenciasActualizadas}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.registros}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog para mapeo de columnas */}
      <Dialog open={showMappingDialog} onOpenChange={setShowMappingDialog}>
        <DialogContent className="w-[96vw] sm:max-w-[96vw] max-w-[96vw] h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurar Carga de Archivo</DialogTitle>
            <DialogDescription>
              Mapea las columnas del Excel y configura las opciones de carga
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Tipo de carga (readonly) */}
            <div className="p-4 bg-accent/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Tipo de carga seleccionado:</Label>
                  <div className="mt-1">{getUploadTypeBadge(uploadType)}</div>
                </div>
                {uploadType === 'configuracion' && (
                  <Alert className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Configuración inicial: No se enviarán notificaciones
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* Selección de materia */}
            <div className="space-y-2">
              <Label>Materia *</Label>
              <Select value={selectedMateria} onValueChange={setSelectedMateria}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la materia para estas calificaciones" />
                </SelectTrigger>
                <SelectContent>
                  {(materias.length ? materias : mockMaterias).map((materia) => (
                    <SelectItem key={materia.id} value={materia.id}>
                      {materia.nombre} ({materia.codigo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ingreso de Ficha */}
            <div className="space-y-2">
              <Label>Ficha *</Label>
              <Input
                value={selectedFicha}
                onChange={(e) => setSelectedFicha(e.target.value.trim())}
                placeholder="Ej: 2251334A"
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">Ingresa la ficha asociada a estas calificaciones (alfanumérica).</p>
            </div>

            {/* Mapeo de columnas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4>Datos del Estudiante</h4>
                
                <div className="space-y-2">
                  <Label>Documento (puede ser correo) *</Label>
                  <Select 
                    value={columnMapping.cedula}
                    onValueChange={(value) => setColumnMapping(prev => ({ ...prev, cedula: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona columna de Documento/Correo" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColumns.filter(c => c && c.trim() !== '').map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Select 
                    value={columnMapping.nombre} 
                    onValueChange={(value) => setColumnMapping(prev => ({ ...prev, nombre: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona columna" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColumns.filter(c => c && c.trim() !== '').map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Apellido *</Label>
                  <Select 
                    value={columnMapping.apellido} 
                    onValueChange={(value) => setColumnMapping(prev => ({ ...prev, apellido: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona columna" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColumns.filter(c => c && c.trim() !== '').map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Email (opcional)</Label>
                  <Select 
                    value={columnMapping.email || ''} 
                    onValueChange={(value) => setColumnMapping(prev => ({ ...prev, email: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona columna" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Opción sentinel para indicar sin mapeo */}
                      <SelectItem value="__sin_mapear__">Sin mapear</SelectItem>
                      {availableColumns.filter(c => c && c.trim() !== '').map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4>Evidencias/Tareas</h4>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => detectColumnMapping(availableColumns)}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Detectar Auto
                  </Button>
                </div>
                
                <div className="p-4 border rounded-lg bg-accent/20">
                  <p className="text-sm text-muted-foreground mb-2">
                    Se detectaron {columnMapping.evidencias.length} columnas de evidencias:
                  </p>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {columnMapping.evidencias.map((ev, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-background rounded border">
                          <span className="text-sm font-medium">{ev}</span>
                          <Badge variant="outline" className="text-xs">Evidencia {idx + 1}</Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Configuración de fechas límite (opcional) */}
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setShowDateConfig(!showDateConfig)}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    {showDateConfig ? 'Ocultar' : 'Configurar'} Fechas Límite (Opcional)
                  </Button>
                  
                  {showDateConfig && (
                    <div className="p-4 border rounded-lg space-y-3 max-h-48 overflow-y-auto">
                      {columnMapping.evidencias.map((ev) => (
                        <div key={ev} className="flex items-center gap-2">
                          <Label className="text-xs min-w-32 truncate">{ev}</Label>
                          <Input
                            type="date"
                            value={evidenceDates[ev] || ''}
                            onChange={(e) => setEvidenceDates(prev => ({
                              ...prev,
                              [ev]: e.target.value
                            }))}
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Vista previa de datos */}
            {previewData.length > 0 && (
              <div className="space-y-2">
                <h4>Vista Previa (primeras 5 filas)</h4>
                <div className="border rounded-lg overflow-auto max-h-64">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {availableColumns.map((col, idx) => (
                          <TableHead key={idx} className="whitespace-nowrap">{col}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, rowIdx) => (
                        <TableRow key={rowIdx}>
                          {row.map((cell: any, cellIdx: number) => (
                            <TableCell key={cellIdx} className="whitespace-nowrap">
                              {cell || <span className="text-muted-foreground text-xs">vacío</span>}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMappingDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowEvidenceDialog(true)}
              disabled={columnMapping.evidencias.length === 0}
              title={columnMapping.evidencias.length === 0 ? 'Carga un Excel y detecta columnas para listar evidencias' : undefined}
            >
              Seleccionar Evidencias
            </Button>
            <Button 
              onClick={validateAndProcessData}
              disabled={isProcessing || !selectedMateria || !selectedFicha || !columnMapping.cedula || !columnMapping.nombre || !columnMapping.apellido}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Procesar Archivo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de selección manual de evidencias */}
      <Dialog open={showEvidenceDialog} onOpenChange={setShowEvidenceDialog}>
        <DialogContent className="w-[96vw] sm:max-w-[96vw] max-w-[96vw] h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Seleccionar Evidencia</DialogTitle>
            <DialogDescription>
              Procesa una evidencia a la vez. Las evidencias se listan en el orden del Excel.
            </DialogDescription>
          </DialogHeader>

          {(columnMapping.evidencias.length > 0 && ( (currentFile && (uploadedFiles.find(f => f.id === currentFile.id)?.datos?.length || 0) > 0) || previewData.length > 0 )) ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {columnMapping.evidencias.map((ev) => {
                  const isSaved = savedEvidences.includes(ev);
                  return (
                    <div key={ev} className="flex items-center gap-2">
                      <Button variant={selectedEvidencias.includes(ev) ? 'default' : 'outline'} onClick={() => handleSelectEvidencia(ev)} className="truncate">
                        {ev}
                      </Button>
                      {isSaved && <Badge variant="outline" className="text-green-700">Guardada</Badge>}
                    </div>
                  );
                })}
              </div>
              <div className="text-sm text-muted-foreground">Guardadas: {savedEvidences.length} / {columnMapping.evidencias.length}</div>

              {selectedEvidencias.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text_base font-medium">Vista previa de evidencias seleccionadas</h4>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="expandedPreview" className="text-xs">Vista completa</Label>
                      <Input id="expandedPreview" type="checkbox" checked={expandedPreview} onChange={(e)=> setExpandedPreview(e.target.checked)} />
                    </div>
                  </div>
                  {selectionTotals && (
                    <div className="flex flex-wrap gap-2 text-sm">
                      <Badge variant="secondary">Selección</Badge>
                      <Badge variant="outline">Total: {selectionTotals.total}</Badge>
                      <Badge variant="outline" className="text-green-700">A: {selectionTotals.A}</Badge>
                      <Badge variant="outline" className="text-red-700">D: {selectionTotals.D}</Badge>
                      <Badge variant="outline" className="text-yellow-700">Pendientes: {selectionTotals.pendientes}</Badge>
                      <Badge variant="outline" className="text-orange-700">No Entregadas: {selectionTotals.noEntregadas}</Badge>
                    </div>
                  )}
                  {selectedEvidencias.map(evName => (
                    <div key={evName} className="space-y-2 border rounded p-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{evName}</span>
                        <div className="flex flex-wrap gap-2 text-sm">
                          <Badge variant="outline">Total: {multiSummary[evName]?.total ?? 0}</Badge>
                          <Badge variant="outline" className="text-green-700">A: {multiSummary[evName]?.A ?? 0}</Badge>
                          <Badge variant="outline" className="text-red-700">D: {multiSummary[evName]?.D ?? 0}</Badge>
                          <Badge variant="outline" className="text-yellow-700">Pendientes: {multiSummary[evName]?.pendientes ?? 0}</Badge>
                          <Badge variant="outline" className="text-orange-700">No Entregadas: {multiSummary[evName]?.noEntregadas ?? 0}</Badge>
                        </div>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Estudiante</TableHead>
                            <TableHead>Documento</TableHead>
                            <TableHead>Correo</TableHead>
                            <TableHead>Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(multiPreview[evName] || []).map((r, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{r.estudiante}</TableCell>
                              <TableCell className="font-mono text-xs">{r.documento}</TableCell>
                              <TableCell className="text-xs">{r.correo || ''}</TableCell>
                              <TableCell className="font-mono">{r.valor || ''}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                Primero carga y procesa un Excel. No necesitas seleccionar Materia ni Ficha para explorar las evidencias. Para guardar, sí se requieren.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEvidenceDialog(false)}>Cerrar</Button>
            <Button onClick={handleSaveSelectedEvidencia} disabled={!selectedEvidencias.length || !selectedMateria || !selectedFicha}>Guardar evidencias seleccionadas</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para ver detalles del archivo */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Archivo: {selectedFileDetails?.nombre}</DialogTitle>
            <DialogDescription>
              Información detallada de los datos procesados
            </DialogDescription>
          </DialogHeader>

          {selectedFileDetails && selectedFileDetails.datos && (
            <div className="space-y-4">
              {/* Resumen */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Estudiantes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedFileDetails.datos.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Evidencias</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Array.isArray(selectedFileDetails.seleccionEvidenciasNames) && selectedFileDetails.seleccionEvidenciasNames.length > 0
                        ? (getSelectionMetricsForFile(selectedFileDetails)?.total || selectedFileDetails.seleccionEvidenciasCount || 0)
                        : selectedFileDetails.totalEvidencias}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Calificadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {Array.isArray(selectedFileDetails.seleccionEvidenciasNames) && selectedFileDetails.seleccionEvidenciasNames.length > 0
                        ? (getSelectionMetricsForFile(selectedFileDetails)?.A || 0)
                        : selectedFileDetails.evidenciasCalificadas}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Pendientes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {Array.isArray(selectedFileDetails.seleccionEvidenciasNames) && selectedFileDetails.seleccionEvidenciasNames.length > 0
                        ? (getSelectionMetricsForFile(selectedFileDetails)?.pendientes || 0)
                        : selectedFileDetails.evidenciasPendientes}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabla de datos */}
              <div className="border rounded-lg overflow-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Documento (correo)</TableHead>
                      <TableHead>Nombre Completo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Evidencias</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedFileDetails.datos.map((student, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-sm">{student.cedula}</TableCell>
                        <TableCell>{student.nombre} {student.apellido}</TableCell>
                        <TableCell>
                          {student.estado === 'valido' && <Badge variant="default">Válido</Badge>}
                          {student.estado === 'error' && <Badge variant="destructive">Error</Badge>}
                          {student.estado === 'advertencia' && <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Advertencia</Badge>}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(Array.isArray(selectedFileDetails.seleccionEvidenciasNames) && selectedFileDetails.seleccionEvidenciasNames.length > 0
                              ? student.evidencias.filter(ev => selectedFileDetails.seleccionEvidenciasNames!.includes(ev.nombre))
                              : student.evidencias
                            ).map((ev, evIdx) => (
                              <div key={evIdx} className="text-xs" title={ev.nombre}>
                                {getEvidenceStatusBadge(ev.estado)}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Errores y advertencias */}
              {selectedFileDetails.errores.length > 0 && (
                <div className="space-y-2">
                  <h4>Errores y Advertencias</h4>
                  <ScrollArea className="h-48 border rounded-lg p-4">
                    <div className="space-y-2">
                      {selectedFileDetails.errores.map((error, idx) => (
                        <Alert key={idx} variant={error.tipo === 'error' ? 'destructive' : 'default'}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            <strong>Fila {error.fila}:</strong> {error.error}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Botón fijo para abrir selección de evidencias */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => setShowEvidenceDialog(true)} disabled={!currentFile || !currentFile.datos || columnMapping.evidencias.length === 0}>
          Seleccionar Evidencias
        </Button>
      </div>
    </div>
  );
}
