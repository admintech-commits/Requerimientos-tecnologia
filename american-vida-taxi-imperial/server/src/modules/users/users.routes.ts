import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { db } from '../../db/connection.js';
import { hashPassword } from '../../lib/password.js';
import { HttpError } from '../../lib/httpError.js';
import { requireAuth, requireRole, type AuthRequest } from '../../middleware/auth.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Contraseña temporal legible, ej: AV-7kq2mx9d */
function generateTempPassword(): string {
  return `AV-${randomBytes(5).toString('base64url').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8).padEnd(8, '7')}`;
}

export const usersRouter = Router();

usersRouter.use(requireAuth);

// Listado de usuarios — aprobadores y gestores (necesario para asignar responsables)
usersRouter.get('/', requireRole('aprobador', 'gestor'), (req: AuthRequest, res, next) => {
  try {
    const users = db
      .prepare(
        'SELECT id, email, name, role, must_change_password, temp_password FROM users ORDER BY name',
      )
      .all() as Array<{
      id: number;
      email: string;
      name: string;
      role: string;
      must_change_password: number;
      temp_password: string | null;
    }>;

    res.json(
      users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        mustChangePassword: u.must_change_password === 1,
        // Solo visible para aprobadores y mientras no se haya definido contraseña propia
        tempPassword:
          req.user!.role === 'aprobador' && u.must_change_password === 1 ? u.temp_password : null,
      })),
    );
  } catch (error) {
    next(error);
  }
});

// Crear usuario con contraseña temporal y cambio obligatorio — solo aprobadores
usersRouter.post('/', requireRole('aprobador'), (req, res, next) => {
  try {
    const { email, name, role } = req.body as { email?: string; name?: string; role?: string };

    const cleanEmail = email?.toLowerCase().trim();
    const cleanName = name?.trim();

    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) throw new HttpError(400, 'Correo inválido');
    if (!cleanName || cleanName.length < 3) {
      throw new HttpError(400, 'El nombre debe tener al menos 3 caracteres');
    }
    if (role !== 'empleado' && role !== 'aprobador' && role !== 'gestor') {
      throw new HttpError(400, 'El rol debe ser empleado, gestor o administrador');
    }

    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (exists) throw new HttpError(409, 'Ya existe un usuario con ese correo');

    const tempPassword = generateTempPassword();
    const result = db
      .prepare(
        `INSERT INTO users (email, name, password_hash, role, must_change_password, temp_password)
         VALUES (?, ?, ?, ?, 1, ?)`,
      )
      .run(cleanEmail, cleanName, hashPassword(tempPassword), role, tempPassword);

    res.status(201).json({
      id: Number(result.lastInsertRowid),
      email: cleanEmail,
      name: cleanName,
      role,
      mustChangePassword: true,
      tempPassword, // se muestra una sola vez
    });
  } catch (error) {
    next(error);
  }
});

// Restablecer contraseña — solo aprobadores
usersRouter.post('/:id/reset-password', requireRole('aprobador'), (req: AuthRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    if (id === req.user!.id) {
      throw new HttpError(400, 'No puedes restablecer tu propia contraseña desde aquí');
    }

    const user = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(id) as
      | { id: number; email: string; name: string }
      | undefined;
    if (!user) throw new HttpError(404, 'Usuario no encontrado');

    const tempPassword = generateTempPassword();
    db.prepare(
      'UPDATE users SET password_hash = ?, must_change_password = 1, temp_password = ? WHERE id = ?',
    ).run(hashPassword(tempPassword), tempPassword, id);

    res.json({ id: user.id, email: user.email, name: user.name, tempPassword });
  } catch (error) {
    next(error);
  }
});
