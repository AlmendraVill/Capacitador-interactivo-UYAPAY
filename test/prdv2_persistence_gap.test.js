/**
 * Pruebas Automatizadas de Compatibilidad PRDv2 (Hito 0 y Hito 1)
 * Valida:
 * 1. Persistencia de Onboarding (7 hitos en SQLite).
 * 2. Auditoría Forense de 2 Niveles en Quizzes (answers_json).
 * 3. Persistencia de Sesión del Simulador ante F5 (/api/evaluations/simulator/session).
 * 4. Cambio directo de Contraseña en caliente (/api/users-mgmt/:id/password).
 * 5. Gatekeeper Status API y Desbloqueo Automático (Algoritmo 3 PRDv2).
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { startServer } = require('../server.js');

describe('8. Verificación de Compatibilidad PRDv2 (Persistencia, Auditoría Forense y Gatekeeper)', () => {
  let serverInstance;
  const TEST_PORT = 3102;
  const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
  let adminToken;
  let advisorToken;

  before(async () => {
    try {
      const { DatabaseSync } = require('node:sqlite');
      const db = new DatabaseSync('uyapay.sqlite');
      db.prepare("DELETE FROM evaluation_assignments WHERE status = 'PENDIENTE'").run();
      db.prepare("DELETE FROM results WHERE case_title = 'Caso 1: Venta simple contado con regalo'").run();
    } catch (e) {}

    serverInstance = await startServer(TEST_PORT);

    // Login Admin
    const adminLogin = await request('POST', '/api/auth/login', { username: 'admin', password: '123' });
    adminToken = adminLogin.body.token;

    // Login Asesor Oficial
    const advLogin = await request('POST', '/api/auth/login', { username: 'edward', password: '123' });
    advisorToken = advLogin.body.token;
  });

  after(async () => {
    try {
      const { DatabaseSync } = require('node:sqlite');
      const db = new DatabaseSync('uyapay.sqlite');
      db.prepare("DELETE FROM evaluation_assignments WHERE event_id = 'eval-mensual-oct'").run();
      db.prepare("DELETE FROM results WHERE case_title = 'Caso 1: Venta simple contado con regalo'").run();
    } catch (e) {}

    if (serverInstance) {
      await new Promise((resolve) => serverInstance.close(resolve));
    }
  });

  function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, BASE_URL);
      const options = {
        method,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            parsed = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      });

      req.on('error', reject);
      if (body) {
        req.write(typeof body === 'string' ? body : JSON.stringify(body));
      }
      req.end();
    });
  }

  test('8.1 Persistencia de Onboarding: Guardar y recuperar progreso de los 7 hitos en BD', async () => {
    // 1. Consultar estado inicial
    const initial = await request('GET', '/api/training/onboarding/progress', null, {
      'Authorization': `Bearer ${advisorToken}`
    });
    assert.strictEqual(initial.status, 200);
    assert.strictEqual(initial.body.success, true);

    // 2. Guardar progreso de 4 hitos
    const completedTasks = ['task-1', 'task-2', 'task-3', 'task-4'];
    const saveRes = await request('POST', '/api/training/onboarding/progress', {
      completedTasks: completedTasks,
      examUnlocked: false
    }, {
      'Authorization': `Bearer ${advisorToken}`
    });
    assert.strictEqual(saveRes.status, 200);
    assert.strictEqual(saveRes.body.completedTasks.length, 4);
    assert.strictEqual(saveRes.body.progressPercent, 57); // 4 / 7 = 57%

    // 3. Re-consultar para verificar persistencia en SQLite
    const fetched = await request('GET', '/api/training/onboarding/progress', null, {
      'Authorization': `Bearer ${advisorToken}`
    });
    assert.strictEqual(fetched.status, 200);
    assert.deepStrictEqual(fetched.body.completedTasks, completedTasks);
    assert.strictEqual(fetched.body.progressPercent, 57);
  });

  test('8.2 Auditoría Forense de 2 Niveles: Guarda detalle de respuestas y permite auditar', async () => {
    // Encontrar un video con quiz
    const videos = await request('GET', '/api/training/videos', null, {
      'Authorization': `Bearer ${advisorToken}`
    });
    const videoWithQuiz = videos.body.find(v => v.quizId);
    assert.ok(videoWithQuiz, 'Debe existir al menos un video con quiz configurado');

    const quizData = await request('GET', `/api/training/videos/${videoWithQuiz.id}/quiz`, null, {
      'Authorization': `Bearer ${advisorToken}`
    });
    assert.strictEqual(quizData.status, 200);
    const q1 = quizData.body.questions[0];

    // Enviar respuestas
    const submitRes = await request('POST', `/api/training/quizzes/${quizData.body.id}/submit`, {
      answers: { [q1.id]: q1.options[0].id }
    }, {
      'Authorization': `Bearer ${advisorToken}`
    });
    assert.strictEqual(submitRes.status, 200);
    assert.ok(submitRes.body.submissionId, 'Debe retornar el ID de la sumisión');

    // Consultar auditoría forense como Admin (Modal Nivel 2)
    const auditRes = await request('GET', `/api/training/quizzes/submissions/${submitRes.body.submissionId}/audit`, null, {
      'Authorization': `Bearer ${adminToken}`
    });
    assert.strictEqual(auditRes.status, 200);
    assert.strictEqual(auditRes.body.success, true);
    assert.ok(Array.isArray(auditRes.body.auditDetails), 'auditDetails debe ser un array de preguntas con retroalimentación');
    assert.ok(auditRes.body.auditDetails.length > 0);
    assert.ok(auditRes.body.auditDetails[0].questionText, 'Debe incluir el texto normativo de la pregunta');
  });

  test('8.3 Persistencia de Sesión del Simulador ante F5: Guardar, recuperar y limpiar estado', async () => {
    // 1. Guardar estado de sesión en curso
    const sessionData = {
      currentCaseCode: 'CP-04',
      activeTabIndex: 2,
      elapsedSeconds: 345,
      casesProgress: [
        { caseCode: 'CP-01', status: 'RESOLVED', score: 20 },
        { caseCode: 'CP-02', status: 'RESOLVED', score: 18 },
        { caseCode: 'CP-04', status: 'ACTIVE', score: 0 }
      ]
    };

    const saveSession = await request('POST', '/api/evaluations/simulator/session', sessionData, {
      'Authorization': `Bearer ${advisorToken}`
    });
    assert.strictEqual(saveSession.status, 200);
    assert.strictEqual(saveSession.body.success, true);

    // 2. Recuperar sesión (simulando recarga de página F5)
    const getSession = await request('GET', '/api/evaluations/simulator/session', null, {
      'Authorization': `Bearer ${advisorToken}`
    });
    assert.strictEqual(getSession.status, 200);
    assert.strictEqual(getSession.body.hasActiveSession, true);
    assert.strictEqual(getSession.body.session.currentCaseCode, 'CP-04');
    assert.strictEqual(getSession.body.session.activeTabIndex, 2);
    assert.strictEqual(getSession.body.session.elapsedSeconds, 345);
    assert.strictEqual(getSession.body.session.casesProgress.length, 3);

    // 3. Limpiar sesión al culminar evaluación
    const deleteSession = await request('DELETE', '/api/evaluations/simulator/session', null, {
      'Authorization': `Bearer ${advisorToken}`
    });
    assert.strictEqual(deleteSession.status, 200);

    const checkCleared = await request('GET', '/api/evaluations/simulator/session', null, {
      'Authorization': `Bearer ${advisorToken}`
    });
    assert.strictEqual(checkCleared.body.hasActiveSession, false);
  });

  test('8.4 Cambio de Contraseña en Caliente: PATCH /:id/password con hash PBKDF2', async () => {
    // Admin actualiza contraseña de edward a 'nuevaClave2026'
    const patchRes = await request('PATCH', '/api/users-mgmt/usr-edward/password', {
      newPassword: 'nuevaClave2026'
    }, {
      'Authorization': `Bearer ${adminToken}`
    });
    assert.strictEqual(patchRes.status, 200);
    assert.strictEqual(patchRes.body.success, true);

    // Intentar login con clave vieja debe fallar (HTTP 401)
    const oldLogin = await request('POST', '/api/auth/login', { username: 'edward', password: '123' });
    assert.strictEqual(oldLogin.status, 401);

    // Login con nueva clave debe ser exitoso
    const newLogin = await request('POST', '/api/auth/login', { username: 'edward', password: 'nuevaClave2026' });
    assert.strictEqual(newLogin.status, 200);
    assert.ok(newLogin.body.token);

    // Restaurar clave original
    await request('PATCH', '/api/users-mgmt/usr-edward/password', {
      newPassword: '123'
    }, {
      'Authorization': `Bearer ${adminToken}`
    });
  });

  test('8.5 Gatekeeper Status API: Bloqueo LOCKED ante evaluación pendiente y UNLOCKED al completar', async () => {
    const today = new Date().toISOString().split('T')[0];

    // 1. Sin evaluaciones asignadas para hoy -> UNLOCKED
    const initialStatus = await request('GET', `/api/gatekeeper/status?userId=edward&date=${today}`);
    assert.strictEqual(initialStatus.status, 200);
    assert.strictEqual(initialStatus.body.status, 'UNLOCKED');
    assert.strictEqual(initialStatus.body.has_blocking_evaluation, false);

    // 2. Asignar evaluación mandatoria para hoy
    const assignRes = await request('POST', '/api/evaluations/assignments', {
      eventId: 'eval-mensual-oct',
      userId: 'edward',
      title: 'Evaluación Mensual de Ruta Octubre',
      evaluationType: 'SIMULADOR',
      scheduledDate: today
    }, {
      'Authorization': `Bearer ${adminToken}`
    });
    assert.strictEqual(assignRes.status, 201);

    // 3. Consultar Gatekeeper -> Debe responder LOCKED
    const lockedStatus = await request('GET', `/api/gatekeeper/status?userId=edward&date=${today}`);
    assert.strictEqual(lockedStatus.status, 200);
    assert.strictEqual(lockedStatus.body.status, 'LOCKED');
    assert.strictEqual(lockedStatus.body.has_blocking_evaluation, true);
    assert.strictEqual(lockedStatus.body.evaluation.title, 'Evaluación Mensual de Ruta Octubre');

    // 4. Completar evaluación enviando resultado a /api/results
    const submitResult = await request('POST', '/api/results', {
      username: 'edward',
      numericScore: 16,
      score: '16 / 20',
      status: 'Aprobado',
      durationSeconds: 720
    });
    assert.strictEqual(submitResult.status, 201);

    // 5. Consultar Gatekeeper nuevamente -> Debe estar UNLOCKED automáticamente
    const unlockedStatus = await request('GET', `/api/gatekeeper/status?userId=edward&date=${today}`);
    assert.strictEqual(unlockedStatus.status, 200);
    assert.strictEqual(unlockedStatus.body.status, 'UNLOCKED');
    assert.strictEqual(unlockedStatus.body.has_blocking_evaluation, false);
  });
});
