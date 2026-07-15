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
  requesterPosition: string;
  impact: number;
  urgency: number;
  priorityScore: number;
  priority: Priority;
  status: Status;
  requestedDate: string;
  attachments: string[];
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

export interface CreateRequirementInput {
  title: string;
  description: string;
  area: Area | '';
  type: RequestType | '';
  requesterPosition: string;
  impact: number;
  urgency: number;
  requestedDate: string;
  attachments: string[];
}

export interface Metrics {
  total: number;
  byStatus: Record<string, number>;
  byArea: Record<string, number>;
  byPriority: Record<string, number>;
  openHighPriority: number;
  finishedLast30Days: number;
}

export interface ListFilters {
  status?: string;
  area?: string;
  priority?: string;
  q?: string;
}
