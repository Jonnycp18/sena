import { useState } from 'react';
import { useAuditLog } from '../hooks/useAuditLog';
import { api } from '../utils/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner@2.0.3';
import { Key, Eye, EyeOff, AlertTriangle } from 'lucide-react';

interface PasswordChangeDialogProps {
  trigger?: React.ReactNode;
}

export function PasswordChangeDialog({ trigger }: PasswordChangeDialogProps) {
  const { log } = useAuditLog();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [errors, setErrors] = useState<string[]>([]);

  const validatePasswords = () => {
    const newErrors: string[] = [];

    if (!passwords.current) {
      newErrors.push('La contraseña actual es requerida');
    }

    if (!passwords.new) {
      newErrors.push('La nueva contraseña es requerida');
    } else {
      if (passwords.new.length < 8) {
        newErrors.push('La nueva contraseña debe tener al menos 8 caracteres');
      }
      if (!/(?=.*[a-z])/.test(passwords.new)) {
        newErrors.push('La nueva contraseña debe contener al menos una minúscula');
      }
      if (!/(?=.*[A-Z])/.test(passwords.new)) {
        newErrors.push('La nueva contraseña debe contener al menos una mayúscula');
      }
      if (!/(?=.*\d)/.test(passwords.new)) {
        newErrors.push('La nueva contraseña debe contener al menos un número');
      }
    }

    if (passwords.new !== passwords.confirm) {
      newErrors.push('Las contraseñas no coinciden');
    }

    if (passwords.current === passwords.new) {
      newErrors.push('La nueva contraseña debe ser diferente a la actual');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswords()) {
      // ⚠️ Registrar validación fallida
      log({
        action: 'password.change_validation_failed',
        description: 'Validación de contraseña fallida',
        success: false,
        severity: 'warning',
        metadata: {
          erroresValidacion: errors.length
        }
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Llamada real a la API
      await api.changePassword(passwords.current, passwords.new);

      // ✅ Registrar cambio exitoso
      log({
        action: 'password.change_success',
        description: 'Contraseña actualizada correctamente',
        metadata: {
          fortalezaContraseña: getStrengthLabel(strength)
        },
        success: true,
        severity: 'warning' // Los cambios de contraseña son eventos de seguridad
      });
      
      toast.success('Contraseña actualizada correctamente');
      setIsOpen(false);
      setPasswords({ current: '', new: '', confirm: '' });
      setErrors([]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

      // ❌ Registrar error al cambiar contraseña
      log({
        action: 'password.change_error',
        description: 'Error al cambiar contraseña',
        success: false,
        severity: 'error',
        errorMessage
      });

      toast.error('Error al cambiar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/(?=.*[a-z])/.test(password)) strength++;
    if (/(?=.*[A-Z])/.test(password)) strength++;
    if (/(?=.*\d)/.test(password)) strength++;
    if (/(?=.*[!@#$%^&*])/.test(password)) strength++;
    
    return strength;
  };

  const getStrengthColor = (strength: number) => {
    if (strength < 2) return 'bg-red-500';
    if (strength < 4) return 'bg-yellow-500';  
    return 'bg-green-500';
  };

  const getStrengthLabel = (strength: number) => {
    if (strength < 2) return 'Débil';
    if (strength < 4) return 'Media';
    return 'Fuerte';
  };

  const strength = getPasswordStrength(passwords.new);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Key className="h-4 w-4 mr-2" />
            Cambiar Contraseña
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Cambiar Contraseña
          </DialogTitle>
          <DialogDescription>
            Ingresa tu contraseña actual y elige una nueva contraseña segura.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Contraseña actual */}
          <div className="space-y-2">
            <Label htmlFor="current-password">Contraseña Actual</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showPasswords.current ? 'text' : 'password'}
                value={passwords.current}
                onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                placeholder="Ingresa tu contraseña actual"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('current')}
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Nueva contraseña */}
          <div className="space-y-2">
            <Label htmlFor="new-password">Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPasswords.new ? 'text' : 'password'}
                value={passwords.new}
                onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                placeholder="Ingresa tu nueva contraseña"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('new')}
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {/* Indicador de fortaleza */}
            {passwords.new && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getStrengthColor(strength)}`}
                      style={{ width: `${(strength / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {getStrengthLabel(strength)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y números.
                </p>
              </div>
            )}
          </div>

          {/* Confirmar contraseña */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwords.confirm}
                onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                placeholder="Confirma tu nueva contraseña"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('confirm')}
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}