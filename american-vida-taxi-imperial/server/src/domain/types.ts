export type Role = 'empleado' | 'aprobador' | 'gestor';

/** Roles que pueden gestionar requerimientos (estados y asignación) */
export const MANAGER_ROLES: Role[] = ['aprobador', 'gestor'];

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
}

export const STATUSES = [
  'creado',
  'en_revision',
  'aprobado',
  'en_desarrollo',
  'en_pruebas',
  'finalizado',
  'rechazado',
] as const;
export type Status = (typeof STATUSES)[number];

/** Transiciones válidas del flujo — trazabilidad garantizada */
export const TRANSITIONS: Record<Status, Status[]> = {
  creado: ['en_revision'],
  en_revision: ['aprobado', 'rechazado'],
  aprobado: ['en_desarrollo'],
  en_desarrollo: ['en_pruebas'],
  en_pruebas: ['finalizado', 'en_desarrollo'],
  finalizado: [],
  rechazado: [],
};

export const AREAS = [
  'Operaciones',
  'Reservas',
  'Contabilidad',
  'Talento Humano',
  'Comercial',
  'Tecnología',
  'Marketing',
  'Presidencia',
] as const;
export type Area = (typeof AREAS)[number];

export const REQUEST_TYPES = [
  'Nuevo desarrollo',
  'Mejora',
  'Corrección de error',
  'Soporte',
  'Infraestructura',
  'Datos / Reportes',
] as const;
export type RequestType = (typeof REQUEST_TYPES)[number];

export type Priority = 'alta' | 'media' | 'baja';

export interface Requirement {
  id: number;
  title: string;
  description: string;
  area: Area;
  type: RequestType;
  requesterPosition: string; // cargo del solicitante
  impact: number; // 1-3
  urgency: number; // 1-3
  priorityScore: number;
  priority: Priority;
  status: Status;
  requestedDate: string; // ISO
  attachments: string[]; // nombres o URLs
  createdBy: number;
  createdByName?: string;
  assignedTo: number | null;
  assignedToName?: string | null;
  assignedExternal: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RequirementEvent {
  id: number;
  requirementId: number;
  userId: number;
  userName?: string;
  fromStatus: Status | null;
  toStatus: Status;
  comment: string | null;
  createdAt: string;
}

/** Priorización: impacto × urgencia (1-9) */
export function computePriority(impact: number, urgency: number): {
  score: number;
  priority: Priority;
} {
  const score = impact * urgency;
  const priority: Priority = score >= 6 ? 'alta' : score >= 3 ? 'media' : 'baja';
  return { score, priority };
}
