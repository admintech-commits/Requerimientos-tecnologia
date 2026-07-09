import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMetrics } from '../services/requirementsService';
import { STATUS_LABELS } from '../constants';
import type { Metrics, Status } from '../types';
import './DashboardPage.css';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMetrics()
      .then(setMetrics)
      .catch((e: Error) => setError(e.message));
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
