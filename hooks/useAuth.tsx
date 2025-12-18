import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { createAuditLog } from '../utils/auditLogger';
import { api } from '../utils/api';
import type { User } from '../types/user';
import type { UserRole } from '../types/user';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// No mapping helper needed here; api.me() already returns a User

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Carga inicial: si hay tokens en storage intentar /auth/me
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (api.getTokens()) {
          const u = await api.me();
            if (!cancelled) setUser(u);
        }
      } catch (e) {
        // tokens inválidos -> limpiar
        api.clearTokens();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      await api.login(email, password);
      const backendUser = await api.me();
      setUser(backendUser);
      createAuditLog({
        action: 'auth.login.success',
        userId: backendUser.id,
        userName: `${backendUser.nombre} ${backendUser.apellido}`,
        userRole: backendUser.rol,
        description: `Inicio de sesión exitoso para ${backendUser.email}`,
        success: true
      });
      return true;
    } catch (e:any) {
      createAuditLog({
        action: 'auth.login.failed',
        userId: 'anonymous',
        userName: 'Usuario Anónimo',
        userRole: 'guest',
        description: `Intento fallido de inicio de sesión para ${email}`,
        success: false,
        errorMessage: e?.message || 'Error desconocido',
        severity: 'warning',
        metadata: { email }
      });
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    if (user) {
      // Registrar logout
      createAuditLog({
        action: 'auth.logout',
        userId: user.id,
        userName: `${user.nombre} ${user.apellido}`,
        userRole: user.rol,
        description: `Cierre de sesión para ${user.email}`,
        success: true
      });
    }
    api.clearTokens();
    setUser(null);
  }, [user]);

  const updateProfile = async (updates: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Detectar cambios
      const changes = Object.entries(updates).map(([field, newValue]) => ({
        field,
        oldValue: (user as any)[field],
        newValue
      }));
      
      // Simulación de actualización de perfil
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      
      // Registrar actualización de perfil
      createAuditLog({
        action: 'user.update',
        userId: user.id,
        userName: `${user.nombre} ${user.apellido}`,
        userRole: user.rol,
        description: `Actualización de perfil de ${user.email}`,
        targetType: 'user',
        targetId: user.id,
        targetName: `${user.nombre} ${user.apellido}`,
        changes,
        success: true
      });
      
      // TODO: Implementar endpoint real de actualización de perfil
      
      return true;
    } catch (error) {
      // Registrar error
      if (user) {
        createAuditLog({
          action: 'user.update',
          userId: user.id,
          userName: `${user.nombre} ${user.apellido}`,
          userRole: user.rol,
          description: `Error al actualizar perfil de ${user.email}`,
          targetType: 'user',
          targetId: user.id,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Error desconocido',
          severity: 'error'
        });
      }
      
      return false;
    }
  };

  const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    try {
      await api.changePassword(oldPassword, newPassword);
      createAuditLog({
        action: 'password.change_success',
        userId: user?.id || 'desconocido',
        userName: user ? `${user.nombre} ${user.apellido}` : 'desconocido',
        userRole: user?.rol || 'docente',
        description: 'Contraseña actualizada correctamente',
        success: true,
        severity: 'warning'
      });
      return true;
    } catch (e:any) {
      createAuditLog({
        action: 'password.change_error',
        userId: user?.id || 'desconocido',
        userName: user ? `${user.nombre} ${user.apellido}` : 'desconocido',
        userRole: user?.rol || 'docente',
        description: 'Error al cambiar contraseña',
        success: false,
        severity: 'error',
        errorMessage: e?.message || 'Error desconocido'
      });
      return false;
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      updateProfile,
      changePassword,
      isAuthenticated: !!user,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}