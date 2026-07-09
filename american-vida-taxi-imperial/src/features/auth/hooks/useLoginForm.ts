import { useState, type ChangeEvent, type FormEvent } from 'react';
import { validateLogin } from '../utils/validators';
import { login } from '../services/authService';
import type { LoginCredentials, LoginFieldErrors, Session } from '../types';

interface UseLoginFormOptions {
  onSuccess?: (session: Session, remember: boolean) => void;
}

/**
 * Estado y lógica del formulario de login,
 * separados de la presentación para poder testearlos.
 */
export function useLoginForm({ onSuccess }: UseLoginFormOptions = {}) {
  const [values, setValues] = useState<LoginCredentials>({
    email: '',
    password: '',
    remember: false,
  });
  const [errors, setErrors] = useState<LoginFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const { name, value, type, checked } = event.target;
    setValues((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrors((prev) =>
      prev[name as keyof LoginFieldErrors] ? { ...prev, [name]: null } : prev,
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitError(null);

    const validationErrors = validateLogin(values);
    if (Object.values(validationErrors).some(Boolean)) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const session = await login(values);
      onSuccess?.(session, values.remember);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'No fue posible iniciar sesión. Intenta de nuevo.',
      );
    } finally {
      setLoading(false);
    }
  }

  return { values, errors, submitError, loading, handleChange, handleSubmit };
}
