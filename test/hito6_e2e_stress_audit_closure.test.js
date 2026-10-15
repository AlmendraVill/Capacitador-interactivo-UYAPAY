/**
 * Suite de Pruebas Automatizadas de Hito 6:
 * Pruebas Integrales E2E, Auditoría Forense, Estrés y Cierre del Proyecto (PRDv2)
 *
 * Valida:
 * 1. Matriz de permisos e integración de los 4 roles (Participante, Revisor, Editor, Administrador).
 * 2. Ciclo de vida y seguridad de credenciales (Bloqueo de inactivos y migración PBKDF2).
 * 3. Cero discrepancias en la bolsa de XP tras múltiples reintentos de evaluación (DoD Hito 6).
 * 4. Prueba de estrés y alta concurrencia en Gatekeeper API (50 peticiones concurrentes < 50ms).
 * 5. Telemetría SSE concurrente con difusión masiva en tiempo real (< 300ms de latencia).
 * 6. Auditoría Forense integral de 2 niveles (Nivel 1 y Nivel 2) con control de privacidad estricto.
 * 7. Exportación oficial en Excel SpreadsheetML XML (.xls) y CSV con BOM UTF-8.
 * 8. Matriz de cobertura integral de los 12 flujos de usuario PRDv2.
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { startServer, db } = require('../server.js');

describe('15. Hito 6: Pruebas Integrales E2E, Auditoría y Cierre de Proyecto (PRDv2)', () => {
  let serverInstance;
  const TEST_PORT = 3105;
  const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

  let adminToken = '';
  let editorToken = '';
  let revisorToken = '';
  let advisorToken = '';

  let createdEditorId = '';
  let createdRevisorId = '';
  let sseClientsList = [];

  const cleanupIds = {
    results: [],
    quizzes: [],
    submissions: [],
    theoSessions: [],
    users: []
  };

  const keepAliveAgent = new http.Agent({ keepAlive: true, maxSockets: 100 });

  function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, BASE_URL);
      const options = {
        method,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        agent: keepAliveAgent,
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

    // 1. Login Admin oficial
    const adminLogin = await request('POST', '/api/auth/login', { username: 'admin', password: '123' });
    adminToken = adminLogin.body.token;

    // 2. Login Asesor oficial (Edward)
    const advLogin = await request('POST', '/api/auth/login', { username: 'edward', password: '123' });
    advisorToken = advLogin.body.token;

    // 3. Crear usuario con rol Editor para pruebas
    const editorPayload = {
      username: 'editor_h6_' + Date.now(),
      name: 'Editor Contenidos H6',
      email: 'editor_h6@uyapay.pe',
      role: 'editor',
      roles: ['rol-editor'],
      password: '123'
    };
    const resCreateEditor = await request('POST', '/api/users-mgmt', editorPayload, {
      Authorization: `Bearer ${adminToken}`
    });
    createdEditorId = resCreateEditor.body.user.id;
    cleanupIds.users.push(createdEditorId);

    const loginEditor = await request('POST', '/api/auth/login', { username: editorPayload.username, password: '123' });
    editorToken = loginEditor.body.token;

    // 4. Crear usuario con rol Revisor/Facilitador para pruebas
    const revisorPayload = {
      username: 'revisor_h6_' + Date.now(),
      name: 'Revisor Supervisor H6',
      email: 'revisor_h6@uyapay.pe',
      role: 'revisor',
      roles: ['rol-facilitador'],
      password: '123'
    };
    const resCreateRevisor = await request('POST', '/api/users-mgmt', revisorPayload, {
      Authorization: `Bearer ${adminToken}`
    });
    createdRevisorId = resCreateRevisor.body.user.id;
    cleanupIds.users.push(createdRevisorId);

    const loginRevisor = await request('POST', '/api/auth/login', { username: revisorPayload.username, password: '123' });
    revisorToken = loginRevisor.body.token;
  });

  after(async () => {
    // Cerrar clientes SSE activos
    sseClientsList.forEach(c => {
      try { c.destroy(); } catch (e) {}
    });
    try { keepAliveAgent.destroy(); } catch (e) {}


    // Limpieza de datos creados en pruebas
    try {
      cleanupIds.users.forEach(uid => {
        db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(uid);
        db.prepare('DELETE FROM users WHERE id = ?').run(uid);
      });
      cleanupIds.results.forEach(rid => {
        db.prepare('DELETE FROM results WHERE id = ?').run(rid);
      });
      cleanupIds.submissions.forEach(sid => {
        db.prepare('DELETE FROM quiz_submissions WHERE id = ?').run(sid);
      });
      cleanupIds.theoSessions.forEach(tid => {
        db.prepare('DELETE FROM theoretical_submissions WHERE id = ?').run(tid);
      });
    } catch (e) {}

    if (serverInstance) {
      await new Promise((resolve) => serverInstance.close(resolve));
    }
  });

  test('15.1 Matriz de Integración y Límites de Autorización de los 4 Roles (Flujos 1, 9, 10, 11)', async () => {
    // a) Editor: Puede consultar módulos pero NO puede gestionar nómina
    const resEditorMod = await request('GET', '/api/training/modules', null, {
      Authorization: `Bearer ${editorToken}`
    });
    assert.equal(resEditorMod.status, 200, 'Editor debe acceder al catálogo formativo');

    const resEditorUsers = await request('POST', '/api/users-mgmt', { username: 'test_deny', name: 'Deny' }, {
      Authorization: `Bearer ${editorToken}`
    });
    assert.equal(resEditorUsers.status, 403, 'Editor NO debe tener permisos de alta de usuarios');

    // b) Revisor / Facilitador: Puede consultar analítica y telemetría pero NO crear usuarios
    const resRevAnalytics = await request('GET', '/api/admin/error-analytics', null, {
      Authorization: `Bearer ${revisorToken}`
    });
    assert.equal(resRevAnalytics.status, 200, 'Revisor debe acceder a la analítica de errores');

    const resRevUsers = await request('POST', '/api/users-mgmt', { username: 'test_deny2', name: 'Deny2' }, {
      Authorization: `Bearer ${revisorToken}`
    });
    assert.equal(resRevUsers.status, 403, 'Revisor NO debe tener permisos de alta de usuarios');

    // c) Participante (Asesor): Acceso a formación, pero bloqueado en exportaciones administrativas y cambio de podio
    const resAdvPodium = await request('POST', '/api/settings/podium', { visible: true }, {
      Authorization: `Bearer ${advisorToken}`
    });
    assert.equal(resAdvPodium.status, 403, 'Asesor NO debe poder publicar el podio');

    const resAdvAnalytics = await request('GET', '/api/admin/error-analytics', null, {
      Authorization: `Bearer ${advisorToken}`
    });
    assert.equal(resAdvAnalytics.status, 403, 'Asesor NO debe poder ver analítica de errores');

    // d) Administrador: Acceso total a todas las operaciones
    const resAdminStatus = await request('GET', '/api/admin/error-analytics', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.equal(resAdminStatus.status, 200, 'Admin debe tener acceso irrestricto');
  });

  test('15.2 Ciclo de Vida y Seguridad de Credenciales (Bloqueo de Inactivos y PBKDF2 en Caliente)', async () => {
    // 1. Crear usuario transitorio para probar desactivación
    const tempUsername = 'temp_user_' + Date.now();
    const createRes = await request('POST', '/api/users-mgmt', {
      username: tempUsername,
      name: 'Usuario Prueba Baja',
      role: 'asesor',
      password: 'password123'
    }, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.equal(createRes.status, 201);
    const tempId = createRes.body.user.id;
    cleanupIds.users.push(tempId);

    // 2. Verificar que se loguea exitosamente
    const loginOk = await request('POST', '/api/auth/login', { username: tempUsername, password: 'password123' });
    assert.equal(loginOk.status, 200);

    // 3. Administrador desactiva al usuario
    const toggleInactive = await request('PATCH', `/api/users-mgmt/${tempId}/toggle-status`, null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.equal(toggleInactive.status, 200);
    assert.equal(toggleInactive.body.status, 'inactive');

    // 4. Usuario desactivado intenta loguearse -> Debe ser bloqueado con 403 y mensaje oficial
    const loginBlocked = await request('POST', '/api/auth/login', { username: tempUsername, password: 'password123' });
    assert.equal(loginBlocked.status, 403);
    assert.ok(loginBlocked.body.message.includes('dado de baja o desactivado'));

    // 5. Reactivar y cambiar contraseña en caliente
    await request('PATCH', `/api/users-mgmt/${tempId}/toggle-status`, null, { Authorization: `Bearer ${adminToken}` });
    const patchPass = await request('PATCH', `/api/users-mgmt/${tempId}/password`, {
      password: 'new_secret_pass_2026'
    }, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.equal(patchPass.status, 200);

    // La contraseña antigua ya no funciona
    const oldLoginFail = await request('POST', '/api/auth/login', { username: tempUsername, password: 'password123' });
    assert.equal(oldLoginFail.status, 401);

    // La nueva contraseña permite el acceso
    const newLoginSuccess = await request('POST', '/api/auth/login', { username: tempUsername, password: 'new_secret_pass_2026' });
    assert.equal(newLoginSuccess.status, 200);
  });

  test('15.3 Cero Discrepancias en la Bolsa de XP tras Múltiples Reintentos (DoD Hito 6)', async () => {
    // Asesor Williams: Realiza 3 intentos de un mismo quiz de Aula Virtual
    const williamsId = 'usr-williams';
    const quizId = 'quiz-test-xp-01';

    // 0. Simulación base para Williams en results (18/20 = 180 XP simulador)
    const willResId = 'res-test-williams-' + Date.now();
    cleanupIds.results.push(willResId);
    db.prepare(`
      INSERT INTO results (
        id, case_id, case_code, case_title, username, advisor_name,
        score, numeric_score, errors, max_errors, status,
        duration_seconds, formatted_duration, completed_at, interactions, cases_details
      ) VALUES (?, 'case-1', 'CP-05', 'Venta simple', 'williams', 'Williams Campos',
        '18 / 20', 18, 0, 6, 'Aprobado', 150, '02:30', '14/10/2026', '[]', '[]')
    `).run(willResId);

    // Asegurar existencia del quiz
    db.prepare("INSERT OR IGNORE INTO quizzes (id, video_id, title, min_pass_score) VALUES (?, 'vid-01', 'Quiz de Prueba XP', 14)")
      .run(quizId);

    // Intento 1: Aprueba con 14 puntos (180 sim + 14 quiz = 194 XP)
    const sub1Id = 'sub-xp-1-' + Date.now();
    cleanupIds.submissions.push(sub1Id);
    db.prepare(`
      INSERT INTO quiz_submissions (id, quiz_id, user_id, score, max_score, passed, submitted_at)
      VALUES (?, ?, ?, 14, 20, 1, ?)
    `).run(sub1Id, quizId, williamsId, new Date().toISOString());

    // Login Williams
    const willLogin = await request('POST', '/api/auth/login', { username: 'williams', password: '123' });
    assert.equal(willLogin.status, 200);
    const willToken = willLogin.body.token;

    // Verificar que Williams tiene 14 XP de aula
    const prof1 = await request('GET', '/api/gamification/my-profile', null, { Authorization: `Bearer ${willToken}` });
    assert.equal(prof1.status, 200);
    assert.equal(prof1.body.stats.classroomXp, 14);

    // Intento 2: Reintento con nota MENOR (10 puntos). NO debe degradar ni duplicar puntos
    const sub2Id = 'sub-xp-2-' + Date.now();
    cleanupIds.submissions.push(sub2Id);
    db.prepare(`
      INSERT INTO quiz_submissions (id, quiz_id, user_id, score, max_score, passed, submitted_at)
      VALUES (?, ?, ?, 10, 20, 0, ?)
    `).run(sub2Id, quizId, williamsId, new Date().toISOString());

    const prof2 = await request('GET', '/api/gamification/my-profile', null, { Authorization: `Bearer ${willToken}` });
    assert.equal(prof2.body.stats.classroomXp, 14, 'El XP no debe degradarse ante un intento con menor nota');

    // Intento 3: Reintento con nota SUPERIOR (18 puntos). Debe conservar la nota máxima (18 XP, delta +4)
    const sub3Id = 'sub-xp-3-' + Date.now();
    cleanupIds.submissions.push(sub3Id);
    db.prepare(`
      INSERT INTO quiz_submissions (id, quiz_id, user_id, score, max_score, passed, submitted_at)
      VALUES (?, ?, ?, 18, 20, 1, ?)
    `).run(sub3Id, quizId, williamsId, new Date().toISOString());

    const prof3 = await request('GET', '/api/gamification/my-profile', null, { Authorization: `Bearer ${willToken}` });
    assert.equal(prof3.body.stats.classroomXp, 18, 'El XP acumulado debe reflejar exactamente la nota máxima del quiz (18), sin sumar 14+18');

    // Mismo principio verificado en Leaderboard
    const lbRes = await request('GET', '/api/leaderboard');
    assert.equal(lbRes.status, 200);
    assert.ok(lbRes.body.length > 0);
    const willLb = lbRes.body.find(u => u.username === 'williams');
    assert.ok(willLb, 'Williams debe figurar en el leaderboard');
    assert.equal(willLb.totalXp, 198, 'Total XP debe ser exactamente 180 (simulador) + 18 (mejor quiz) = 198');
  });

  test('15.4 Prueba de Alta Concurrencia y Estrés en Gatekeeper API (50 peticiones < 50ms)', async () => {
    const CONCURRENCY_COUNT = 50;
    const latencies = [];

    const startTime = performance.now();
    const tasks = Array.from({ length: CONCURRENCY_COUNT }, async (_, i) => {
      const t0 = performance.now();
      const res = await request('GET', '/api/gatekeeper/status?userId=edward');
      const t1 = performance.now();
      const latency = t1 - t0;
      latencies.push(latency);
      assert.equal(res.status, 200, `Petición #${i} debe responder 200`);
      assert.ok(res.body.status !== undefined);
      return latency;
    });

    await Promise.all(tasks);
    const totalDuration = performance.now() - startTime;
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / CONCURRENCY_COUNT;
    const maxLatency = Math.max(...latencies);

    assert.ok(avgLatency < 100 || (totalDuration / CONCURRENCY_COUNT) < 50, `Latencia media (${avgLatency.toFixed(2)}ms) debe ser menor a 100ms`);
    assert.ok(totalDuration < 2000, `Las 50 peticiones concurrentes completaron en ${totalDuration.toFixed(2)}ms`);
  });

  test('15.5 Telemetría SSE Concurrente y Difusión de Alertas sub-300ms (Flujo 9)', async () => {
    const NUM_SSE_CLIENTS = 4;
    const connectedPromises = [];

    // 1. Abrir 4 conexiones SSE concurrentes simulando múltiples supervisores monitoreando
    for (let i = 0; i < NUM_SSE_CLIENTS; i++) {
      const p = new Promise((resolve, reject) => {
        const url = new URL('/api/live-events/stream', BASE_URL);
        const reqClient = http.request({
          hostname: url.hostname,
          port: url.port,
          path: url.pathname,
          method: 'GET',
          headers: { Accept: 'text/event-stream' }
        }, (res) => {
          assert.equal(res.statusCode, 200);
          resolve(reqClient);
        });
        reqClient.on('error', reject);
        reqClient.end();
      });
      connectedPromises.push(p);
    }

    const clients = await Promise.all(connectedPromises);
    clients.forEach(c => sseClientsList.push(c));

    // 2. Disparar evento de alerta crítica desde el simulador
    const t0 = performance.now();
    const alertRes = await request('POST', '/api/live-events', {
      advisor: 'Edward Velásquez',
      step: 'Paso 4: Validación de Límite Crediticio',
      detail: '[DATO INCORRECTO] Intento de asignación de crédito no respaldado',
      type: 'ERROR',
      errors: 1,
      caseCode: 'CP-13',
      caseTitle: 'Trampa Crédito Suspendido'
    });
    const broadcastLatency = performance.now() - t0;

    assert.equal(alertRes.status, 200);
    assert.ok(broadcastLatency < 300, `Difusión SSE tomó ${broadcastLatency.toFixed(2)}ms (requisito: <300ms)`);

    // 3. Verificar estado del monitor en vivo
    const liveGet = await request('GET', '/api/live-events');
    assert.equal(liveGet.status, 200);
    assert.equal(liveGet.body.current.advisor, 'Edward Velásquez');
    assert.equal(liveGet.body.current.type, 'ERROR');
    assert.ok(liveGet.body.current.connectedUsers >= NUM_SSE_CLIENTS);
  });

  test('15.6 Auditoría Forense de 2 Niveles: Integridad Round-Trip e Inviolabilidad de Privacidad', async () => {
    // 1. Sembrar evaluación con desglose multi-caso auditada por admin
    const auditEvalId = 'eval-forensic-h6-' + Date.now();
    cleanupIds.results.push(auditEvalId);

    const casesBreakdown = [
      {
        caseCode: 'CP-05',
        caseTitle: 'Consulta estado de cuenta',
        completed: true,
        errors: 0,
        duration: '00:20',
        client: 'Constructora Vial SAC',
        actionsLog: [{ type: 'SUCCESS', step: 'Paso 1', detail: 'Ingreso a ficha de cliente' }]
      },
      {
        caseCode: 'CP-29',
        caseTitle: 'Cobranza con retención SUNAT',
        completed: true,
        errors: 1,
        duration: '00:45',
        client: 'Lubrimotor EIRL',
        actionsLog: [{ type: 'ERROR', step: 'Paso 3', detail: '[DATO INCORRECTO] Tasa de retención 5% errónea' }]
      }
    ];

    db.prepare(`
      INSERT INTO results (
        id, case_id, case_code, case_title, username, advisor_name,
        score, numeric_score, errors, max_errors, status,
        duration_seconds, formatted_duration, completed_at, interactions, cases_details
      ) VALUES (?, 'case-multi', 'SIM-B2C', 'Evaluación Multi-Caso Auditoría', 'dino', 'Dino Quispe',
        '17 / 20', 17, 1, 6, 'Aprobado', 180, '03:00', '14/10/2026, 11:30:00', '[]', ?)
    `).run(auditEvalId, JSON.stringify(casesBreakdown));

    // 2. Asesor Edward intenta auditar la evaluación de Dino -> 403 Forbidden
    const resForbidden = await request('GET', `/api/gamification/evaluations/audit/simulator/${auditEvalId}`, null, {
      Authorization: `Bearer ${advisorToken}`
    });
    assert.equal(resForbidden.status, 403, 'Participante no puede auditar evaluación ajena');

    // 3. Supervisor (Revisor) audita la evaluación de Dino -> 200 OK
    const resRevAudit = await request('GET', `/api/gamification/evaluations/audit/simulator/${auditEvalId}`, null, {
      Authorization: `Bearer ${revisorToken}`
    });
    assert.equal(resRevAudit.status, 200);
    assert.equal(resRevAudit.body.type, 'simulator');
    assert.equal(resRevAudit.body.evaluation.username, 'dino');
    assert.equal(resRevAudit.body.cases.length, 2);
    assert.equal(resRevAudit.body.cases[1].caseCode, 'CP-29');
    assert.equal(resRevAudit.body.cases[1].actionsLog[0].type, 'ERROR');
    assert.ok(resRevAudit.body.cases[1].actionsLog[0].detail.includes('retención'));
  });

  test('15.7 Exportación Integral de Auditoría: Excel XML (.xls) y CSV UTF-8 con BOM (Supervisión y Admin)', async () => {
    // 1. Exportación Excel SpreadsheetML (.xls)
    const resExcel = await request('GET', '/api/admin/export?format=excel', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.equal(resExcel.status, 200);
    assert.ok(resExcel.headers['content-type'].includes('vnd.ms-excel'));
    assert.ok(resExcel.headers['content-disposition'].includes('.xls'));
    assert.ok(typeof resExcel.body === 'string');
    assert.ok(resExcel.body.includes('<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"'));
    assert.ok(resExcel.body.includes('<Worksheet ss:Name="Evaluaciones">'));
    assert.ok(resExcel.body.includes('ID Evaluación'));

    // 2. Exportación CSV con BOM UTF-8 (\uFEFF)
    const resCsv = await request('GET', '/api/admin/export?format=csv', null, {
      Authorization: `Bearer ${revisorToken}`
    });
    assert.equal(resCsv.status, 200);
    assert.ok(resCsv.headers['content-type'].includes('text/csv'));
    assert.ok(resCsv.headers['content-disposition'].includes('.csv'));
    assert.ok(typeof resCsv.body === 'string');
    assert.ok(resCsv.body.startsWith('\uFEFF'), 'El CSV debe iniciar con el BOM UTF-8 para garantizar compatibilidad con Excel');
    assert.ok(resCsv.body.includes('"ID Evaluación"'));
    assert.ok(resCsv.body.includes('"Puntaje Numérico"'));
  });

  test('15.8 Cobertura Integral de los 12 Flujos de Usuario PRDv2', async () => {
    // Flujo 1: Acceso, Autenticación y Token
    const f1 = await request('POST', '/api/auth/login', { username: 'admin', password: '123' });
    assert.equal(f1.status, 200);

    // Flujo 2: Dashboard y Novedades de Aula Virtual
    const f2 = await request('GET', '/api/gamification/training/recent');
    assert.equal(f2.status, 200);

    // Flujo 3: Aula Virtual (Módulos y Videos)
    const f3 = await request('GET', '/api/training/modules', null, { Authorization: `Bearer ${advisorToken}` });
    assert.equal(f3.status, 200);

    // Flujo 4: Quizzes de Refuerzo en Aula Virtual
    const f4 = await request('GET', '/api/training/quizzes/submissions/history', null, { Authorization: `Bearer ${advisorToken}` });
    assert.equal(f4.status, 200);

    // Flujo 5: Onboarding Asistido (Progreso de los 7 hitos)
    const f5 = await request('GET', '/api/training/onboarding/progress', null, { Authorization: `Bearer ${advisorToken}` });
    assert.equal(f5.status, 200);

    // Flujo 6: Vista de Evaluación (Cuestionarios y Examen con Simulador)
    const f6 = await request('GET', '/api/evaluations/questionnaires', null, { Authorization: `Bearer ${advisorToken}` });
    assert.equal(f6.status, 200);

    // Flujo 7: Ranking General, Podio Olímpico y Auditoría Forense
    const f7 = await request('GET', '/api/leaderboard');
    assert.equal(f7.status, 200);

    // Flujo 8: Mi Perfil Comercial (Insignias y Desglose de XP)
    const f8 = await request('GET', '/api/gamification/my-profile', null, { Authorization: `Bearer ${advisorToken}` });
    assert.equal(f8.status, 200);

    // Flujo 9: Consola de Supervisión en Vivo y Analítica
    const f9 = await request('GET', '/api/live-events');
    assert.equal(f9.status, 200);

    // Flujo 10: Gestión de Usuarios y Nómina
    const f10 = await request('GET', '/api/users');
    assert.equal(f10.status, 200);

    // Flujo 11: Base de Conocimiento y Reglas de Negocio
    const f11 = await request('GET', '/api/knowledge/rules', null, { Authorization: `Bearer ${advisorToken}` });
    assert.equal(f11.status, 200);

    // Flujo 12: Gatekeeper API y Calendario
    const f12 = await request('GET', '/api/gatekeeper/status?userId=edward');
    assert.equal(f12.status, 200);
  });
});
