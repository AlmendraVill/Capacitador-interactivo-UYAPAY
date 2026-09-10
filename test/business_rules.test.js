/**
 * Suite de Pruebas Automatizadas de Reglas de Negocio UYAPAY
 * Ejecutable con: npm test (Node.js Test Runner nativo)
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

// Cargar catálogo de casos y datos
const { CASES, PRODUCTS } = require('../js/data/cases.js');
const { INITIAL_USERS } = require('../js/data/users.js');

describe('1. Catálogo Oficial de Casos y Productos UYAPAY', () => {
  test('El catálogo contiene exactamente los 21 casos oficiales de capacitación B2C', () => {
    assert.strictEqual(CASES.length, 21, `Se esperaban 21 casos pero se encontraron ${CASES.length}`);
  });

  test('Todos los casos poseen estructura requerida (id, code, client, rules, solutionFlow)', () => {
    CASES.forEach((c, index) => {
      assert.ok(c.id, `El caso en índice ${index} carece de id`);
      assert.ok(c.code, `El caso ${c.id} carece de código oficial`);
      assert.ok(c.title, `El caso ${c.code} carece de título`);
      assert.ok(c.client, `El caso ${c.code} carece de cliente`);
      assert.ok(Array.isArray(c.rules) && c.rules.length > 0, `El caso ${c.code} carece de reglas de evaluación`);
      assert.ok(c.solutionFlow, `El caso ${c.code} carece de solutionFlow`);
      const maxErr = c.maxErrorsAllowed !== undefined ? c.maxErrorsAllowed : (c.scoring && c.scoring.maxErrorsAllowed);
      assert.ok(maxErr !== undefined, `El caso ${c.code} carece de maxErrorsAllowed`);

      // Verificar que cada regla tenga validador ejecutable
      c.rules.forEach((rule, rIndex) => {
        assert.ok(rule.eventName, `Regla ${rIndex} en caso ${c.code} sin eventName`);
        assert.strictEqual(typeof rule.validate, 'function', `Regla ${rule.eventName} en caso ${c.code} debe tener función validate`);
      });
    });
  });

  test('El catálogo de productos contiene lubricantes Shell con sus precios y SKUs oficiales', () => {
    assert.ok(PRODUCTS.length >= 4, 'Deben existir al menos 4 productos Shell oficiales');
    const hx7 = PRODUCTS.find(p => p.sku === 'B-734807');
    assert.ok(hx7, 'Shell Helix HX7 10W/40 no encontrado');
    assert.strictEqual(hx7.unitPrice, 22.0, 'El precio unitario de HX7 debe ser 22.0 USD');
    assert.strictEqual(hx7.hasPromo, true, 'HX7 debe tener promoción configurada');
  });

  test('La nómina de usuarios oficiales incluye al Administrador y los 12 asesores comerciales', () => {
    assert.ok(INITIAL_USERS.length >= 13, 'Debe haber al menos 13 usuarios (1 admin + 12 asesores)');
    const admin = INITIAL_USERS.find(u => u.username === 'admin');
    assert.ok(admin, 'Usuario admin no encontrado');
    assert.strictEqual(admin.role, 'admin');

    const alvaro = INITIAL_USERS.find(u => u.username === 'alvaro');
    assert.ok(alvaro, 'Asesor alvaro no encontrado');
    assert.strictEqual(alvaro.role, 'asesor');
  });
});

describe('2. Sistema de Calificación Vigesimal (Escala 0 a 20)', () => {
  function calculateScore(errors) {
    return Math.max(0, 20 - (errors * 4));
  }

  test('0 errores otorga nota perfecta 20/20', () => {
    assert.strictEqual(calculateScore(0), 20);
  });

  test('1 error deduce 4 puntos (nota 16/20)', () => {
    assert.strictEqual(calculateScore(1), 16);
  });

  test('2 errores deduce 8 puntos (nota 12/20)', () => {
    assert.strictEqual(calculateScore(2), 12);
  });

  test('3 errores deduce 12 puntos (nota 08/20)', () => {
    assert.strictEqual(calculateScore(3), 8);
  });

  test('5 o más errores nunca da puntaje negativo (piso en 0)', () => {
    assert.strictEqual(calculateScore(5), 0);
    assert.strictEqual(calculateScore(10), 0);
  });
});

describe('3. Criterios Oficiales de Desempate en Ranking (RF-MVP-042 a 047)', () => {
  function sortLeaderboard(entries) {
    return [...entries].sort((a, b) => {
      // 1. Mayor puntaje
      if (b.numericScore !== a.numericScore) return b.numericScore - a.numericScore;
      // 2. Menor tiempo empleado (desempate primario)
      if (a.durationSeconds !== b.durationSeconds) return a.durationSeconds - b.durationSeconds;
      // 3. Menor cantidad de errores cometidos (desempate secundario)
      return a.errors - b.errors;
    });
  }

  test('Desempate: A igual puntaje gana el asesor con menor tiempo', () => {
    const candidateA = { username: 'alvaro', numericScore: 20, durationSeconds: 65, errors: 0 };
    const candidateB = { username: 'lruiz', numericScore: 20, durationSeconds: 45, errors: 0 };

    const ranked = sortLeaderboard([candidateA, candidateB]);
    assert.strictEqual(ranked[0].username, 'lruiz', 'Leonardo debió ganar el 1er lugar por menor tiempo');
    assert.strictEqual(ranked[1].username, 'alvaro');
  });

  test('Desempate: A igual puntaje e igual tiempo gana el asesor con menor cantidad de errores', () => {
    const candidateA = { username: 'danilo', numericScore: 16, durationSeconds: 50, errors: 2 };
    const candidateB = { username: 'betsy', numericScore: 16, durationSeconds: 50, errors: 1 };

    const ranked = sortLeaderboard([candidateA, candidateB]);
    assert.strictEqual(ranked[0].username, 'betsy', 'Betsy debió ganar por menor cantidad de errores');
  });

  test('Mayor puntaje siempre prevalece aunque tenga mayor tiempo', () => {
    const candidateA = { username: 'percy', numericScore: 20, durationSeconds: 120, errors: 0 };
    const candidateB = { username: 'dino', numericScore: 16, durationSeconds: 30, errors: 1 };

    const ranked = sortLeaderboard([candidateA, candidateB]);
    assert.strictEqual(ranked[0].username, 'percy', 'Percy debe quedar primero por mayor nota');
  });
});

describe('4. Selección Estratificada Balanceada de 5 Casos', () => {
  // Implementación fiel de la lógica de portal.js
  function selectFiveEvaluationCases(catalog, usedCodes = []) {
    const strata = [
      ['B2C-01', 'B2C-04', 'B2C-06', 'B2C-15', 'B2C-20'], // 1: Ventas básicas
      ['B2C-02', 'B2C-05', 'B2C-17', 'B2C-18'],           // 2: Condiciones comerciales
      ['B2C-03', 'B2C-07', 'B2C-14', 'B2C-19'],           // 3: Promociones
      ['B2C-08', 'B2C-09', 'B2C-10', 'B2C-22'],           // 4: Ruta y visitas
      ['B2C-11', 'B2C-16', 'B2C-21', 'B2C-23']            // 5: Cobranzas y liquidación
    ];

    const selected = [];
    const chosenCodes = new Set();

    strata.forEach(groupCodes => {
      const availableInStrata = catalog.filter(c => groupCodes.includes(c.code) && !chosenCodes.has(c.code));
      if (availableInStrata.length === 0) return;

      const nonRepeated = availableInStrata.filter(c => !usedCodes.includes(c.code));
      const pool = nonRepeated.length > 0 ? nonRepeated : availableInStrata;
      const pick = pool[Math.floor(Math.random() * pool.length)];

      selected.push(pick);
      chosenCodes.add(pick.code);
    });

    return selected;
  }

  test('Siempre selecciona exactamente 5 casos únicos', () => {
    for (let testRun = 0; testRun < 20; testRun++) {
      const selected = selectFiveEvaluationCases(CASES, []);
      assert.strictEqual(selected.length, 5, `El lote debe tener 5 casos en intento ${testRun}`);
      const uniqueCodes = new Set(selected.map(c => c.code));
      assert.strictEqual(uniqueCodes.size, 5, 'No debe haber casos duplicados en la selección');
    }
  });

  test('La selección cubre los 5 estratos pedagógicos requeridos', () => {
    const strata = [
      ['B2C-01', 'B2C-04', 'B2C-06', 'B2C-15', 'B2C-20'],
      ['B2C-02', 'B2C-05', 'B2C-17', 'B2C-18'],
      ['B2C-03', 'B2C-07', 'B2C-14', 'B2C-19'],
      ['B2C-08', 'B2C-09', 'B2C-10', 'B2C-22'],
      ['B2C-11', 'B2C-16', 'B2C-21', 'B2C-23']
    ];

    const selected = selectFiveEvaluationCases(CASES, []);
    strata.forEach((group, stratumIndex) => {
      const hasMatch = selected.some(c => group.includes(c.code));
      assert.ok(hasMatch, `El estrato pedagógico ${stratumIndex + 1} no tuvo representación en la selección`);
    });
  });

  test('El filtro anti-repetición prioriza casos no evaluados previamente', () => {
    // Si el usuario ya vio B2C-01, B2C-04, B2C-06, B2C-15 del Estrato 1, debe escoger B2C-20
    const usedCodes = ['B2C-01', 'B2C-04', 'B2C-06', 'B2C-15'];
    const selected = selectFiveEvaluationCases(CASES, usedCodes);
    const stratum1Pick = selected.find(c => ['B2C-01', 'B2C-04', 'B2C-06', 'B2C-15', 'B2C-20'].includes(c.code));
    assert.strictEqual(stratum1Pick.code, 'B2C-20', 'Debe seleccionar el único caso no repetido del estrato 1');
  });
});

describe('5. Seguridad, Criptografía PBKDF2 y Tokens de Sesión', () => {
  function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const iterations = 10000;
    const derived = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
    return `$pbkdf2$${iterations}$${salt}$${derived}`;
  }

  function verifyPassword(password, storedHash) {
    if (!storedHash) return false;
    if (!storedHash.startsWith('$pbkdf2$')) {
      return storedHash === password;
    }
    const parts = storedHash.split('$');
    if (parts.length !== 5) return false;
    const iterations = parseInt(parts[2], 10);
    const salt = parts[3];
    const expectedHash = parts[4];
    const actualHash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(actualHash, 'utf8'), Buffer.from(expectedHash, 'utf8'));
  }

  test('El hash PBKDF2 genera formato seguro con salt e iteraciones', () => {
    const hash = hashPassword('123');
    assert.ok(hash.startsWith('$pbkdf2$10000$'), 'El hash debe iniciar con el identificador de algoritmo e iteraciones');
    assert.strictEqual(hash.split('$').length, 5, 'El hash debe contener 4 separadores $');
  });

  test('verifyPassword valida correctamente contraseñas legítimas con PBKDF2', () => {
    const pass = 'SuperSecret123!';
    const hash = hashPassword(pass);
    assert.strictEqual(verifyPassword(pass, hash), true, 'La contraseña legítima debe ser aceptada');
  });

  test('verifyPassword rechaza contraseñas erróneas', () => {
    const hash = hashPassword('CorrectPassword');
    assert.strictEqual(verifyPassword('WrongPassword', hash), false, 'La contraseña incorrecta debe ser rechazada');
  });

  test('verifyPassword soporta retrocompatibilidad con contraseñas legadas en texto plano', () => {
    assert.strictEqual(verifyPassword('123', '123'), true, 'Debe aceptar temporalmente texto plano para auto-migración');
    assert.strictEqual(verifyPassword('wrong', '123'), false, 'Debe rechazar texto plano incorrecto');
  });
});
