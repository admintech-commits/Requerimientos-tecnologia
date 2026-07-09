import type { LoginCredentials, LoginFieldErrors } from '../types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): string | null {
  if (!value.trim()) return 'El correo es obligatorio';
  if (!EMAIL_REGEX.test(value)) return 'Ingresa un correo válido';
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return 'La contraseña es obligatoria';
  if (value.length < 8) return 'Mínimo 8 caracteres';
  return null;
}

export function validateLogin({ email, password }: LoginCredentials): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;
  return errors;
}
