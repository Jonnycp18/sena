import { useRef, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';
import { toast } from 'sonner@2.0.3';
import { Upload, FileSpreadsheet, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

interface DryRunResult {
  success: boolean;
  dryRun: boolean;
  total: number;
  detalle: { A: number; D: number; '-': number; Pendiente: number; tot_registros: number };
  errores: string[];
  columnMapping: Record<string,string>;
  evidenciaCols: string[];
  identityPreview: Array<{ documento:string; nombre:string; apellido:string; correo:string }>;
  cedulaIgnorada: boolean;
}

interface FinalResult {
  success: boolean;
  insertados?: number;
  insertados_actualizados?: number;
  counts?: { A: number; D: number; '-': number; Pendiente: number; tot_registros: number };
  errores?: string[];
}

export function EvidenciasWideUpload() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [evidenciasTemplateCount, setEvidenciasTemplateCount] = useState(5);
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null);
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null);
  const [ficha, setFicha] = useState<string>('');
  const [materias, setMaterias] = useState<any[]>([]);
  const [materiaId, setMateriaId] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user || (user.rol !== 'docente' && user.rol !== 'administrador')) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h3>Acceso Denegado</h3>
          <p className="text-muted-foreground">Solo docentes o administradores.</p>
        </div>
      </div>
    );
  }

  const acceptExtensions = ['.xlsx', '.xls'];

  const handleFiles = (files: File[]) => {
    const f = files[0];
    if (!f) return;
    const ok = acceptExtensions.some(ext => f.name.toLowerCase().endsWith(ext));
    if (!ok) {
      toast.error('Archivo debe ser .xlsx o .xls');
      return;
    }
    setFile(f);
    setDryRunResult(null);
    setFinalResult(null);
  };

  const pickFile = async () => {
    // Usa el File System Access API si existe, con fallback al input clásico
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


  const base = (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

  // Cargar materias disponibles al montar
  useEffect(() => {
    (async () => {
      try {
        let fichaResolvedId: string | undefined;
        if (ficha && ficha.trim()) {
          try {
            const f = await api.findFichaByNumero(ficha.trim());
            if (f?.id) fichaResolvedId = String(f.id);
          } catch {}
        }
        const res = await api.getMaterias({ pageSize: 200, fichaId: fichaResolvedId });
        let mats = res.materias || [];
        if (user?.rol === 'docente') {
            mats = mats.filter(m => m.docenteId === String(user.id));
        }
        setMaterias(mats);
        if (mats.length && !mats.find(m => Number(m.id) === materiaId)) {
          setMateriaId(Number(mats[0].id));
        } else if (!mats.length) {
          setMateriaId(0);
        }
      } catch {}
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ficha]);

  // Carga inicial sin ficha (para mostrar algo)
  useEffect(() => {
    if (materias.length === 0 && !ficha) {
      (async () => {
        try {
          const res = await api.getMaterias({ pageSize: 100 });
          let mats = res.materias || [];
          if (user?.rol === 'docente') mats = mats.filter(m => m.docenteId === String(user.id));
          setMaterias(mats);
          if (mats.length) setMateriaId(Number(mats[0].id));
        } catch {}
      })();
    }
  }, [materias.length, ficha, user]);

  const executeUpload = async () => {
    if (!file) { toast.error('Selecciona un archivo'); return; }
    if (!ficha.trim()) { toast.error('Ingresa la Ficha antes de continuar'); return; }
    const tokens = api.getTokens();
    if (!tokens?.access_token) {
      toast.error('Sesión expirada');
      return;
    }
    setLoading(true);
    setUploadProgress(0);
    try {
      const form = new FormData();
      form.append('file', file);
      // Adjuntar ficha si el backend lo soporta (no rompe si se ignora)
      form.append('ficha', ficha.trim());
      const endpoint = dryRun ? `${base}/evidencias-wide/upload-wide?dryRun=true` : `${base}/evidencias-wide/upload`;
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', endpoint, true);
        xhr.setRequestHeader('Authorization', `Bearer ${tokens.access_token}`);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Number(((e.loaded / e.total) * 100).toFixed(2)));
          }
        };
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            try {
              const json = JSON.parse(xhr.responseText);
              if (xhr.status < 200 || xhr.status >= 300) {
                toast.error(json.detail || 'Error en la carga');
                reject(new Error(json.detail || 'Error')); return;
              }
              if (dryRun) {
                setDryRunResult(json as DryRunResult);
                const detalle = (json as any).detalle || (json as any).counts || {};
                toast.success(`Validación OK: ${file.name} | A:${detalle.A||0} D:${detalle.D||0} -:${detalle['-']||0} Pend:${detalle.Pendiente||detalle.pendiente||0}`);
              } else {
                setFinalResult(json as FinalResult);
                const counts = (json as any).counts || {};
                const inserted = (json as any).insertados || (json as any).insertados_actualizados || 0;
                toast.success(`Carga definitiva: ${file?.name} | Ins/Act:${inserted} A:${counts.A||0} D:${counts.D||0} -:${counts['-']||0}`);
              }
              setUploadProgress(100);
              resolve();
            } catch (err:any) {
              toast.error(err.message || 'Error procesando respuesta');
              reject(err);
            }
          }
        };
        xhr.onerror = () => {
          toast.error('Error de red');
          reject(new Error('network'));
        };
        // Incluir materia / ficha explícitos
        form.append('ficha_id', '0');
        if (ficha.trim()) form.append('ficha_numero', ficha.trim());
        form.append('materia_id', String(materiaId||0));
        form.append('docente_id', user ? String(user.id) : '0');
        xhr.send(form);
      });
    } catch (e:any) {
      toast.error(e.message || 'Error de red');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = async () => {
    const tokens = api.getTokens();
    if (!tokens?.access_token) {
      toast.error('Sesión expirada');
      return;
    }
    try {
      const url = `${base}/evidencias-wide/template?evidencias=${evidenciasTemplateCount}`;
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${tokens.access_token}` } });
      if (!resp.ok) {
        toast.error('Error descargando plantilla');
        return;
      }
      const blob = await resp.blob();
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = 'plantilla_evidencias.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(dlUrl);
      toast.success('Plantilla descargada');
    } catch (e:any) {
      toast.error(e.message || 'Error de red');
    }
  };

  const countsBlock = (detalle?: {A:number;D:number;'-':number;Pendiente:number;tot_registros:number}) => {
    if (!detalle) return null;
    return (
      <div className="flex flex-wrap gap-2 mt-2 text-xs">
        <Badge variant="outline">A: {detalle.A}</Badge>
        <Badge variant="outline">D: {detalle.D}</Badge>
        <Badge variant="outline">-: {detalle['-']}</Badge>
        <Badge variant="outline">Pendiente: {detalle.Pendiente}</Badge>
        <Badge variant="secondary">Total: {detalle.tot_registros}</Badge>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Evidencias Wide (Excel)</h1>
        <p className="text-muted-foreground text-sm">Sube el archivo masivo para registrar / actualizar evidencias (A, D, -, vacío).</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Archivo</CardTitle>
          <CardDescription>Primero realiza una validación (dry run) para ver mapeo y errores.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="outline" onClick={pickFile} disabled={loading}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />Seleccionar archivo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
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
            />
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium">Ficha *</label>
              <Input
                value={ficha}
                onChange={(e)=> setFicha(e.target.value.trim())}
                maxLength={20}
                placeholder="Ej: 2251334A"
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium">Materia *</label>
              <select
                value={materiaId}
                onChange={(e)=> setMateriaId(Number(e.target.value))}
                className="border rounded p-2 text-xs"
                disabled={loading || materias.length===0}
              >
                {materias.map(m => (
                  <option key={m.id} value={m.id}>{m.codigo || m.id} - {m.nombre}</option>
                ))}
              </select>
            </div>
            {materias.length === 0 && (
              <div className="text-xs text-red-600">No hay materias para la ficha y docente ingresados. Verifica la ficha o tus asignaciones.</div>
            )}
            <div className="flex items-center gap-2">
              <Checkbox id="dryRun" checked={dryRun} onCheckedChange={(v:any)=>setDryRun(!!v)} />
              <label htmlFor="dryRun" className="text-sm">Dry Run (solo validar)</label>
            </div>
            <Button
              onClick={executeUpload}
              disabled={
                loading ||
                !file ||
                !ficha.trim() ||
                materiaId === 0 ||
                materias.length === 0
              }
            >
              {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {dryRun ? 'Validar' : 'Subir Definitivo'}
            </Button>
            {dryRunResult && (
              <Button variant="outline" onClick={()=>{setDryRun(false);}} disabled={loading}>Ir a Carga Definitiva</Button>
            )}
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={50}
                value={evidenciasTemplateCount}
                onChange={(e)=> setEvidenciasTemplateCount(Number(e.target.value))}
                className="w-20"
              />
              <Button variant="outline" onClick={downloadTemplate} disabled={loading}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />Plantilla
              </Button>
            </div>
          </div>
          {(loading || uploadProgress > 0) && file && (
            <div className="space-y-2 mt-4 w-full">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subiendo: {file.name}</span>
                <span>{uploadProgress.toFixed(0)}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
          <Alert>
            <AlertDescription className="text-xs leading-relaxed">
              <strong>Valores permitidos:</strong> A=Aprobado, D=Reprobado, -=No entregó, vacío=Pendiente. Ingresa la <strong>Ficha</strong> para diferenciar cargas por grupo.
              El sistema fuerza Documento=Correo y no sobrescribe identidad (solo inserta nuevos estudiantes). Usa siempre primero Dry Run para verificar.<br/>
              Después de validar, desmarca "Dry Run" y pulsa "Subir Definitivo".
            </AlertDescription>
          </Alert>
          {file && (
            <div className="text-xs text-muted-foreground">Seleccionado: {file.name} ({(file.size/1024/1024).toFixed(2)} MB)</div>
          )}
        </CardContent>
      </Card>
      {dryRunResult && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado Validación</CardTitle>
            <CardDescription>Mapeo y conteos preliminares</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm">
              <div><strong>Éxito:</strong> {dryRunResult.success ? 'Sí' : 'No'}</div>
              <div><strong>Total Registros:</strong> {dryRunResult.total}</div>
              <div><strong>Cédula Ignorada:</strong> {dryRunResult.cedulaIgnorada ? 'Sí' : 'No'}</div>
              <div><strong>Column Mapping:</strong> {Object.entries(dryRunResult.columnMapping).map(([k,v])=>`${k}=>${v}`).join(', ')}</div>
              <div><strong>Columnas Evidencia:</strong> {dryRunResult.evidenciaCols.length}</div>
              {countsBlock(dryRunResult.detalle)}
            </div>
            {dryRunResult.identityPreview?.length > 0 && (
              <div>
                <Separator className="my-2" />
                <h4 className="text-sm font-medium mb-2">Preview Identidad (primeros {dryRunResult.identityPreview.length})</h4>
                <ScrollArea className="h-40 border rounded p-2 text-xs">
                  {dryRunResult.identityPreview.map((s,i)=>(
                    <div key={i} className="py-1 border-b last:border-b-0">
                      <span className="font-mono">{s.documento}</span> — {s.nombre} {s.apellido} ({s.correo})
                    </div>
                  ))}
                </ScrollArea>
              </div>
            )}
            {dryRunResult.errores.length > 0 && (
              <div>
                <Separator className="my-2" />
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4" />Errores ({dryRunResult.errores.length})</h4>
                <ScrollArea className="h-40 border rounded p-2 text-xs">
                  {dryRunResult.errores.map((e,i)=>(
                    <div key={i} className="py-1 border-b last:border-b-0 text-red-700">{e}</div>
                  ))}
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {finalResult && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado Carga Definitiva</CardTitle>
            <CardDescription>Resumen de inserción / actualización</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><strong>Éxito:</strong> {finalResult.success ? 'Sí' : 'No'}</div>
            <div><strong>Insertados / Actualizados:</strong> {finalResult.insertados ?? finalResult.insertados_actualizados ?? 0}</div>
            {countsBlock(finalResult.counts)}
            {finalResult.errores && finalResult.errores.length > 0 && (
              <div className="mt-2">
                <h4 className="text-sm font-medium flex items-center gap-1"><AlertTriangle className="w-4 h-4" />Errores ({finalResult.errores.length})</h4>
                <ScrollArea className="h-32 border rounded p-2 text-xs">
                  {finalResult.errores.map((e,i)=>(
                    <div key={i} className="py-1 border-b last:border-b-0 text-red-700">{e}</div>
                  ))}
                </ScrollArea>
              </div>
            )}
            <Button variant="outline" onClick={()=>{setFile(null); setDryRunResult(null); setFinalResult(null); setDryRun(true); setTimeout(()=>pickFile(),150);}}>Nueva Carga</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
