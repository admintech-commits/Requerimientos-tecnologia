import { api } from '@/lib/apiClient';
import type { LoginCredentials, Session } from '../types';

export async function login(credentials: LoginCredentials): Promise<Session> {
  return api.post<Session>('/auth/login', {
    email: credentials.email,
    password: credentials.password,
  });
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await api.post('/auth/change-password', { currentPassword, newPassword });
}
