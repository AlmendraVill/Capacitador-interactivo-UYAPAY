/**
 * Rutas de Gestión de Usuarios y Roles
 * Implementa RF-003, RF-004, RF-005, RF-006, RF-007 y RF-048.
 */
const express = require('express');

function createUsersRouter(db, authMiddleware, adminMiddleware) {
  const router = express.Router();

  // 0. Listar todos los usuarios con detalle completo (RF-003, RF-004, RF-005)
  router.get('/', adminMiddleware, (req, res) => {
    try {
      const users = db.prepare('SELECT id, username, name, email, role, status, created_at FROM users ORDER BY name ASC').all();
      const usersWithRoles = users.map(u => {
        const roles = db.prepare(`
          SELECT r.id, r.code, r.name FROM roles r
          JOIN user_roles ur ON r.id = ur.role_id
          WHERE ur.user_id = ?
        `).all(u.id);
        return {
          ...u,
          status: u.status || 'active',
          roles: roles.map(r => r.code),
          roleDetails: roles
        };
      });
      res.json(usersWithRoles);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 1. Listar roles del sistema
  router.get('/roles', (req, res) => {
    try {
      const roles = db.prepare('SELECT * FROM roles ORDER BY name ASC').all();
      res.json(roles);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 1b. Crear nuevo usuario (RF-003)
  router.post('/', adminMiddleware, (req, res) => {
    try {
      const { username, name, email, role = 'asesor', roles = ['rol-participante'], password = '123' } = req.body;
      if (!username || !name) {
        return res.status(400).json({ success: false, message: 'Usuario y nombre son obligatorios.' });
      }

      const cleanUsername = username.trim().toLowerCase();
      const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = ?').get(cleanUsername);
      if (existing) {
        return res.status(409).json({ success: false, message: 'Ese nombre de usuario ya está registrado.' });
      }

      const crypto = require('crypto');
      const salt = crypto.randomBytes(16).toString('hex');
      const iterations = 10000;
      const derived = crypto.pbkdf2Sync(password.trim(), salt, iterations, 64, 'sha512').toString('hex');
      const hashedPassword = `$pbkdf2$${iterations}$${salt}$${derived}`;

      const newId = 'usr-' + Date.now();
      const createdAt = new Date().toISOString();

      db.prepare(`
        INSERT INTO users (id, username, name, role, email, status, password, created_at)
        VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
      `).run(newId, cleanUsername, name.trim(), role, (email || '').trim(), hashedPassword, createdAt);

      // Asignar roles en user_roles
      if (Array.isArray(roles) && roles.length > 0) {
        const insertRole = db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)');
        roles.forEach(rId => insertRole.run(newId, rId));
      } else {
        const defaultRole = role === 'admin' ? 'rol-admin' : 'rol-participante';
        db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)').run(newId, defaultRole);
      }

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente.',
        user: { id: newId, username: cleanUsername, name: name.trim(), email: (email || '').trim(), role, status: 'active' }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 2. Editar información de un usuario (RF-004)
  router.put('/:id', adminMiddleware, (req, res) => {
    try {
      const userId = req.params.id;
      const { name, email, role } = req.body;

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      }

      const updatedName = name !== undefined ? name.trim() : user.name;
      const updatedEmail = email !== undefined ? email.trim() : (user.email || '');
      const updatedRole = role !== undefined ? role.trim() : user.role;

      db.prepare(`
        UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?
      `).run(updatedName, updatedEmail, updatedRole, userId);

      res.json({
        success: true,
        message: 'Usuario actualizado correctamente.',
        user: { id: userId, username: user.username, name: updatedName, email: updatedEmail, role: updatedRole }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 3. Activar o desactivar usuario (RF-005)
  router.patch('/:id/toggle-status', adminMiddleware, (req, res) => {
    try {
      const userId = req.params.id;
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      }

      const currentStatus = user.status || 'active';
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

      db.prepare('UPDATE users SET status = ? WHERE id = ?').run(newStatus, userId);

      res.json({
        success: true,
        message: `Usuario ${newStatus === 'active' ? 'habilitado' : 'deshabilitado'} con éxito.`,
        status: newStatus
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 4. Consultar roles asignados a un usuario (RF-006)
  router.get('/:id/roles', authMiddleware, (req, res) => {
    try {
      const userId = req.params.id;
      const roles = db.prepare(`
        SELECT r.* FROM roles r
        JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = ?
      `).all(userId);

      res.json(roles);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 5. Asignar uno o más roles a un usuario (RF-006, RF-048)
  router.put('/:id/roles', adminMiddleware, (req, res) => {
    try {
      const userId = req.params.id;
      const { roleIds } = req.body; // Array de IDs de rol

      if (!Array.isArray(roleIds)) {
        return res.status(400).json({ success: false, message: 'roleIds debe ser un array de identificadores.' });
      }

      // Eliminar asignaciones previas
      db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(userId);

      // Insertar nuevos roles
      const insert = db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');
      for (const rId of roleIds) {
        insert.run(userId, rId);
      }

      res.json({ success: true, message: 'Roles actualizados correctamente.' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 6. Modificar contraseña de usuario en caliente (Flujo 10 PRDv2)
  router.patch('/:id/password', authMiddleware, (req, res) => {
    try {
      const targetUserId = req.params.id;
      const { newPassword } = req.body;

      if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'La nueva contraseña no puede estar vacía.' });
      }

      const currentUser = req.user;
      const isSelf = currentUser && currentUser.id === targetUserId;
      const isAdmin = currentUser && (currentUser.role === 'admin' || (Array.isArray(currentUser.roles) && currentUser.roles.includes('admin')));
      const isEditor = currentUser && (currentUser.role === 'editor' || (Array.isArray(currentUser.roles) && currentUser.roles.includes('editor')));

      if (!isSelf && !isAdmin && !isEditor) {
        return res.status(403).json({ success: false, message: 'No tienes permisos para modificar la contraseña de este usuario.' });
      }

      const targetUser = db.prepare('SELECT id, username FROM users WHERE id = ?').get(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      }

      const crypto = require('crypto');
      const salt = crypto.randomBytes(16).toString('hex');
      const iterations = 10000;
      const derived = crypto.pbkdf2Sync(newPassword.trim(), salt, iterations, 64, 'sha512').toString('hex');
      const hashedPassword = `$pbkdf2$${iterations}$${salt}$${derived}`;

      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, targetUserId);

      res.json({
        success: true,
        message: 'Contraseña actualizada correctamente en caliente.',
        userId: targetUserId
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  return router;
}

module.exports = { createUsersRouter };
