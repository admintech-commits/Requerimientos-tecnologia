import type { Priority, Status } from './types';

export const STATUS_LABELS: Record<Status, string> = {
  creado: 'Creado',
  en_revision: 'En revisión',
  aprobado: 'Aprobado',
  en_desarrollo: 'En desarrollo',
  en_pruebas: 'En pruebas',
  finalizado: 'Finalizado',
  rechazado: 'Rechazado',
};

/** Flujo principal para pintar el stepper (rechazado se maneja aparte) */
export const STATUS_FLOW: Status[] = [
  'creado',
  'en_revision',
  'aprobado',
  'en_desarrollo',
  'en_pruebas',
  'finalizado',
];

/** Transiciones válidas — espejo del backend para pintar acciones */
export const TRANSITIONS: Record<Status, Status[]> = {
  creado: ['en_revision'],
  en_revision: ['aprobado', 'rechazado'],
  aprobado: ['en_desarrollo'],
  en_desarrollo: ['en_pruebas'],
  en_pruebas: ['finalizado', 'en_desarrollo'],
  finalizado: [],
  rechazado: [],
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

export const LEVEL_LABELS: Record<number, string> = {
  1: 'Bajo',
  2: 'Medio',
  3: 'Alto',
};

/** Nombre legible de un adjunto (quita la ruta y el prefijo de fecha) */
export function attachmentLabel(value: string): string {
  if (!value.startsWith('/api/uploads/')) return value;
  const base = value.split('/').pop() ?? value;
  return base.replace(/^\d+-/, '');
}
