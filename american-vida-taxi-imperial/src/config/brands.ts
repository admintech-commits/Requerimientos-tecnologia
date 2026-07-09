import americanVidaLogo from '@/assets/img/american-vida-horizontal.svg';
import americanVidaIso from '@/assets/img/american-vida-isologo.svg';
import taxiImperialLogo from '@/assets/img/taxi-imperial-logo.png';
import taxiImperialLogoLight from '@/assets/img/taxi-imperial-logo-light.png';

export interface Brand {
  id: string;
  name: string;
  logo: string;
  /** Variante para fondos oscuros */
  logoOnDark: string;
  isologo: string;
  color: string;
}

/**
 * Metadatos de marca. Centralizados para que cualquier
 * pantalla futura (dashboard, reportes) los reutilice.
 */
export const BRANDS = {
  americanVida: {
    id: 'american-vida',
    name: 'American Vida',
    logo: americanVidaLogo,
    logoOnDark: americanVidaLogo, // el dorado funciona sobre oscuro
    isologo: americanVidaIso,
    color: 'var(--color-gold)',
  },
  taxiImperial: {
    id: 'taxi-imperial',
    name: 'Taxi Imperial S.A.S.',
    logo: taxiImperialLogo,
    logoOnDark: taxiImperialLogoLight,
    isologo: taxiImperialLogo,
    color: 'var(--color-orange)',
  },
} satisfies Record<string, Brand>;

export const APP_NAME = 'Portal Corporativo';
