import { Router } from 'express';
import { requireAuth, requireRole, type AuthRequest } from '../../middleware/auth.js';
import * as service from './requirements.service.js';

export const requirementsRouter = Router();

requirementsRouter.use(requireAuth);

// Lista con filtros: ?status=&area=&priority=&q=
requirementsRouter.get('/', (req, res, next) => {
  try {
    const { status, area, priority, q } = req.query as Record<string, string | undefined>;
    res.json(service.listRequirements({ status, area, priority, q }));
  } catch (error) {
    next(error);
  }
});

// Métricas para el dashboard
requirementsRouter.get('/metrics', (_req, res, next) => {
  try {
    res.json(service.getMetrics());
  } catch (error) {
    next(error);
  }
});

// Detalle + historial de eventos (trazabilidad)
requirementsRouter.get('/:id', (req, res, next) => {
  try {
    res.json(service.getRequirement(Number(req.params.id)));
  } catch (error) {
    next(error);
  }
});

// Registro de requerimiento (cualquier usuario autenticado)
requirementsRouter.post('/', (req: AuthRequest, res, next) => {
  try {
    const requirement = service.createRequirement(req.body, req.user!);
    res.status(201).json(requirement);
  } catch (error) {
    next(error);
  }
});

// Asignar responsable — aprobadores y gestores
requirementsRouter.patch('/:id/assign', requireRole('aprobador', 'gestor'), (req: AuthRequest, res, next) => {
  try {
    const { userId, externalName } = req.body as {
      userId?: number | null;
      externalName?: string | null;
    };
    const requirement = service.assignRequirement(
      Number(req.params.id),
      { userId: userId === null || userId === undefined ? null : Number(userId), externalName },
      req.user!,
    );
    res.json(requirement);
  } catch (error) {
    next(error);
  }
});

// Cambio de estado — aprobadores y gestores (validación y gestión)
requirementsRouter.patch('/:id/status', requireRole('aprobador', 'gestor'), (req: AuthRequest, res, next) => {
  try {
    const { status, comment } = req.body as { status?: string; comment?: string };
    const requirement = service.changeStatus(
      Number(req.params.id),
      status ?? '',
      comment,
      req.user!,
    );
    res.json(requirement);
  } catch (error) {
    next(error);
  }
});
