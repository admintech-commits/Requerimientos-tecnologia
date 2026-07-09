import { api } from '@/lib/apiClient';
import type { Role } from '@/features/auth/types';

export interface UserSummary {
  id: number;
  email: string;
  name: string;
  role: Role;
  mustChangePassword: boolean;
  /** Solo presente mientras el usuario no haya cambiado la contraseña */
  tempPassword?: string | null;
}

export interface CreatedUser extends UserSummary {
  tempPassword: string;
}

export function listUsers(): Promise<UserSummary[]> {
  return api.get<UserSummary[]>('/users');
}

export function createUser(input: {
  name: string;
  email: string;
  role: Role;
}): Promise<CreatedUser> {
  return api.post<CreatedUser>('/users', input);
}

export interface ResetResult {
  id: number;
  email: string;
  name: string;
  tempPassword: string;
}

export function resetPassword(userId: number): Promise<ResetResult> {
  return api.post<ResetResult>(`/users/${userId}/reset-password`, {});
}
