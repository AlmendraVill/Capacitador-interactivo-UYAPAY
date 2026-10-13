/**
 * Pruebas Automatizadas de los Módulos de Requisitos.pdf
 * Valida Roles, LMS, Quizzes, FAQs, Reglas de Negocio, Gamificación e Integración.
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { startServer } = require('../server.js');

describe('7. Verificación de Módulos Requisitos.pdf (LMS, Roles, FAQ, Gamificación)', () => {
  let serverInstance;
  const TEST_PORT = 3101;
  const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

  before(async () => {
    serverInstance = await startServer(TEST_PORT);
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
        req.write(typeof body === 'string' ? body : JSON.stringify(body));
      }
      req.end();
    });
  }

  let adminToken = '';
  let advisorToken = '';

  test('Autenticación y obtención de tokens con soporte Multi-Rol (RF-001, RF-006)', async () => {
    const adminLogin = await request('POST', '/api/auth/login', { username: 'admin', password: '123' });
    assert.strictEqual(adminLogin.status, 200);
    assert.ok(adminLogin.body.token);
    assert.ok(Array.isArray(adminLogin.body.user.roles));
    assert.ok(adminLogin.body.user.roles.includes('admin'));
    adminToken = adminLogin.body.token;

    const advisorLogin = await request('POST', '/api/auth/login', { username: 'alvaro', password: '123' });
    assert.strictEqual(advisorLogin.status, 200);
    assert.ok(advisorLogin.body.token);
    assert.ok(Array.isArray(advisorLogin.body.user.roles));
    assert.ok(advisorLogin.body.user.roles.includes('participante') || advisorLogin.body.user.roles.includes('asesor'));
    advisorToken = advisorLogin.body.token;
  });

  test('Gestión de Usuarios: Catálogo de 4 Roles Oficiales (ACC-03, RF-006)', async () => {
    const res = await request('GET', '/api/users-mgmt/roles', null, { Authorization: `Bearer ${advisorToken}` });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body));
    const codes = res.body.map(r => r.code);
    assert.ok(codes.includes('admin'));
    assert.ok(codes.includes('facilitador'));
    assert.ok(codes.includes('editor'));
    assert.ok(codes.includes('participante'));
  });

  test('Gestión de Usuarios: Crear nuevo usuario con roles y contraseña PBKDF2 (ACC-01, RF-003)', async () => {
    const newUsername = 'testuser_' + Date.now();
    const createRes = await request('POST', '/api/users-mgmt', {
      username: newUsername,
      name: 'Usuario de Prueba Automatizada',
      email: 'test@uyapay.pe',
      role: 'asesor',
      roles: ['rol-participante'],
      password: '123'
    }, { Authorization: `Bearer ${adminToken}` });

    assert.strictEqual(createRes.status, 201);
    assert.strictEqual(createRes.body.success, true);
    assert.strictEqual(createRes.body.user.username, newUsername);

    // Verificar listado en GET /api/users-mgmt
    const listRes = await request('GET', '/api/users-mgmt', null, { Authorization: `Bearer ${adminToken}` });
    assert.strictEqual(listRes.status, 200);
    const createdUser = listRes.body.find(u => u.username === newUsername);
    assert.ok(createdUser, 'El usuario creado debe aparecer en la nómina administrativa');
    assert.strictEqual(createdUser.status, 'active');
  });

  test('Gestión de Usuarios: Activar / Desactivar Usuario (ACC-02, RF-005)', async () => {
    // Buscar usuario edward
    const usersRes = await request('GET', '/api/users');
    const edward = usersRes.body.find(u => u.username === 'edward');
    assert.ok(edward, 'Usuario edward debe existir');

    // Toggle a inactivo
    const toggle1 = await request('PATCH', `/api/users-mgmt/${edward.id}/toggle-status`, null, { Authorization: `Bearer ${adminToken}` });
    assert.strictEqual(toggle1.status, 200);
    assert.strictEqual(toggle1.body.status, 'inactive');

    // Verificar en la API de integración que su acceso queda denegado por inactividad
    const checkInactive = await request('GET', '/api/integration/user-status/edward');
    assert.strictEqual(checkInactive.status, 403);
    assert.strictEqual(checkInactive.body.reason, 'USER_INACTIVE');

    // Restaurar a activo
    const toggle2 = await request('PATCH', `/api/users-mgmt/${edward.id}/toggle-status`, null, { Authorization: `Bearer ${adminToken}` });
    assert.strictEqual(toggle2.status, 200);
    assert.strictEqual(toggle2.body.status, 'active');
  });

  test('LMS: Catálogo de Módulos y Biblioteca de Videos (CAP-01, RF-008)', async () => {
    const modRes = await request('GET', '/api/training/modules', null, { Authorization: `Bearer ${advisorToken}` });
    assert.strictEqual(modRes.status, 200);
    assert.ok(Array.isArray(modRes.body));
    assert.ok(modRes.body.length >= 3);

    const vidRes = await request('GET', '/api/training/videos', null, { Authorization: `Bearer ${advisorToken}` });
    assert.strictEqual(vidRes.status, 200);
    assert.ok(Array.isArray(vidRes.body));
    assert.ok(vidRes.body.length >= 3);
    assert.ok(vidRes.body[0].quizId, 'El video debe tener un cuestionario asociado');
  });

  test('LMS: Cuestionario de Refuerzo de hasta 3 preguntas sin spoilers (CAP-02, RF-010)', async () => {
    const vidRes = await request('GET', '/api/training/videos', null, { Authorization: `Bearer ${advisorToken}` });
    const firstVideo = vidRes.body[0];

    const quizRes = await request('GET', `/api/training/videos/${firstVideo.id}/quiz`, null, { Authorization: `Bearer ${advisorToken}` });
    assert.strictEqual(quizRes.status, 200);
    assert.ok(Array.isArray(quizRes.body.questions));
    assert.ok(quizRes.body.questions.length <= 3, 'Máximo 3 preguntas por video');

    // Verificar que las alternativas NO incluyan is_correct para evitar trampas en frontend
    const q1 = quizRes.body.questions[0];
    assert.ok(q1.options.length >= 2);
    assert.strictEqual(q1.options[0].is_correct, undefined, 'No debe filtrar la respuesta correcta en el GET');
  });

  test('LMS: Envío de Cuestionario, Calificación Vigesimal y Registro Histórico (RF-011, RF-012)', async () => {
    const vidRes = await request('GET', '/api/training/videos', null, { Authorization: `Bearer ${advisorToken}` });
    const firstVideo = vidRes.body[0];
    const quizRes = await request('GET', `/api/training/videos/${firstVideo.id}/quiz`, null, { Authorization: `Bearer ${advisorToken}` });

    const q1 = quizRes.body.questions[0];
    const q2 = quizRes.body.questions[1];
    const q3 = quizRes.body.questions[2];

    // Enviar respuestas
    const submitRes = await request('POST', `/api/training/quizzes/${quizRes.body.id}/submit`, {
      answers: {
        [q1.id]: q1.options[0].id,
        [q2.id]: q2.options[0].id,
        [q3.id]: q3.options[0].id
      }
    }, { Authorization: `Bearer ${advisorToken}` });

    assert.strictEqual(submitRes.status, 200);
    assert.strictEqual(submitRes.body.maxScore, 20);
    assert.ok(typeof submitRes.body.score === 'number');
    assert.ok(Array.isArray(submitRes.body.feedback));
  });

  test('Base de Conocimiento: Consulta de FAQs y Reglas de Negocio (CAP-05, CAP-06, RF-017, RF-018)', async () => {
    const faqRes = await request('GET', '/api/knowledge/faqs', null, { Authorization: `Bearer ${advisorToken}` });
    assert.strictEqual(faqRes.status, 200);
    assert.ok(Array.isArray(faqRes.body));
    assert.ok(faqRes.body.length >= 4);
    assert.ok(faqRes.body.some(f => f.question.includes('50 metros')));

    const rulesRes = await request('GET', '/api/knowledge/rules', null, { Authorization: `Bearer ${advisorToken}` });
    assert.strictEqual(rulesRes.status, 200);
    assert.ok(Array.isArray(rulesRes.body));
    assert.ok(rulesRes.body.length >= 3);
  });

  test('Gamificación y Perfil: Insignias y Puntaje Global Acumulado (SEG-01 a SEG-03, RF-036 a RF-039)', async () => {
    const profileRes = await request('GET', '/api/gamification/my-profile', null, { Authorization: `Bearer ${advisorToken}` });
    assert.strictEqual(profileRes.status, 200);
    assert.ok(profileRes.body.user);
    assert.ok(profileRes.body.stats);
    assert.ok(profileRes.body.stats.globalPoints !== undefined);
    assert.ok(Array.isArray(profileRes.body.badges));
    assert.strictEqual(profileRes.body.badges.length, 6, 'Debe contar con las 6 insignias oficiales');
  });

  test('Integración Externa y Recomendaciones Pedagógicas (EVA-08, EVA-10, RF-013, RF-029, RF-033)', async () => {
    const statusRes = await request('GET', '/api/integration/user-status/admin');
    assert.strictEqual(statusRes.status, 200);
    assert.strictEqual(statusRes.body.allowed, true);

    const recoRes = await request('GET', '/api/integration/recommendations/alvaro');
    assert.strictEqual(recoRes.status, 200);
    assert.ok(recoRes.body !== null);
  });
});
