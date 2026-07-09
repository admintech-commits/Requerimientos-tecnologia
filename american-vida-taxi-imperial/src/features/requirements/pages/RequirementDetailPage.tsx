import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { canManageRequirements } from '@/features/auth/types';
import { listUsers, type UserSummary } from '@/features/users/usersService';
import { assignRequirement, changeStatus, getRequirement } from '../services/requirementsService';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import { resolveApiUrl } from '@/lib/apiClient';
import { LEVEL_LABELS, STATUS_FLOW, STATUS_LABELS, TRANSITIONS, attachmentLabel } from '../constants';
import type { Requirement, RequirementEvent, Status } from '../types';
import './RequirementDetailPage.css';

export default function RequirementDetailPage() {
  const { id } = useParams();
  const { session } = useAuth();
  const [requirement, setRequirement] = useState<Requirement | null>(null);
  const [events, setEvents] = useState<RequirementEvent[]>([]);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [team, setTeam] = useState<UserSummary[]>([]);
  const [externalMode, setExternalMode] = useState(false);
  const [externalName, setExternalName] = useState('');

  const load = useCallback(() => {
    getRequirement(Number(id))
      .then((data) => {
        setRequirement(data.requirement);
        setEvents(data.events);
      })
      .catch((e: Error) => setError(e.message));
  }, [id]);

  useEffect(load, [load]);

  const isApproverRole = canManageRequirements(session?.user.role);
  useEffect(() => {
    if (isApproverRole) {
      listUsers()
        .then(setTeam)
        .catch(() => setTeam([]));
    }
  }, [isApproverRole]);

  async function handleAssign(value: string): Promise<void> {
    if (!requirement) return;
    if (value === 'external') {
      setExternalMode(true);
      return;
    }
    setExternalMode(false);
    setActing(true);
    setError(null);
    try {
      await assignRequirement(requirement.id, { userId: value ? Number(value) : null });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No fue posible asignar el responsable');
    } finally {
      setActing(false);
    }
  }

  async function handleAssignExternal(): Promise<void> {
    if (!requirement || externalName.trim().length < 3) return;
    setActing(true);
    setError(null);
    try {
      await assignRequirement(requirement.id, { externalName: externalName.trim() });
      setExternalMode(false);
      setExternalName('');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No fue posible asignar el responsable');
    } finally {
      setActing(false);
    }
  }

  async function handleTransition(to: Status): Promise<void> {
    if (!requirement) return;
    setActing(true);
    setError(null);
    try {
      await changeStatus(requirement.id, to, comment || undefined);
      setComment('');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No fue posible cambiar el estado');
    } finally {
      setActing(false);
    }
  }

  if (error && !requirement) {
    return (
      <p className="detail__error" role="alert">
        {error} — <Link to="/requerimientos">volver a la lista</Link>
      </p>
    );
  }
  if (!requirement) return <p className="detail__loading">Cargando…</p>;

  const isApprover = canManageRequirements(session?.user.role);
  const nextStatuses = TRANSITIONS[requirement.status];
  const flowIndex = STATUS_FLOW.indexOf(requirement.status);

  return (
    <section className="detail">
      <nav className="detail__breadcrumb">
        <Link to="/requerimientos">← Requerimientos</Link>
      </nav>

      <header className="detail__header">
        <div>
          <h1>
            #{requirement.id} · {requirement.title}
          </h1>
          <p className="detail__meta">
            Solicitado por {requirement.createdByName}
            {requirement.requesterPosition && ` (${requirement.requesterPosition})`} ·{' '}
            {requirement.area} · {requirement.type}
          </p>
        </div>
        <div className="detail__badges">
          <PriorityBadge priority={requirement.priority} />
          <StatusBadge status={requirement.status} />
        </div>
      </header>

      {/* Flujo de estados */}
      <ol className="detail__flow" aria-label="Flujo del requerimiento">
        {STATUS_FLOW.map((s, i) => (
          <li
            key={s}
            className={
              requirement.status === 'rechazado'
                ? i <= 1
                  ? 'done'
                  : ''
                : i < flowIndex
                  ? 'done'
                  : i === flowIndex
                    ? 'current'
                    : ''
            }
          >
            {STATUS_LABELS[s]}
          </li>
        ))}
        {requirement.status === 'rechazado' && <li className="rejected">Rechazado</li>}
      </ol>

      <div className="detail__columns">
        <article className="detail__card">
          <h2>Descripción</h2>
          <p className="detail__description">{requirement.description}</p>

          <dl className="detail__facts">
            <div>
              <dt>Impacto</dt>
              <dd>{LEVEL_LABELS[requirement.impact]}</dd>
            </div>
            <div>
              <dt>Urgencia</dt>
              <dd>{LEVEL_LABELS[requirement.urgency]}</dd>
            </div>
            <div>
              <dt>Puntaje de prioridad</dt>
              <dd>{requirement.priorityScore} / 9</dd>
            </div>
            <div>
              <dt>Fecha estimada</dt>
              <dd>{requirement.requestedDate}</dd>
            </div>
            <div>
              <dt>Responsable</dt>
              <dd>
                {requirement.assignedToName ??
                  (requirement.assignedExternal
                    ? `${requirement.assignedExternal} (externo)`
                    : 'Sin asignar')}
              </dd>
            </div>
            <div>
              <dt>Creado</dt>
              <dd>{requirement.createdAt}</dd>
            </div>
            <div>
              <dt>Última actualización</dt>
              <dd>{requirement.updatedAt}</dd>
            </div>
          </dl>

          {requirement.attachments.length > 0 && (
            <>
              <h2>Adjuntos</h2>
              <ul className="detail__attachments">
                {requirement.attachments.map((a) => (
                  <li key={a}>
                    {a.startsWith('http') || a.startsWith('/api/uploads/') ? (
                      <a href={resolveApiUrl(a)} target="_blank" rel="noreferrer">
                        {attachmentLabel(a)}
                      </a>
                    ) : (
                      a
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </article>

        <div className="detail__side">
          {isApprover && (
            <article className="detail__card">
              <h2>Responsable</h2>
              <select
                className="detail__assign"
                value={externalMode ? 'external' : requirement.assignedTo ?? (requirement.assignedExternal ? 'external' : '')}
                disabled={acting}
                onChange={(e) => handleAssign(e.target.value)}
                aria-label="Asignar responsable"
              >
                <option value="">Sin asignar</option>
                {team.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
                <option value="external">
                  {requirement.assignedExternal && !externalMode
                    ? `Externo: ${requirement.assignedExternal}`
                    : 'Otro (externo)…'}
                </option>
              </select>

              {externalMode && (
                <div className="detail__external">
                  <input
                    type="text"
                    value={externalName}
                    onChange={(e) => setExternalName(e.target.value)}
                    placeholder="Nombre del responsable externo"
                    minLength={3}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAssignExternal();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="detail__action"
                    disabled={acting || externalName.trim().length < 3}
                    onClick={handleAssignExternal}
                  >
                    Asignar
                  </button>
                </div>
              )}
            </article>
          )}

          {isApprover && nextStatuses.length > 0 && (
            <article className="detail__card">
              <h2>Validación y aprobación</h2>
              <label className="detail__comment">
                <span>Comentario (obligatorio para rechazar)</span>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Motivo de la decisión, observaciones…"
                />
              </label>
              {error && (
                <p className="detail__error" role="alert">
                  {error}
                </p>
              )}
              <div className="detail__actions">
                {nextStatuses.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={acting}
                    className={`detail__action ${s === 'rechazado' ? 'detail__action--danger' : ''}`}
                    onClick={() => handleTransition(s)}
                  >
                    Pasar a: {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </article>
          )}

          <article className="detail__card">
            <h2>Trazabilidad</h2>
            <ol className="detail__timeline">
              {events.map((e) => (
                <li key={e.id}>
                  <p className="detail__timeline-title">
                    {e.fromStatus === null
                      ? STATUS_LABELS[e.toStatus]
                      : e.fromStatus === e.toStatus
                        ? 'Asignación'
                        : `${STATUS_LABELS[e.fromStatus]} → ${STATUS_LABELS[e.toStatus]}`}
                  </p>
                  <p className="detail__timeline-meta">
                    {e.userName} · {e.createdAt}
                  </p>
                  {e.comment && <p className="detail__timeline-comment">{e.comment}</p>}
                </li>
              ))}
            </ol>
          </article>
        </div>
      </div>
    </section>
  );
}
