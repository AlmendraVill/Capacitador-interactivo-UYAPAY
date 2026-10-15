/**
 * Rutas de Gamificación, Perfil de Usuario, Auditoría Forense y Supervisión
 * Implementa Flujo 2, Flujo 7, Flujo 9, SEG-01 a SEG-03 y RF-036 a RF-039.
 */
const express = require('express');

function createGamificationRouter(db, authMiddleware) {
  const router = express.Router();

  function isSupervisor(user) {
    if (!user || !user.role) return false;
    const r = user.role.toLowerCase();
    return ['admin', 'administrador', 'revisor', 'editor', 'facilitador'].includes(r);
  }

  // Función interna para evaluar y otorgar insignias automáticamente (Catálogo Oficial de 6 medallas)
  function checkAndAwardBadges(userId, username) {
    try {
      const allResults = db.prepare('SELECT * FROM results WHERE LOWER(username) = LOWER(?)').all(username);
      const insertBadge = db.prepare('INSERT OR IGNORE INTO user_badges (id, user_id, badge_id, awarded_at) VALUES (?, ?, ?, ?)');

      allResults.forEach(r => {
        // 1. Calificación Perfecta (20/20)
        if (r.numeric_score === 20) {
          insertBadge.run('ub-' + Date.now() + '-1', userId, 'bdg-perfect', r.completed_at || new Date().toISOString());
        }
        // 2. Precisión Impecable (0 errores)
        if (r.errors === 0) {
          insertBadge.run('ub-' + Date.now() + '-2', userId, 'bdg-zero-errors', r.completed_at || new Date().toISOString());
        }
        // 3. Velocista (< 240s)
        if (r.duration_seconds > 0 && r.duration_seconds < 240) {
          insertBadge.run('ub-' + Date.now() + '-3', userId, 'bdg-speedster', r.completed_at || new Date().toISOString());
        }
        // 5. Especialista en Cobranzas
        if (r.case_code === 'CP-11' || r.case_code === 'CP-26' || r.case_code === 'CP-29' || (r.case_title || '').toLowerCase().includes('cobranza')) {
          insertBadge.run('ub-' + Date.now() + '-cob', userId, 'bdg-cobranzas', r.completed_at || new Date().toISOString());
        }
      });

      // 4. Maestro Teórico (Aprobó todos los quizzes)
      const totalQuizzes = db.prepare('SELECT COUNT(*) as count FROM quizzes').get().count;
      if (totalQuizzes > 0) {
        const passedQuizzes = db.prepare(`
          SELECT COUNT(DISTINCT quiz_id) as count FROM quiz_submissions
          WHERE user_id = ? AND passed = 1
        `).get(userId).count;

        if (passedQuizzes >= totalQuizzes) {
          insertBadge.run('ub-' + Date.now() + '-4', userId, 'bdg-quiz-master', new Date().toISOString());
        }
      }
    } catch (e) {
      console.warn('[Gamification Warning] Evaluando insignias:', e.message);
    }
  }

  // 1. Perfil completo del usuario (puntaje consolidado, vitrina oficial de 6 medallas, desglose)
  router.get('/my-profile', authMiddleware, (req, res) => {
    try {
      const user = req.user;
      checkAndAwardBadges(user.id, user.username);

      // Datos actualizados del usuario en BD
      const userDb = db.prepare('SELECT id, username, name, role, pinned_badge_id, avatar_url FROM users WHERE id = ?').get(user.id) || user;

      // Historial de evaluaciones con simulador
      const evalResults = db.prepare('SELECT * FROM results WHERE LOWER(username) = LOWER(?) ORDER BY rowid DESC').all(user.username);
      const totalEvals = evalResults.length;
      const bestScore = evalResults.reduce((max, r) => Math.max(max, r.numeric_score || 0), 0);
      const totalEvalPoints = evalResults.reduce((acc, r) => acc + (r.numeric_score || 0), 0);

      // Cuestionarios de video (Aula Virtual) - Máxima nota por quiz
      const quizSubs = db.prepare('SELECT * FROM quiz_submissions WHERE user_id = ?').all(user.id);
      const quizBestMap = {};
      quizSubs.filter(q => q.passed === 1).forEach(q => {
        quizBestMap[q.quiz_id] = Math.max(quizBestMap[q.quiz_id] || 0, q.score || 0);
      });
      const totalQuizPoints = Object.values(quizBestMap).reduce((acc, pts) => acc + pts, 0);

      // Cuestionarios teóricos institucionales - Máxima nota por cuestionario
      let totalTheoreticalPoints = 0;
      let theoPassedCount = 0;
      try {
        const theoSubs = db.prepare('SELECT * FROM theoretical_submissions WHERE user_id = ?').all(user.id);
        const theoBestMap = {};
        theoSubs.filter(t => t.passed === 1).forEach(t => {
          theoBestMap[t.questionnaire_id] = Math.max(theoBestMap[t.questionnaire_id] || 0, t.xp_earned || 0);
        });
        totalTheoreticalPoints = Object.values(theoBestMap).reduce((acc, pts) => acc + pts, 0);
        theoPassedCount = Object.keys(theoBestMap).length;
      } catch (e) {}

      // Bolsa Única de XP Consolidado (Flujo 7 PRDv2)
      const globalPoints = (totalEvalPoints * 10) + totalQuizPoints + totalTheoreticalPoints;

      // Insignias ganadas
      const badges = db.prepare(`
        SELECT b.*, ub.awarded_at FROM badges b
        JOIN user_badges ub ON b.id = ub.badge_id
        WHERE ub.user_id = ?
        ORDER BY ub.awarded_at DESC
      `).all(user.id);

      // Catálogo oficial de insignias
      const allBadges = db.prepare('SELECT * FROM badges').all();
      const badgeCatalog = allBadges.map(b => {
        const earned = badges.find(ub => ub.id === b.id);
        return {
          ...b,
          unlocked: Boolean(earned),
          awardedAt: earned ? earned.awarded_at : null
        };
      });

      // Medalla fijada (pin broche metálico)
      let pinnedBadge = null;
      if (userDb.pinned_badge_id) {
        pinnedBadge = allBadges.find(b => b.id === userDb.pinned_badge_id) || null;
      }

      res.json({
        user: {
          id: userDb.id,
          username: userDb.username,
          name: userDb.name,
          role: userDb.role,
          avatarUrl: userDb.avatar_url || null,
          pinnedBadgeId: userDb.pinned_badge_id || null,
          pinnedBadge: pinnedBadge
        },
        stats: {
          globalPoints: globalPoints,
          classroomXp: totalQuizPoints,
          simulatorXp: totalEvalPoints * 10,
          theoreticalXp: totalTheoreticalPoints,
          evaluationsCount: totalEvals,
          bestScore: bestScore,
          quizzesPassed: quizSubs.filter(q => q.passed === 1).length,
          theoreticalPassed: theoPassedCount,
          badgesUnlockedCount: badges.length,
          totalBadgesCount: allBadges.length
        },
        badges: badgeCatalog,
        recentEvaluations: evalResults.slice(0, 5).map(r => ({
          id: r.id,
          caseTitle: r.case_title,
          score: r.score,
          errors: r.errors,
          status: r.status,
          duration: r.formatted_duration,
          date: r.completed_at
        }))
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 2. Fijar medalla / pin en el avatar de perfil (Flujo 8 PRDv2)
  router.post('/pin-badge', authMiddleware, (req, res) => {
    try {
      const { badgeId } = req.body;
      const userId = req.user.id;

      if (badgeId) {
        // Verificar que el usuario realmente haya desbloqueado la medalla
        const earned = db.prepare('SELECT * FROM user_badges WHERE user_id = ? AND badge_id = ?').get(userId, badgeId);
        if (!earned) {
          return res.status(400).json({ success: false, message: 'No has desbloqueado esta medalla todavía.' });
        }
      }

      db.prepare('UPDATE users SET pinned_badge_id = ? WHERE id = ?').run(badgeId || null, userId);

      res.json({
        success: true,
        message: badgeId ? 'Medalla fijada a tu avatar exitosamente.' : 'Medalla desanclada del avatar.',
        pinnedBadgeId: badgeId || null
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 3. Catálogo general de insignias
  router.get('/badges', authMiddleware, (req, res) => {
    try {
      const badges = db.prepare('SELECT * FROM badges ORDER BY name ASC').all();
      res.json(badges);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 4. Modal Nivel 1 — Desglose Histórico de Evaluaciones (Flujo 2 y Flujo 7 PRDv2)
  router.get('/advisors/:id/history', authMiddleware, (req, res) => {
    try {
      const targetParam = req.params.id;
      const currentUser = req.user;

      // Buscar el usuario objetivo
      const targetUser = db.prepare(`
        SELECT id, username, name, role, pinned_badge_id, avatar_url 
        FROM users 
        WHERE LOWER(id) = LOWER(?) OR LOWER(username) = LOWER(?)
      `).get(targetParam, targetParam);

      if (!targetUser) {
        return res.status(404).json({ success: false, message: 'Asesor no encontrado en el padrón.' });
      }

      // Control estricto de privacidad (PRDv2 Flujo 7):
      // El participante SOLO puede consultar su propio historial; los supervisores pueden consultar el de cualquiera.
      const isSelf = (currentUser.id === targetUser.id) || (currentUser.username.toLowerCase() === targetUser.username.toLowerCase());
      if (!isSelf && !isSupervisor(currentUser)) {
        return res.status(403).json({
          success: false,
          message: 'Control de privacidad activo: Solo puedes consultar tu propio historial de evaluaciones.'
        });
      }

      // Evaluaciones de Simulador Móvil
      const simResults = db.prepare(`
        SELECT id, case_id, case_code, case_title, score, numeric_score, errors, 
               formatted_duration, duration_seconds, status, completed_at
        FROM results 
        WHERE LOWER(username) = LOWER(?) 
        ORDER BY rowid DESC
      `).all(targetUser.username);

      // Quizzes del Aula Virtual
      let quizResults = [];
      try {
        quizResults = db.prepare(`
          SELECT qs.id, qs.quiz_id, q.title as title, qs.score, qs.max_score, qs.passed, qs.submitted_at
          FROM quiz_submissions qs
          JOIN quizzes q ON qs.quiz_id = q.id
          WHERE qs.user_id = ?
          ORDER BY qs.rowid DESC
        `).all(targetUser.id);
      } catch (e) {}

      // Cuestionarios Teóricos Google Forms
      let theoResults = [];
      try {
        theoResults = db.prepare(`
          SELECT ts.id, ts.questionnaire_id, tq.title as title, ts.score, ts.numeric_score, 
                 ts.passed, ts.xp_earned, ts.duration_seconds, ts.submitted_at
          FROM theoretical_submissions ts
          JOIN theoretical_questionnaires tq ON ts.questionnaire_id = tq.id
          WHERE ts.user_id = ?
          ORDER BY ts.rowid DESC
        `).all(targetUser.id);
      } catch (e) {}

      // Cálculo de métricas agregadas (tomando la mejor nota por quiz y cuestionario para evitar duplicidad)
      const totalSimPoints = simResults.reduce((acc, r) => acc + (r.numeric_score || 0), 0);
      const bestQuizMap = {};
      quizResults.filter(q => q.passed === 1).forEach(q => {
        const qId = q.quiz_id || q.id;
        bestQuizMap[qId] = Math.max(bestQuizMap[qId] || 0, q.score || 0);
      });
      const totalQuizPoints = Object.values(bestQuizMap).reduce((acc, pts) => acc + pts, 0);

      const bestTheoMap = {};
      theoResults.filter(t => t.passed === 1).forEach(t => {
        const tId = t.questionnaire_id || t.id;
        bestTheoMap[tId] = Math.max(bestTheoMap[tId] || 0, t.xp_earned || 0);
      });
      const totalTheoPoints = Object.values(bestTheoMap).reduce((acc, pts) => acc + pts, 0);
      const consolidatedXp = (totalSimPoints * 10) + totalQuizPoints + totalTheoPoints;

      res.json({
        success: true,
        advisor: {
          id: targetUser.id,
          username: targetUser.username,
          name: targetUser.name,
          role: targetUser.role
        },
        summary: {
          consolidatedXp: consolidatedXp,
          simulatorCount: simResults.length,
          quizzesPassed: quizResults.filter(q => q.passed === 1).length,
          theoreticalPassed: theoResults.filter(t => t.passed === 1).length,
          bestSimScore: simResults.reduce((max, r) => Math.max(max, r.numeric_score || 0), 0)
        },
        evaluations: {
          simulator: simResults.map(r => ({
            id: r.id,
            type: 'SIMULATOR',
            code: r.case_code,
            title: r.case_title,
            score: r.score,
            numericScore: r.numeric_score,
            errors: r.errors,
            duration: r.formatted_duration,
            status: r.status,
            date: r.completed_at
          })),
          quizzes: quizResults.map(q => ({
            id: q.id,
            type: 'QUIZ',
            title: q.title,
            score: `${q.score} / ${q.max_score}`,
            passed: Boolean(q.passed),
            status: q.passed ? 'Aprobado' : 'Desaprobado',
            date: q.submitted_at
          })),
          questionnaires: theoResults.map(t => ({
            id: t.id,
            type: 'QUESTIONNAIRE',
            title: t.title,
            score: `${t.numeric_score.toFixed(1)} / 20`,
            xpEarned: t.xp_earned,
            passed: Boolean(t.passed),
            status: t.passed ? 'Aprobado' : 'Desaprobado',
            durationSeconds: t.duration_seconds,
            date: t.submitted_at
          }))
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 5. Modal Nivel 2 — Auditoría Granular Ítem por Ítem (Flujo 2 y Flujo 7 PRDv2)
  router.get('/evaluations/audit/:type/:id', authMiddleware, (req, res) => {
    try {
      const { type, id } = req.params;
      const currentUser = req.user;

      if (type === 'simulator') {
        const result = db.prepare('SELECT * FROM results WHERE id = ?').get(id);
        if (!result) return res.status(404).json({ success: false, message: 'Evaluación no encontrada.' });

        const isSelf = (currentUser.username.toLowerCase() === result.username.toLowerCase());
        if (!isSelf && !isSupervisor(currentUser)) {
          return res.status(403).json({ success: false, message: 'No tienes autorización para auditar esta evaluación.' });
        }

        let casesDetails = [];
        let interactions = [];
        try {
          casesDetails = JSON.parse(result.cases_details || '[]');
          interactions = JSON.parse(result.interactions || '[]');
        } catch (e) {}

        return res.json({
          success: true,
          type: 'simulator',
          evaluation: {
            id: result.id,
            caseCode: result.case_code,
            caseTitle: result.case_title,
            advisorName: result.advisor_name,
            username: result.username,
            score: result.score,
            numericScore: result.numeric_score,
            errors: result.errors,
            duration: result.formatted_duration,
            status: result.status,
            completedAt: result.completed_at
          },
          cases: casesDetails,
          interactions: interactions
        });
      }

      if (type === 'quiz') {
        const submission = db.prepare(`
          SELECT qs.*, q.title as quiz_title 
          FROM quiz_submissions qs 
          JOIN quizzes q ON qs.quiz_id = q.id 
          WHERE qs.id = ?
        `).get(id);
        if (!submission) return res.status(404).json({ success: false, message: 'Quiz no encontrado.' });

        const isSelf = (currentUser.id === submission.user_id);
        if (!isSelf && !isSupervisor(currentUser)) {
          return res.status(403).json({ success: false, message: 'No tienes autorización para auditar este quiz.' });
        }

        let answers = [];
        try {
          answers = JSON.parse(submission.answers_json || '[]');
        } catch (e) {}

        return res.json({
          success: true,
          type: 'quiz',
          submission: {
            id: submission.id,
            quizId: submission.quiz_id,
            title: submission.quiz_title,
            score: submission.score,
            maxScore: submission.max_score,
            passed: Boolean(submission.passed),
            submittedAt: submission.submitted_at
          },
          answers: answers
        });
      }

      if (type === 'questionnaire') {
        const submission = db.prepare(`
          SELECT ts.*, tq.title as questionnaire_title, tq.description 
          FROM theoretical_submissions ts 
          JOIN theoretical_questionnaires tq ON ts.questionnaire_id = tq.id 
          WHERE ts.id = ?
        `).get(id);
        if (!submission) return res.status(404).json({ success: false, message: 'Cuestionario no encontrado.' });

        const isSelf = (currentUser.id === submission.user_id);
        if (!isSelf && !isSupervisor(currentUser)) {
          return res.status(403).json({ success: false, message: 'No tienes autorización para auditar este cuestionario.' });
        }

        let answers = [];
        try {
          answers = JSON.parse(submission.answers_json || '[]');
        } catch (e) {}

        return res.json({
          success: true,
          type: 'questionnaire',
          submission: {
            id: submission.id,
            questionnaireId: submission.questionnaire_id,
            title: submission.questionnaire_title,
            score: submission.numeric_score,
            passed: Boolean(submission.passed),
            xpEarned: submission.xp_earned,
            durationSeconds: submission.duration_seconds,
            submittedAt: submission.submitted_at
          },
          answers: answers
        });
      }

      return res.status(400).json({ success: false, message: 'Tipo de evaluación no válido (use simulator, quiz o questionnaire).' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 6. Feedback de Supervisión y Felicitaciones (Flujo 7 PRDv2)
  router.post('/advisors/:id/feedback', authMiddleware, (req, res) => {
    try {
      if (!isSupervisor(req.user)) {
        return res.status(403).json({ success: false, message: 'Acceso restringido a revisores y administradores.' });
      }

      const targetUser = db.prepare('SELECT id, name FROM users WHERE id = ? OR username = ?').get(req.params.id, req.params.id);
      if (!targetUser) {
        return res.status(404).json({ success: false, message: 'Asesor objetivo no encontrado.' });
      }

      const { type = 'SUGGESTION', topicOrModule = '', message } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: 'El mensaje de retroalimentación es obligatorio.' });
      }

      const id = 'fb-' + Date.now();
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO user_feedback (id, user_id, author_id, author_name, type, topic_or_module, message, created_at, is_read)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
      `).run(id, targetUser.id, req.user.id, req.user.name || req.user.username, type, topicOrModule, message.trim(), now);

      res.json({
        success: true,
        message: type === 'CONGRATULATION' ? 'Felicitación enviada al asesor exitosamente.' : 'Recomendación pedagógica enviada con éxito.',
        feedbackId: id
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 7. Consultar Feedback recibido por el usuario actual
  router.get('/advisors/my-feedback', authMiddleware, (req, res) => {
    try {
      const list = db.prepare(`
        SELECT * FROM user_feedback 
        WHERE user_id = ? OR user_id = ? 
        ORDER BY rowid DESC
      `).all(req.user.id, req.user.username);

      res.json({ success: true, feedback: list });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 8. Novedades de Capacitación ("Agregados Recientemente" - Flujo 2 PRDv2)
  router.get('/training/recent', (req, res) => {
    try {
      const recentVideos = db.prepare(`
        SELECT v.id, v.title, v.description, v.duration_seconds, v.order_num, m.title as module_title, m.icon as module_icon, m.id as module_id
        FROM videos v
        JOIN modules m ON v.module_id = m.id
        ORDER BY v.rowid DESC
        LIMIT 4
      `).all();

      const formatted = recentVideos.map(v => ({
        id: v.id,
        title: v.title,
        moduleTitle: v.module_title,
        moduleIcon: v.module_icon || '📁',
        moduleId: v.module_id,
        type: 'VIDEO',
        estimatedTime: `${Math.ceil((v.duration_seconds || 180) / 60)} min de revisión`,
        date: 'Recientemente'
      }));

      res.json({ success: true, recentItems: formatted });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  return router;
}

module.exports = { createGamificationRouter };
