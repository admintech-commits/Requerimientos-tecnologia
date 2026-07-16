import { HttpError } from '../../lib/httpError.js';
import { sendAssignmentEmail } from '../../lib/mailer.js';
import { config } from '../../config.js';
import { db } from '../../db/connection.js';
import {
  AREAS,
  REQUEST_TYPES,
  STATUSES,
  TRANSITIONS,
  computePriority,
  type Requirement,
  type RequirementEvent,
  type Status,
  type User,
} from '../../domain/types.js';
import * as repo from './requirements.repository.js';

export interface CreateRequirementInput {
  title?: string;
  description?: string;
  area?: string;
  type?: string;
  requesterPosition?: string;
  impact?: number;
  urgency?: number;
  requestedDate?: string;
  attachments?: string[];
}

export function createRequirement(input: CreateRequirementInput, user: User): Requirement {
  const title = input.title?.trim();
  const description = input.description?.trim();

  if (!title || title.length < 5) throw new HttpError(400, 'El título debe tener al menos 5 caracteres');
  if (!description || description.length < 20) {
    throw new HttpError(400, 'La descripción detallada debe tener al menos 20 caracteres');
  }
  if (!input.area || !(AREAS as readonly string[]).includes(input.area)) {
    throw new HttpError(400, 'Área solicitante inválida');
  }
  if (!input.type || !(REQUEST_TYPES as readonly string[]).includes(input.type)) {
    throw new HttpError(400, 'Tipo de solicitud inválido');
  }
  const requesterPosition = input.requesterPosition?.trim();
  if (!requesterPosition || requesterPosition.length < 3) {
    throw new HttpError(400, 'El cargo del solicitante es obligatorio (mínimo 3 caracteres)');
  }
  const impact = Number(input.impact);
  const urgency = Number(input.urgency);
  if (![1, 2, 3].includes(impact)) throw new HttpError(400, 'El impacto debe ser 1, 2 o 3');
  if (![1, 2, 3].includes(urgency)) throw new HttpError(400, 'La urgencia debe ser 1, 2 o 3');
  if (!input.requestedDate || Number.isNaN(Date.parse(input.requestedDate))) {
    throw new HttpError(400, 'La fecha estimada es inválida');
  }
  const attachments = Array.isArray(input.attachments)
    ? input.attachments.map(String).filter(Boolean).slice(0, 10)
    : [];

  const { score, priority } = computePriority(impact, urgency);

  const requirement = repo.insertRequirement({
    title,
    description,
    area: input.area,
    type: input.type,
    requesterPosition,
    impact,
    urgency,
    priorityScore: score,
    priority,
    requestedDate: input.requestedDate,
    attachments,
    createdBy: user.id,
  });

  repo.insertEvent({
    requirementId: requirement.id,
    userId: user.id,
    fromStatus: null,
    toStatus: 'creado',
    comment: 'Requerimiento registrado',
  });

  return requirement;
}

export function listRequirements(filters: repo.ListFilters): Requirement[] {
  if (filters.status && !(STATUSES as readonly string[]).includes(filters.status)) {
    throw new HttpError(400, 'Estado de filtro inválido');
  }
  return repo.listRequirements(filters);
}

export function getRequirement(id: number): {
  requirement: Requirement;
  events: RequirementEvent[];
} {
  const requirement = repo.findRequirement(id);
  if (!requirement) throw new HttpError(404, 'Requerimiento no encontrado');
  return { requirement, events: repo.listEvents(id) };
}

export function changeStatus(
  id: number,
  toStatus: string,
  comment: string | undefined,
  user: User,
): Requirement {
  if (!(STATUSES as readonly string[]).includes(toStatus)) {
    throw new HttpError(400, 'Estado destino inválido');
  }
  const requirement = repo.findRequirement(id);
  if (!requirement) throw new HttpError(404, 'Requerimiento no encontrado');

  if (toStatus === 'rechazado' && !comment?.trim()) {
    throw new HttpError(400, 'Para rechazar debes indicar el motivo en el comentario');
  }

  const allowed = TRANSITIONS[requirement.status];
  if (!allowed.includes(toStatus as Status)) {
    throw new HttpError(
      409,
      `Transición no permitida: de "${requirement.status}" solo se puede pasar a: ${allowed.join(', ') || 'ninguno'}`,
    );
  }

  repo.updateStatus(id, toStatus as Status);
  repo.insertEvent({
    requirementId: id,
    userId: user.id,
    fromStatus: requirement.status,
    toStatus: toStatus as Status,
    comment: comment?.trim() || null,
  });

  return repo.findRequirement(id)!;
}

export function addAttachment(id: number, url: string, user: User): Requirement {
  if (!url?.trim()) throw new HttpError(400, 'URL de adjunto inválida');
  const requirement = repo.findRequirement(id);
  if (!requirement) throw new HttpError(404, 'Requerimiento no encontrado');
  repo.appendAttachment(id, url.trim());
  repo.insertEvent({
    requirementId: id,
    userId: user.id,
    fromStatus: requirement.status,
    toStatus: requirement.status,
    comment: `Adjunto agregado: ${url.trim().split('/').pop()}`,
  });
  return repo.findRequirement(id)!;
}

export function addComment(id: number, comment: string, user: User): void {
  const text = comment?.trim();
  if (!text) throw new HttpError(400, 'El comentario no puede estar vacío');
  const requirement = repo.findRequirement(id);
  if (!requirement) throw new HttpError(404, 'Requerimiento no encontrado');
  repo.insertEvent({
    requirementId: id,
    userId: user.id,
    fromStatus: requirement.status,
    toStatus: requirement.status,
    comment: text,
  });
}

export function getMetrics(): repo.Metrics {
  return repo.getMetrics();
}

export interface AssignInput {
  userId?: number | null;
  externalName?: string | null;
}

export function assignRequirement(id: number, input: AssignInput, actor: User): Requirement {
  const requirement = repo.findRequirement(id);
  if (!requirement) throw new HttpError(404, 'Requerimiento no encontrado');

  let userId: number | null = null;
  let externalName: string | null = null;
  let assigneeName: string | null = null;

  if (input.externalName?.trim()) {
    externalName = input.externalName.trim();
    if (externalName.length < 3) {
      throw new HttpError(400, 'El nombre del responsable externo debe tener al menos 3 caracteres');
    }
    assigneeName = `${externalName} (externo)`;
  } else if (input.userId !== null && input.userId !== undefined) {
    const assignee = db
      .prepare('SELECT id, name, email FROM users WHERE id = ?')
      .get(input.userId) as { id: number; name: string; email: string } | undefined;
    if (!assignee) throw new HttpError(400, 'El usuario asignado no existe');
    userId = assignee.id;
    assigneeName = assignee.name;

    // Enviar correo de notificación al responsable asignado (no bloquea la respuesta)
    const appUrl = process.env.APP_URL ?? 'http://localhost:5173';
    sendAssignmentEmail({
      toEmail: assignee.email,
      toName: assignee.name,
      requirementId: id,
      requirementTitle: requirement.title,
      assignedBy: actor.name,
      appUrl,
    }).catch((err: unknown) => {
      console.error('[mailer] Error al enviar correo de asignación:', err);
    });
  }

  repo.updateAssignee(id, userId, externalName);
  repo.insertEvent({
    requirementId: id,
    userId: actor.id,
    fromStatus: requirement.status,
    toStatus: requirement.status,
    comment: assigneeName ? `Asignado a: ${assigneeName}` : 'Asignación retirada',
  });

  return repo.findRequirement(id)!;
}
