import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { api } from '@/lib/apiClient';
import { createRequirement } from '../services/requirementsService';
import { AREAS, REQUEST_TYPES, type CreateRequirementInput } from '../types';
import { LEVEL_LABELS, attachmentLabel } from '../constants';
import './RequirementNewPage.css';

const INITIAL: CreateRequirementInput = {
  title: '',
  description: '',
  area: '',
  type: '',
  requesterPosition: '',
  impact: 2,
  urgency: 2,
  requestedDate: '',
  attachments: [],
};

export default function RequirementNewPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState<CreateRequirementInput>(INITIAL);
  const [attachment, setAttachment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function update<K extends keyof CreateRequirementInput>(
    key: K,
    value: CreateRequirementInput[K],
  ): void {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function addAttachment(): void {
    const value = attachment.trim();
    if (!value || values.attachments.includes(value)) return;
    update('attachments', [...values.attachments, value]);
    setAttachment('');
  }

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded = await api.upload('/uploads', file);
      update('attachments', [...values.attachments, uploaded.url]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No fue posible subir el archivo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const created = await createRequirement(values);
      navigate(`/requerimientos/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No fue posible registrar el requerimiento');
      setLoading(false);
    }
  }

  return (
    <section className="new">
      <h1>Nuevo requerimiento</h1>
      <p className="new__hint">
        Describe la necesidad con el mayor detalle posible: esto agiliza la revisión y aprobación.
      </p>

      <form className="new__form" onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="new__alert" role="alert">
            {error}
          </div>
        )}

        <label className="new__field">
          <span>Título *</span>
          <input
            type="text"
            value={values.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Resumen corto de la necesidad"
            required
            minLength={5}
          />
        </label>

        <label className="new__field">
          <span>Descripción detallada *</span>
          <textarea
            value={values.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Qué se necesita, por qué, a quién beneficia y qué impacto tiene…"
            rows={5}
            required
            minLength={20}
          />
        </label>

        <div className="new__grid">
          <label className="new__field">
            <span>Área solicitante *</span>
            <select value={values.area} onChange={(e) => update('area', e.target.value as never)} required>
              <option value="">Selecciona…</option>
              {AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>

          <label className="new__field">
            <span>Cargo del solicitante *</span>
            <input
              type="text"
              value={values.requesterPosition}
              onChange={(e) => update('requesterPosition', e.target.value)}
              placeholder="ej: Coordinadora de Reservas"
              required
              minLength={3}
            />
          </label>

          <label className="new__field">
            <span>Tipo de solicitud *</span>
            <select value={values.type} onChange={(e) => update('type', e.target.value as never)} required>
              <option value="">Selecciona…</option>
              {REQUEST_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="new__field">
            <span>Impacto *</span>
            <select value={values.impact} onChange={(e) => update('impact', Number(e.target.value))}>
              {[1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {LEVEL_LABELS[n]}
                </option>
              ))}
            </select>
          </label>

          <label className="new__field">
            <span>Urgencia *</span>
            <select value={values.urgency} onChange={(e) => update('urgency', Number(e.target.value))}>
              {[1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {LEVEL_LABELS[n]}
                </option>
              ))}
            </select>
          </label>

          <label className="new__field">
            <span>Fecha estimada *</span>
            <input
              type="date"
              value={values.requestedDate}
              onChange={(e) => update('requestedDate', e.target.value)}
              required
            />
          </label>

        </div>

        <div className="new__field">
          <span>Adjuntos</span>
          <div className="new__attach-row">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.txt,.csv,.zip"
              onChange={handleFileSelected}
              disabled={uploading}
              aria-label="Subir documento"
            />
            {uploading && <span className="new__uploading">Subiendo…</span>}
          </div>
          <div className="new__attach-row">
            <input
              type="text"
              value={attachment}
              onChange={(e) => setAttachment(e.target.value)}
              placeholder="…o pega un enlace (https://)"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addAttachment();
                }
              }}
            />
            <button type="button" className="new__attach-add" onClick={addAttachment}>
              Agregar
            </button>
          </div>
          {values.attachments.length > 0 && (
            <ul className="new__attach-list">
              {values.attachments.map((a) => (
                <li key={a}>
                  {attachmentLabel(a)}
                  <button
                    type="button"
                    aria-label={`Quitar ${a}`}
                    onClick={() =>
                      update(
                        'attachments',
                        values.attachments.filter((x) => x !== a),
                      )
                    }
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="new__actions">
          <Button type="submit" loading={loading}>
            {loading ? 'Registrando…' : 'Registrar requerimiento'}
          </Button>
        </div>
      </form>
    </section>
  );
}
