import { createContext, useContext, ReactNode } from 'react';
import { 
  createAuditLog, 
  AuditAction, 
  AuditLog,
  AuditSeverity 
} from '../utils/auditLogger';
import { useAuth } from './useAuth';

interface AuditContextType {
  log: (params: {
    action: AuditAction;
    description: string;
    targetType?: string;
    targetId?: string;
    targetName?: string;
    metadata?: any;
    changes?: { field: string; oldValue: any; newValue: any }[];
    success?: boolean;
    errorMessage?: string;
    severity?: AuditSeverity;
  }) => AuditLog;
}

const AuditContext = createContext<AuditContextType | undefined>(undefined);

export function AuditProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const log = (params: Parameters<AuditContextType['log']>[0]): AuditLog => {
    // Si no hay usuario, usar valores por defecto (para logs de sistema)
    const userId = user?.id || 'system';
    const userName = user?.nombre ? `${user.nombre} ${user.apellido}` : 'Sistema';
    const userRole = user?.rol || 'system';

    return createAuditLog({
      ...params,
      userId,
      userName,
      userRole
    });
  };

  return (
    <AuditContext.Provider value={{ log }}>
      {children}
    </AuditContext.Provider>
  );
}

export function useAuditLog() {
  const context = useContext(AuditContext);
  if (context === undefined) {
    throw new Error('useAuditLog must be used within an AuditProvider');
  }
  return context;
}
