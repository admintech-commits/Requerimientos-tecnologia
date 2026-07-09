import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import TextField from '@/components/ui/TextField';
import Button from '@/components/ui/Button';
import { useAuth } from '../AuthContext';
import { changePassword } from '../services/authService';
import './ChangePasswordPage.css';

export default function ChangePasswordPage() {
  const { session, updateUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);

    if (next.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (next !== confirm) {
      setError('La confirmación no coincide con la nueva contraseña');
      return;
    }

    setLoading(true);
    try {
      await changePassword(current, next);
      updateUser({ mustChangePassword: false });
      navigate('/', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No fue posible cambiar la contraseña');
      setLoading(false);
    }
  }

  function handleCancel(): void {
    signOut();
    navigate('/login', { replace: true });
  }

  return (
    <main className="changepwd">
      <div className="changepwd__card">
        <h1>Cambia tu contraseña</h1>
        <p className="changepwd__hint">
          Hola, {session?.user.name}. Por seguridad debes definir una contraseña propia antes de
          continuar.
        </p>

        <form onSubmit={handleSubmit} noValidate className="changepwd__form">
          {error && (
            <div className="changepwd__alert" role="alert">
              {error}
            </div>
          )}

          <TextField
            label="Contraseña actual"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
          <TextField
            label="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
          <TextField
            label="Confirmar nueva contraseña"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />

          <Button type="submit" loading={loading}>
            {loading ? 'Guardando…' : 'Guardar y continuar'}
          </Button>
          <Button type="button" variant="ghost" onClick={handleCancel}>
            Cancelar y salir
          </Button>
        </form>
      </div>
    </main>
  );
}
