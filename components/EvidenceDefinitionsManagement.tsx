import { useEffect, useState } from 'react';
import { evidenciasDefApi } from '../utils/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Calendar, RefreshCw } from 'lucide-react';

type DefRow = {
  id: number;
  nombre: string;
  activa: boolean;
  semana_activacion?: number | null;
  fecha_activacion?: string | null;
  orden: number;
  total?: number;
  calificadas?: number;
  entregadas?: number;
  pendientes?: number;
  noEntrego?: number;
};

export function EvidenceDefinitionsManagement() {
  const [materiaId, setMateriaId] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<DefRow[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showInactive, setShowInactive] = useState(true);

  const load = async () => {
    if (!materiaId) return;
    setLoading(true); setError(null);
    try {
      const r = await evidenciasDefApi.resumenEvidenciaDefiniciones(materiaId);
      if (r.success) {
        let data = r.data as DefRow[];
        if (!showInactive) data = data.filter(d => d.activa);
        setRows(data);
        setSelected(new Set());
      }
    } catch (e:any) {
      setError(e.message || 'Error cargando definiciones');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [materiaId, showInactive]);

  const toggleSelect = (id: number) => {
    const n = new Set(selected);
    if (n.has(id)) n.delete(id); else n.add(id);
    setSelected(n);
  };

  const bulkActivate = async (activate: boolean) => {
    if (selected.size === 0) return;
    setLoading(true); setError(null);
    try {
      const ids = Array.from(selected);
      if (activate) await evidenciasDefApi.activarDefiniciones(ids); else await evidenciasDefApi.desactivarDefiniciones(ids);
      await load();
    } catch (e:any) { setError(e.message || 'Error aplicando acción'); } finally { setLoading(false); }
  };

  const updateRow = async (id: number, patch: any) => {
    setLoading(true); setError(null);
    try {
      await evidenciasDefApi.actualizarEvidenciaDefinicion(id, patch);
      await load();
    } catch (e:any) { setError(e.message || 'Error actualizando'); } finally { setLoading(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Evidencias</CardTitle>
        <CardDescription>Activa, programa y monitorea evidencias por materia</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <label className="text-xs font-medium">Materia ID</label>
            <Input type="number" value={materiaId || ''} onChange={e=>setMateriaId(Number(e.target.value))} placeholder="Ej: 12" className="w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={showInactive} onCheckedChange={(v)=>setShowInactive(Boolean(v))} />
            <span className="text-sm">Mostrar inactivas</span>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading || !materiaId}>
            {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refrescar
          </Button>
          <Button size="sm" variant="default" disabled={selected.size===0} onClick={()=>bulkActivate(true)}>Activar seleccionadas</Button>
          <Button size="sm" variant="secondary" disabled={selected.size===0} onClick={()=>bulkActivate(false)}>Desactivar seleccionadas</Button>
        </div>
        {error && <div className="p-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded">{error}</div>}
        {!materiaId && <div className="text-sm text-muted-foreground">Ingrese un materiaId para ver definiciones.</div>}
        {materiaId > 0 && rows.length === 0 && !loading && <div className="text-sm text-muted-foreground">Sin definiciones para esta materia.</div>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-2 text-left"><Checkbox checked={selected.size>0 && selected.size===rows.length} onCheckedChange={(v)=>{ if (!v) setSelected(new Set()); else setSelected(new Set(rows.map(r=>r.id))); }} /></th>
                <th className="p-2 text-left">Nombre</th>
                <th className="p-2 text-left">Activa</th>
                <th className="p-2 text-left">Semana</th>
                <th className="p-2 text-left">Fecha</th>
                <th className="p-2 text-left">Entregadas</th>
                <th className="p-2 text-left">Calificadas</th>
                <th className="p-2 text-left">Pendientes</th>
                <th className="p-2 text-left">No entregó</th>
                <th className="p-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b hover:bg-muted/30">
                  <td className="p-2"><Checkbox checked={selected.has(r.id)} onCheckedChange={()=>toggleSelect(r.id)} /></td>
                  <td className="p-2 font-medium">{r.nombre}</td>
                  <td className="p-2">
                    <Button size="sm" variant={r.activa ? 'default':'outline'} onClick={()=>updateRow(r.id, { activa: !r.activa })}>
                      {r.activa ? 'Activa':'Inactiva'}
                    </Button>
                  </td>
                  <td className="p-2">
                    <Input type="number" className="w-20" value={r.semana_activacion ?? ''} onChange={e=>updateRow(r.id,{ semana_activacion: e.target.value ? Number(e.target.value): null })} />
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-1">
                      <Input type="date" className="w-36" value={r.fecha_activacion ?? ''} onChange={e=>updateRow(r.id,{ fecha_activacion: e.target.value || null })} />
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </td>
                  <td className="p-2">{r.entregadas ?? 0}</td>
                  <td className="p-2">{r.calificadas ?? 0}</td>
                  <td className="p-2">{r.pendientes ?? 0}</td>
                  <td className="p-2">{r.noEntrego ?? 0}</td>
                  <td className="p-2 space-x-2">
                    <Badge variant="outline">#{r.orden}</Badge>
                  </td>
                </tr>
              ))}
              {loading && (
                <tr><td colSpan={10} className="p-4 text-center text-xs text-muted-foreground">Cargando...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}