/**
 * Rutas del Módulo de Evaluación, Persistencia de Simulador y Gatekeeper
 * Implementa Flujo 6, Flujo 12, Algoritmo 3 y Gatekeeper API (PRDv2 y arquitecture.md).
 */
const express = require('express');

function createEvaluationsRouter(db, authMiddleware, adminMiddleware) {
  const router = express.Router();

  // 1. Consultar estado de sesión activa del simulador ante F5 / recarga (Flujo 6 PRDv2)
  router.get('/simulator/session', authMiddleware, (req, res) => {
    try {
      const userId = req.user.id;
      const session = db.prepare('SELECT * FROM simulator_sessions WHERE user_id = ?').get(userId);

      if (!session) {
        return res.json({
          hasActiveSession: false,
          session: null
        });
      }

      let casesProgress = [];
      try {
        casesProgress = JSON.parse(session.cases_progress_json || '[]');
      } catch (e) {
        casesProgress = [];
      }

      res.json({
        hasActiveSession: true,
        session: {
          userId: session.user_id,
          currentCaseCode: session.current_case_code,
          activeTabIndex: session.active_tab_index,
          elapsedSeconds: session.elapsed_seconds,
          casesProgress: casesProgress,
          updatedAt: session.updated_at
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 2. Guardar / sincronizar sesión activa del simulador (Flujo 6 PRDv2)
  router.post('/simulator/session', authMiddleware, (req, res) => {
    try {
      const userId = req.user.id;
      const {
        currentCaseCode = null,
        casesProgress = [],
        activeTabIndex = 0,
        elapsedSeconds = 0
      } = req.body;

      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO simulator_sessions (user_id, current_case_code, cases_progress_json, active_tab_index, elapsed_seconds, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          current_case_code = excluded.current_case_code,
          cases_progress_json = excluded.cases_progress_json,
          active_tab_index = excluded.active_tab_index,
          elapsed_seconds = excluded.elapsed_seconds,
          updated_at = excluded.updated_at
      `).run(
        userId,
        currentCaseCode,
        JSON.stringify(casesProgress),
        activeTabIndex,
        elapsedSeconds,
        now
      );

      res.json({
        success: true,
        message: 'Sesión del simulador sincronizada exitosamente.',
        updatedAt: now
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 3. Limpiar sesión del simulador (al finalizar o reiniciar evaluación)
  router.delete('/simulator/session', authMiddleware, (req, res) => {
    try {
      const userId = req.user.id;
      db.prepare('DELETE FROM simulator_sessions WHERE user_id = ?').run(userId);
      res.json({ success: true, message: 'Sesión de simulador limpiada correctamente.' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 4. Gatekeeper Status API (Algoritmo 3 PRDv2 / arquitecture.md)
  // GET /api/evaluations/gatekeeper/status?userId={userId}&date={YYYY-MM-DD}
  router.get('/gatekeeper/status', (req, res) => {
    try {
      const userId = req.query.userId || (req.user ? req.user.id : null);
      const queryDate = req.query.date || new Date().toISOString().split('T')[0];

      if (!userId) {
        return res.status(400).json({ success: false, message: 'El parámetro userId es obligatorio.' });
      }

      const activeAssignments = db.prepare(`
        SELECT * FROM evaluation_assignments
        WHERE user_id = ? AND scheduled_date = ?
      `).all(userId, queryDate);

      for (const assign of activeAssignments) {
        if (assign.status === 'PENDIENTE' || assign.status === 'EN_CURSO') {
          return res.json({
            has_blocking_evaluation: true,
            status: 'LOCKED',
            evaluation: {
              eventId: assign.event_id,
              title: assign.title,
              type: assign.evaluation_type,
              status: assign.status,
              scheduledDate: assign.scheduled_date
            }
          });
        }
      }

      res.json({
        has_blocking_evaluation: false,
        status: 'UNLOCKED'
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 5. Asignar evaluación programada (Admin / Editor)
  router.post('/assignments', adminMiddleware, (req, res) => {
    try {
      const {
        eventId = 'evt-' + Date.now(),
        userId,
        title,
        evaluationType = 'SIMULADOR',
        scheduledDate
      } = req.body;

      if (!userId || !title || !scheduledDate) {
        return res.status(400).json({ success: false, message: 'userId, title y scheduledDate son obligatorios.' });
      }

      const newId = 'asgn-' + Date.now();
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO evaluation_assignments (id, event_id, user_id, title, evaluation_type, scheduled_date, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'PENDIENTE', ?, ?)
      `).run(newId, eventId, userId, title, evaluationType, scheduledDate, now, now);

      res.status(201).json({
        success: true,
        message: 'Evaluación asignada correctamente.',
        assignmentId: newId
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 6. Actualizar estado de asignación de evaluación
  router.patch('/assignments/:id/status', authMiddleware, (req, res) => {
    try {
      const assignmentId = req.params.id;
      const { status } = req.body;

      if (!['PENDIENTE', 'EN_CURSO', 'COMPLETADO'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Estado inválido. Use PENDIENTE, EN_CURSO o COMPLETADO.' });
      }

      const now = new Date().toISOString();
      db.prepare(`
        UPDATE evaluation_assignments SET status = ?, updated_at = ? WHERE id = ?
      `).run(status, now, assignmentId);

      res.json({ success: true, message: 'Estado de asignación actualizado.', status });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  return router;
}

module.exports = { createEvaluationsRouter };
