export type Role = 'empleado' | 'aprobador' | 'gestor';

export const ROLE_LABELS: Record<Role, string> = {
  empleado: 'Empleado',
  gestor: 'Gestor',
  aprobador: 'Administrador',
};

/** Roles que gestionan requerimientos (estados y asignación) */
export function canManageRequirements(role?: Role): boolean {
  return role === 'aprobador' || role === 'gestor';
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember: boolean;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: Role;
  mustChangePassword?: boolean;
}

export interface Session {
  token: string;
  user: AuthUser;
}

export type LoginFieldErrors = Partial<Record<'email' | 'password', string | null>>;
