import TextField from '@/components/ui/TextField';
import Button from '@/components/ui/Button';
import { useLoginForm } from '../hooks/useLoginForm';
import type { Session } from '../types';

interface LoginFormProps {
  onSuccess?: (session: Session, remember: boolean) => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const { values, errors, submitError, loading, handleChange, handleSubmit } =
    useLoginForm({ onSuccess });

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      {submitError && (
        <div className="login-form__alert" role="alert">
          {submitError}
        </div>
      )}

      <TextField
        label="Correo electrónico"
        name="email"
        type="email"
        placeholder="usuario@empresa.com"
        autoComplete="email"
        inputMode="email"
        value={values.email}
        error={errors.email}
        onChange={handleChange}
      />

      <TextField
        label="Contraseña"
        name="password"
        type="password"
        placeholder="••••••••"
        autoComplete="current-password"
        value={values.password}
        error={errors.password}
        onChange={handleChange}
      />

      <div className="login-form__row">
        <label className="login-form__remember">
          <input
            type="checkbox"
            name="remember"
            checked={values.remember}
            onChange={handleChange}
          />
          <span>Recordarme</span>
        </label>

        <a href="#recuperar" className="login-form__link">
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      <Button type="submit" loading={loading}>
        {loading ? 'Ingresando…' : 'Iniciar sesión'}
      </Button>
    </form>
  );
}
