import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { useAuth } from '../hooks/useAuth';
import { docenteApi } from '../utils/api';
import { 
  Trophy, 
  Clock, 
  FileText, 
  Users, 
  BookOpen,
  Target,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface DynamicStats {
  completitudPerfil: number;
  diasConectado: number;
  actividadReciente: number;
  notificacionesPendientes: number;
  tareasCalificadas?: number;
  estudiantesGestionados?: number;
  reportesGenerados?: number;
  sistemasAdministrados?: number;
}

function computeProfileCompletion(user: any): number {
  if (!user) return 0;
  const fields = [user.nombre, user.apellido, user.email, user.telefono, user.cedula, user.departamento, user.especialidad, user.biografia];
  const filled = fields.filter(f => f && String(f).trim() !== '').length;
  return Math.min(100, Math.round((filled / fields.length) * 100));
}

function daysSince(fecha: string): number {
  try {
    const d = new Date(fecha);
    const diff = Date.now() - d.getTime();
    return Math.max(0, Math.floor(diff / (1000*60*60*24)));
  } catch { return 0; }
}

export function ProfileStats() {
  const { user } = useAuth();
  
  if (!user) return null;

  const [stats, setStats] = useState<DynamicStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) return;
      const base: DynamicStats = {
        completitudPerfil: computeProfileCompletion(user),
        diasConectado: daysSince(user.fechaIngreso),
        actividadReciente: 0,
        notificacionesPendientes: 0,
      };
      // Docente: aprovechar stats de docenteApi
      if (user.rol === 'docente') {
        try {
          const r = await docenteApi.getDocenteStats();
          if (r.success && r.data) {
            base.tareasCalificadas = r.data.calificacionesCargadas;
            base.estudiantesGestionados = r.data.entregadas; // heurística, ajustar si endpoint específico
          }
        } catch {/* ignore */}
      }
      // Administrador / coordinador: placeholders con fórmula básica hasta endpoints dedicados
      if (user.rol === 'coordinador') {
        base.reportesGenerados = Math.floor(base.diasConectado / 10);
        base.estudiantesGestionados = (base.tareasCalificadas || 0) * 2;
      }
      if (user.rol === 'administrador') {
        base.sistemasAdministrados = 5; // fijo hasta endpoint real
        base.reportesGenerados = Math.floor(base.diasConectado / 7);
      }
      if (!cancelled) setStats(base);
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  if (!stats) return null;

  const getCompletitudColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const statCards = [
    {
      title: 'Completitud del Perfil',
      value: `${stats.completitudPerfil}%`,
      description: 'Información completa',
      icon: Target,
      color: getCompletitudColor(stats.completitudPerfil),
      showProgress: true,
      progressValue: stats.completitudPerfil
    },
    {
      title: 'Días Conectado',
      value: stats.diasConectado.toString(),
      description: 'En los últimos 6 meses',
      icon: Calendar,
      color: 'text-blue-600'
    },
    {
      title: 'Actividad Reciente',
      value: stats.actividadReciente.toString(),
      description: 'Acciones esta semana',
      icon: TrendingUp,
      color: 'text-purple-600'
    },
    {
      title: 'Notificaciones',
      value: stats.notificacionesPendientes.toString(),
      description: 'Pendientes por revisar',
      icon: Clock,
      color: stats.notificacionesPendientes > 0 ? 'text-orange-600' : 'text-green-600'
    }
  ];

  // Agregar estadísticas específicas por rol
  if (user.rol === 'administrador') {
    statCards.push(
      {
        title: 'Sistemas Gestionados',
        value: stats.sistemasAdministrados?.toString() || '0',
        description: 'Módulos activos',
        icon: BookOpen,
        color: 'text-indigo-600'
      },
      {
        title: 'Reportes Generados',
        value: stats.reportesGenerados?.toString() || '0',
        description: 'Este mes',
        icon: FileText,
        color: 'text-teal-600'
      }
    );
  }

  if (user.rol === 'coordinador') {
    statCards.push(
      {
        title: 'Estudiantes Gestionados',
        value: stats.estudiantesGestionados?.toString() || '0',
        description: 'En seguimiento',
        icon: Users,
        color: 'text-green-600'
      },
      {
        title: 'Reportes de Seguimiento',
        value: stats.reportesGenerados?.toString() || '0',
        description: 'Generados este mes',
        icon: FileText,
        color: 'text-blue-600'
      }
    );
  }

  if (user.rol === 'docente') {
    statCards.push(
      {
        title: 'Tareas Calificadas',
        value: stats.tareasCalificadas?.toString() || '0',
        description: 'Este período',
        icon: Trophy,
        color: 'text-yellow-600'
      },
      {
        title: 'Estudiantes Activos',
        value: stats.estudiantesGestionados?.toString() || '0',
        description: 'En mis cursos',
        icon: Users,
        color: 'text-green-600'
      }
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full bg-muted ${stat.color}`}>
                <IconComponent className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <p className="text-xs text-muted-foreground mb-2">
                {stat.description}
              </p>
              {stat.showProgress && stat.progressValue && (
                <Progress 
                  value={stat.progressValue} 
                  className="h-2"
                />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}