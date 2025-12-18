import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner@2.0.3';
import { useAuditLog } from '../../hooks/useAuditLog';
import { useAuth } from '../../hooks/useAuth';
import { api, evidenciasWideApi, docenteApi } from '../../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Upload, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  BookOpen,
  Users,
  Calendar,
  HelpCircle
} from 'lucide-react';

// ---- Simple Upload Modal Trigger Component ----

function UploadModalTrigger({ onUploaded, materiaId }: { onUploaded: () => void; materiaId?: number }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dryRunResult, setDryRunResult] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ficha, setFicha] = useState<string>('');
  const [materias, setMaterias] = useState<any[]>([]);
  const [selectedMateriaId, setSelectedMateriaId] = useState<number>(materiaId || 0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Obtener usuario autenticado para asociar docente_id
  const { user } = useAuth();

  const handleFiles = (files: File[]) => {
    const f = files[0];
    if (!f) return;
    const ok = ['.xlsx', '.xls'].some(ext => f.name.toLowerCase().endsWith(ext));
    if (!ok) {
      setError('Archivo debe ser .xlsx o .xls');
      return;
    }
    setFile(f);
    setDryRunResult(null);
    setError(null);
  };

  const pickFile = async () => {
    if ('showOpenFilePicker' in window) {
      try {
        const picker: any = await (window as any).showOpenFilePicker({
          multiple: false,
          types: [{ description: 'Excel', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] } }]
        });
        const [handle] = Array.isArray(picker) ? picker : [picker];
        if (handle) {
          const f = await handle.getFile();
          handleFiles([f]);
          return;
        }
      } catch (err) {
        // cancelado o no soportado -> fallback
      }
    }
    fileInputRef.current?.click();
  };

  // Auto abrir selector al abrir modal si aún no hay archivo
  useEffect(() => {
    if (open && !file) {
      const t = setTimeout(() => {
        pickFile();
      }, 150);
      return () => clearTimeout(t);
    }
  }, [open, file]);

  // Cargar materias para selector al abrir modal
  useEffect(() => {
    if (open) {
      (async () => {
        try {
          // Resolver ficha si ya ingresada para filtrar materias por ficha
          let fichaResolvedId: string | undefined;
          if (ficha && ficha.trim()) {
            try {
              const f = await api.findFichaByNumero(ficha.trim());
              if (f?.id) fichaResolvedId = String(f.id);
            } catch {}
          }
          const res = await api.getMaterias({ pageSize: 200, fichaId: fichaResolvedId });
          let mats = res.materias || [];
          // Filtrar por docente actual si rol docente
          if (user?.rol === 'docente') {
            mats = mats.filter(m => m.docenteId === String(user.id));
          }
          setMaterias(mats);
          if ((!selectedMateriaId || !mats.find(m=>String(m.id)===String(selectedMateriaId))) && mats.length > 0) {
            setSelectedMateriaId(Number(mats[0].id));
          }
        } catch {}
      })();
    }
  }, [open]);

  // Actualizar lista de materias cuando cambia la ficha digitada
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        let fichaResolvedId: string | undefined;
        if (ficha && ficha.trim().length > 2) {
          const f = await api.findFichaByNumero(ficha.trim());
          if (f?.id) fichaResolvedId = String(f.id);
        }
        const res = await api.getMaterias({ pageSize: 200, fichaId: fichaResolvedId });
        let mats = res.materias || [];
        if (user?.rol === 'docente') mats = mats.filter(m => m.docenteId === String(user.id));
        setMaterias(mats);
        if (!mats.find(m => String(m.id) === String(selectedMateriaId))) {
          setSelectedMateriaId(mats.length ? Number(mats[0].id) : 0);
        }
      } catch {}
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ficha]);

  const handleDryRun = async () => {
    if (!file) { setError('Selecciona un archivo'); return; }
    if (!ficha.trim()) { setError('Ingresa la Ficha antes de validar'); return; }
    setBusy(true); setError(null); setDryRunResult(null);
    try {
      let fichaIdNum = 0;
      try {
        const f = await api.findFichaByNumero(ficha.trim());
        fichaIdNum = f?.id ?? 0;
      } catch {}
      const res = await evidenciasWideApi.uploadEvidenciasWide(file, { dryRun: true, fichaId: fichaIdNum, fichaNumero: ficha.trim(), materiaId: selectedMateriaId || 0, docenteId: user ? Number(user.id) : 0 });
      setDryRunResult(res);
      const counts: any = (res as any).counts || (res as any).detalle || {};
      toast.success(`Dry Run OK: ${file.name} | A:${counts.A||0} D:${counts.D||0} -:${counts['-']||0} Pend:${counts.Pendiente||counts.pendiente||0}`);
    } catch (e:any) {
      setError(e.message);
    } finally { setBusy(false); }
  };
  const handleUpload = async () => {
    if (!file) { setError('Selecciona un archivo'); return; }
    if (!ficha.trim()) { setError('Ingresa la Ficha antes de subir'); return; }
    setBusy(true); setError(null);
    try {
      let fichaIdNum = 0;
      try {
        const f = await api.findFichaByNumero(ficha.trim());
        fichaIdNum = f?.id ?? 0;
      } catch {}
      const res = await evidenciasWideApi.uploadEvidenciasWide(file, { dryRun: false, fichaId: fichaIdNum, fichaNumero: ficha.trim(), materiaId: selectedMateriaId || 0, docenteId: user ? Number(user.id) : 0 });
      const counts: any = (res as any).counts || {};
      if (res.success) {
        setOpen(false); setFile(null); setDryRunResult(null);
        setFicha('');
        onUploaded();
        const inserted = (res as any).insertados || (res as any).insertados_actualizados || 0;
        toast.success(`Carga completa: ${file.name} | Insertados:${inserted} A:${counts.A||0} D:${counts.D||0} -:${counts['-']||0}`);
      } else {
        setError('Error en subida');
        toast.error('Falló carga del archivo');
      }
    } catch (e:any) {
      setError(e.message);
      toast.error(e.message||'Error subiendo archivo');
    } finally { setBusy(false); }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4 mr-2" /> Nueva Carga
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-lg shadow-lg border p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Subir Calificaciones (Excel)</h3>
              <button onClick={() => { if(!busy){ setOpen(false); setError(null); setDryRunResult(null);} }} className="text-sm px-2 py-1 rounded hover:bg-muted">Cerrar</button>
            </div>
            <p className="text-sm text-muted-foreground">Formato: use la plantilla disponible en Exportar/Template. Realice primero un Dry Run para validar.</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={pickFile} disabled={busy}>
                  <Upload className="h-4 w-4 mr-2" /> Seleccionar archivo
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  disabled={busy}
                  onClick={(e) => { (e.currentTarget as HTMLInputElement).value = ''; }}
                  onChange={(e) => {
                    const list = e.target.files;
                    if (!list || list.length === 0) return;
                    const arr = Array.from(list);
                    const run = () => handleFiles(arr);
                    if ('requestIdleCallback' in window) {
                      (window as any).requestIdleCallback(run);
                    } else {
                      setTimeout(run, 0);
                    }
                  }}
                  className="hidden"
                />
                {file && (<span className="text-xs text-muted-foreground">{file.name}</span>)}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Ficha *</label>
                <input
                  value={ficha}
                  onChange={(e)=> setFicha(e.target.value.trim())}
                  maxLength={20}
                  placeholder="Ej: 2251334A"
                  className="w-full border rounded p-2 text-sm"
                />
                <p className="text-xs text-muted-foreground">Ingresa la ficha asociada a estas calificaciones (alfanumérica).</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Materia *</label>
                <select
                  value={selectedMateriaId}
                  onChange={(e)=> setSelectedMateriaId(Number(e.target.value))}
                  className="w-full border rounded p-2 text-sm"
                  disabled={busy || materias.length===0}
                >
                  {materias.map(m => (
                    <option key={m.id} value={m.id}>{m.codigo || m.id} - {m.nombre}</option>
                  ))}
                </select>
                {materias.length === 0 ? (
                  <p className="text-xs text-red-600">No hay materias para esta ficha y docente. Ingresa otra ficha o verifica asignaciones.</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Selecciona la materia para asociar las evidencias.</p>
                )}
              </div>
            </div>
            {error && <div className="text-sm text-red-600 border border-red-300 rounded p-2 bg-red-50">{error}</div>}
            {dryRunResult && (
              <div className="text-sm border rounded p-2 bg-muted">
                <p className="font-medium mb-1">Dry Run:</p>
                <p>
                  Insertados: {dryRunResult.insertados ?? 0} |
                  A: {dryRunResult.counts?.A ?? 0} |
                  D: {dryRunResult.counts?.D ?? 0} |
                  -: {dryRunResult.counts?.['-'] ?? 0}
                </p>
                {dryRunResult.errores && dryRunResult.errores.length > 0 && (
                  <ul className="mt-1 max-h-32 overflow-auto list-disc ml-4">
                    {dryRunResult.errores.slice(0,10).map((er:string,i:number)=>(<li key={i}>{er}</li>))}
                  </ul>
                )}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={handleDryRun}
                disabled={
                  busy ||
                  !file ||
                  !ficha.trim() ||
                  selectedMateriaId === 0 ||
                  materias.length === 0
                }
              >Dry Run</Button>
              <Button
                onClick={handleUpload}
                disabled={
                  busy ||
                  !file ||
                  !ficha.trim() ||
                  selectedMateriaId === 0 ||
                  materias.length === 0 ||
                  (dryRunResult && dryRunResult.errores && dryRunResult.errores.length>0)
                }
              >Subir</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function DocenteDashboard() {
  const { log } = useAuditLog();
  const { user } = useAuth();

  // 📊 Registrar acceso al dashboard
  useEffect(() => {
    log({
      action: 'dashboard.access',
      description: 'Acceso al Dashboard de Docente',
      metadata: {
        dashboard: 'docente',
        vistas: ['tareas asignadas', 'pendientes de calificación', 'materias']
      },
      success: true
    });
  }, [log]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [pendingGrades, setPendingGrades] = useState<any[]>([]);
  const [recentUploads, setRecentUploads] = useState<any[]>([]);

  // Ya no usamos documento; backend identifica docente por token (claims.sub)
  const isAuthenticated = !!user;

  const loadData = async () => {
    setLoading(true); setError(null);
    try {
      if (!isAuthenticated) { setLoading(false); return; }
      const s = await docenteApi.getDocenteStats();
      const c = await docenteApi.getDocenteCourses(6);
      const pg = await docenteApi.getDocentePendingGrades(10);
      const ru = await docenteApi.getDocenteRecentUploads(5);
      if (s.success) setStats(s.data);
      if (c.success) setCourses(c.data);
      if (pg.success) setPendingGrades(pg.data);
      if (ru.success) setRecentUploads(ru.data);
    } catch (e:any) {
      setError(e.message || 'Error cargando dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isAuthenticated) { loadData(); } }, [isAuthenticated]);

  const resumen = stats ? {
    fichasAsignadas: (stats.fichasWide ?? courses.length ?? 0),
    estudiantesTotal: (stats.estudiantesWide ?? courses.reduce((acc,c)=>acc + (c.total||0),0)),
    tareasCargas: (stats.cargasWide ?? stats.calificacionesCargadas ?? 0),
    pendientesCarga: (stats.pendientesWide ?? stats.pendientes ?? 0)
  } : { fichasAsignadas: 0, estudiantesTotal: 0, tareasCargas: 0, pendientesCarga: 0 };

  const fichasAsignadas = courses.map(c => ({
    nombre: c.curso || '—',
    materia: c.curso || '—',
    estudiantes: c.total,
    ultimaCarga: '—',
    progreso: c.progreso,
    estado: c.progreso === 100 ? 'completo' : c.progreso >= 75 ? 'al-dia' : 'atrasado'
  }));

  const historialCargas = recentUploads.map(u => ({
    archivo: u.archivo,
    fecha: u.fecha ? new Date(u.fecha).toLocaleString() : '—',
    registros: u.registros,
    estado: u.estado,
    observaciones: u.observaciones,
    ficha: (u.ficha ?? u.group ?? '—')
  }));

  const proximasEvaluaciones: any[] = []; // Placeholder hasta tener calendario real

  return (
    <div className="space-y-6">
      <div>
        <h1>Dashboard Docente</h1>
        <p className="text-muted-foreground">
          Gestiona tus cargas académicas y calificaciones
        </p>
      </div>

      {/* Resumen rápido */}
      {error && <div className="p-3 text-sm text-red-700 border border-red-300 rounded bg-red-50">{error}</div>}
      {/* Métricas consolidadas (Wide + Calificaciones) con tooltips */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <BookOpen className="h-8 w-8 text-blue-600 mr-4" />
            <div>
              <p className="text-2xl font-bold">{resumen.fichasAsignadas}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Fichas (Wide)
                <span className="inline-flex" aria-label="info" title="Fichas que tienen al menos una carga wide de evidencias asociada por ti.">
                  <HelpCircle className="h-3 w-3" />
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-green-600 mr-4" />
            <div>
              <p className="text-2xl font-bold">{resumen.estudiantesTotal}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Estudiantes (Wide)
                <span className="inline-flex" aria-label="info" title="Estudiantes únicos en las fichas gestionadas por tus cargas wide.">
                  <HelpCircle className="h-3 w-3" />
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <CheckCircle className="h-8 w-8 text-purple-600 mr-4" />
            <div>
              <p className="text-2xl font-bold">{resumen.tareasCargas}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Cargas Wide
                <span className="inline-flex" aria-label="info" title="Número de archivos Excel wide subidos (auditoría).">
                  <HelpCircle className="h-3 w-3" />
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Clock className="h-8 w-8 text-orange-600 mr-4" />
            <div>
              <p className="text-2xl font-bold">{resumen.pendientesCarga}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Evidencias Pend.
                <span className="inline-flex" aria-label="info" title="Cantidad de evidencias sin letra (pendientes) entre estudiantes de tus fichas wide.">
                  <HelpCircle className="h-3 w-3" />
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <CheckCircle className="h-8 w-8 text-emerald-600 mr-4" />
            <div>
              <p className="text-2xl font-bold">{stats?.calificacionesCargadas ?? 0}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Calificaciones Cargadas
                <span className="inline-flex" aria-label="info" title="Registros en tabla calificaciones con nota cargadas por ti (cargado_por).">
                  <HelpCircle className="h-3 w-3" />
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Clock className="h-8 w-8 text-orange-500 mr-4" />
            <div>
              <p className="text-2xl font-bold">{stats?.pendientes ?? 0}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Pendientes Calif.
                <span className="inline-flex" aria-label="info" title="Registros de calificaciones aún sin nota (pendientes de calificar).">
                  <HelpCircle className="h-3 w-3" />
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fichas Asignadas */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Fichas Asignadas</CardTitle>
            <CardDescription>
              Estado de tus grupos académicos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fichasAsignadas.map((ficha, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{ficha.nombre}</h4>
                    <p className="text-sm text-muted-foreground">{ficha.materia}</p>
                    <p className="text-xs text-muted-foreground">
                      {ficha.estudiantes} estudiantes • {ficha.ultimaCarga}
                    </p>
                  </div>
                  <Badge 
                    variant={
                      ficha.estado === 'completo' ? 'default' :
                      ficha.estado === 'al-dia' ? 'secondary' : 'destructive'
                    }
                  >
                    {ficha.estado === 'completo' ? 'Completo' :
                     ficha.estado === 'al-dia' ? 'Al día' : 'Atrasado'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Progreso de calificaciones</span>
                    <span>{ficha.progreso}%</span>
                  </div>
                  <Progress value={ficha.progreso} className="h-2" />
                </div>
                <Button size="sm" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Cargar Calificaciones
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Próximas Evaluaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Próximas Evaluaciones</CardTitle>
            <CardDescription>
              Eventos programados en tu calendario académico
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {proximasEvaluaciones.map((evaluacion, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{evaluacion.evaluacion}</p>
                  <p className="text-xs text-muted-foreground">{evaluacion.ficha}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {evaluacion.tipo}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {evaluacion.fecha}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full">
              <Calendar className="h-4 w-4 mr-2" />
              Ver Calendario Completo
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Historial de Cargas */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Historial de Cargas</CardTitle>
              <CardDescription>
                Últimos archivos subidos al sistema
              </CardDescription>
            </div>
            <UploadModalTrigger onUploaded={loadData} materiaId={(courses[0]?.materia_id as number) || 0} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {historialCargas.map((carga, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-muted">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{carga.archivo}</p>
                    <p className="text-xs text-muted-foreground">
                      {carga.fecha} • {carga.registros} registros • Ficha: {carga.ficha}
                    </p>
                    {carga.observaciones && (
                      <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                        <AlertTriangle className="h-3 w-3" />
                        {carga.observaciones}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={
                      carga.estado === 'exitoso' ? 'default' :
                      carga.estado === 'con-errores' ? 'secondary' : 'destructive'
                    }
                  >
                    {carga.estado === 'exitoso' ? 'Exitoso' :
                     carga.estado === 'con-errores' ? 'Con errores' : 'Fallido'}
                  </Badge>
                  <Button size="sm" variant="ghost">
                    Ver detalles
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}