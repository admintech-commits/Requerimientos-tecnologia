import { db } from './connection.js';
import { hashPassword } from '../lib/password.js';
import { computePriority } from '../domain/types.js';

/**
 * Datos de prueba: 2 usuarios (empleado y aprobador) y
 * requerimientos de ejemplo en distintos estados.
 * Solo se ejecuta si la base está vacía.
 */
export function seedIfEmpty(): void {
  const users = (db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number }).n;
  if (users > 0) return;

  console.log('Base vacía: cargando datos de prueba…');

  const insertUser = db.prepare(
    'INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)',
  );
  const empleadoId = Number(
    insertUser.run('empleado@empresa.com', 'Laura Gómez', hashPassword('demo1234'), 'empleado')
      .lastInsertRowid,
  );
  const aprobadorId = Number(
    insertUser.run('aprobador@empresa.com', 'Carlos Ruiz', hashPassword('demo1234'), 'aprobador')
      .lastInsertRowid,
  );

  const insertReq = db.prepare(
    `INSERT INTO requirements
      (title, description, area, type, requester_position, impact, urgency, priority_score,
       priority, status, requested_date, attachments, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', ?, datetime('now', ?), datetime('now', ?))`,
  );
  const insertEvent = db.prepare(
    `INSERT INTO requirement_events (requirement_id, user_id, from_status, to_status, comment, created_at)
     VALUES (?, ?, ?, ?, ?, datetime('now', ?))`,
  );

  const samples = [
    {
      title: 'Integración de reservas con canal WhatsApp',
      description:
        'Se requiere conectar el motor de reservas del hotel con WhatsApp Business para confirmar reservas automáticamente y reducir tiempos de respuesta del área comercial.',
      area: 'Reservas',
      type: 'Nuevo desarrollo',
      position: 'Coordinadora de Reservas',
      impact: 3,
      urgency: 3,
      status: 'en_desarrollo',
      daysAgo: 20,
      requestedInDays: 15,
    },
    {
      title: 'Reporte diario de ocupación por sede',
      description:
        'Generar un reporte automático de ocupación por cada sede (Tower, Boutique, Normandía) que llegue por correo a gerencia todos los días a las 6 a. m.',
      area: 'Gerencia',
      type: 'Datos / Reportes',
      position: 'Gerente General',
      impact: 3,
      urgency: 2,
      status: 'aprobado',
      daysAgo: 12,
      requestedInDays: 20,
    },
    {
      title: 'Corrección en cálculo de propinas del restaurante',
      description:
        'El sistema del restaurante calcula mal la propina sugerida cuando se divide la cuenta entre varios comensales. Afecta la facturación diaria del punto de venta.',
      area: 'Contabilidad',
      type: 'Corrección de error',
      position: 'Auxiliar Contable',
      impact: 2,
      urgency: 3,
      status: 'en_pruebas',
      daysAgo: 8,
      requestedInDays: 5,
    },
    {
      title: 'App de control de despacho para conductores',
      description:
        'Taxi Imperial necesita una vista móvil para que los conductores confirmen servicios asignados, marquen inicio y fin de carrera y reporten novedades en tiempo real.',
      area: 'Operaciones',
      type: 'Nuevo desarrollo',
      position: 'Jefe de Operaciones',
      impact: 3,
      urgency: 2,
      status: 'en_revision',
      daysAgo: 5,
      requestedInDays: 45,
    },
    {
      title: 'Actualización de certificados SSL de los portales',
      description:
        'Renovar y automatizar la renovación de certificados SSL de los sitios del grupo para evitar advertencias de seguridad en los navegadores de los clientes.',
      area: 'Tecnología',
      type: 'Infraestructura',
      position: 'Administrador de Sistemas',
      impact: 2,
      urgency: 2,
      status: 'finalizado',
      daysAgo: 40,
      requestedInDays: -10,
    },
    {
      title: 'Formulario de vacaciones en la intranet',
      description:
        'Talento Humano solicita digitalizar el formato de solicitud de vacaciones que hoy se diligencia en papel, con aprobación del jefe directo y notificación por correo.',
      area: 'Talento Humano',
      type: 'Mejora',
      position: 'Analista de Talento Humano',
      impact: 1,
      urgency: 2,
      status: 'creado',
      daysAgo: 2,
      requestedInDays: 30,
    },
    {
      title: 'Campaña de fidelización con puntos por estadía',
      description:
        'El área comercial propone acumular puntos canjeables por noches o consumos del restaurante. Requiere módulo de puntos en el perfil del huésped y reglas de acumulación.',
      area: 'Comercial',
      type: 'Nuevo desarrollo',
      position: 'Directora Comercial',
      impact: 2,
      urgency: 1,
      status: 'creado',
      daysAgo: 1,
      requestedInDays: 60,
    },
    {
      title: 'Migración del servidor de contabilidad',
      description:
        'El servidor actual de contabilidad está al límite de capacidad. Se requiere migrarlo a la nube con ventana de mantenimiento un fin de semana.',
      area: 'Contabilidad',
      type: 'Infraestructura',
      position: 'Contador Público',
      impact: 3,
      urgency: 1,
      status: 'rechazado',
      daysAgo: 15,
      requestedInDays: 10,
    },
  ] as const;

  const statusPath: Record<string, string[]> = {
    creado: ['creado'],
    en_revision: ['creado', 'en_revision'],
    aprobado: ['creado', 'en_revision', 'aprobado'],
    en_desarrollo: ['creado', 'en_revision', 'aprobado', 'en_desarrollo'],
    en_pruebas: ['creado', 'en_revision', 'aprobado', 'en_desarrollo', 'en_pruebas'],
    finalizado: ['creado', 'en_revision', 'aprobado', 'en_desarrollo', 'en_pruebas', 'finalizado'],
    rechazado: ['creado', 'en_revision', 'rechazado'],
  };

  for (const s of samples) {
    const { score, priority } = computePriority(s.impact, s.urgency);
    const createdOffset = `-${s.daysAgo} days`;
    const requestedDate = new Date(Date.now() + s.requestedInDays * 86_400_000)
      .toISOString()
      .slice(0, 10);

    const reqId = Number(
      insertReq.run(
        s.title,
        s.description,
        s.area,
        s.type,
        s.position,
        s.impact,
        s.urgency,
        score,
        priority,
        s.status,
        requestedDate,
        empleadoId,
        createdOffset,
        createdOffset,
      ).lastInsertRowid,
    );

    const path = statusPath[s.status];
    path.forEach((status, index) => {
      insertEvent.run(
        reqId,
        index === 0 ? empleadoId : aprobadorId,
        index === 0 ? null : path[index - 1],
        status,
        index === 0 ? 'Requerimiento registrado' : null,
        `-${s.daysAgo - index} days`,
      );
    });
  }

  console.log('Datos de prueba cargados. Usuarios: empleado@empresa.com / aprobador@empresa.com (contraseña: demo1234)');
}
