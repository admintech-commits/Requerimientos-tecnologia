import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BRANDS } from '@/config/brands';
import { useAuth } from '@/features/auth/AuthContext';
import { useTheme } from '@/features/theme/ThemeContext';
import { ROLE_LABELS } from '@/features/auth/types';
import './AppLayout.css';

export default function AppLayout() {
  const { session, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  function handleSignOut(): void {
    signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div className="layout">
      <header className="layout__header">
        <div className="layout__brand">
          <img src={BRANDS.americanVida.logoOnDark} alt={BRANDS.americanVida.name} />
          <span aria-hidden="true" />
          <img src={BRANDS.taxiImperial.logoOnDark} alt={BRANDS.taxiImperial.name} />
        </div>

        <nav className="layout__nav" aria-label="Principal">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/requerimientos">Requerimientos</NavLink>
          <NavLink to="/requerimientos/nuevo">Nuevo</NavLink>
          {session?.user.role === 'aprobador' && <NavLink to="/usuarios">Usuarios</NavLink>}
        </nav>

        <div className="layout__user">
          <div className="layout__user-info">
            <strong>{session?.user.name}</strong>
            <small>{session ? ROLE_LABELS[session.user.role] : ''}</small>
          </div>
          <button
            type="button"
            className="layout__theme-toggle"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button type="button" className="layout__logout" onClick={handleSignOut}>
            Salir
          </button>
        </div>
      </header>

      <main className="layout__main">
        <Outlet />
      </main>
    </div>
  );
}
