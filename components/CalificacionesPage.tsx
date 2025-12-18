import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
// Usar select nativo para evitar problemas de interacción con el UI Select
import { Input } from './ui/input';
import { Button } from './ui/button';
import { evidenciasApi } from '../utils/api';

interface EvidenciaItem {
  id: number;
  documento: string;
  evidencia_nombre: string;
  letra?: string | null;
  estado?: string | null;
  observaciones?: string | null;
  created_at?: string;
  updated_at?: string;
}

export function CalificacionesPage() {
  const [items, setItems] = useState<EvidenciaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  // Trimestre eliminado (no se usa)
  const [estado, setEstado] = useState<string | undefined>(undefined);
  const [total, setTotal] = useState(0);

  async function load() {
    setLoading(true);
    try {
      const res = await evidenciasApi.list({ page, pageSize, search, estado });
      setItems(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch (e) {
      // noop: UI mínima
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, estado]);

  // Materia/Ficha selectors removed: evidencias table doesn't include these keys

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="text-sm">Buscar estudiante</label>
          <Input placeholder="Nombre o documento" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {/* Materia y Ficha removidos para evidencias */}
        {/* Trimestre eliminado */}
        <div>
          <label className="text-sm">Estado</label>
          <select className="border rounded px-2 py-1" value={estado ?? ''} onChange={e => setEstado(e.target.value || undefined)}>
            <option value="">Todos</option>
            <option value="Aprobado">Aprobado</option>
            <option value="Reprobado">Reprobado</option>
            <option value="Cursando">Cursando</option>
          </select>
        </div>
        <Button onClick={() => { setPage(1); load(); }} disabled={loading}>Buscar</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Documento</TableHead>
              <TableHead>Evidencia</TableHead>
              <TableHead>Letra</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Observaciones</TableHead>
              <TableHead>Creado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it) => (
              <TableRow key={it.id}>
                <TableCell>{it.documento}</TableCell>
                <TableCell>{it.evidencia_nombre}</TableCell>
                <TableCell>{it.letra ?? '—'}</TableCell>
                <TableCell>{it.estado ?? '—'}</TableCell>
                <TableCell>{it.observaciones ?? '—'}</TableCell>
                <TableCell>{it.created_at ? new Date(it.created_at).toLocaleString() : '—'}</TableCell>
              </TableRow>
            ))}
            {!items.length && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">Sin resultados</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Total: {total}</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={page<=1 || loading} onClick={() => setPage(p => Math.max(1, p-1))}>Anterior</Button>
          <span className="text-sm">Página {page} de {totalPages}</span>
          <Button variant="outline" disabled={page>=totalPages || loading} onClick={() => setPage(p => Math.min(totalPages, p+1))}>Siguiente</Button>
        </div>
      </div>
    </div>
  );
}
