/**
 * Rutas del Módulo de Capacitación y LMS
 * Implementa CAP-01, CAP-02, RF-008 a RF-012, RF-042, RF-043.
 */
const express = require('express');

function createTrainingRouter(db, authMiddleware, adminMiddleware) {
  const router = express.Router();

  // 1. Listar módulos de capacitación disponibles según rol del usuario (RF-007, RF-008)
  router.get('/modules', authMiddleware, (req, res) => {
    try {
      const user = req.user;
      let modules;

      if (user.role === 'admin') {
        modules = db.prepare("SELECT * FROM modules WHERE status = 'active' ORDER BY order_num ASC").all();
      } else {
        // Módulos asociados a los roles del usuario
        modules = db.prepare(`
          SELECT DISTINCT m.* FROM modules m
          JOIN module_roles mr ON m.id = mr.module_id
          JOIN user_roles ur ON mr.role_id = ur.role_id
          WHERE ur.user_id = ? AND m.status = 'active'
          ORDER BY m.order_num ASC
        `).all(user.id);

        if (modules.length === 0) {
          // Fallback a todos los módulos activos
          modules = db.prepare("SELECT * FROM modules WHERE status = 'active' ORDER BY order_num ASC").all();
        }
      }

      res.json(modules);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 2. Listar videos organizados por módulo (RF-008)
  router.get('/videos', authMiddleware, (req, res) => {
    try {
      const { moduleId } = req.query;
      let query = "SELECT v.*, m.title as module_title FROM videos v JOIN modules m ON v.module_id = m.id WHERE v.status = 'active'";
      const params = [];

      if (moduleId) {
        query += ' AND v.module_id = ?';
        params.push(moduleId);
      }
      query += ' ORDER BY v.order_num ASC';

      const videos = db.prepare(query).all(...params);

      // Enriquecer con información de si tiene quiz y si el usuario ya lo aprobó
      const userId = req.user.id;
      const quizStmt = db.prepare('SELECT id, title FROM quizzes WHERE video_id = ?');
      const subStmt = db.prepare(`
        SELECT score, max_score, passed, submitted_at FROM quiz_submissions
        WHERE quiz_id = ? AND user_id = ?
        ORDER BY score DESC LIMIT 1
      `);

      const parsed = videos.map(v => {
        const quiz = quizStmt.get(v.id);
        let userSubmission = null;
        if (quiz) {
          userSubmission = subStmt.get(quiz.id, userId);
        }

        return {
          ...v,
          quizId: quiz ? quiz.id : null,
          quizTitle: quiz ? quiz.title : null,
          userPassed: userSubmission ? Boolean(userSubmission.passed) : false,
          userBestScore: userSubmission ? userSubmission.score : null
        };
      });

      res.json(parsed);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 3. Obtener cuestionario de refuerzo de un video (máximo 3 preguntas) (RF-010)
  router.get('/videos/:videoId/quiz', authMiddleware, (req, res) => {
    try {
      const videoId = req.params.videoId;
      const quiz = db.prepare('SELECT * FROM quizzes WHERE video_id = ?').get(videoId);

      if (!quiz) {
        return res.status(404).json({ success: false, message: 'Este video no tiene cuestionario asociado.' });
      }

      const questions = db.prepare('SELECT id, question_text, explanation FROM questions WHERE quiz_id = ? LIMIT 3').all(quiz.id);
      const questionsWithOptions = questions.map(q => {
        // Enviar opciones SIN el campo is_correct para evitar trampas en frontend
        const options = db.prepare('SELECT id, option_text FROM question_options WHERE question_id = ?').all(q.id);
        return {
          id: q.id,
          questionText: q.question_text,
          options: options
        };
      });

      res.json({
        id: quiz.id,
        videoId: quiz.video_id,
        title: quiz.title,
        questions: questionsWithOptions
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 4. Enviar respuestas de un cuestionario y calcular calificación (RF-011, RF-012)
  router.post('/quizzes/:quizId/submit', authMiddleware, (req, res) => {
    try {
      const quizId = req.params.quizId;
      const { answers } = req.body; // { [questionId]: selectedOptionId }
      const userId = req.user.id;

      const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(quizId);
      if (!quiz) {
        return res.status(404).json({ success: false, message: 'Cuestionario no encontrado.' });
      }

      const questions = db.prepare('SELECT * FROM questions WHERE quiz_id = ?').all(quizId);
      const totalQuestions = questions.length;
      if (totalQuestions === 0) {
        return res.status(400).json({ success: false, message: 'El cuestionario no tiene preguntas configuradas.' });
      }

      let correctCount = 0;
      const feedback = [];

      for (const q of questions) {
        const selectedOptId = answers ? answers[q.id] : null;
        const correctOpt = db.prepare('SELECT id, option_text FROM question_options WHERE question_id = ? AND is_correct = 1').get(q.id);
        const isCorrect = selectedOptId && correctOpt && selectedOptId === correctOpt.id;

        if (isCorrect) correctCount++;

        feedback.push({
          questionId: q.id,
          questionText: q.question_text,
          isCorrect: Boolean(isCorrect),
          correctOptionText: correctOpt ? correctOpt.option_text : '',
          explanation: q.explanation || ''
        });
      }

      // Calificación en escala vigesimal (0 a 20)
      const numericScore = Math.round((correctCount / totalQuestions) * 20);
      const passed = numericScore >= (quiz.min_pass_score || 14);

      const submissionId = 'sub-' + Date.now();
      const submittedAt = new Date().toISOString();

      // Guardar auditoría forense completa de respuestas (PRDv2 Auditoría de 2 Niveles)
      const forensicData = {
        rawAnswers: answers || {},
        feedback: feedback
      };

      db.prepare(`
        INSERT INTO quiz_submissions (id, quiz_id, user_id, score, max_score, passed, answers_json, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(submissionId, quizId, userId, numericScore, 20, passed ? 1 : 0, JSON.stringify(forensicData), submittedAt);

      // Registrar puntos de gamificación (RF-036, RF-037)
      if (passed) {
        db.prepare(`
          INSERT INTO user_scores (id, user_id, source_type, source_id, points, description, created_at)
          VALUES (?, ?, 'QUIZ', ?, ?, ?, ?)
        `).run('score-' + Date.now(), userId, quizId, numericScore, `Aprobó cuestionario: ${quiz.title}`, submittedAt);
      }

      res.json({
        success: true,
        submissionId: submissionId,
        score: numericScore,
        maxScore: 20,
        formattedScore: `${numericScore < 10 ? '0' : ''}${numericScore} / 20`,
        passed: passed,
        correctAnswers: correctCount,
        totalQuestions: totalQuestions,
        feedback: feedback
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 4b. Auditoría Forense de 2 Niveles para un Quiz (Flujo 7 PRDv2)
  router.get('/quizzes/submissions/:submissionId/audit', authMiddleware, (req, res) => {
    try {
      const submissionId = req.params.submissionId;
      const submission = db.prepare('SELECT qs.*, q.title as quiz_title, u.name as user_name FROM quiz_submissions qs JOIN quizzes q ON qs.quiz_id = q.id JOIN users u ON qs.user_id = u.id WHERE qs.id = ?').get(submissionId);

      if (!submission) {
        return res.status(404).json({ success: false, message: 'Registro de evaluación no encontrado.' });
      }

      const currentUser = req.user;
      const isAdminOrRevisor = currentUser && (currentUser.role === 'admin' || currentUser.role === 'revisor' || (Array.isArray(currentUser.roles) && (currentUser.roles.includes('admin') || currentUser.roles.includes('revisor') || currentUser.roles.includes('facilitador'))));
      const isOwner = currentUser && currentUser.id === submission.user_id;

      if (!isAdminOrRevisor && !isOwner) {
        return res.status(403).json({ success: false, message: 'No tienes permiso para auditar esta evaluación.' });
      }

      let parsedAnswers = [];
      try {
        const stored = JSON.parse(submission.answers_json || '{}');
        parsedAnswers = stored.feedback || stored.rawAnswers || stored;
      } catch (e) {
        parsedAnswers = [];
      }

      res.json({
        success: true,
        submissionId: submission.id,
        quizId: submission.quiz_id,
        quizTitle: submission.quiz_title,
        userId: submission.user_id,
        userName: submission.user_name,
        score: submission.score,
        maxScore: submission.max_score,
        passed: Boolean(submission.passed),
        submittedAt: submission.submitted_at,
        auditDetails: parsedAnswers
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 4c. Historial de cuestionarios rendidos por el usuario (Flujo 4 / Mi Perfil)
  router.get('/quizzes/submissions/history', authMiddleware, (req, res) => {
    try {
      const userId = req.user.id;
      const history = db.prepare(`
        SELECT qs.id, qs.quiz_id, q.title as quiz_title, qs.score, qs.max_score, qs.passed, qs.submitted_at
        FROM quiz_submissions qs
        JOIN quizzes q ON qs.quiz_id = q.id
        WHERE qs.user_id = ?
        ORDER BY qs.rowid DESC
      `).all(userId);

      res.json(history.map(h => ({
        ...h,
        passed: Boolean(h.passed),
        formattedScore: `${h.score < 10 ? '0' : ''}${h.score} / ${h.max_score}`
      })));
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 5. Cargar / crear video de capacitación (Admin / Editor) (RF-042)
  router.post('/videos', adminMiddleware, (req, res) => {
    try {
      const { moduleId, title, description, videoUrl, durationSeconds = 0, orderNum = 1 } = req.body;
      if (!moduleId || !title || !videoUrl) {
        return res.status(400).json({ success: false, message: 'moduleId, title y videoUrl son obligatorios.' });
      }

      const newId = 'vid-' + Date.now();
      db.prepare(`
        INSERT INTO videos (id, module_id, title, description, video_url, duration_seconds, order_num)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(newId, moduleId, title.trim(), description || '', videoUrl.trim(), durationSeconds, orderNum);

      res.status(201).json({ success: true, message: 'Video registrado exitosamente.', videoId: newId });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 6. Consultar progreso de Onboarding en BD (Flujo 5 PRDv2)
  router.get('/onboarding/progress', authMiddleware, (req, res) => {
    try {
      const userId = req.user.id;
      const record = db.prepare('SELECT * FROM user_onboarding WHERE user_id = ?').get(userId);

      if (!record) {
        return res.json({
          success: true,
          completedTasks: [],
          examUnlocked: false,
          examPassed: false,
          progressPercent: 0
        });
      }

      let completedTasks = [];
      try {
        completedTasks = JSON.parse(record.completed_tasks_json || '[]');
      } catch (e) {
        completedTasks = [];
      }

      const totalHitosOficiales = 7;
      const progressPercent = Math.min(100, Math.round((completedTasks.length / totalHitosOficiales) * 100));

      res.json({
        success: true,
        completedTasks: completedTasks,
        examUnlocked: Boolean(record.exam_unlocked),
        examPassed: Boolean(record.exam_passed),
        progressPercent: progressPercent,
        updatedAt: record.updated_at
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 7. Guardar / Sincronizar progreso de Onboarding en BD (Flujo 5 PRDv2)
  router.post('/onboarding/progress', authMiddleware, (req, res) => {
    try {
      const userId = req.user.id;
      const { completedTasks = [], examUnlocked = false, examPassed = false } = req.body;

      if (!Array.isArray(completedTasks)) {
        return res.status(400).json({ success: false, message: 'completedTasks debe ser un array.' });
      }

      const totalHitosOficiales = 7;
      const isComplete = completedTasks.length >= totalHitosOficiales;
      const shouldUnlock = Boolean(examUnlocked || isComplete);
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO user_onboarding (user_id, completed_tasks_json, exam_unlocked, exam_passed, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          completed_tasks_json = excluded.completed_tasks_json,
          exam_unlocked = excluded.exam_unlocked,
          exam_passed = excluded.exam_passed,
          updated_at = excluded.updated_at
      `).run(userId, JSON.stringify(completedTasks), shouldUnlock ? 1 : 0, examPassed ? 1 : 0, now);

      const progressPercent = Math.min(100, Math.round((completedTasks.length / totalHitosOficiales) * 100));

      res.json({
        success: true,
        message: 'Progreso de onboarding guardado exitosamente.',
        completedTasks: completedTasks,
        examUnlocked: shouldUnlock,
        examPassed: Boolean(examPassed),
        progressPercent: progressPercent
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  return router;
}

module.exports = { createTrainingRouter };
