import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMetrics, listRequirements } from '../services/requirementsService';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import { STATUS_LABELS } from '../constants';
import type { Metrics, Requirement, Status } from '../types';

const CLOSED = new Set(['finalizado', 'rechazado']);

function diasAbierto(req: Requirement): string {
  if (CLOSED.has(req.status)) return '—';
  // SQLite datetime('now') devuelve UTC sin 'Z'; añadirlo evita que JS
  // lo interprete como hora local y produzca valores negativos.
  const created = new Date(req.createdAt.replace(' ', 'T') + 'Z');
  const days = Math.floor((Date.now() - created.getTime()) / 86_400_000);
  return days <= 0 ? 'Hoy' : `${days} día${days !== 1 ? 's' : ''}`;
}
import './DashboardPage.css';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMetrics()
      .then(setMetrics)
      .catch((e: Error) => setError(e.message));
    listRequirements()
      .then((reqs) =>
        setRequirements(
          reqs
            .filter((r) => !CLOSED.has(r.status))
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
        ),
      )
      .catch(() => setRequirements([]));
  }, []);

  if (error) return <p className="dash__error" role="alert">{error}</p>;
  if (!metrics) return <p className="dash__loading">Cargando métricas…</p>;

  const open =
    metrics.total -
    (metrics.byStatus.finalizado ?? 0) -
    (metrics.byStatus.rechazado ?? 0);

  const kpis = [
    { label: 'Requerimientos totales', value: metrics.total },
    { label: 'Abiertos', value: open },
    { label: 'Prioridad alta abiertos', value: metrics.openHighPriority },
    { label: 'Finalizados (últimos 30 días)', value: metrics.finishedLast30Days },
  ];

  return (
    <section>
      <header className="dash__header">
        <h1>Dashboard</h1>
        <Link className="dash__cta" to="/requerimientos/nuevo">
          + Nuevo requerimiento
        </Link>
      </header>

      <div className="dash__kpis">
        {kpis.map((kpi) => (
          <article key={kpi.label} className="dash__kpi">
            <p className="dash__kpi-value">{kpi.value}</p>
            <p className="dash__kpi-label">{kpi.label}</p>
          </article>
        ))}
      </div>

      <div className="dash__charts">
        <BarPanel
          title="Por estado"
          data={Object.entries(metrics.byStatus).map(([key, value]) => ({
            label: STATUS_LABELS[key as Status] ?? key,
            value,
            href: `/requerimientos?status=${key}`,
          }))}
        />
        <BarPanel
          title="Por área solicitante"
          data={Object.entries(metrics.byArea).map(([key, value]) => ({
            label: key,
            value,
            href: `/requerimientos?area=${encodeURIComponent(key)}`,
          }))}
        />
        <BarPanel
          title="Por prioridad"
          data={(['alta', 'media', 'baja'] as const)
            .filter((p) => metrics.byPriority[p])
            .map((p) => ({
              label: p[0].toUpperCase() + p.slice(1),
              value: metrics.byPriority[p],
              href: `/requerimientos?priority=${p}`,
            }))}
        />
      </div>

      {requirements.length > 0 && (
        <article className="dash__panel dash__reqs">
          <h2>Requerimientos por fecha de creación</h2>
          <div className="dash__table-wrap">
            <table className="dash__table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha creación</th>
                  <th>Título</th>
                  <th>Área</th>
                  <th>Responsable</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Días abierto</th>
                </tr>
              </thead>
              <tbody>
                {requirements.map((req) => (
                  <tr key={req.id}>
                    <td className="dash__req-id">{req.id}</td>
                    <td className="dash__req-date">{req.createdAt}</td>
                    <td>
                      <Link to={`/requerimientos/${req.id}`} className="dash__req-title">
                        {req.title}
                      </Link>
                    </td>
                    <td className="dash__req-area">{req.area}</td>
                    <td className="dash__req-assignee">
                      {req.assignedToName ?? (req.assignedExternal ? `${req.assignedExternal} (ext.)` : <span className="dash__req-unassigned">Sin asignar</span>)}
                    </td>
                    <td><PriorityBadge priority={req.priority} /></td>
                    <td><StatusBadge status={req.status} /></td>
                    <td className="dash__req-days">{diasAbierto(req)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}
    </section>
  );
}

interface BarDatum {
  label: string;
  value: number;
  href: string;
}

function BarPanel({ title, data }: { title: string; data: BarDatum[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <article className="dash__panel">
      <h2>{title}</h2>
      <ul>
        {data.map((d) => (
          <li key={d.label}>
            <Link to={d.href} className="dash__bar-row">
              <span className="dash__bar-label">{d.label}</span>
              <span className="dash__bar-track">
                <span className="dash__bar-fill" style={{ width: `${(d.value / max) * 100}%` }} />
              </span>
              <span className="dash__bar-value">{d.value}</span>
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
