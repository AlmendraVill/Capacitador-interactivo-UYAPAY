/**
 * Pruebas Automatizadas de Hito 5:
 * Ranking General, Podio Olímpico y Telemetría SSE (Flujos 2, 7 y 9 PRDv2)
 *
 * Valida:
 * 1. Leaderboard unificado con XP consolidado y conteo de intentos (Fórmula determinista).
 * 2. Podio Olímpico Asimétrico Top 3 (1° Centro/Oro, 2° Derecha/Plata, 3° Izquierda/Bronce).
 * 3. Control estricto de privacidad (SEG-01 / Flujo 7: participante solo ve lo suyo; supervisor audita a todos).
 * 4. Auditoría Forense Nivel 1 (Historial multimodular) y Nivel 2 (Autopsia granular caso por caso e ítem por ítem).
 * 5. Herramientas de Feedback de Supervisión (Sugerencias pedagógicas de refuerzo y Notas de felicitación).
 * 6. Control de publicación del podio (Mostrar/Ocultar con difusión SSE).
 * 7. Telemetría SSE en vivo (<300ms de latencia, usuarios conectados y feed de errores en tiempo real).
 * 8. Analítica de errores y ranking de casos críticos.
 * 9. Sección "Agregados Recientemente" del Aula Virtual.
 * 10. Fijar y desanclar insignias ganadas en el avatar de perfil.
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { startServer, db } = require('../server.js');

describe('14. Hito 5: Ranking General, Podio Olímpico y Telemetría SSE (Flujos 2, 7 y 9 PRDv2)', () => {
  let serverInstance;
  const TEST_PORT = 3104;
  const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

  let adminToken = '';
  let edwardToken = '';
  let henryToken = '';
  let sseReq = null;

  const testResultIds = [
    'test-eval-h5-edward-1',
    'test-eval-h5-edward-2',
    'test-eval-h5-henry',
    'test-eval-h5-alvaro'
  ];
  let createdQuestionnaireSubId = null;

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

  before(async () => {
    serverInstance = await startServer(TEST_PORT);

    // 1. Obtener tokens de autenticación
    const adminRes = await request('POST', '/api/auth/login', { username: 'admin', password: '123' });
    adminToken = adminRes.body.token;

    const edwardRes = await request('POST', '/api/auth/login', { username: 'edward', password: '123' });
    edwardToken = edwardRes.body.token;

    const henryRes = await request('POST', '/api/auth/login', { username: 'henry', password: '123' });
    henryToken = henryRes.body.token;

    // 2. Sembrar evaluaciones de prueba en SQLite para validar ranking, podio y auditoría
    try {
      db.prepare("DELETE FROM results WHERE username IN ('edward', 'henry', 'alvaro', 'lruiz', 'percy')").run();
    } catch (e) {}

    const insertResult = db.prepare(`
      INSERT INTO results (
        id, case_id, case_code, case_title, username, advisor_name,
        score, numeric_score, errors, max_errors, status,
        duration_seconds, formatted_duration, completed_at, interactions, cases_details
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Edward: 20/20, 0 errores, 120s (Mejor resultado)
    const edwardCases = [
      { caseCode: 'CP-05', caseTitle: 'Consulta estado de cuenta', completed: true, errors: 0, duration: '00:24', client: 'Constructora Vial SAC', actionsLog: [] },
      { caseCode: 'CP-06', caseTitle: 'Historial antes de venta', completed: true, errors: 0, duration: '00:24', client: 'Bodega Dos Hermanos', actionsLog: [] },
      { caseCode: 'CP-07', caseTitle: 'Visita telefónica', completed: true, errors: 0, duration: '00:24', client: 'Lubrimotor EIRL', actionsLog: [] },
      { caseCode: 'CP-08', caseTitle: 'Precio competencia', completed: true, errors: 0, duration: '00:24', client: 'Transportes Pepito', actionsLog: [] },
      { caseCode: 'CP-09', caseTitle: 'Pedido y cobranza', completed: true, errors: 0, duration: '00:24', client: 'Comercial Vega', actionsLog: [] }
    ];
    insertResult.run(
      'test-eval-h5-edward-1', 'case-multi', 'SIM-B2C', 'Evaluación Integral Multi-Caso',
      'edward', 'Edward Velásquez', '20 / 20', 20, 0, 6, 'Aprobado',
      120, '02:00', '14/10/2026, 10:00:00', '[]', JSON.stringify(edwardCases)
    );

    // Edward Intento 2 anterior (para comprobar conteo de intentos = 2)
    insertResult.run(
      'test-eval-h5-edward-2', 'case-multi', 'SIM-B2C', 'Evaluación Integral Multi-Caso (Previo)',
      'edward', 'Edward Velásquez', '16 / 20', 16, 2, 6, 'Aprobado',
      200, '03:20', '14/10/2026, 09:00:00', '[]', JSON.stringify([])
    );

    // Henry: 18/20, 1 error, 180s
    const henryCases = [
      {
        caseCode: 'CP-05',
        caseTitle: 'Consulta estado de cuenta',
        completed: true,
        errors: 1,
        duration: '00:36',
        client: 'Constructora Vial SAC',
        actionsLog: [{ type: 'ERROR', step: 'Paso 2', detail: '[CLIC INDEBIDO] Clic en icono incorrecto' }]
      }
    ];
    insertResult.run(
      'test-eval-h5-henry', 'case-multi', 'SIM-B2C', 'Evaluación Integral Multi-Caso',
      'henry', 'Henry Macedo', '18 / 20', 18, 1, 6, 'Aprobado',
      180, '03:00', '14/10/2026, 10:30:00', '[]', JSON.stringify(henryCases)
    );

    // Alvaro: 14/20, 3 errores, 240s
    insertResult.run(
      'test-eval-h5-alvaro', 'case-multi', 'SIM-B2C', 'Evaluación Integral Multi-Caso',
      'alvaro', 'Álvaro Rodríguez', '14 / 20', 14, 3, 6, 'Aprobado',
      240, '04:00', '14/10/2026, 11:00:00', '[]', JSON.stringify([])
    );

    // 3. Crear una sumisión de cuestionario teórico para Edward con detalle para auditoría forense Nivel 2
    try {
      const qRow = db.prepare('SELECT id FROM theoretical_questionnaires LIMIT 1').get();
      if (qRow) {
        const subId = 'test-theo-sub-' + Date.now();
        const answersJson = JSON.stringify([
          {
            questionId: 'q-1',
            questionText: '¿Cuál es la tasa de retención SUNAT para compras mayores a S/. 700?',
            userAnswer: '3%',
            correctAnswer: '3%',
            isCorrect: true,
            explanation: 'Según la normativa SUNAT de agentes de retención, la alícuota aplicable es del 3%.'
          },
          {
            questionId: 'q-2',
            questionText: '¿Se puede emitir factura a un cliente con RUC suspendido?',
            userAnswer: 'Sí',
            correctAnswer: 'No',
            isCorrect: false,
            explanation: 'Un RUC suspendido o de baja no puede ser receptor válido de comprobantes electrónicos tributarios.'
          }
        ]);
        db.prepare(`
          INSERT INTO theoretical_submissions (
            id, questionnaire_id, user_id, score, numeric_score,
            passed, xp_earned, answers_json, duration_seconds, submitted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          subId, qRow.id, 'usr-edward',
          10, 10.0, 0, 0, answersJson, 150, new Date().toISOString()
        );
        createdQuestionnaireSubId = subId;
      }
    } catch (e) {
      console.warn('Advertencia sembrando cuestionario de prueba:', e.message);
    }
  });

  after(async () => {
    // Limpieza de datos insertados
    try {
      db.prepare("DELETE FROM results WHERE id LIKE 'test-eval-h5-%'").run();
      db.prepare("DELETE FROM user_feedback WHERE id LIKE 'fb-%'").run();
      if (createdQuestionnaireSubId) {
        db.prepare('DELETE FROM theoretical_submissions WHERE id = ?').run(createdQuestionnaireSubId);
      }
    } catch (e) {}

    if (sseReq) {
      try { sseReq.destroy(); } catch (e) {}
    }

    if (serverInstance) {
      await new Promise((resolve) => serverInstance.close(resolve));
    }
  });

  test('14.1 Leaderboard Unificado y Desempate Determinista (Nota > XP > Tiempo > Errores)', async () => {
    const res = await request('GET', '/api/leaderboard');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body), 'El leaderboard debe ser un array');
    assert.ok(res.body.length >= 3, 'Deben existir al menos 3 asesores en el leaderboard');

    // Verificar que Edward sea el puesto 1 (20/20, menor tiempo, 0 errores)
    const first = res.body[0];
    assert.equal(first.username, 'edward');
    assert.equal(first.rank, 1);
    assert.equal(first.numericScore, 20);
    assert.equal(first.errors, 0);
    assert.equal(first.durationSeconds, 120);
    assert.equal(first.attempts, 2, 'Edward rindió 2 evaluaciones; attempts debe ser 2');
    assert.ok(first.totalXp >= 200, 'El totalXp debe consolidar los 200 XP del simulador');

    // Verificar orden determinista para todos los elementos adyacentes
    for (let i = 0; i < res.body.length - 1; i++) {
      const a = res.body[i];
      const b = res.body[i + 1];
      assert.ok(a.numericScore >= b.numericScore, `Orden inválido de notas: ${a.numericScore} < ${b.numericScore}`);
      if (a.numericScore === b.numericScore) {
        assert.ok(a.totalXp >= b.totalXp, `Desempate XP falló: ${a.totalXp} < ${b.totalXp}`);
        if (a.totalXp === b.totalXp) {
          assert.ok(a.durationSeconds <= b.durationSeconds, `Desempate tiempo falló: ${a.durationSeconds} > ${b.durationSeconds}`);
          if (a.durationSeconds === b.durationSeconds) {
            assert.ok(a.errors <= b.errors, `Desempate errores falló: ${a.errors} > ${b.errors}`);
          }
        }
      }
    }
  });

  test('14.2 Podio Olímpico Asimétrico Top 3 (1° Oro Centro, 2° Plata Derecha, 3° Bronce Izquierda)', async () => {
    const res = await request('GET', '/api/leaderboard');
    assert.equal(res.status, 200);

    const top1 = res.body[0]; // Oro - Centro
    const top2 = res.body[1]; // Plata - Derecha
    const top3 = res.body[2]; // Bronce - Izquierda

    assert.ok(top1, 'Debe existir 1° lugar');
    assert.ok(top2, 'Debe existir 2° lugar');
    assert.ok(top3, 'Debe existir 3° lugar');

    assert.equal(top1.username, 'edward');
    assert.equal(top2.username, 'henry');
    assert.equal(top3.username, 'alvaro');

    assert.ok(top1.numericScore >= top2.numericScore);
    assert.ok(top2.numericScore >= top3.numericScore);

    // Validar atributos necesarios para el render asimétrico
    [top1, top2, top3].forEach(item => {
      assert.ok(item.advisorName);
      assert.ok(item.username);
      assert.ok(item.score);
      assert.ok(item.formattedDuration);
      assert.ok(item.status);
    });
  });

  test('14.3 Control Estricto de Privacidad en Historial de Asesor (SEG-01 / Flujo 7)', async () => {
    // 1. Asesor Edward consulta su propio historial con su propio token -> 200 OK
    const resOwnUsername = await request('GET', '/api/gamification/advisors/edward/history', null, {
      Authorization: `Bearer ${edwardToken}`
    });
    assert.equal(resOwnUsername.status, 200);
    assert.equal(resOwnUsername.body.success, true);
    assert.equal(resOwnUsername.body.advisor.username, 'edward');

    const resOwnId = await request('GET', '/api/gamification/advisors/usr-edward/history', null, {
      Authorization: `Bearer ${edwardToken}`
    });
    assert.equal(resOwnId.status, 200);
    assert.equal(resOwnId.body.advisor.id, 'usr-edward');

    // 2. Asesor Edward intenta consultar el historial de Henry -> 403 FORBIDDEN
    const resForbidden = await request('GET', '/api/gamification/advisors/henry/history', null, {
      Authorization: `Bearer ${edwardToken}`
    });
    assert.equal(resForbidden.status, 403);
    assert.equal(resForbidden.body.success, false);
    assert.ok(resForbidden.body.message.includes('Control de privacidad'));

    // 3. Supervisor (Administrador) consulta el historial de Henry -> 200 OK (Auditoría permitida)
    const resAdminAudit = await request('GET', '/api/gamification/advisors/henry/history', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.equal(resAdminAudit.status, 200);
    assert.equal(resAdminAudit.body.success, true);
    assert.equal(resAdminAudit.body.advisor.username, 'henry');
  });

  test('14.4 Auditoría Forense Nivel 1: Resumen y Desglose Multimodular', async () => {
    const res = await request('GET', '/api/gamification/advisors/edward/history', null, {
      Authorization: `Bearer ${edwardToken}`
    });

    assert.equal(res.status, 200);
    const body = res.body;

    // Estructura oficial del Nivel 1
    assert.ok(body.advisor);
    assert.ok(body.summary);
    assert.ok(body.evaluations);

    // Resumen cuantitativo
    assert.ok(body.summary.consolidatedXp >= 200);
    assert.equal(body.summary.simulatorCount, 2);
    assert.equal(body.summary.bestSimScore, 20);

    // Desglose de evaluaciones por tipo
    assert.ok(Array.isArray(body.evaluations.simulator));
    assert.ok(Array.isArray(body.evaluations.quizzes));
    assert.ok(Array.isArray(body.evaluations.questionnaires));

    const sim1 = body.evaluations.simulator.find(s => s.id === 'test-eval-h5-edward-1');
    assert.ok(sim1);
    assert.equal(sim1.type, 'SIMULATOR');
    assert.equal(sim1.numericScore, 20);
    assert.equal(sim1.errors, 0);
    assert.equal(sim1.status, 'Aprobado');
  });

  test('14.5 Auditoría Forense Nivel 2: Desglose Granular de Casos e Ítems con Protección de Privacidad', async () => {
    // 1. Auditoría de Simulador: Edward audita su evaluación
    const resAuditSim = await request('GET', '/api/gamification/evaluations/audit/simulator/test-eval-h5-edward-1', null, {
      Authorization: `Bearer ${edwardToken}`
    });
    assert.equal(resAuditSim.status, 200);
    assert.equal(resAuditSim.body.type, 'simulator');
    assert.equal(resAuditSim.body.evaluation.username, 'edward');
    assert.equal(resAuditSim.body.cases.length, 5, 'Debe incluir el desglose de los 5 casos');
    assert.equal(resAuditSim.body.cases[0].caseCode, 'CP-05');
    assert.equal(resAuditSim.body.cases[0].completed, true);

    // 2. Henry intenta auditar la evaluación de Edward -> 403 Forbidden
    const resAuditSimForbidden = await request('GET', '/api/gamification/evaluations/audit/simulator/test-eval-h5-edward-1', null, {
      Authorization: `Bearer ${henryToken}`
    });
    assert.equal(resAuditSimForbidden.status, 403);
    assert.equal(resAuditSimForbidden.body.success, false);

    // 3. Administrador audita la evaluación de Henry con detalle de errores
    const resAuditHenry = await request('GET', '/api/gamification/evaluations/audit/simulator/test-eval-h5-henry', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.equal(resAuditHenry.status, 200);
    assert.equal(resAuditHenry.body.evaluation.username, 'henry');
    assert.equal(resAuditHenry.body.cases[0].errors, 1);
    assert.equal(resAuditHenry.body.cases[0].actionsLog.length, 1);
    assert.ok(resAuditHenry.body.cases[0].actionsLog[0].detail.includes('[CLIC INDEBIDO]'));

    // 4. Auditoría de Cuestionario Teórico Nivel 2 (si se creó sumisión)
    if (createdQuestionnaireSubId) {
      const resAuditTheo = await request('GET', `/api/gamification/evaluations/audit/questionnaire/${createdQuestionnaireSubId}`, null, {
        Authorization: `Bearer ${edwardToken}`
      });
      assert.equal(resAuditTheo.status, 200);
      assert.equal(resAuditTheo.body.type, 'questionnaire');
      assert.equal(resAuditTheo.body.answers.length, 2);
      assert.equal(resAuditTheo.body.answers[0].isCorrect, true);
      assert.equal(resAuditTheo.body.answers[1].isCorrect, false);
      assert.ok(resAuditTheo.body.answers[0].explanation);
      assert.ok(resAuditTheo.body.answers[1].explanation);
    }
  });

  test('14.6 Herramientas de Feedback de Supervisión: Sugerencias y Felicitaciones (Flujo 7)', async () => {
    // 1. Asesor Edward intenta enviar feedback -> 403 Forbidden
    const resDeny = await request('POST', '/api/gamification/advisors/henry/feedback', {
      type: 'SUGGESTION',
      message: 'Intento de feedback no autorizado'
    }, {
      Authorization: `Bearer ${edwardToken}`
    });
    assert.equal(resDeny.status, 403);

    // 2. Supervisor envía sugerencia pedagógica a Edward
    const resSug = await request('POST', '/api/gamification/advisors/edward/feedback', {
      type: 'SUGGESTION',
      topicOrModule: 'Módulo 2: Créditos y Cobranzas',
      message: 'Recomendamos repasar la regla de los 45 días sin aval corporativo.'
    }, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.equal(resSug.status, 200);
    assert.equal(resSug.body.success, true);
    assert.ok(resSug.body.feedbackId);

    // 3. Supervisor envía nota de felicitación a Edward
    const resCongrat = await request('POST', '/api/gamification/advisors/edward/feedback', {
      type: 'CONGRATULATION',
      message: '¡Felicitaciones Edward por liderar el Podio Olímpico con puntaje perfecto!'
    }, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.equal(resCongrat.status, 200);
    assert.equal(resCongrat.body.success, true);

    // 4. Edward consulta su bandeja de feedback recibido
    const resMyFeedback = await request('GET', '/api/gamification/advisors/my-feedback', null, {
      Authorization: `Bearer ${edwardToken}`
    });
    assert.equal(resMyFeedback.status, 200);
    assert.ok(Array.isArray(resMyFeedback.body.feedback));
    assert.ok(resMyFeedback.body.feedback.length >= 2);

    const sug = resMyFeedback.body.feedback.find(f => f.type === 'SUGGESTION');
    const con = resMyFeedback.body.feedback.find(f => f.type === 'CONGRATULATION');
    assert.ok(sug, 'Debe haber una sugerencia registrada');
    assert.ok(con, 'Debe haber una felicitación registrada');
    assert.equal(sug.topic_or_module, 'Módulo 2: Créditos y Cobranzas');
    assert.ok(con.message.includes('Podio Olímpico'));
  });

  test('14.7 Control de Publicación del Podio y Emisión de Eventos (Supervisor/Admin)', async () => {
    // 1. Asesor intenta cambiar estado de publicación -> 403 Forbidden
    const resDeny = await request('POST', '/api/settings/podium', { visible: true }, {
      Authorization: `Bearer ${edwardToken}`
    });
    assert.equal(resDeny.status, 403);

    // 2. Supervisor publica el podio -> 200 OK
    const resPublish = await request('POST', '/api/settings/podium', { visible: true }, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.equal(resPublish.status, 200);
    assert.equal(resPublish.body.success, true);
    assert.equal(resPublish.body.podiumVisible, true);

    // 3. Verificar estado persistido
    const resCheck = await request('GET', '/api/settings/podium');
    assert.equal(resCheck.status, 200);
    assert.equal(resCheck.body.podiumVisible, true);

    // 4. Ocultar podio nuevamente
    const resHide = await request('POST', '/api/settings/podium', { visible: false }, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.equal(resHide.status, 200);
    assert.equal(resHide.body.podiumVisible, false);
  });

  test('14.8 Telemetría SSE en Vivo y Alertas de Infracciones sub-300ms (Flujo 9)', async () => {
    // 1. Conexión de cliente a stream SSE
    const ssePromise = new Promise((resolve, reject) => {
      const url = new URL('/api/live-events/stream', BASE_URL);
      sseReq = http.request({
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'GET',
        headers: { Accept: 'text/event-stream' }
      }, (res) => {
        assert.equal(res.statusCode, 200);
        assert.equal(res.headers['content-type'], 'text/event-stream');
        resolve(res);
      });
      sseReq.on('error', reject);
      sseReq.end();
    });

    await ssePromise;

    // 2. Envío de evento en vivo simulando error operativo en el simulador
    const start = performance.now();
    const liveEventPayload = {
      advisor: 'Edward Velásquez',
      step: 'Paso 3: Selección de Regalo en Carrito',
      detail: '[CLIC INDEBIDO] Clic en botón de pago antes de agregar regalo',
      type: 'ERROR',
      errors: 1,
      caseCode: 'CP-05',
      caseTitle: 'Venta con Regalo',
      resolvedCases: '1 de 5'
    };

    const resPost = await request('POST', '/api/live-events', liveEventPayload);
    const elapsed = performance.now() - start;

    assert.equal(resPost.status, 200);
    assert.equal(resPost.body.success, true);
    assert.ok(elapsed < 300, `La difusión y registro del live event tomó ${elapsed.toFixed(2)}ms (requisito: <300ms)`);

    // 3. Verificar que el estado actual y el historial reflejan la telemetría
    const resGet = await request('GET', '/api/live-events');
    assert.equal(resGet.status, 200);
    assert.equal(resGet.body.current.advisor, 'Edward Velásquez');
    assert.equal(resGet.body.current.type, 'ERROR');
    assert.ok(resGet.body.current.connectedUsers >= 1);
    assert.ok(resGet.body.history.length > 0);
    assert.equal(resGet.body.history[0].advisor, 'Edward Velásquez');
    assert.equal(resGet.body.history[0].type, 'ERROR');
  });

  test('14.9 Analítica de Errores y Casos Críticos (Exclusivo Supervisión / Admin)', async () => {
    // 1. Asesor intenta acceder a la analítica de supervisión -> 403 Forbidden
    const resDeny = await request('GET', '/api/admin/error-analytics', null, {
      Authorization: `Bearer ${edwardToken}`
    });
    assert.equal(resDeny.status, 403);

    // 2. Supervisor consulta analítica ejecutiva -> 200 OK
    const resAnalytics = await request('GET', '/api/admin/error-analytics', null, {
      Authorization: `Bearer ${adminToken}`
    });

    assert.equal(resAnalytics.status, 200);
    const body = resAnalytics.body;

    // Métricas ejecutivas globales
    assert.ok(body.totalEvaluations >= 3);
    assert.ok(body.passedEvaluations >= 2);
    assert.ok(body.passRate !== undefined);

    // Ranking analítico de casos críticos
    assert.ok(Array.isArray(body.criticalCases));
    assert.ok(body.criticalCases.length > 0);

    const cp05 = body.criticalCases.find(c => c.caseCode === 'CP-05');
    if (cp05) {
      assert.ok(cp05.attempts >= 1);
      assert.ok(cp05.severity !== undefined);
      assert.ok(['ALTA', 'MEDIA', 'BAJA'].includes(cp05.severity));
    }
  });

  test('14.10 Novedades de Aula Virtual ("Agregados Recientemente" - Flujo 2)', async () => {
    const res = await request('GET', '/api/gamification/training/recent');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.recentItems));
    assert.ok(res.body.recentItems.length > 0, 'Debe haber contenidos de aula virtual recientes');

    const item = res.body.recentItems[0];
    assert.ok(item.id);
    assert.ok(item.title);
    assert.ok(item.moduleTitle);
    assert.ok(item.moduleId);
    assert.equal(item.type, 'VIDEO');
    assert.ok(item.estimatedTime);
  });

  test('14.11 Fijar y Desanclar Medalla en Avatar de Perfil (Flujo 8)', async () => {
    // 1. Intentar fijar una medalla que no se ha ganado -> 400 Bad Request
    const resInvalid = await request('POST', '/api/gamification/pin-badge', {
      badgeId: 'bdg-quiz-master'
    }, {
      Authorization: `Bearer ${edwardToken}`
    });
    // Si no ha ganado bdg-quiz-master devuelve 400
    if (resInvalid.status === 400) {
      assert.equal(resInvalid.body.success, false);
      assert.ok(resInvalid.body.message.includes('No has desbloqueado'));
    }

    // 2. Edward ganó bdg-perfect (evaluación con 20/20 sembrada). Otorgar/asegurar en user_badges
    try {
      db.prepare("INSERT OR IGNORE INTO user_badges (id, user_id, badge_id, awarded_at) VALUES ('ub-test-edward-perf', 'usr-edward', 'bdg-perfect', ?)")
        .run(new Date().toISOString());
    } catch (e) {}

    // Fijar la medalla ganada en el avatar
    const resPin = await request('POST', '/api/gamification/pin-badge', {
      badgeId: 'bdg-perfect'
    }, {
      Authorization: `Bearer ${edwardToken}`
    });
    assert.equal(resPin.status, 200);
    assert.equal(resPin.body.success, true);
    assert.equal(resPin.body.pinnedBadgeId, 'bdg-perfect');

    // Desanclar la medalla
    const resUnpin = await request('POST', '/api/gamification/pin-badge', {
      badgeId: null
    }, {
      Authorization: `Bearer ${edwardToken}`
    });
    assert.equal(resUnpin.status, 200);
    assert.equal(resUnpin.body.success, true);
    assert.equal(resUnpin.body.pinnedBadgeId, null);
  });
});
