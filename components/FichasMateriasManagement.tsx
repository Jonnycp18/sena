import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAuditLog } from '../hooks/useAuditLog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  BookOpen,
  GraduationCap,
  Users,
  Clock,
  Download,
  Upload
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { FichaForm } from './FichaForm';
import { MateriaForm } from './MateriaForm';
import { FichaDetail } from './FichaDetail';
import { toast } from 'sonner@2.0.3';
import { api } from '../utils/api';

// Interfaces
export interface Ficha {
  id: string;
  nombre: string;
  codigo: string;
  descripcion: string;
  estado: 'activa' | 'inactiva';
  fechaCreacion: string;
  tipoPrograma: 'tecnico' | 'tecnologico' | 'profesional';
  modalidad: 'presencial' | 'virtual' | 'mixta';
}

export interface Materia {
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

// Datos de prueba
const mockFichas: Ficha[] = [
  {
    id: '1',
    nombre: 'Técnico en Desarrollo de Software',
    codigo: 'TDS-001',
    descripcion: 'Programa técnico enfocado en el desarrollo de aplicaciones de software',
    estado: 'activa',
    fechaCreacion: '2023-01-15',
    tipoPrograma: 'tecnico',
    modalidad: 'presencial'
  },
  {
    id: '2',
    nombre: 'Tecnólogo en Sistemas de Información',
    codigo: 'TSI-002',
    descripcion: 'Programa tecnológico en sistemas de información empresarial',
    estado: 'activa',
    fechaCreacion: '2023-02-20',
    tipoPrograma: 'tecnologico',
    modalidad: 'mixta'
  },
  {
    id: '3',
    nombre: 'Técnico en Redes y Telecomunicaciones',
    codigo: 'TRT-003',
    descripcion: 'Programa técnico especializado en infraestructura de redes',
    estado: 'inactiva',
    fechaCreacion: '2022-08-10',
    tipoPrograma: 'tecnico',
    modalidad: 'presencial'
  }
];

const mockMaterias: Materia[] = [
  {
    id: '1',
    nombre: 'Fundamentos de Programación',
    codigo: 'FP-101',
    descripcion: 'Introducción a los conceptos básicos de programación',
    horas: 64,
    fichaId: '1',
    docenteId: '3',
    prerrequisitos: [],
    estado: 'activa',
    tipoMateria: 'teorico-practica'
  },
  {
    id: '2',
    nombre: 'Bases de Datos',
    codigo: 'BD-201',
    descripcion: 'Diseño e implementación de bases de datos relacionales',
    horas: 48,
    fichaId: '1',
    docenteId: '3',
    prerrequisitos: ['1'],
    estado: 'activa',
    tipoMateria: 'teorico-practica'
  },
  {
    id: '3',
    nombre: 'Desarrollo Web',
    codigo: 'DW-301',
    descripcion: 'Desarrollo de aplicaciones web con tecnologías modernas',
    horas: 64,
    fichaId: '1',
    prerrequisitos: ['1', '2'],
    estado: 'activa',
    tipoMateria: 'practica'
  },
  {
    id: '4',
    nombre: 'Sistemas Operativos',
    codigo: 'SO-102',
    descripcion: 'Fundamentos de sistemas operativos',
    horas: 48,
    fichaId: '2',
    docenteId: '3',
    prerrequisitos: [],
    estado: 'activa',
    tipoMateria: 'teorica'
  },
  {
    id: '5',
    nombre: 'Configuración de Redes',
    codigo: 'CR-201',
    descripcion: 'Configuración y administración de redes',
    horas: 64,
    fichaId: '3',
    prerrequisitos: [],
    estado: 'inactiva',
    tipoMateria: 'practica'
  }
];

export function FichasMateriasManagement() {
  const { user } = useAuth();
  const { log } = useAuditLog();
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos desde el backend
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [{ fichas }, { materias }] = await Promise.all([
          api.getFichas({ page: 1, pageSize: 50 }),
          api.getMaterias({ page: 1, pageSize: 200 }),
        ]);
        if (!mounted) return;
        setFichas(fichas as unknown as Ficha[]);
        setMaterias(materias as unknown as Materia[]);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError('No se pudieron cargar fichas y materias. Usando datos locales.');
        setFichas(mockFichas);
        setMaterias(mockMaterias);
        toast.error('Error cargando fichas/materias desde el servidor');
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
  const [activeTab, setActiveTab] = useState('fichas');
  
  // Estados para fichas
  const [searchFichas, setSearchFichas] = useState('');
  const [filterFichasTipo, setFilterFichasTipo] = useState<string>('todos');
  const [filterFichasEstado, setFilterFichasEstado] = useState<string>('todos');
  const [selectedFicha, setSelectedFicha] = useState<Ficha | null>(null);
  const [isFichaFormOpen, setIsFichaFormOpen] = useState(false);
  const [editingFicha, setEditingFicha] = useState<Ficha | null>(null);
  
  // Estados para materias
  const [searchMaterias, setSearchMaterias] = useState('');
  const [filterMateriasFicha, setFilterMateriasFicha] = useState<string>('todos');
  const [filterMateriasEstado, setFilterMateriasEstado] = useState<string>('todos');
  const [isMateriaFormOpen, setIsMateriaFormOpen] = useState(false);
  const [editingMateria, setEditingMateria] = useState<Materia | null>(null);

  // Verificar permisos de administrador
  if (user?.rol !== 'administrador') {
    // 🔐 Registrar intento de acceso denegado
    log({
      action: 'security.access_denied',
      description: 'Intento de acceso denegado a Gestión de Fichas y Materias',
      success: false,
      severity: 'warning',
      metadata: {
        seccionSolicitada: 'FichasMateriasManagement',
        rolRequerido: 'administrador',
        rolActual: user?.rol || 'guest'
      }
    });

    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h3>Acceso Denegado</h3>
          <p className="text-muted-foreground">
            No tienes permisos para acceder a la gestión de fichas y materias.
          </p>
        </div>
      </div>
    );
  }

  // Filtrar fichas
  const filteredFichas = useMemo(() => {
    return fichas.filter(ficha => {
      const matchesSearch = 
        ficha.nombre.toLowerCase().includes(searchFichas.toLowerCase()) ||
        ficha.codigo.toLowerCase().includes(searchFichas.toLowerCase());
      
      const matchesTipo = filterFichasTipo === 'todos' || ficha.tipoPrograma === filterFichasTipo;
      const matchesEstado = filterFichasEstado === 'todos' || ficha.estado === filterFichasEstado;
      
      return matchesSearch && matchesTipo && matchesEstado;
    });
  }, [fichas, searchFichas, filterFichasTipo, filterFichasEstado]);

  // Filtrar materias
  const filteredMaterias = useMemo(() => {
    return materias.filter(materia => {
      const matchesSearch = 
        materia.nombre.toLowerCase().includes(searchMaterias.toLowerCase()) ||
        materia.codigo.toLowerCase().includes(searchMaterias.toLowerCase());
      
      const matchesFicha = filterMateriasFicha === 'todos' || materia.fichaId === filterMateriasFicha;
      const matchesEstado = filterMateriasEstado === 'todos' || materia.estado === filterMateriasEstado;
      
      return matchesSearch && matchesFicha && matchesEstado;
    });
  }, [materias, searchMaterias, filterMateriasFicha, filterMateriasEstado]);

  // Estadísticas
  const stats = useMemo(() => {
    const totalFichas = fichas.length;
    const fichasActivas = fichas.filter(f => f.estado === 'activa').length;
    const totalMaterias = materias.length;
    const materiasActivas = materias.filter(m => m.estado === 'activa').length;
    const materiasConDocente = materias.filter(m => m.docenteId).length;

    return { totalFichas, fichasActivas, totalMaterias, materiasActivas, materiasConDocente };
  }, [fichas, materias]);

  // Handlers para fichas
  const handleCreateFicha = async (fichaData: Partial<Ficha>) => {
    try {
      const payload = {
        numero: (fichaData.codigo || '').trim(),
        nombre: (fichaData.nombre || '').trim(),
        descripcion: (fichaData.descripcion || '').trim() || undefined,
        estado: 'Activa',
        fecha_inicio: (fichaData as any).fecha_inicio || new Date().toISOString().slice(0,10),
        fecha_fin: (fichaData as any).fecha_fin || new Date(new Date().setFullYear(new Date().getFullYear(), 11, 31)).toISOString().slice(0,10)
      };
      const creada = await api.createFicha(payload);
      const newFicha: Ficha = {
        id: creada.id,
        nombre: creada.nombre,
        codigo: creada.codigo,
        descripcion: creada.descripcion,
        estado: creada.estado,
        fechaCreacion: creada.fechaCreacion,
        tipoPrograma: 'tecnico',
        modalidad: 'presencial'
      } as Ficha;
      setFichas([...fichas, newFicha]);
      setIsFichaFormOpen(false);
      log({
        action: 'ficha.create',
        description: `Nueva ficha creada: ${newFicha.nombre} (${newFicha.codigo})`,
        targetType: 'ficha',
        targetId: newFicha.id,
        targetName: newFicha.nombre,
        metadata: {
          codigo: newFicha.codigo,
          tipoPrograma: newFicha.tipoPrograma,
          modalidad: newFicha.modalidad
        },
        success: true
      });
      toast.success('Ficha creada exitosamente');
    } catch (error) {
      log({
        action: 'ficha.create',
        description: `Error al crear ficha: ${fichaData.nombre}`,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error desconocido',
        severity: 'error',
        metadata: { codigo: fichaData.codigo }
      });
      toast.error('Error al crear ficha');
    }
  };

  const handleEditFicha = async (fichaData: Partial<Ficha>) => {
    if (!editingFicha) return;

    try {
      // Detectar cambios específicos
      const changes: { field: string; oldValue: any; newValue: any }[] = [];
      Object.keys(fichaData).forEach(key => {
        const oldValue = (editingFicha as any)[key];
        const newValue = (fichaData as any)[key];
        if (oldValue !== newValue) {
          changes.push({ field: key, oldValue, newValue });
        }
      });

      // Persistir en backend
      await api.updateFicha(Number(editingFicha.id), {
        numero: fichaData.codigo?.trim(),
        nombre: fichaData.nombre?.trim(),
        descripcion: fichaData.descripcion?.trim(),
        estado: fichaData.estado === 'activa' ? 'Activa' : 'Inactiva'
      });

      const updatedFichas: Ficha[] = fichas.map(ficha => 
        ficha.id === editingFicha.id 
          ? ({ ...ficha, ...fichaData } as Ficha)
          : ficha
      );

  setFichas(updatedFichas);
      const updatedFicha = updatedFichas.find(f => f.id === editingFicha.id)!;

      // ✅ Registrar actualización exitosa
      log({
        action: 'ficha.update',
        description: `Ficha actualizada: ${updatedFicha.nombre} (${updatedFicha.codigo})`,
        targetType: 'ficha',
        targetId: updatedFicha.id,
        targetName: updatedFicha.nombre,
        changes,
        metadata: {
          codigo: updatedFicha.codigo,
          tipoPrograma: updatedFicha.tipoPrograma
        },
        success: true
      });

      setEditingFicha(null);
      setIsFichaFormOpen(false);
      toast.success('Ficha actualizada exitosamente');
    } catch (error) {
      // ❌ Registrar error
      log({
        action: 'ficha.update',
        description: `Error al actualizar ficha: ${editingFicha.nombre}`,
        targetType: 'ficha',
        targetId: editingFicha.id,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error desconocido',
        severity: 'error'
      });

      toast.error('Error al actualizar ficha');
    }
  };

  const handleDeleteFicha = async (fichaId: string) => {
    const fichaToDelete = fichas.find(f => f.id === fichaId);
    if (!fichaToDelete) return;

    // Verificar si la ficha tiene materias asociadas
    const materiasAsociadas = materias.filter(m => m.fichaId === fichaId);
    if (materiasAsociadas.length > 0) {
      // ⚠️ Registrar intento de eliminación bloqueado
      log({
        action: 'ficha.delete',
        description: `Intento de eliminación bloqueado: Ficha ${fichaToDelete.nombre} tiene materias asociadas`,
        targetType: 'ficha',
        targetId: fichaId,
        targetName: fichaToDelete.nombre,
        success: false,
        errorMessage: 'La ficha tiene materias asociadas',
        severity: 'warning',
        metadata: {
          codigo: fichaToDelete.codigo,
          materiasAsociadas: materiasAsociadas.length
        }
      });

      toast.error('No se puede eliminar la ficha porque tiene materias asociadas');
      return;
    }

    try {
      await api.deleteFicha(Number(fichaId));
      setFichas(fichas.filter(ficha => ficha.id !== fichaId));

      // ⚠️ Registrar eliminación (warning severity)
      log({
        action: 'ficha.delete',
        description: `Ficha eliminada: ${fichaToDelete.nombre} (${fichaToDelete.codigo})`,
        targetType: 'ficha',
        targetId: fichaId,
        targetName: fichaToDelete.nombre,
        metadata: {
          codigo: fichaToDelete.codigo,
          tipoPrograma: fichaToDelete.tipoPrograma,
          duracionSemestres: fichaToDelete.duracionSemestres
        },
        success: true,
        severity: 'warning'
      });

      toast.success('Ficha eliminada exitosamente');
    } catch (error) {
      // ❌ Registrar error
      log({
        action: 'ficha.delete',
        description: `Error al eliminar ficha: ${fichaToDelete.nombre}`,
        targetType: 'ficha',
        targetId: fichaId,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error desconocido',
        severity: 'error'
      });

      toast.error('Error al eliminar ficha');
    }
  };

  const handleToggleFichaStatus = async (fichaId: string) => {
    const updatedFichas = fichas.map(ficha => 
      ficha.id === fichaId 
        ? { 
            ...ficha, 
            estado: (ficha.estado === 'activa' ? 'inactiva' : 'activa') as 'activa' | 'inactiva'
          }
        : ficha
    );

    // Persistir en backend
    const nuevoEstadoApi = updatedFichas.find(f => f.id === fichaId)?.estado === 'activa' ? 'Activa' : 'Inactiva';
    await api.setFichaEstado(Number(fichaId), nuevoEstadoApi as any);
    setFichas(updatedFichas);
    const newStatus = updatedFichas.find(f => f.id === fichaId)?.estado;
    toast.success(`Ficha ${newStatus === 'activa' ? 'activada' : 'desactivada'} exitosamente`);
  };

  // Handlers para materias
  const handleCreateMateria = async (materiaData: Partial<Materia>) => {
    try {
      const payload = {
        codigo: (materiaData.codigo || '').trim(),
        nombre: (materiaData.nombre || '').trim(),
        descripcion: (materiaData.descripcion || '').trim() || undefined,
        horas_semanales: Number(materiaData.horas || 48),
        ficha_id: Number(materiaData.fichaId),
        docente_id: materiaData.docenteId ? Number(materiaData.docenteId) : undefined,
        estado: 'Activa'
      };
      const creada = await api.createMateria(payload);
      const newMateria: Materia = {
        id: creada.id,
        nombre: creada.nombre,
        codigo: creada.codigo,
        descripcion: creada.descripcion,
        horas: creada.horas_semanales ?? creada.horas ?? Number(materiaData.horas || 48),
        fichaId: String(creada.fichaId),
        docenteId: creada.docenteId,
        prerrequisitos: [],
        estado: creada.estado,
        tipoMateria: materiaData.tipoMateria || 'teorico-practica'
      } as Materia;

      setMaterias([...materias, newMateria]);
      setIsMateriaFormOpen(false);

      const fichaAsociada = fichas.find(f => f.id === newMateria.fichaId);

      // ✅ Registrar creación exitosa
      log({
        action: 'materia.create',
        description: `Nueva materia creada: ${newMateria.nombre} (${newMateria.codigo})`,
        targetType: 'materia',
        targetId: newMateria.id,
        targetName: newMateria.nombre,
        metadata: {
          codigo: newMateria.codigo,
          horas: newMateria.horas,
          fichaAsociada: fichaAsociada?.nombre || 'Sin asignar',
          tipoMateria: newMateria.tipoMateria
        },
        success: true
      });

      toast.success('Materia creada exitosamente');
    } catch (error) {
      // ❌ Registrar error
      log({
        action: 'materia.create',
        description: `Error al crear materia: ${materiaData.nombre}`,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error desconocido',
        severity: 'error',
        metadata: { codigo: materiaData.codigo }
      });

      toast.error('Error al crear materia');
    }
  };

  const handleEditMateria = async (materiaData: Partial<Materia>) => {
    if (!editingMateria) return;

    try {
      // Detectar cambios específicos
      const changes: { field: string; oldValue: any; newValue: any }[] = [];
      Object.keys(materiaData).forEach(key => {
        const oldValue = (editingMateria as any)[key];
        const newValue = (materiaData as any)[key];
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changes.push({ field: key, oldValue, newValue });
        }
      });

      // Persistir en backend
      await api.updateMateria(Number(editingMateria.id), {
        codigo: materiaData.codigo?.trim(),
        nombre: materiaData.nombre?.trim(),
        descripcion: materiaData.descripcion?.trim(),
        horas_semanales: materiaData.horas,
        ficha_id: materiaData.fichaId ? Number(materiaData.fichaId) : undefined,
        docente_id: materiaData.docenteId ? Number(materiaData.docenteId) : undefined,
        estado: materiaData.estado === 'activa' ? 'Activa' : 'Inactiva'
      });

      const updatedMaterias: Materia[] = materias.map(materia => 
        materia.id === editingMateria.id 
          ? ({ ...materia, ...materiaData } as Materia)
          : materia
      );

  setMaterias(updatedMaterias);
      const updatedMateria = updatedMaterias.find(m => m.id === editingMateria.id)!;

      // ✅ Registrar actualización exitosa
      log({
        action: 'materia.update',
        description: `Materia actualizada: ${updatedMateria.nombre} (${updatedMateria.codigo})`,
        targetType: 'materia',
        targetId: updatedMateria.id,
        targetName: updatedMateria.nombre,
        changes,
        metadata: {
          codigo: updatedMateria.codigo,
          horas: updatedMateria.horas
        },
        success: true
      });

      setEditingMateria(null);
      setIsMateriaFormOpen(false);
      toast.success('Materia actualizada exitosamente');
    } catch (error) {
      // ❌ Registrar error
      log({
        action: 'materia.update',
        description: `Error al actualizar materia: ${editingMateria.nombre}`,
        targetType: 'materia',
        targetId: editingMateria.id,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error desconocido',
        severity: 'error'
      });

      toast.error('Error al actualizar materia');
    }
  };

  const handleDeleteMateria = async (materiaId: string) => {
    const materiaToDelete = materias.find(m => m.id === materiaId);
    if (!materiaToDelete) return;

    // Verificar si otras materias dependen de esta como prerrequisito
    const dependientes = materias.filter(m => m.prerrequisitos.includes(materiaId));
    if (dependientes.length > 0) {
      // ⚠️ Registrar intento de eliminación bloqueado
      log({
        action: 'materia.delete',
        description: `Intento de eliminación bloqueado: Materia ${materiaToDelete.nombre} es prerrequisito de otras`,
        targetType: 'materia',
        targetId: materiaId,
        targetName: materiaToDelete.nombre,
        success: false,
        errorMessage: 'La materia es prerrequisito de otras materias',
        severity: 'warning',
        metadata: {
          codigo: materiaToDelete.codigo,
          materiasDependientes: dependientes.length
        }
      });

      toast.error('No se puede eliminar la materia porque es prerrequisito de otras materias');
      return;
    }

    try {
      await api.deleteMateria(Number(materiaId));
      setMaterias(materias.filter(materia => materia.id !== materiaId));

      // ⚠️ Registrar eliminación (warning severity)
      log({
        action: 'materia.delete',
        description: `Materia eliminada: ${materiaToDelete.nombre} (${materiaToDelete.codigo})`,
        targetType: 'materia',
        targetId: materiaId,
        targetName: materiaToDelete.nombre,
        metadata: {
          codigo: materiaToDelete.codigo,
          fichaAsociada: getFichaName(materiaToDelete.fichaId)
        },
        success: true,
        severity: 'warning'
      });

      toast.success('Materia eliminada exitosamente');
    } catch (error) {
      // ❌ Registrar error
      log({
        action: 'materia.delete',
        description: `Error al eliminar materia: ${materiaToDelete.nombre}`,
        targetType: 'materia',
        targetId: materiaId,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error desconocido',
        severity: 'error'
      });

      toast.error('Error al eliminar materia');
    }
  };

  const handleToggleMateriaStatus = async (materiaId: string) => {
    const updatedMaterias = materias.map(materia => 
      materia.id === materiaId 
        ? { 
            ...materia, 
            estado: (materia.estado === 'activa' ? 'inactiva' : 'activa') as 'activa' | 'inactiva'
          }
        : materia
    );

    const nuevoEstadoApi = updatedMaterias.find(m => m.id === materiaId)?.estado === 'activa' ? 'Activa' : 'Inactiva';
    await api.setMateriaEstado(Number(materiaId), nuevoEstadoApi as any);
    setMaterias(updatedMaterias);
    const newStatus = updatedMaterias.find(m => m.id === materiaId)?.estado;
    toast.success(`Materia ${newStatus === 'activa' ? 'activada' : 'desactivada'} exitosamente`);
  };

  const getFichaName = (fichaId: string) => {
    return fichas.find(f => f.id === fichaId)?.nombre || 'Sin asignar';
  };

  const getTipoBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case 'tecnico': return 'secondary';
      case 'tecnologico': return 'default';
      case 'profesional': return 'destructive';
      default: return 'outline';
    }
  };

  const getEstadoBadgeVariant = (estado: string) => {
    return estado === 'activa' ? 'default' : 'secondary';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Fichas y Materias</h1>
          <p className="text-muted-foreground">
            Gestiona los programas académicos y sus materias
          </p>
          {loading && (
            <p className="text-sm text-muted-foreground">Cargando datos…</p>
          )}
          {error && (
            <p className="text-sm text-yellow-600">{error}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Total Fichas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFichas}</div>
            <p className="text-xs text-muted-foreground">
              {stats.fichasActivas} activas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Total Materias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMaterias}</div>
            <p className="text-xs text-muted-foreground">
              {stats.materiasActivas} activas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              Con Docente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.materiasConDocente}</div>
            <p className="text-xs text-muted-foreground">
              materias asignadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Sin Docente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.totalMaterias - stats.materiasConDocente}
            </div>
            <p className="text-xs text-muted-foreground">
              por asignar
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalFichas > 0 ? Math.round(stats.totalMaterias / stats.totalFichas) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              materias por ficha
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contenido principal con pestañas */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="fichas">Fichas Académicas</TabsTrigger>
          <TabsTrigger value="materias">Materias</TabsTrigger>
        </TabsList>

        <TabsContent value="fichas" className="space-y-4">
          {/* Filtros para fichas */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar fichas por nombre o código..."
                      value={searchFichas}
                      onChange={(e) => setSearchFichas(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterFichasTipo} onValueChange={setFilterFichasTipo}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tipo de programa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los tipos</SelectItem>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="tecnologico">Tecnológico</SelectItem>
                    <SelectItem value="profesional">Profesional</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterFichasEstado} onValueChange={setFilterFichasEstado}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    <SelectItem value="activa">Activa</SelectItem>
                    <SelectItem value="inactiva">Inactiva</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog open={isFichaFormOpen} onOpenChange={setIsFichaFormOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingFicha(null)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nueva Ficha
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingFicha ? 'Editar Ficha' : 'Crear Ficha'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingFicha 
                          ? 'Actualiza la información del programa académico.'
                          : 'Completa los datos para crear un nuevo programa académico.'}
                      </DialogDescription>
                    </DialogHeader>
                    <FichaForm
                      ficha={editingFicha}
                      onSubmit={editingFicha ? handleEditFicha : handleCreateFicha}
                      onCancel={() => setIsFichaFormOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de fichas */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ficha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Créditos</TableHead>
                    <TableHead>Modalidad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFichas.map((ficha) => (
                    <TableRow key={ficha.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{ficha.nombre}</div>
                          <div className="text-sm text-muted-foreground">
                            {ficha.codigo}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTipoBadgeVariant(ficha.tipoPrograma)}>
                          {ficha.tipoPrograma}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {ficha.duracionSemestres} semestres
                      </TableCell>
                      <TableCell>
                        {ficha.creditosTotales} créditos
                      </TableCell>
                      <TableCell>
                        {ficha.modalidad}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getEstadoBadgeVariant(ficha.estado)}>
                          {ficha.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => setSelectedFicha(ficha)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setEditingFicha(ficha);
                                setIsFichaFormOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleToggleFichaStatus(ficha.id)}
                            >
                              {ficha.estado === 'activa' ? 'Desactivar' : 'Activar'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
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
                                  <AlertDialogTitle>¿Eliminar ficha?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción eliminará permanentemente la ficha "{ficha.nombre}".
                                    Las materias asociadas también se verán afectadas.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteFicha(ficha.id)}
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
        </TabsContent>

        <TabsContent value="materias" className="space-y-4">
          {/* Filtros para materias */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar materias por nombre o código..."
                      value={searchMaterias}
                      onChange={(e) => setSearchMaterias(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterMateriasFicha} onValueChange={setFilterMateriasFicha}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filtrar por ficha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas las fichas</SelectItem>
                    {fichas.map((ficha) => (
                      <SelectItem key={ficha.id} value={ficha.id}>
                        {ficha.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterMateriasEstado} onValueChange={setFilterMateriasEstado}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    <SelectItem value="activa">Activa</SelectItem>
                    <SelectItem value="inactiva">Inactiva</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog open={isMateriaFormOpen} onOpenChange={setIsMateriaFormOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingMateria(null)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nueva Materia
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingMateria ? 'Editar Materia' : 'Crear Materia'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingMateria 
                          ? 'Actualiza la información de la materia.'
                          : 'Completa los datos para crear una nueva materia.'}
                      </DialogDescription>
                    </DialogHeader>
                    <MateriaForm
                      materia={editingMateria}
                      fichas={fichas}
                      materias={materias}
                      onSubmit={editingMateria ? handleEditMateria : handleCreateMateria}
                      onCancel={() => setIsMateriaFormOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de materias */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Materia</TableHead>
                    <TableHead>Ficha</TableHead>
                    
                    <TableHead>Horas</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaterias.map((materia) => (
                    <TableRow key={materia.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{materia.nombre}</div>
                          <div className="text-sm text-muted-foreground">
                            {materia.codigo}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {getFichaName(materia.fichaId)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {materia.horas}h
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {materia.tipoMateria}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getEstadoBadgeVariant(materia.estado)}>
                          {materia.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => {
                                setEditingMateria(materia);
                                setIsMateriaFormOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleToggleMateriaStatus(materia.id)}
                            >
                              {materia.estado === 'activa' ? 'Desactivar' : 'Activar'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
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
                                  <AlertDialogTitle>¿Eliminar materia?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción eliminará permanentemente la materia "{materia.nombre}".
                                    Esto puede afectar otras materias que la tengan como prerrequisito.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteMateria(materia.id)}
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
        </TabsContent>
      </Tabs>

      {/* Modal de detalles de ficha */}
      {selectedFicha && (
        <Dialog open={!!selectedFicha} onOpenChange={() => setSelectedFicha(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles de la Ficha</DialogTitle>
            </DialogHeader>
            <FichaDetail 
              ficha={selectedFicha} 
              materias={materias.filter(m => m.fichaId === selectedFicha.id)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}