/**
 * Rutas de Gamificación, Perfil de Usuario y Acumulación de Puntajes
 * Implementa SEG-01, SEG-02, SEG-03, RF-036 a RF-039.
 */
const express = require('express');

function createGamificationRouter(db, authMiddleware) {
  const router = express.Router();

  // Función interna para evaluar y otorgar insignias automáticamente
  function checkAndAwardBadges(userId, username) {
    try {
      const allResults = db.prepare('SELECT * FROM results WHERE LOWER(username) = LOWER(?)').all(username);
      const insertBadge = db.prepare('INSERT OR IGNORE INTO user_badges (id, user_id, badge_id, awarded_at) VALUES (?, ?, ?, ?)');

      allResults.forEach(r => {
        // 1. Calificación Perfecta
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

  // 1. Perfil completo del usuario (puntaje consolidado, insignias, estadísticas) (RF-036, RF-037, RF-039)
  router.get('/my-profile', authMiddleware, (req, res) => {
    try {
      const user = req.user;
      checkAndAwardBadges(user.id, user.username);

      // Historial de evaluaciones
      const evalResults = db.prepare('SELECT * FROM results WHERE LOWER(username) = LOWER(?) ORDER BY rowid DESC').all(user.username);
      const totalEvals = evalResults.length;
      const bestScore = evalResults.reduce((max, r) => Math.max(max, r.numeric_score || 0), 0);
      const totalEvalPoints = evalResults.reduce((acc, r) => acc + (r.numeric_score || 0), 0);

      // Cuestionarios aprobados
      const quizSubs = db.prepare('SELECT * FROM quiz_submissions WHERE user_id = ?').all(user.id);
      const totalQuizPoints = quizSubs.filter(q => q.passed === 1).reduce((acc, q) => acc + q.score, 0);

      // Puntaje global acumulado
      const globalPoints = totalEvalPoints + totalQuizPoints;

      // Insignias ganadas
      const badges = db.prepare(`
        SELECT b.*, ub.awarded_at FROM badges b
        JOIN user_badges ub ON b.id = ub.badge_id
        WHERE ub.user_id = ?
        ORDER BY ub.awarded_at DESC
      `).all(user.id);

      // Todas las insignias del catálogo (con flag de desbloqueada)
      const allBadges = db.prepare('SELECT * FROM badges').all();
      const badgeCatalog = allBadges.map(b => {
        const earned = badges.find(ub => ub.id === b.id);
        return {
          ...b,
          unlocked: Boolean(earned),
          awardedAt: earned ? earned.awarded_at : null
        };
      });

      res.json({
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role
        },
        stats: {
          globalPoints: globalPoints,
          evaluationsCount: totalEvals,
          bestScore: bestScore,
          quizzesPassed: quizSubs.filter(q => q.passed === 1).length,
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

  // 2. Catálogo general de insignias
  router.get('/badges', authMiddleware, (req, res) => {
    try {
      const badges = db.prepare('SELECT * FROM badges ORDER BY name ASC').all();
      res.json(badges);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  return router;
}

module.exports = { createGamificationRouter };
