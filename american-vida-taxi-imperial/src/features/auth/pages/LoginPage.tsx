import { useNavigate } from 'react-router-dom';
import { BRANDS } from '@/config/brands';
import { useAuth } from '../AuthContext';
import LoginForm from '../components/LoginForm';
import type { Session } from '../types';
import './LoginPage.css';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  function handleSuccess(session: Session, remember: boolean): void {
    signIn(session, remember);
    navigate('/', { replace: true });
  }

  return (
    <main className="login">
      {/* Panel de marca — visual en escritorio, cabecera compacta en móvil */}
      <section className="login__brand" aria-label="Empresas">
        <div className="login__brand-inner">
          <div className="login__logos">
            <img
              className="login__logo login__logo--av"
              src={BRANDS.americanVida.logoOnDark}
              alt={BRANDS.americanVida.name}
            />
            <span className="login__divider" aria-hidden="true" />
            <img
              className="login__logo login__logo--ti"
              src={BRANDS.taxiImperial.logoOnDark}
              alt={BRANDS.taxiImperial.name}
            />
          </div>
          <p className="login__tagline">
            Un solo portal para la gestión de <strong>American Vida</strong> y{' '}
            <strong>Taxi Imperial</strong>.
          </p>
        </div>
        <div className="login__brand-accent" aria-hidden="true" />
      </section>

      {/* Panel de formulario */}
      <section className="login__panel">
        <div className="login__card">
          <header className="login__header">
            <h1 className="login__title">Iniciar sesión</h1>
            <p className="login__subtitle">Ingresa tus credenciales corporativas</p>
          </header>

          <LoginForm onSuccess={handleSuccess} />

          <footer className="login__footer">
            <p>
              © {new Date().getFullYear()} American Vida · Taxi Imperial S.A.S. Todos los
              derechos reservados.
            </p>
          </footer>
        </div>
      </section>
    </main>
  );
}
