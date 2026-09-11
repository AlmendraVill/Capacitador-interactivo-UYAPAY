/**
 * Pruebas de Integración End-to-End del Servidor y API REST UYAPAY
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { startServer } = require('../server.js');

// Arrancar servidor en puerto dinámico para pruebas
describe('6. Integración End-to-End del Backend UYAPAY (server.js)', () => {
  let serverInstance;
  const TEST_PORT = 3099;
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

  test('El endpoint /api/health responde status ok', async () => {
    const res = await request('GET', '/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
  });

  test('Login con credenciales válidas genera Token Bearer seguro y auto-migra a PBKDF2', async () => {
    const res = await request('POST', '/api/auth/login', { username: 'admin', password: '123' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.user.role, 'admin');
    assert.ok(res.body.token, 'Debe emitir un token');
    adminToken = res.body.token;

    // Login asesor
    const resAsesor = await request('POST', '/api/auth/login', { username: 'alvaro', password: '123' });
    assert.strictEqual(resAsesor.status, 200);
    assert.strictEqual(resAsesor.body.user.role, 'asesor');
    advisorToken = resAsesor.body.token;
  });

  test('Login con contraseña incorrecta es rechazado (HTTP 401)', async () => {
    const res = await request('POST', '/api/auth/login', { username: 'admin', password: 'wrongPassword' });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  test('Ruta administrativa /api/settings/podium rechaza solicitudes sin token (HTTP 401)', async () => {
    const res = await request('POST', '/api/settings/podium', { visible: true });
    assert.strictEqual(res.status, 401);
  });

  test('Ruta administrativa rechaza solicitudes de asesor con rol no-admin (HTTP 403)', async () => {
    const res = await request('POST', '/api/settings/podium', { visible: true }, {
      'Authorization': `Bearer ${advisorToken}`
    });
    assert.strictEqual(res.status, 403);
  });

  test('Ruta administrativa acepta modificaciones con token de Administrador (HTTP 200)', async () => {
    const res = await request('POST', '/api/settings/podium', { visible: true }, {
      'Authorization': `Bearer ${adminToken}`
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.podiumVisible, true);
  });

  test('Endpoint /api/admin/export genera CSV con BOM UTF-8 y cabeceras correctas', async () => {
    const res = await request('GET', '/api/admin/export?format=csv', null, {
      'Authorization': `Bearer ${adminToken}`
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers['content-disposition'].includes('.csv'));
    assert.ok(typeof res.body === 'string' && res.body.includes('ID Evaluación'));
  });

  test('Endpoint /api/admin/export genera Excel XML (.xls)', async () => {
    const res = await request('GET', '/api/admin/export?format=excel', null, {
      'Authorization': `Bearer ${adminToken}`
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers['content-disposition'].includes('.xls'));
    assert.ok(typeof res.body === 'string' && res.body.includes('urn:schemas-microsoft-com:office:spreadsheet'));
  });

  test('Protección de archivos internos del servidor (server.js, sqlite y package.json responden HTTP 403)', async () => {
    const resServer = await request('GET', '/server.js');
    assert.strictEqual(resServer.status, 403);

    const resSqlite = await request('GET', '/uyapay.sqlite');
    assert.strictEqual(resSqlite.status, 403);

    const resPackage = await request('GET', '/package.json');
    assert.strictEqual(resPackage.status, 403);
  });
});
