/**
 * Rutas de Integración Externa y Recomendaciones Pedagógicas
 * Implementa EVA-08, EVA-10, ADM-07, RF-013, RF-029, RF-032, RF-033.
 */
const express = require('express');

function createIntegrationRouter(db) {
  const router = express.Router();

  // 1. Endpoint para verificación desde UYAPAY B2C (EVA-10, RF-032, RF-033)
  // Determina si el asesor tiene evaluación obligatoria aprobada y vigente
  router.get('/user-status/:username', (req, res) => {
    try {
      const username = req.params.username.toLowerCase().trim();
      const user = db.prepare('SELECT id, username, name, role, status FROM users WHERE LOWER(username) = ?').get(username);

      if (!user) {
        return res.status(404).json({
          allowed: false,
          reason: 'USER_NOT_FOUND',
          message: 'Usuario no registrado en el sistema de capacitación.'
        });
      }

      if (user.status === 'inactive') {
        return res.status(403).json({
          allowed: false,
          reason: 'USER_INACTIVE',
          message: 'Usuario inhabilitado administrativamente.'
        });
      }

      // Si es admin o facilitador, tiene acceso irrestricto
      if (user.role === 'admin' || user.role === 'facilitador') {
        return res.json({
          allowed: true,
          reason: 'ADMIN_BYPASS',
          message: 'Acceso autorizado con permisos de administración.',
          user: user
        });
      }

      // Buscar última evaluación aprobada
      const lastPassed = db.prepare(`
        SELECT * FROM results
        WHERE LOWER(username) = ? AND status = 'Aprobado'
        ORDER BY rowid DESC LIMIT 1
      `).get(username);

      if (!lastPassed) {
        return res.json({
          allowed: false,
          reason: 'NO_PASSED_EVALUATION',
          message: 'El asesor no cuenta con ninguna evaluación práctica aprobada en la plataforma.',
          pendingRequirement: true
        });
      }

      res.json({
        allowed: true,
        reason: 'EVALUATION_APPROVED',
        message: 'El asesor cuenta con evaluación práctica aprobada vigente.',
        lastEvaluation: {
          id: lastPassed.id,
          score: lastPassed.score,
          numericScore: lastPassed.numeric_score,
          date: lastPassed.completed_at
        }
      });
    } catch (err) {
      res.status(500).json({ allowed: false, message: err.message });
    }
  });

  // 2. Recomendaciones Pedagógicas y Feedback Inteligente (CAP-03, EVA-08, RF-013, RF-029)
  // Analiza los errores de la última evaluación del asesor y devuelve contenidos recomendados
  router.get('/recommendations/:username', (req, res) => {
    try {
      const username = req.params.username.toLowerCase().trim();
      const lastResult = db.prepare(`
        SELECT * FROM results WHERE LOWER(username) = ? ORDER BY rowid DESC LIMIT 1
      `).get(username);

      if (!lastResult) {
        return res.json({
          hasRecommendations: false,
          message: 'Aún no se registran evaluaciones para este asesor.'
        });
      }

      const casesDetails = JSON.parse(lastResult.cases_details || '[]');
      const detectedWeaknesses = [];
      const recommendedVideos = [];
      const recommendedRules = [];

      // Analizar casos con errores
      casesDetails.filter(c => c.errors > 0 || !c.completed).forEach(cd => {
        const cCode = cd.caseCode || cd.caseTitle || '';
        const title = cd.caseTitle || '';

        // Mapeo temático de debilidades
        if (cCode.includes('CP-05') || cCode.includes('CP-19') || cCode.includes('CP-23') || title.toLowerCase().includes('cobranza')) {
          if (!detectedWeaknesses.includes('Cobranzas y Conciliación')) {
            detectedWeaknesses.push('Cobranzas y Conciliación');
          }
        }
        if (cCode.includes('CP-01') || cCode.includes('CP-02') || cCode.includes('CP-20') || title.toLowerCase().includes('promoción') || title.toLowerCase().includes('regalo')) {
          if (!detectedWeaknesses.includes('Políticas Promocionales y Descuentos')) {
            detectedWeaknesses.push('Políticas Promocionales y Descuentos');
          }
        }
        if (cCode.includes('CP-07') || cCode.includes('CP-16') || cCode.includes('CP-17') || title.toLowerCase().includes('geocerca') || title.toLowerCase().includes('telefónica')) {
          if (!detectedWeaknesses.includes('Geocercas GPS y Visitas Telefónicas')) {
            detectedWeaknesses.push('Geocercas GPS y Visitas Telefónicas');
          }
        }
      });

      // Obtener videos sugeridos según debilidades
      if (detectedWeaknesses.includes('Cobranzas y Conciliación')) {
        const v = db.prepare('SELECT id, title, description FROM videos WHERE id = "vid-02"').get();
        if (v) recommendedVideos.push(v);
        const r = db.prepare('SELECT id, title, content FROM business_rules WHERE id = "rule-04"').get();
        if (r) recommendedRules.push(r);
      }
      if (detectedWeaknesses.includes('Políticas Promocionales y Descuentos')) {
        const v = db.prepare('SELECT id, title, description FROM videos WHERE id = "vid-01"').get();
        if (v) recommendedVideos.push(v);
        const r = db.prepare('SELECT id, title, content FROM business_rules WHERE id = "rule-01"').get();
        if (r) recommendedRules.push(r);
      }
      if (detectedWeaknesses.includes('Geocercas GPS y Visitas Telefónicas')) {
        const v = db.prepare('SELECT id, title, description FROM videos WHERE id = "vid-03"').get();
        if (v) recommendedVideos.push(v);
        const r = db.prepare('SELECT id, title, content FROM business_rules WHERE id = "rule-02"').get();
        if (r) recommendedRules.push(r);
      }

      res.json({
        hasRecommendations: detectedWeaknesses.length > 0,
        detectedWeaknesses,
        recommendedVideos,
        recommendedRules,
        evaluationScore: lastResult.score,
        evaluationDate: lastResult.completed_at
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  return router;
}

module.exports = { createIntegrationRouter };
