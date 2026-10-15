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
      const rawUserId = req.query.userId || (req.user ? req.user.id : null);
      const queryDate = req.query.date || new Date().toISOString().split('T')[0];

      if (!rawUserId) {
        return res.status(400).json({ success: false, message: 'El parámetro userId es obligatorio.' });
      }

      const userRow = db.prepare('SELECT id, username FROM users WHERE id = ? OR username = ?').get(rawUserId, rawUserId);
      const resolvedId = userRow ? userRow.id : rawUserId;
      const resolvedUsername = userRow ? userRow.username : rawUserId;

      const activeAssignments = db.prepare(`
        SELECT * FROM evaluation_assignments
        WHERE (user_id = ? OR user_id = ?) AND scheduled_date = ?
      `).all(resolvedId, resolvedUsername, queryDate);

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

  // =========================================================================
  // CALENDARIO DE EVALUACIONES (Flujo 12 PRDv2)
  // =========================================================================

  // 7. Listar todos los eventos del calendario con estadísticas de avance
  router.get('/calendar/events', authMiddleware, (req, res) => {
    try {
      const events = db.prepare('SELECT * FROM calendar_events ORDER BY start_date ASC').all();
      const usersList = db.prepare('SELECT id, username, name FROM users').all();
      const usersMap = new Map(usersList.map(u => [u.id, u]));

      const enriched = events.map(evt => {
        let assignedUserIds = [];
        try { assignedUserIds = JSON.parse(evt.assigned_users_json || '[]'); } catch (e) {}

        const assignedUserDetails = assignedUserIds.map(uid => {
          const u = usersMap.get(uid) || usersList.find(x => x.username === uid);
          return u ? { id: u.id, username: u.username, name: u.name } : { id: uid, username: uid, name: uid };
        });

        let questionnaireTitle = null;
        if (evt.questionnaire_id) {
          const q = db.prepare('SELECT title FROM theoretical_questionnaires WHERE id = ?').get(evt.questionnaire_id);
          if (q) questionnaireTitle = q.title;
        }

        const assignments = db.prepare('SELECT user_id, status FROM evaluation_assignments WHERE event_id = ?').all(evt.id);
        const completedCount = assignments.filter(a => a.status === 'COMPLETADO').length;

        return {
          id: evt.id,
          title: evt.title,
          evaluationType: evt.evaluation_type,
          level: evt.level,
          questionnaireId: evt.questionnaire_id,
          questionnaireTitle: questionnaireTitle,
          startDate: evt.start_date,
          endDate: evt.end_date,
          assignedUsers: assignedUserDetails,
          assignedUserIds: assignedUserIds,
          totalAssigned: assignedUserIds.length,
          completedCount: completedCount,
          completionRate: assignedUserIds.length > 0 ? Math.round((completedCount / assignedUserIds.length) * 100) : 0,
          createdBy: evt.created_by,
          createdAt: evt.created_at
        };
      });

      res.json(enriched);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 8. Crear nuevo evento en el calendario y generar asignaciones para asesores convocados
  router.post('/calendar/events', authMiddleware, (req, res) => {
    try {
      const userRoles = [
        req.user.role,
        ...(req.user.roles || [])
      ].map(r => String(r).toLowerCase());
      const isStaff = userRoles.some(r => ['admin', 'administrador', 'editor', 'revisor', 'supervisor', 'facilitador'].includes(r));
      if (!isStaff) {
        return res.status(403).json({ success: false, message: 'Acceso restringido a editores, supervisores y administradores.' });
      }

      const {
        title,
        evaluationType = 'SIMULADOR',
        level = 'basico',
        questionnaireId = null,
        startDate,
        endDate = null,
        assignedUsers = []
      } = req.body;

      if (!title || !startDate) {
        return res.status(400).json({ success: false, message: 'El título y la fecha de inicio son obligatorios.' });
      }

      const newEventId = 'evt-' + Date.now();
      const now = new Date().toISOString();
      const finalEndDate = endDate || startDate;

      db.prepare(`
        INSERT INTO calendar_events (id, title, evaluation_type, level, questionnaire_id, start_date, end_date, assigned_users_json, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newEventId,
        title,
        evaluationType,
        level,
        questionnaireId,
        startDate,
        finalEndDate,
        JSON.stringify(assignedUsers),
        req.user.username || 'admin',
        now
      );

      // Generar asignaciones de evaluación para cada asesor convocado
      const insertAssign = db.prepare(`
        INSERT INTO evaluation_assignments (id, event_id, user_id, title, evaluation_type, scheduled_date, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'PENDIENTE', ?, ?)
      `);

      for (const userId of assignedUsers) {
        const assignId = `asgn-${newEventId}-${userId}`;
        insertAssign.run(assignId, newEventId, userId, title, evaluationType, startDate, now, now);
      }

      res.status(201).json({
        success: true,
        message: 'Evento programado exitosamente en el calendario y bloqueo Gatekeeper activado.',
        eventId: newEventId,
        assignedCount: assignedUsers.length
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 9. Eliminar evento del calendario y sus asignaciones pendientes
  router.delete('/calendar/events/:id', authMiddleware, (req, res) => {
    try {
      const userRoles = [
        req.user.role,
        ...(req.user.roles || [])
      ].map(r => String(r).toLowerCase());
      const isStaff = userRoles.some(r => ['admin', 'administrador', 'editor', 'revisor', 'supervisor', 'facilitador'].includes(r));
      if (!isStaff) {
        return res.status(403).json({ success: false, message: 'Acceso restringido a editores, supervisores y administradores.' });
      }

      const eventId = req.params.id;
      db.prepare('DELETE FROM calendar_events WHERE id = ?').run(eventId);
      db.prepare("DELETE FROM evaluation_assignments WHERE event_id = ? AND status = 'PENDIENTE'").run(eventId);

      res.json({ success: true, message: 'Evento eliminado correctamente.' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // =========================================================================
  // CUESTIONARIOS TEÓRICOS DE REGLAS DE NEGOCIO (Estilo Google Forms - Flujo 12 PRDv2)
  // =========================================================================

  // 10. Listar catálogo de cuestionarios teóricos institucionales
  router.get('/questionnaires', authMiddleware, (req, res) => {
    try {
      const questionnaires = db.prepare('SELECT * FROM theoretical_questionnaires ORDER BY created_at DESC').all();
      const mapped = questionnaires.map(q => {
        let questions = [];
        try { questions = JSON.parse(q.questions_json || '[]'); } catch (e) {}
        return {
          id: q.id,
          title: q.title,
          description: q.description,
          durationMinutes: q.duration_minutes,
          xpReward: q.xp_reward,
          questionCount: questions.length,
          createdBy: q.created_by,
          createdAt: q.created_at
        };
      });
      res.json(mapped);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 11. Consultar detalle de un cuestionario con sus preguntas
  router.get('/questionnaires/:id', authMiddleware, (req, res) => {
    try {
      const q = db.prepare('SELECT * FROM theoretical_questionnaires WHERE id = ?').get(req.params.id);
      if (!q) {
        return res.status(404).json({ success: false, message: 'Cuestionario no encontrado.' });
      }

      let questions = [];
      try { questions = JSON.parse(q.questions_json || '[]'); } catch (e) {}

      // Si el usuario es asesor y va a rendir, ocultar correctAnswers para evitar spoilers
      const isStaff = ['admin', 'editor', 'facilitador'].includes(req.user.role);
      const sanitizedQuestions = questions.map(qu => {
        if (!isStaff) {
          const { correctAnswers, ...rest } = qu;
          return rest;
        }
        return qu;
      });

      res.json({
        id: q.id,
        title: q.title,
        description: q.description,
        durationMinutes: q.duration_minutes,
        xpReward: q.xp_reward,
        questions: sanitizedQuestions,
        createdBy: q.created_by,
        createdAt: q.created_at
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 12. Crear nuevo cuestionario teórico (Constructor dinámico estilo Google Forms)
  router.post('/questionnaires', authMiddleware, (req, res) => {
    try {
      const isStaff = ['admin', 'editor'].includes(req.user.role);
      if (!isStaff) {
        return res.status(403).json({ success: false, message: 'Acceso restringido a editores y administradores.' });
      }

      const {
        title,
        description = '',
        durationMinutes = 20,
        xpReward = 50,
        questions = []
      } = req.body;

      if (!title || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ success: false, message: 'El título y al menos una pregunta son requeridos.' });
      }

      const newId = 'quest-' + Date.now();
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO theoretical_questionnaires (id, title, description, duration_minutes, xp_reward, questions_json, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newId,
        title,
        description,
        durationMinutes,
        xpReward,
        JSON.stringify(questions),
        req.user.username || 'admin',
        now
      );

      res.status(201).json({
        success: true,
        message: 'Cuestionario teórico creado exitosamente y disponible en el calendario.',
        questionnaireId: newId
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 13. Enviar resolución de cuestionario por un asesor, calificar vigesimalmente y desbloquear Gatekeeper
  router.post('/questionnaires/:id/submit', authMiddleware, (req, res) => {
    try {
      const q = db.prepare('SELECT * FROM theoretical_questionnaires WHERE id = ?').get(req.params.id);
      if (!q) {
        return res.status(404).json({ success: false, message: 'Cuestionario no encontrado.' });
      }

      const { userAnswers = {}, durationSeconds = 0 } = req.body;
      let questions = [];
      try { questions = JSON.parse(q.questions_json || '[]'); } catch (e) {}

      if (questions.length === 0) {
        return res.status(400).json({ success: false, message: 'El cuestionario no contiene preguntas.' });
      }

      let correctCount = 0;
      const feedback = questions.map((qu, index) => {
        const given = userAnswers[qu.id] !== undefined ? userAnswers[qu.id] : (userAnswers[index] || null);
        const correctAnswers = qu.correctAnswers || [];
        let isCorrect = false;

        if (qu.type === 'multiple') {
          const givenArr = Array.isArray(given) ? given : [given].filter(Boolean);
          isCorrect = correctAnswers.length === givenArr.length &&
            correctAnswers.every(ca => givenArr.includes(ca));
        } else {
          isCorrect = correctAnswers.includes(given);
        }

        if (isCorrect) correctCount++;

        return {
          questionId: qu.id,
          text: qu.text,
          givenAnswer: given,
          correctAnswers: correctAnswers,
          isCorrect: isCorrect,
          explanation: qu.explanation || 'Respuesta verificada según la normativa oficial UYAPAY B2C.'
        };
      });

      // Calificación vigesimal oficial (0 - 20)
      const numericScore = Math.round((correctCount / questions.length) * 20 * 10) / 10;
      const passed = numericScore >= 12;
      // XP proporcional asignado al cuestionario
      const xpEarned = Math.round((numericScore / 20) * (q.xp_reward || 50));

      const submissionId = 'sub-th-' + Date.now();
      const now = new Date().toISOString();
      const userId = req.user.id;

      // Guardar sumisión con auditoría forense de respuestas
      db.prepare(`
        INSERT INTO theoretical_submissions (id, questionnaire_id, user_id, score, numeric_score, passed, xp_earned, answers_json, duration_seconds, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        submissionId,
        q.id,
        userId,
        Math.round(numericScore),
        numericScore,
        passed ? 1 : 0,
        xpEarned,
        JSON.stringify(feedback),
        durationSeconds,
        now
      );

      // Registrar puntos ganados en user_scores
      db.prepare(`
        INSERT INTO user_scores (id, user_id, source_type, source_id, points, description, created_at)
        VALUES (?, ?, 'QUESTIONNAIRE', ?, ?, ?, ?)
      `).run(
        'sc-th-' + Date.now(),
        userId,
        q.id,
        xpEarned,
        `Cuestionario Teórico: ${q.title} (${numericScore}/20)`,
        now
      );

      // Desbloquear automáticamente Gatekeeper (cambiar asignación pendiente a COMPLETADO)
      db.prepare(`
        UPDATE evaluation_assignments
        SET status = 'COMPLETADO', updated_at = ?
        WHERE (user_id = ? OR user_id = ?)
          AND (evaluation_type = 'CUESTIONARIO' OR title = ?)
          AND status IN ('PENDIENTE', 'EN_CURSO')
      `).run(now, userId, req.user.username, q.title);

      res.json({
        success: true,
        submissionId: submissionId,
        score: `${numericScore.toFixed(1)} / 20`,
        numericScore: numericScore,
        passed: passed,
        status: passed ? 'Aprobado' : 'Desaprobado',
        xpEarned: xpEarned,
        totalQuestions: questions.length,
        correctQuestions: correctCount,
        feedback: feedback
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  return router;
}

module.exports = { createEvaluationsRouter };
