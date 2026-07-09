import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../../db/connection.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import { HttpError } from '../../lib/httpError.js';
import { config } from '../../config.js';
import { requireAuth, type AuthRequest } from '../../middleware/auth.js';
import type { Role } from '../../domain/types.js';

interface UserRow {
  id: number;
  email: string;
  name: string;
  password_hash: string;
  role: Role;
  must_change_password: number;
}

export const authRouter = Router();

authRouter.post('/login', (req, res, next) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) throw new HttpError(400, 'Correo y contraseña son obligatorios');

    const user = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email.toLowerCase().trim()) as UserRow | undefined;

    if (!user || !verifyPassword(password, user.password_hash)) {
      throw new HttpError(401, 'Credenciales incorrectas. Verifica tu correo y contraseña.');
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, name: user.name, role: user.role },
      config.jwtSecret,
      { expiresIn: config.tokenExpiry },
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mustChangePassword: user.must_change_password === 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Cambio de contraseña del usuario autenticado
authRouter.post('/change-password', requireAuth, (req: AuthRequest, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };
    if (!currentPassword || !newPassword) {
      throw new HttpError(400, 'Debes indicar la contraseña actual y la nueva');
    }
    if (newPassword.length < 8) {
      throw new HttpError(400, 'La nueva contraseña debe tener al menos 8 caracteres');
    }
    if (newPassword === currentPassword) {
      throw new HttpError(400, 'La nueva contraseña debe ser diferente a la actual');
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as
      | UserRow
      | undefined;
    if (!user || !verifyPassword(currentPassword, user.password_hash)) {
      throw new HttpError(401, 'La contraseña actual es incorrecta');
    }

    db.prepare(
      'UPDATE users SET password_hash = ?, must_change_password = 0, temp_password = NULL WHERE id = ?',
    ).run(hashPassword(newPassword), user.id);

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
