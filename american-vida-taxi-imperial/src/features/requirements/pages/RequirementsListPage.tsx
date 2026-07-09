import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { listRequirements } from '../services/requirementsService';
import { PriorityBadge, StatusBadge } from '../components/Badges';
import { AREAS, STATUSES, type Requirement } from '../types';
import { STATUS_LABELS } from '../constants';
import './RequirementsListPage.css';

export default function RequirementsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<Requirement[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filters = {
    status: searchParams.get('status') ?? '',
    area: searchParams.get('area') ?? '',
    priority: searchParams.get('priority') ?? '',
    q: searchParams.get('q') ?? '',
  };

  useEffect(() => {
    setItems(null);
    listRequirements({
      status: filters.status || undefined,
      area: filters.area || undefined,
      priority: filters.priority || undefined,
      q: filters.q || undefined,
    })
      .then(setItems)
      .catch((e: Error) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function setFilter(key: string, value: string): void {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  }

  return (
    <section>
      <header className="list__header">
        <h1>Requerimientos</h1>
        <Link className="list__cta" to="/requerimientos/nuevo">
          + Nuevo requerimiento
        </Link>
      </header>

      <div className="list__filters">
        <input
          type="search"
          placeholder="Buscar por título o descripción…"
          value={filters.q}
          onChange={(e) => setFilter('q', e.target.value)}
          aria-label="Buscar"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilter('status', e.target.value)}
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los estados</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          value={filters.area}
          onChange={(e) => setFilter('area', e.target.value)}
          aria-label="Filtrar por área"
        >
          <option value="">Todas las áreas</option>
          {AREAS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          value={filters.priority}
          onChange={(e) => setFilter('priority', e.target.value)}
          aria-label="Filtrar por prioridad"
        >
          <option value="">Todas las prioridades</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
      </div>

      {error && <p className="list__error" role="alert">{error}</p>}
      {!error && items === null && <p className="list__empty">Cargando…</p>}
      {items?.length === 0 && <p className="list__empty">No hay requerimientos con estos filtros.</p>}

      {items && items.length > 0 && (
        <div className="list__table-wrap">
          <table className="list__table">
            <thead>
              <tr>
                <th>Requerimiento</th>
                <th>Área</th>
                <th>Tipo</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Responsable</th>
                <th>Fecha estimada</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link to={`/requerimientos/${r.id}`} className="list__title">
                      {r.title}
                    </Link>
                    <p className="list__meta">
                      #{r.id} · {r.createdByName}
                    </p>
                  </td>
                  <td>{r.area}</td>
                  <td>{r.type}</td>
                  <td>
                    <PriorityBadge priority={r.priority} />
                  </td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td>
                    {r.assignedToName ??
                      (r.assignedExternal ? (
                        `${r.assignedExternal} (ext.)`
                      ) : (
                        <span className="list__meta">Sin asignar</span>
                      ))}
                  </td>
                  <td>{r.requestedDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
