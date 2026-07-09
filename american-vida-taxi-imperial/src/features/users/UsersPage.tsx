import { useEffect, useState, type FormEvent } from 'react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/features/auth/AuthContext';
import { ROLE_LABELS, type Role } from '@/features/auth/types';
import {
  createUser,
  listUsers,
  resetPassword,
  type CreatedUser,
  type ResetResult,
  type UserSummary,
} from './usersService';
import './UsersPage.css';

export default function UsersPage() {
  const { session } = useAuth();
  const [users, setUsers] = useState<UserSummary[] | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('empleado');
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [reset, setReset] = useState<ResetResult | null>(null);
  const [resettingId, setResettingId] = useState<number | null>(null);

  function load(): void {
    listUsers()
      .then(setUsers)
      .catch((e: Error) => setError(e.message));
  }

  useEffect(load, []);

  async function handleReset(user: UserSummary): Promise<void> {
    const ok = window.confirm(
      `¿Restablecer la contraseña de ${user.name}? La actual dejará de funcionar y deberá cambiarla al ingresar.`,
    );
    if (!ok) return;
    setError(null);
    setReset(null);
    setResettingId(user.id);
    try {
      setReset(await resetPassword(user.id));
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No fue posible restablecer la contraseña');
    } finally {
      setResettingId(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setCreated(null);
    setLoading(true);
    try {
      const user = await createUser({ name, email, role });
      setCreated(user);
      setName('');
      setEmail('');
      setRole('empleado');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No fue posible crear el usuario');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="users">
      <h1>Usuarios</h1>

      <div className="users__columns">
        <article className="users__card">
          <h2>Crear usuario</h2>
          <p className="users__hint">
            La cuenta se crea con una contraseña temporal; al primer ingreso el sistema exige
            cambiarla.
          </p>

          <form onSubmit={handleSubmit} className="users__form" noValidate>
            {error && (
              <div className="users__alert" role="alert">
                {error}
              </div>
            )}

            {created && (
              <div className="users__created" role="status">
                <p>
                  Usuario <strong>{created.email}</strong> creado.
                </p>
                <p>
                  Contraseña temporal: <code>{created.tempPassword}</code>
                </p>
                <small>Cópiala ahora — no se volverá a mostrar.</small>
              </div>
            )}

            <label className="users__field">
              <span>Nombre completo *</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej: Ana Martínez"
                required
                minLength={3}
              />
            </label>

            <label className="users__field">
              <span>Correo corporativo *</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@grupoamericanvisa.com"
                required
              />
            </label>

            <label className="users__field">
              <span>Rol *</span>
              <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                <option value="empleado">Empleado — registra y consulta</option>
                <option value="gestor">Gestor — además cambia estados y asigna</option>
                <option value="aprobador">Administrador — además administra usuarios</option>
              </select>
            </label>

            <Button type="submit" loading={loading}>
              {loading ? 'Creando…' : 'Crear usuario'}
            </Button>
          </form>
        </article>

        <article className="users__card">
          <h2>Equipo ({users?.length ?? '…'})</h2>

          {reset && (
            <div className="users__created" role="status">
              <p>
                Contraseña de <strong>{reset.name}</strong> restablecida.
              </p>
              <p>
                Nueva temporal: <code>{reset.tempPassword}</code>
              </p>
              <small>Cópiala ahora — no se volverá a mostrar.</small>
            </div>
          )}

          {users === null && <p className="users__hint">Cargando…</p>}
          {users && (
            <ul className="users__list">
              {users.map((u) => (
                <li key={u.id}>
                  <div>
                    <strong>{u.name}</strong>
                    <small>{u.email}</small>
                  </div>
                  <div className="users__tags">
                    <span className={`users__role users__role--${u.role}`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                    {u.mustChangePassword &&
                      (u.tempPassword ? (
                        <span className="users__temp" title="Contraseña temporal — compártela para el primer ingreso">
                          <code>{u.tempPassword}</code>
                        </span>
                      ) : (
                        <span className="users__pending">Contraseña pendiente</span>
                      ))}
                    {u.id !== session?.user.id && (
                      <button
                        type="button"
                        className="users__reset"
                        disabled={resettingId !== null}
                        onClick={() => handleReset(u)}
                      >
                        {resettingId === u.id ? 'Restableciendo…' : 'Restablecer contraseña'}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  );
}
