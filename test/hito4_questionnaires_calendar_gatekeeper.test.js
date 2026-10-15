/**
 * Pruebas Automatizadas de Hito 4: Cuestionarios Teóricos, Calendario y Gatekeeper API
 * Flujo 6 y Flujo 12 PRDv2 (Reglas de Negocio, Escala Vigesimal, Gatekeeper sub-50ms y Anti-spoilers).
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { startServer } = require('../server.js');

describe('13. Hito 4: Cuestionarios Teóricos, Calendario y Gatekeeper API (Flujos 6 y 12 PRDv2)', () => {
  let serverInstance;
  const TEST_PORT = 3103;
  const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
  let adminToken;
  let advisorToken;
  let createdQuestionnaireId;
  let createdCalendarEventId;

  before(async () => {
    try {
      const { DatabaseSync } = require('node:sqlite');
      const db = new DatabaseSync('uyapay.sqlite');
      db.prepare("DELETE FROM evaluation_assignments WHERE status = 'PENDIENTE'").run();
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
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }

  test('13.1 Gatekeeper API responde en menos de 50ms (Algoritmo 3 PRDv2)', async () => {
    const start = performance.now();
    const res = await request('GET', '/api/gatekeeper/status?userId=edward');
    const elapsed = performance.now() - start;

    assert.equal(res.status, 200);
    assert.ok(res.body.status !== undefined);
    assert.ok(elapsed < 50, `Gatekeeper respondió en ${elapsed.toFixed(2)}ms (límite: 50ms)`);
  });

  test('13.2 Gatekeeper resuelve tanto userId ("usr-edward") como username ("edward")', async () => {
    const resUsername = await request('GET', '/api/gatekeeper/status?userId=edward');
    const resId = await request('GET', '/api/gatekeeper/status?userId=usr-edward');

    assert.equal(resUsername.status, 200);
    assert.equal(resId.status, 200);
    assert.equal(resUsername.body.status, resId.body.status);
  });

  test('13.3 Sembrado de Cuestionarios Oficiales en Banco Institucional', async () => {
    const res = await request('GET', '/api/evaluations/questionnaires', null, {
      Authorization: `Bearer ${advisorToken}`
    });

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.length >= 2, 'Deben existir al menos 2 cuestionarios sembrados');

    const sunatQ = res.body.find(q => q.id === 'quest-sunat-01');
    const michelinQ = res.body.find(q => q.id === 'quest-michelin-02');

    assert.ok(sunatQ, 'Cuestionario SUNAT debe existir');
    assert.ok(michelinQ, 'Cuestionario Michelin debe existir');
    assert.equal(sunatQ.xpReward, 50);
    assert.equal(michelinQ.xpReward, 40);
  });

  test('13.4 Anti-Spoilers en Cuestionarios: Ocultar correctAnswers a los participantes', async () => {
    // Consulta con token de Asesor
    const resAsesor = await request('GET', '/api/evaluations/questionnaires/quest-sunat-01', null, {
      Authorization: `Bearer ${advisorToken}`
    });
    assert.equal(resAsesor.status, 200);
    assert.ok(resAsesor.body.questions.length > 0);
    resAsesor.body.questions.forEach(q => {
      assert.equal(q.correctAnswers, undefined, 'Las respuestas correctas deben estar despojadas para participantes');
    });

    // Consulta con token de Administrador
    const resAdmin = await request('GET', '/api/evaluations/questionnaires/quest-sunat-01', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.equal(resAdmin.status, 200);
    assert.ok(resAdmin.body.questions.length > 0);
    resAdmin.body.questions.forEach(q => {
      assert.ok(Array.isArray(q.correctAnswers), 'Las respuestas correctas deben estar presentes para administradores');
    });
  });

  test('13.5 Constructor de Cuestionarios: Staff crea prueba dinámica estilo Google Forms', async () => {
    // Intento no autorizado por asesor
    const resDeny = await request('POST', '/api/evaluations/questionnaires', {
      title: 'Prueba no autorizada',
      questions: []
    }, { Authorization: `Bearer ${advisorToken}` });
    assert.equal(resDeny.status, 403);

    // Creación válida por Administrador
    const newQuestPayload = {
      title: 'Evaluación Dinámica de Políticas de Crédito',
      description: 'Prueba de validación de condiciones comerciales a 30 y 45 días.',
      durationMinutes: 15,
      xpReward: 40,
      questions: [
        {
          id: 'q-cred-1',
          text: '¿Cuál es el plazo máximo de crédito sin aval corporativo?',
          type: 'single',
          options: ['15 días', '30 días', '60 días'],
          correctAnswers: ['30 días'],
          explanation: 'La política crediticia estándar B2C autoriza como máximo 30 días.'
        },
        {
          id: 'q-cred-2',
          text: '¿Una venta a cliente suspendido puede procesarse si el pago es al contado?',
          type: 'boolean',
          options: ['Verdadero', 'Falso'],
          correctAnswers: ['Verdadero'],
          explanation: 'La suspensión crediticia solo restringe ventas a crédito; la venta al contado sí está permitida.'
        }
      ]
    };

    const resCreate = await request('POST', '/api/evaluations/questionnaires', newQuestPayload, {
      Authorization: `Bearer ${adminToken}`
    });

    assert.equal(resCreate.status, 201);
    assert.ok(resCreate.body.questionnaireId);
    createdQuestionnaireId = resCreate.body.questionnaireId;
  });

  test('13.6 Calendario de Evaluaciones: Programación y Bloqueo Automático Gatekeeper', async () => {
    const today = new Date().toISOString().split('T')[0];

    const eventPayload = {
      title: 'Jornada Evaluativa de Crédito Obligatoria',
      evaluationType: 'CUESTIONARIO',
      questionnaireId: createdQuestionnaireId,
      startDate: today,
      endDate: today,
      assignedUsers: ['usr-edward', 'usr-almendra']
    };

    const resEvent = await request('POST', '/api/evaluations/calendar/events', eventPayload, {
      Authorization: `Bearer ${adminToken}`
    });

    assert.equal(resEvent.status, 201);
    assert.ok(resEvent.body.eventId);
    assert.equal(resEvent.body.assignedCount, 2);
    createdCalendarEventId = resEvent.body.eventId;

    // Verificar en calendario con estadísticas de avance
    const resCal = await request('GET', '/api/evaluations/calendar/events', null, {
      Authorization: `Bearer ${advisorToken}`
    });
    assert.equal(resCal.status, 200);
    const evt = resCal.body.find(e => e.id === createdCalendarEventId);
    assert.ok(evt);
    assert.equal(evt.totalAssigned, 2);
    assert.equal(evt.completedCount, 0);
    assert.equal(evt.completionRate, 0);

    // Verificar que Gatekeeper ahora está bloqueado (LOCKED) para Edward
    const resGk = await request('GET', `/api/gatekeeper/status?userId=edward&date=${today}`);
    assert.equal(resGk.status, 200);
    assert.equal(resGk.body.status, 'LOCKED');
    assert.equal(resGk.body.has_blocking_evaluation, true);
    assert.equal(resGk.body.evaluation.eventId, createdCalendarEventId);
  });

  test('13.7 Resolución de Cuestionario: Calificación vigesimal, XP y Auto-desbloqueo Gatekeeper', async () => {
    const today = new Date().toISOString().split('T')[0];

    // Edward rinde el cuestionario creado respondiendo correctamente ambas preguntas
    const submitPayload = {
      userAnswers: {
        'q-cred-1': '30 días',
        'q-cred-2': 'Verdadero'
      },
      durationSeconds: 120
    };

    const resSubmit = await request('POST', `/api/evaluations/questionnaires/${createdQuestionnaireId}/submit`, submitPayload, {
      Authorization: `Bearer ${advisorToken}`
    });

    assert.equal(resSubmit.status, 200);
    assert.equal(resSubmit.body.numericScore, 20);
    assert.equal(resSubmit.body.passed, true);
    assert.equal(resSubmit.body.status, 'Aprobado');
    assert.equal(resSubmit.body.xpEarned, 40); // 100% de 40 XP
    assert.equal(resSubmit.body.correctQuestions, 2);
    assert.equal(resSubmit.body.totalQuestions, 2);

    // Verificar que Gatekeeper se auto-desbloqueó a UNLOCKED para Edward
    const resGkAfter = await request('GET', `/api/gatekeeper/status?userId=edward&date=${today}`);
    assert.equal(resGkAfter.status, 200);
    assert.equal(resGkAfter.body.status, 'UNLOCKED');
    assert.equal(resGkAfter.body.has_blocking_evaluation, false);

    // Verificar que el calendario ahora refleja el 50% de avance (1 de 2 asesores completado)
    const resCalAfter = await request('GET', '/api/evaluations/calendar/events', null, {
      Authorization: `Bearer ${advisorToken}`
    });
    const evtAfter = resCalAfter.body.find(e => e.id === createdCalendarEventId);
    assert.ok(evtAfter);
    assert.equal(evtAfter.completedCount, 1);
    assert.equal(evtAfter.completionRate, 50);
  });

  test('13.8 Eliminación de Evento en Calendario y Protección de Roles', async () => {
    // Asesor no puede eliminar
    const resDenyDel = await request('DELETE', `/api/evaluations/calendar/events/${createdCalendarEventId}`, null, {
      Authorization: `Bearer ${advisorToken}`
    });
    assert.equal(resDenyDel.status, 403);

    // Administrador elimina evento exitosamente
    const resDel = await request('DELETE', `/api/evaluations/calendar/events/${createdCalendarEventId}`, null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.equal(resDel.status, 200);
    assert.equal(resDel.body.success, true);

    // Ya no debe figurar en el calendario
    const resCal = await request('GET', '/api/evaluations/calendar/events', null, {
      Authorization: `Bearer ${adminToken}`
    });
    const found = resCal.body.find(e => e.id === createdCalendarEventId);
    assert.equal(found, undefined);
  });
});
