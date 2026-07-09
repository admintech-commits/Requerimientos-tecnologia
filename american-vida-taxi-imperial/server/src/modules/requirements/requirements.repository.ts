import { db } from '../../db/connection.js';
import type { Requirement, RequirementEvent, Status } from '../../domain/types.js';

interface RequirementRow {
  id: number;
  title: string;
  description: string;
  area: string;
  type: string;
  requester_position: string;
  impact: number;
  urgency: number;
  priority_score: number;
  priority: string;
  status: string;
  requested_date: string;
  attachments: string;
  created_by: number;
  created_by_name: string;
  assigned_to: number | null;
  assigned_to_name: string | null;
  assigned_external: string | null;
  created_at: string;
  updated_at: string;
}

function toRequirement(row: RequirementRow): Requirement {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    area: row.area as Requirement['area'],
    type: row.type as Requirement['type'],
    requesterPosition: row.requester_position,
    impact: row.impact,
    urgency: row.urgency,
    priorityScore: row.priority_score,
    priority: row.priority as Requirement['priority'],
    status: row.status as Status,
    requestedDate: row.requested_date,
    attachments: JSON.parse(row.attachments) as string[],
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    assignedTo: row.assigned_to,
    assignedToName: row.assigned_to_name,
    assignedExternal: row.assigned_external,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const BASE_SELECT = `
  SELECT r.*, u.name AS created_by_name, a.name AS assigned_to_name
  FROM requirements r
  JOIN users u ON u.id = r.created_by
  LEFT JOIN users a ON a.id = r.assigned_to
`;

export interface ListFilters {
  status?: string;
  area?: string;
  priority?: string;
  q?: string;
}

export function listRequirements(filters: ListFilters): Requirement[] {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.status) {
    conditions.push('r.status = ?');
    params.push(filters.status);
  }
  if (filters.area) {
    conditions.push('r.area = ?');
    params.push(filters.area);
  }
  if (filters.priority) {
    conditions.push('r.priority = ?');
    params.push(filters.priority);
  }
  if (filters.q) {
    conditions.push('(r.title LIKE ? OR r.description LIKE ?)');
    params.push(`%${filters.q}%`, `%${filters.q}%`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = db
    .prepare(`${BASE_SELECT} ${where} ORDER BY r.priority_score DESC, r.created_at DESC`)
    .all(...params) as RequirementRow[];
  return rows.map(toRequirement);
}

export function findRequirement(id: number): Requirement | null {
  const row = db.prepare(`${BASE_SELECT} WHERE r.id = ?`).get(id) as RequirementRow | undefined;
  return row ? toRequirement(row) : null;
}

export interface CreateRequirementData {
  title: string;
  description: string;
  area: string;
  type: string;
  requesterPosition: string;
  impact: number;
  urgency: number;
  priorityScore: number;
  priority: string;
  requestedDate: string;
  attachments: string[];
  createdBy: number;
}

export function insertRequirement(data: CreateRequirementData): Requirement {
  const result = db
    .prepare(
      `INSERT INTO requirements
        (title, description, area, type, requester_position, impact, urgency, priority_score,
         priority, requested_date, attachments, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      data.title,
      data.description,
      data.area,
      data.type,
      data.requesterPosition,
      data.impact,
      data.urgency,
      data.priorityScore,
      data.priority,
      data.requestedDate,
      JSON.stringify(data.attachments),
      data.createdBy,
    );
  return findRequirement(Number(result.lastInsertRowid))!;
}

export function updateAssignee(
  id: number,
  userId: number | null,
  externalName: string | null,
): void {
  db.prepare(
    `UPDATE requirements
     SET assigned_to = ?, assigned_external = ?, updated_at = datetime('now')
     WHERE id = ?`,
  ).run(userId, externalName, id);
}

export function updateStatus(id: number, status: Status): void {
  db.prepare(`UPDATE requirements SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(
    status,
    id,
  );
}

export function insertEvent(data: {
  requirementId: number;
  userId: number;
  fromStatus: Status | null;
  toStatus: Status;
  comment: string | null;
}): void {
  db.prepare(
    `INSERT INTO requirement_events (requirement_id, user_id, from_status, to_status, comment)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(data.requirementId, data.userId, data.fromStatus, data.toStatus, data.comment);
}

export function listEvents(requirementId: number): RequirementEvent[] {
  const rows = db
    .prepare(
      `SELECT e.*, u.name AS user_name
       FROM requirement_events e
       JOIN users u ON u.id = e.user_id
       WHERE e.requirement_id = ?
       ORDER BY e.created_at ASC, e.id ASC`,
    )
    .all(requirementId) as Array<{
    id: number;
    requirement_id: number;
    user_id: number;
    user_name: string;
    from_status: Status | null;
    to_status: Status;
    comment: string | null;
    created_at: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    requirementId: row.requirement_id,
    userId: row.user_id,
    userName: row.user_name,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    comment: row.comment,
    createdAt: row.created_at,
  }));
}

export interface Metrics {
  total: number;
  byStatus: Record<string, number>;
  byArea: Record<string, number>;
  byPriority: Record<string, number>;
  openHighPriority: number;
  finishedLast30Days: number;
}

export function getMetrics(): Metrics {
  const count = (sql: string) => db.prepare(sql).all() as Array<{ key: string; n: number }>;

  const byStatus = Object.fromEntries(
    count('SELECT status AS key, COUNT(*) AS n FROM requirements GROUP BY status').map((r) => [
      r.key,
      r.n,
    ]),
  );
  const byArea = Object.fromEntries(
    count('SELECT area AS key, COUNT(*) AS n FROM requirements GROUP BY area').map((r) => [
      r.key,
      r.n,
    ]),
  );
  const byPriority = Object.fromEntries(
    count('SELECT priority AS key, COUNT(*) AS n FROM requirements GROUP BY priority').map((r) => [
      r.key,
      r.n,
    ]),
  );

  const total = (db.prepare('SELECT COUNT(*) AS n FROM requirements').get() as { n: number }).n;
  const openHighPriority = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM requirements
         WHERE priority = 'alta' AND status NOT IN ('finalizado', 'rechazado')`,
      )
      .get() as { n: number }
  ).n;
  const finishedLast30Days = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM requirements
         WHERE status = 'finalizado' AND updated_at >= datetime('now', '-30 days')`,
      )
      .get() as { n: number }
  ).n;

  return { total, byStatus, byArea, byPriority, openHighPriority, finishedLast30Days };
}
