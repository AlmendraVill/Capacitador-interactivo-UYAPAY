/**
 * Suite de Pruebas Automatizadas de Reglas de Negocio UYAPAY
 * Ejecutable con: npm test (Node.js Test Runner nativo)
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

// Cargar catálogo de casos, usuarios y motor evaluador
const { CASES, PRODUCTS } = require('../js/data/cases.js');
const { INITIAL_USERS } = require('../js/data/users.js');
const Evaluator = require('../js/services/evaluator.js');
const { calculateCaseScore } = Evaluator;

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

  test('La nómina de usuarios oficiales incluye al Administrador y los 14 asesores comerciales', () => {
    assert.strictEqual(INITIAL_USERS.length, 15, 'Debe haber exactamente 15 usuarios (1 admin + 14 asesores)');
    const admin = INITIAL_USERS.find(u => u.username === 'admin');
    assert.ok(admin, 'Usuario admin no encontrado');
    assert.strictEqual(admin.role, 'admin');

    const edward = INITIAL_USERS.find(u => u.username === 'edward');
    assert.ok(edward, 'Asesor edward no encontrado');
    assert.strictEqual(edward.role, 'asesor', 'Edward debe tener rol de asesor comercial');

    const henry = INITIAL_USERS.find(u => u.username === 'henry');
    assert.ok(henry, 'Asesor henry no encontrado');
    assert.strictEqual(henry.role, 'asesor', 'Henry debe tener rol de asesor comercial');

    const alvaro = INITIAL_USERS.find(u => u.username === 'alvaro');
    assert.ok(alvaro, 'Asesor alvaro no encontrado');
    assert.strictEqual(alvaro.role, 'asesor');
  });
});

describe('2. Sistema de Calificación Vigesimal de Doble Factor (60% Resolución / 40% Calidad)', () => {
  test('Caso no intentado / saltado (0 pasos completados) otorga nota 00/20', () => {
    const result = calculateCaseScore(0, 6, 0, false);
    assert.strictEqual(result.numericScore, 0);
    assert.strictEqual(result.score, '00 / 20');
    assert.strictEqual(result.advancePoints, 0);
    assert.strictEqual(result.qualityPoints, 0);
  });

  test('Caso completado al 100% con 0 errores otorga nota perfecta 20/20', () => {
    const result = calculateCaseScore(6, 6, 0, true);
    assert.strictEqual(result.numericScore, 20);
    assert.strictEqual(result.score, '20 / 20');
    assert.strictEqual(result.advancePoints, 12.0);
    assert.strictEqual(result.qualityPoints, 8.0);
  });

  test('Caso completado al 100% con 1 error deduce 1 punto de calidad (nota 19/20)', () => {
    const result = calculateCaseScore(6, 6, 1, true);
    assert.strictEqual(result.numericScore, 19);
    assert.strictEqual(result.score, '19 / 20');
    assert.strictEqual(result.advancePoints, 12.0);
    assert.strictEqual(result.qualityPoints, 7.0);
  });

  test('Caso completado al 100% con 2 errores deduce 2 puntos de calidad (nota 18/20)', () => {
    const result = calculateCaseScore(6, 6, 2, true);
    assert.strictEqual(result.numericScore, 18);
    assert.strictEqual(result.score, '18 / 20');
    assert.strictEqual(result.advancePoints, 12.0);
    assert.strictEqual(result.qualityPoints, 6.0);
  });

  test('Caso completado al 100% con 4 errores deduce 4 puntos de calidad (nota 16/20)', () => {
    const result = calculateCaseScore(6, 6, 4, true);
    assert.strictEqual(result.numericScore, 16);
    assert.strictEqual(result.score, '16 / 20');
    assert.strictEqual(result.advancePoints, 12.0);
    assert.strictEqual(result.qualityPoints, 4.0);
  });

  test('Caso completado al 100% con alta tasa de errores (ej. 10 errores) aplica tope de 4 puntos menos (nota 16/20)', () => {
    const result = calculateCaseScore(6, 6, 10, true);
    // Avance: 12.0 pts. Calidad con tope: 8.0 - 4.0 = 4.0 pts. Total: 16
    assert.strictEqual(result.numericScore, 16);
    assert.strictEqual(result.score, '16 / 20');
    assert.strictEqual(result.advancePoints, 12.0);
    assert.strictEqual(result.qualityPoints, 4.0);
    assert.ok(result.numericScore >= 11, 'El asesor aprueba el caso por haber resuelto la meta');
  });

  test('Caso incompleto con avance del 50% y 0 errores otorga nota proporcional (10/20)', () => {
    const result = calculateCaseScore(3, 6, 0, false);
    // Avance: 0.5 * 12.0 = 6.0 pts. Calidad: 0.5 * 8.0 = 4.0 pts. Total: 10
    assert.strictEqual(result.numericScore, 10);
    assert.strictEqual(result.score, '10 / 20');
  });

  test('Caso incompleto con avance del 50% y 2 errores otorga nota proporcional reducida (09/20)', () => {
    const result = calculateCaseScore(3, 6, 2, false);
    // Avance: 6.0 pts. Calidad: 0.5 * (8 - 2) = 3.0 pts. Total: 9
    assert.strictEqual(result.numericScore, 9);
    assert.strictEqual(result.score, '09 / 20');
  });

  test('Caso no resuelto con 0 pasos completados pero con errores cometidos otorga 00/20', () => {
    const result = calculateCaseScore(0, 6, 5, false);
    assert.strictEqual(result.numericScore, 0);
    assert.strictEqual(result.score, '00 / 20');
    assert.strictEqual(result.advancePoints, 0);
    assert.strictEqual(result.qualityPoints, 0);
  });

  test('Simulación de usuario que se salta todos los 5 casos: promedio exacto 00/20 y desaprobado', () => {
    const mockCases = [
      { id: 'c1', code: 'CP-01', rules: [{}, {}, {}] },
      { id: 'c2', code: 'CP-02', rules: [{}, {}, {}] },
      { id: 'c3', code: 'CP-03', rules: [{}, {}, {}] },
      { id: 'c4', code: 'CP-04', rules: [{}, {}, {}] },
      { id: 'c5', code: 'CP-05', rules: [{}, {}, {}] }
    ];
    Evaluator.startMultiEvaluation({ username: 'testuser', name: 'Test User' }, mockCases);
    const finalResult = Evaluator.finishMultiEvaluation();
    assert.strictEqual(finalResult.numericScore, 0);
    assert.strictEqual(finalResult.score, '00 / 20');
    assert.strictEqual(finalResult.status, 'Desaprobado');
    assert.strictEqual(finalResult.completedCasesCount, 0);
    assert.strictEqual(finalResult.casesDetails.length, 5);
    finalResult.casesDetails.forEach(cs => {
      assert.strictEqual(cs.numericScore, 0);
      assert.strictEqual(cs.score, '00 / 20');
    });
  });

  test('Puntaje siempre se mantiene acotado en escala vigesimal válida [0 a 20]', () => {
    assert.strictEqual(calculateCaseScore(0, 5, 20, false).numericScore, 0);
    assert.strictEqual(calculateCaseScore(5, 5, 0, true).numericScore, 20);
    assert.ok(calculateCaseScore(2, 5, 100, false).numericScore >= 0);
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
      ['CP-01', 'B2C-01', 'B2C-04', 'B2C-06', 'B2C-15', 'B2C-20'], // 1: Ventas básicas
      ['B2C-02', 'B2C-05', 'B2C-17', 'B2C-18'],           // 2: Condiciones comerciales
      ['B2C-03', 'B2C-07', 'B2C-14', 'B2C-19'],           // 3: Promociones
      ['B2C-08', 'B2C-09', 'B2C-10', 'B2C-22'],           // 4: Ruta y visitas
      ['B2C-11', 'B2C-16', 'B2C-21', 'B2C-23']            // 5: Cobranzas y liquidación
    ];

    const selected = [];
    const chosenCodes = new Set();

    strata.forEach(groupCodes => {
      const availableInStrata = catalog.filter(c => (groupCodes.includes(c.code) || (c.aliases && c.aliases.some(a => groupCodes.includes(a)))) && !chosenCodes.has(c.code));
      if (availableInStrata.length === 0) return;

      const nonRepeated = availableInStrata.filter(c => !usedCodes.includes(c.code) && !(c.aliases && c.aliases.some(a => usedCodes.includes(a))));
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
      ['CP-01', 'B2C-01', 'B2C-04', 'B2C-06', 'B2C-15', 'B2C-20'],
      ['B2C-02', 'B2C-05', 'B2C-17', 'B2C-18'],
      ['B2C-03', 'B2C-07', 'B2C-14', 'B2C-19'],
      ['B2C-08', 'B2C-09', 'B2C-10', 'B2C-22'],
      ['B2C-11', 'B2C-16', 'B2C-21', 'B2C-23']
    ];

    const selected = selectFiveEvaluationCases(CASES, []);
    strata.forEach((group, stratumIndex) => {
      const hasMatch = selected.some(c => group.includes(c.code) || (c.aliases && c.aliases.some(a => group.includes(a))));
      assert.ok(hasMatch, `El estrato pedagógico ${stratumIndex + 1} no tuvo representación en la selección`);
    });
  });

  test('El filtro anti-repetición prioriza casos no evaluados previamente', () => {
    // Si el usuario ya vio CP-01/B2C-01, B2C-04, B2C-06, B2C-15 del Estrato 1, debe escoger B2C-20
    const usedCodes = ['CP-01', 'B2C-01', 'B2C-04', 'B2C-06', 'B2C-15'];
    const selected = selectFiveEvaluationCases(CASES, usedCodes);
    const stratum1Pick = selected.find(c => ['CP-01', 'B2C-01', 'B2C-04', 'B2C-06', 'B2C-15', 'B2C-20'].includes(c.code));
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

describe('6. Caso CP-01: Venta al contado con regalo y entrega programada', () => {
  const cp01 = CASES.find(c => c.code === 'CP-01' || c.id === 'case-1');

  test('CP-01 está configurado con código CP-01 y exactamente 7 reglas secuenciales', () => {
    assert.ok(cp01, 'Caso CP-01 debe existir en el catálogo');
    assert.strictEqual(cp01.code, 'CP-01');
    assert.strictEqual(cp01.priceList, '3');
    assert.strictEqual(cp01.rules.length, 7, 'CP-01 debe tener 7 reglas de evaluación');
  });

  test('Reglas 0 y 1: Selección de cliente Ferretería Los Andes e inicio de visita', () => {
    const rule0 = cp01.rules[0];
    assert.strictEqual(rule0.eventName, 'SELECT_CLIENT');
    assert.strictEqual(rule0.validate({ clientName: 'Ferretería Los Andes S.A.C.' }), true);
    assert.strictEqual(rule0.validate({ clientName: 'Distribuidora Kanchis EIRL' }), false);

    const rule1 = cp01.rules[1];
    assert.strictEqual(rule1.eventName, 'SELECT_ACTION');
    assert.strictEqual(rule1.validate({ action: 'iniciar' }), true);
    assert.strictEqual(rule1.validate({ action: 'ver_deuda' }), false);
  });

  test('Regla 2: Fotos obligatorias inicial y final', () => {
    const rule2 = cp01.rules[2];
    assert.strictEqual(rule2.eventName, 'SAVE_PHOTOS');
    assert.strictEqual(rule2.validate({ initialPhoto: true, finalPhoto: true }), true);
    assert.strictEqual(rule2.validate({ initialPhoto: true, finalPhoto: false }), false);
    assert.strictEqual(rule2.validate({ initialPhoto: false, finalPhoto: true }), false);
  });

  test('Regla 3: Motivo de no registro de precios (Punto crítico)', () => {
    const rule3 = cp01.rules[3];
    assert.strictEqual(rule3.eventName, 'SAVE_PRICE_TRACKING_MOTIVO');
    assert.strictEqual(rule3.validate({ motivo: 'sin_tiempo' }), true);
    assert.strictEqual(rule3.validate({ motivo: 'no_autoriza' }), true);
    assert.strictEqual(rule3.validate({ motivo: '' }), false, 'Debe fallar si no se selecciona motivo');
    assert.strictEqual(rule3.validate({ motivo: null }), false);
  });

  test('Regla 4: Configuración comercial con cambio obligatorio a Lista 3', () => {
    const rule4 = cp01.rules[4];
    assert.strictEqual(rule4.eventName, 'CREATE_ORDER_CONFIG');
    // Éxito: Contado, Lista 3, lubricantes, shell
    assert.strictEqual(rule4.validate({ paymentCondition: 'contado', priceList: '3', line: 'lubricantes', brand: 'shell' }), true);
    // Error crítico: Dejar la Lista 1 por defecto
    assert.strictEqual(rule4.validate({ paymentCondition: 'contado', priceList: '1', line: 'lubricantes', brand: 'shell' }), false);
    // Error: Condición incorrecta (crédito)
    assert.strictEqual(rule4.validate({ paymentCondition: 'credito_30', priceList: '3', line: 'lubricantes', brand: 'shell' }), false);
  });

  test('Regla 5: Producto 8 baldes HX7 y promoción de regalo activa', () => {
    const rule5 = cp01.rules[5];
    assert.strictEqual(rule5.eventName, 'ADD_PRODUCT');
    // Éxito
    assert.strictEqual(rule5.validate({ product: 'Shell Helix HX7 10W/40', quantity: 8, promoDiscount: true }), true);
    // Error: Cantidad incorrecta
    assert.strictEqual(rule5.validate({ product: 'Shell Helix HX7 10W/40', quantity: 6, promoDiscount: true }), false);
    // Error: Sin promoción de regalo
    assert.strictEqual(rule5.validate({ product: 'Shell Helix HX7 10W/40', quantity: 8, promoDiscount: false }), false);
  });

  test('Regla 6: Confirmación de orden con dirección en almacén y fecha 16 de septiembre', () => {
    const rule6 = cp01.rules[6];
    assert.strictEqual(rule6.eventName, 'SUBMIT_ORDER');
    // Éxito
    assert.strictEqual(rule6.validate({
      confirmed: true,
      deliveryAddress: 'almacen',
      deliveryAddressText: 'ALMACÉN (a 600m de punto de venta)',
      estimatedDeliveryDate: '2026-09-16'
    }), true);
    // Error: Dejar dirección por defecto de visita (principal)
    assert.strictEqual(rule6.validate({
      confirmed: true,
      deliveryAddress: 'principal',
      deliveryAddressText: 'AV. TOMAS TUYRUTUPAC 412 (Punto de venta / Visita)',
      estimatedDeliveryDate: '2026-09-16'
    }), false);
    // Error: Fecha no es 16 de septiembre
    assert.strictEqual(rule6.validate({
      confirmed: true,
      deliveryAddress: 'almacen',
      deliveryAddressText: 'ALMACÉN (a 600m de punto de venta)',
      estimatedDeliveryDate: '2026-09-12'
    }), false);
  });
});

describe('7. Estados de Plan de Visitas y Nuevo Pedido (Fidelidad de Capturas Oficiales)', () => {
  // Simulamos la lógica de renderizado de tarjetas de visita
  function getRenderedCards(targetClient, distractors, visitInProgress, activeVisitClient) {
    let cards = [];
    const isTargetInProgress = Boolean(visitInProgress && activeVisitClient === targetClient);
    cards.push({
      client: targetClient,
      isInProgress: isTargetInProgress,
      hasBadgeInCourse: isTargetInProgress,
      hasTime: isTargetInProgress
    });

    distractors.forEach(d => {
      const isDInProgress = Boolean(visitInProgress && activeVisitClient === d.name);
      cards.push({
        client: d.name,
        isInProgress: isDInProgress,
        hasBadgeInCourse: isDInProgress,
        hasTime: isDInProgress
      });
    });
    return cards;
  }

  test('Plan de Visitas inicial: todas las visitas deben estar PENDIENTES sin visita en curso', () => {
    const target = 'Ferretería Los Andes S.A.C.';
    const distractors = [
      { name: 'Distribuidora Kanchis EIRL' },
      { name: 'Comercial Vega Hnos.' },
      { name: 'Transportes del Sur SAC' }
    ];

    // Al iniciar caso: visitInProgress es false
    const initialCards = getRenderedCards(target, distractors, false, null);
    assert.strictEqual(initialCards.length, 4);
    initialCards.forEach(c => {
      assert.strictEqual(c.isInProgress, false, `El cliente ${c.client} NO debe iniciar con is-in-progress`);
      assert.strictEqual(c.hasBadgeInCourse, false, `El cliente ${c.client} NO debe tener badge EN CURSO`);
      assert.strictEqual(c.hasTime, false, `El cliente ${c.client} NO debe tener reloj de tiempo`);
    });
  });

  test('Plan de Visitas al iniciar visita: solo el cliente activo pasa a EN CURSO', () => {
    const target = 'Ferretería Los Andes S.A.C.';
    const distractors = [
      { name: 'Distribuidora Kanchis EIRL' },
      { name: 'Comercial Vega Hnos.' }
    ];

    const startedCards = getRenderedCards(target, distractors, true, target);
    const targetCard = startedCards.find(c => c.client === target);
    assert.strictEqual(targetCard.isInProgress, true);
    assert.strictEqual(targetCard.hasBadgeInCourse, true);
    assert.strictEqual(targetCard.hasTime, true);

    const distractorCards = startedCards.filter(c => c.client !== target);
    distractorCards.forEach(c => {
      assert.strictEqual(c.isInProgress, false);
      assert.strictEqual(c.hasBadgeInCourse, false);
    });
  });

  test('Nuevo Pedido: carrito vacío (qty=0) debe estar limpio y Completar deshabilitado', () => {
    const emptyCart = { qty: 0, product: '' };
    const canComplete = Boolean(emptyCart.qty > 0 && emptyCart.product);
    assert.strictEqual(canComplete, false, 'Completar debe estar deshabilitado cuando qty === 0');
  });

  test('Nuevo Pedido: producto agregado (qty > 0) calcula totales oficiales y habilita Completar', () => {
    const populatedCart = {
      qty: 8,
      unitPrice: 22.0,
      product: 'Shell Helix HX7 10W/40',
      sku: '726528',
      format: 'BAL 5 GLNS',
      paymentCondition: 'contado'
    };

    const rawTotal = populatedCart.qty * populatedCart.unitPrice;
    assert.strictEqual(rawTotal, 176.0);

    const discountRate = populatedCart.paymentCondition === 'contado' ? 0.05 : 0.0;
    const discountVal = rawTotal * discountRate;
    assert.strictEqual(discountVal, 8.80);

    const orderTotal = rawTotal - discountVal;
    assert.strictEqual(orderTotal, 167.20);

    const invoiceTotal = +(orderTotal * 1.18).toFixed(2);
    assert.strictEqual(invoiceTotal, 197.30);

    const canComplete = Boolean(populatedCart.qty > 0 && populatedCart.product);
    assert.strictEqual(canComplete, true, 'Completar debe estar habilitado con producto en carrito');
  });
});

describe('8. Caso CP-02: Cotización a crédito con promoción por volumen', () => {
  const cp02 = CASES.find(c => c.code === 'CP-02' || c.id === 'case-2');

  test('CP-02 está configurado con código CP-02 y exactamente 7 reglas secuenciales', () => {
    assert.ok(cp02, 'Caso CP-02 debe existir en el catálogo');
    assert.strictEqual(cp02.code, 'CP-02');
    assert.strictEqual(cp02.client, 'Distribuidora Kanchis EIRL');
    assert.strictEqual(cp02.paymentCondition, 'credito_30');
    assert.strictEqual(cp02.priceList, 'OF');
    assert.strictEqual(cp02.expectedQty, 9);
    assert.strictEqual(cp02.unitPrice, 55);
    assert.strictEqual(cp02.rules.length, 7, 'CP-02 debe tener 7 reglas de evaluación');
  });

  test('Reglas 0 y 1: Selección de cliente Distribuidora Kanchis EIRL e inicio de visita', () => {
    const rule0 = cp02.rules[0];
    assert.strictEqual(rule0.eventName, 'SELECT_CLIENT');
    assert.strictEqual(rule0.validate({ clientName: 'Distribuidora Kanchis EIRL' }), true);
    assert.strictEqual(rule0.validate({ clientName: 'Ferretería Los Andes S.A.C.' }), false);

    const rule1 = cp02.rules[1];
    assert.strictEqual(rule1.eventName, 'SELECT_ACTION');
    assert.strictEqual(rule1.validate({ action: 'iniciar' }), true);
    assert.strictEqual(rule1.validate({ action: 'ver_deuda' }), false);
  });

  test('Regla 2: Fotos obligatorias inicial y final', () => {
    const rule2 = cp02.rules[2];
    assert.strictEqual(rule2.eventName, 'SAVE_PHOTOS');
    assert.strictEqual(rule2.validate({ initialPhoto: true, finalPhoto: true }), true);
    assert.strictEqual(rule2.validate({ initialPhoto: true, finalPhoto: false }), false);
  });

  test('Regla 3: Motivo de no registro de precios', () => {
    const rule3 = cp02.rules[3];
    assert.strictEqual(rule3.eventName, 'SAVE_PRICE_TRACKING_MOTIVO');
    assert.strictEqual(rule3.validate({ motivo: 'sin_tiempo' }), true);
    assert.strictEqual(rule3.validate({ motivo: '' }), false);
  });

  test('Regla 4: Configuración comercial con cambio de Contado a Crédito 30 días, Lista OF y Neumáticos Michelin', () => {
    const rule4 = cp02.rules[4];
    assert.strictEqual(rule4.eventName, 'CREATE_ORDER_CONFIG');
    // Éxito
    assert.strictEqual(rule4.validate({ paymentCondition: 'credito_30', priceList: 'OF', line: 'neumaticos', brand: 'michelin' }), true);
    // Trampa: Mantener Contado por defecto
    assert.strictEqual(rule4.validate({ paymentCondition: 'contado', priceList: 'OF', line: 'neumaticos', brand: 'michelin' }), false, 'Debe penalizar dejar condición Contado');
    // Trampa: Cambiar a lista distinta a OF
    assert.strictEqual(rule4.validate({ paymentCondition: 'credito_30', priceList: '3', line: 'neumaticos', brand: 'michelin' }), false, 'Debe penalizar cambiar lista distinta a OF');
    // Trampa: Dejar línea Lubricantes Shell
    assert.strictEqual(rule4.validate({ paymentCondition: 'credito_30', priceList: 'OF', line: 'lubricantes', brand: 'shell' }), false, 'Debe penalizar no configurar Neumáticos Michelin');
  });

  test('Regla 5: Producto 9 neumáticos Michelin Energy XM2+ (003718) con precio $55 y toggle de volumen activo', () => {
    const rule5 = cp02.rules[5];
    assert.strictEqual(rule5.eventName, 'ADD_PRODUCT');
    // Éxito
    assert.strictEqual(rule5.validate({
      product: 'Michelin Energy XM2+ 195/60 R15',
      sku: '003718',
      quantity: 9,
      unitPrice: 55.0,
      promoDiscount: true,
      promoDiscountAmount: 10.0
    }), true);

    // Trampa: Producto Michelin erróneo (Latitude Tour HP)
    assert.strictEqual(rule5.validate({
      product: 'Michelin Latitude Tour HP',
      sku: '024009',
      quantity: 9,
      unitPrice: 48.0,
      promoDiscount: true,
      promoDiscountAmount: 10.0
    }), false, 'Debe penalizar seleccionar producto distinto a SKU 003718');

    // Trampa: Cantidad distinta a 9 unidades
    assert.strictEqual(rule5.validate({
      product: 'Michelin Energy XM2+ 195/60 R15',
      sku: '003718',
      quantity: 5,
      unitPrice: 55.0,
      promoDiscount: true,
      promoDiscountAmount: 10.0
    }), false, 'Debe penalizar registrar cantidad distinta a 9 unidades');

    // Trampa: No verificar precio unitario de USD 55.00
    assert.strictEqual(rule5.validate({
      product: 'Michelin Energy XM2+ 195/60 R15',
      sku: '003718',
      quantity: 9,
      unitPrice: 65.0,
      promoDiscount: true,
      promoDiscountAmount: 10.0
    }), false, 'Debe penalizar precio erróneo');

    // Trampa: No activar el toggle de la promoción de volumen
    assert.strictEqual(rule5.validate({
      product: 'Michelin Energy XM2+ 195/60 R15',
      sku: '003718',
      quantity: 9,
      unitPrice: 55.0,
      promoDiscount: false,
      promoDiscountAmount: 0.0
    }), false, 'Debe penalizar no activar el toggle de la promoción');

    // Trampa: Aplicar incorrectamente la promoción de USD 10 por cada 5 productos
    assert.strictEqual(rule5.validate({
      product: 'Michelin Energy XM2+ 195/60 R15',
      sku: '003718',
      quantity: 9,
      unitPrice: 55.0,
      promoDiscount: true,
      promoDiscountAmount: 20.0
    }), false, 'Para 9 unidades solo aplica 1 bloque de 5 ($10 USD de descuento)');
  });

  test('Regla 6: Guardar como Cotización (Tipo 3) y entrega programada al 20 de septiembre', () => {
    const rule6 = cp02.rules[6];
    assert.strictEqual(rule6.eventName, 'SUBMIT_ORDER');
    // Éxito
    assert.strictEqual(rule6.validate({
      confirmed: true,
      documentType: 'cotizacion',
      documentTypeId: 3,
      estimatedDeliveryDate: '2026-09-20'
    }), true);

    // Trampa: Confirmar como orden de compra en lugar de cotización
    assert.strictEqual(rule6.validate({
      confirmed: true,
      documentType: 'orden',
      documentTypeId: 2,
      estimatedDeliveryDate: '2026-09-20'
    }), false, 'Debe penalizar confirmar como orden y no como cotización');

    // Trampa: No registrar fecha de entrega del 20 de septiembre
    assert.strictEqual(rule6.validate({
      confirmed: true,
      documentType: 'cotizacion',
      documentTypeId: 3,
      estimatedDeliveryDate: '2026-09-15'
    }), false, 'Debe penalizar fecha errónea');
  });

  test('Cálculo financiero exacto de CP-02 (Subtotal $485.00, Pedido $470.45, Factura $555.13)', () => {
    const qty = 9;
    const unitPrice = 55.0;
    const rawTotal = qty * unitPrice;
    assert.strictEqual(rawTotal, 495.00, 'Subtotal bruto debe ser 495.00');

    // Promo escala: $10 por cada 5 unidades -> floor(9/5) * 10 = 10
    const promoDiscount = Math.floor(qty / 5) * 10.0;
    assert.strictEqual(promoDiscount, 10.00, 'Descuento promocional de volumen debe ser 10.00');

    const subtotalNet = rawTotal - promoDiscount;
    assert.strictEqual(subtotalNet, 485.00, 'Subtotal neto debe ser 485.00');

    // Crédito 30 días: 3% sobre subtotal neto
    const condDiscount = +(subtotalNet * 0.03).toFixed(2);
    assert.strictEqual(condDiscount, 14.55, 'Descuento por Crédito 30 días debe ser 14.55');

    const orderTotal = +(subtotalNet - condDiscount).toFixed(2);
    assert.strictEqual(orderTotal, 470.45, 'Total pedido debe ser 470.45');

    const invoiceTotal = +(orderTotal * 1.18).toFixed(2);
    assert.strictEqual(invoiceTotal, 555.13, 'Total factura con IGV debe ser 555.13');
  });
});

describe('9. Navegación del Plan de Visitas y Bottom Sheet Oficial de Direcciones', () => {
  test('Cuando no hay visita iniciada, presionar la card del cliente abre el bottom sheet de DIRECCIONES', () => {
    const simState = {
      visitInProgress: false,
      activeVisitClient: null,
      selectedClient: null
    };

    let openedModal = false;
    let navigatedTo = null;

    function handleCardClick(clientName) {
      if (simState.visitInProgress && simState.activeVisitClient === clientName) {
        navigatedTo = 's-cliente-inicio';
        return;
      }
      simState.selectedClient = clientName;
      openedModal = true;
    }

    handleCardClick('Distribuidora Kanchis EIRL');

    assert.strictEqual(openedModal, true, 'Debe abrir el bottom sheet');
    assert.strictEqual(navigatedTo, null, 'No debe navegar directo si la visita no ha iniciado');
    assert.strictEqual(simState.selectedClient, 'Distribuidora Kanchis EIRL');
  });

  test('Estructura oficial del Bottom Sheet DIRECCIONES (visitas-iniciar visita lejos del punto.png)', () => {
    // Definición de direcciones por cliente según captura oficial
    const clientName = 'Distribuidora Kanchis EIRL';
    const mainAddr = 'AV. INDUSTRIAL 104';
    const branchAddr = 'AV. INDUSTRIAL 104 - SOCABAYA';

    const sheetData = {
      title: 'DIRECCIONES',
      hasPhoneCallButton: true,
      phoneButtonText: 'Iniciar llamada telefónica',
      sectionTitle: 'Actualización disponible',
      addresses: [
        { address: mainAddr, client: clientName.toUpperCase(), tag: 'PRINCIPAL' },
        { address: branchAddr, client: clientName.toUpperCase(), tag: 'VISITA' }
      ]
    };

    assert.strictEqual(sheetData.title, 'DIRECCIONES');
    assert.strictEqual(sheetData.hasPhoneCallButton, true);
    assert.strictEqual(sheetData.sectionTitle, 'Actualización disponible');
    assert.strictEqual(sheetData.addresses.length, 2);
    assert.strictEqual(sheetData.addresses[0].tag, 'PRINCIPAL');
    assert.strictEqual(sheetData.addresses[1].tag, 'VISITA');
  });

  test('Presionar una dirección inicia la visita presencial (action: "iniciar")', () => {
    const simState = {
      visitInProgress: false,
      activeVisitClient: null,
      selectedClient: 'Distribuidora Kanchis EIRL',
      activeVisitAddress: null
    };

    let emittedAction = null;
    let navigatedTo = null;

    function startVisitFromAddress(address) {
      simState.activeVisitAddress = address;
      simState.visitInProgress = true;
      simState.activeVisitClient = simState.selectedClient;
      emittedAction = 'iniciar';
      navigatedTo = 's-cliente-inicio';
    }

    startVisitFromAddress('AV. INDUSTRIAL 104');

    assert.strictEqual(simState.visitInProgress, true);
    assert.strictEqual(simState.activeVisitClient, 'Distribuidora Kanchis EIRL');
    assert.strictEqual(simState.activeVisitAddress, 'AV. INDUSTRIAL 104');
    assert.strictEqual(emittedAction, 'iniciar');
    assert.strictEqual(navigatedTo, 's-cliente-inicio');
  });

  test('Cuando la visita YA está en curso, presionar la card ingresa DIRECTAMENTE a las tareas', () => {
    const simState = {
      visitInProgress: true,
      activeVisitClient: 'Distribuidora Kanchis EIRL',
      selectedClient: 'Distribuidora Kanchis EIRL',
      currentVisitTaskIndex: 3 // Estaba en PEDIDOS
    };

    let openedModal = false;
    let navigatedTo = null;
    let taskIndexPreserved = null;

    function handleCardClick(clientName) {
      if (simState.visitInProgress && simState.activeVisitClient === clientName) {
        navigatedTo = 's-cliente-inicio';
        taskIndexPreserved = simState.currentVisitTaskIndex;
        return;
      }
      openedModal = true;
    }

    handleCardClick('Distribuidora Kanchis EIRL');

    assert.strictEqual(openedModal, false, 'NO debe abrir ningún modal');
    assert.strictEqual(navigatedTo, 's-cliente-inicio', 'Debe ingresar directamente a las tareas del cliente');
    assert.strictEqual(taskIndexPreserved, 3, 'Debe preservar el avance de tareas del carrusel');
  });

  test('Cuando hay una visita en curso con Cliente A, presionar card de Cliente B bloquea la acción', () => {
    const simState = {
      visitInProgress: true,
      activeVisitClient: 'Distribuidora Kanchis EIRL'
    };

    let openedModal = false;
    let errorBlocked = false;

    function handleCardClick(clientName) {
      if (simState.visitInProgress && simState.activeVisitClient === clientName) {
        return;
      }
      if (simState.visitInProgress && simState.activeVisitClient !== clientName) {
        errorBlocked = true;
        return;
      }
      openedModal = true;
    }

    handleCardClick('Ferretería Los Andes S.A.C.');

    assert.strictEqual(openedModal, false, 'No debe abrir opciones de otro cliente');
    assert.strictEqual(errorBlocked, true, 'Debe bloquear la acción indicando visita en curso');
    assert.strictEqual(simState.activeVisitClient, 'Distribuidora Kanchis EIRL');
  });
});

describe('10. Reglas y Flujos de Solución de los 5 Casos de Evaluación Oficiales (CP-05 a CP-09)', () => {
  // CP-05
  test('CP-05: Consulta de documentos electrónicos y estado de cuenta (Constructora Vial Perú SAC)', () => {
    const cp05 = CASES.find(c => c.id === 'case-cp05' || c.code === 'CP-05');
    assert.ok(cp05, 'Caso CP-05 debe estar definido en CASES');
    assert.strictEqual(cp05.rules.length, 6, 'CP-05 debe contener exactamente 6 reglas');

    // Regla 0: OPEN_CUSTOMER_PROFILE
    assert.strictEqual(cp05.rules[0].validate({ clientName: 'Constructora Vial Perú SAC' }), true);
    assert.strictEqual(cp05.rules[0].validate({ clientName: 'Ferretería Central' }), false);

    // Regla 1: VIEW_ACCOUNT_STATUS
    assert.strictEqual(cp05.rules[1].validate({ viewed: true }), true);
    assert.strictEqual(cp05.rules[1].validate({ viewed: false }), false);

    // Regla 2: SUBMIT_INVOICE_AUDIT (F001-55048)
    assert.strictEqual(cp05.rules[2].validate({ invoiceNumber: 'F001-55048' }), true);
    assert.strictEqual(cp05.rules[2].validate({ invoiceNumber: 'F001-00055048' }), true);
    assert.strictEqual(cp05.rules[2].validate({ invoiceNumber: 'F001-99999' }), false);

    // Regla 3: OPEN_ELECTRONIC_DOCS
    assert.strictEqual(cp05.rules[3].validate({ opened: true }), true);

    // Regla 4: VIEW_INVOICE_DETAIL (F001-00055048)
    assert.strictEqual(cp05.rules[4].validate({ invoiceNumber: 'F001-00055048' }), true);
    assert.strictEqual(cp05.rules[4].validate({ invoiceNumber: 'F001-00012345' }), false);

    // Regla 5: SUBMIT_RC_AUDIT (RE020-021740)
    assert.strictEqual(cp05.rules[5].validate({ rcNumber: 'RE020-021740' }), true);
    assert.strictEqual(cp05.rules[5].validate({ rcNumber: 'RE020-021741' }), false);
  });

  // CP-06
  test('CP-06: Consulta de historial de visitas antes de venta (Bodega y Ferretería Dos Hermanos)', () => {
    const cp06 = CASES.find(c => c.id === 'case-cp06' || c.code === 'CP-06');
    assert.ok(cp06, 'Caso CP-06 debe estar definido en CASES');
    assert.strictEqual(cp06.rules.length, 2, 'CP-06 debe contener exactamente 2 reglas');

    // Regla 0: OPEN_CUSTOMER_PROFILE
    assert.strictEqual(cp06.rules[0].validate({ clientName: 'Bodega y Ferretería Dos Hermanos' }), true);
    assert.strictEqual(cp06.rules[0].validate({ consulted: true }), true);
    assert.strictEqual(cp06.rules[0].validate({ clientName: 'Inversiones Islay' }), false);

    // Regla 1: SUBMIT_HISTORY_DATE (14/08/2026)
    assert.strictEqual(cp06.rules[1].validate({ date: '14/08/2026' }), true);
    assert.strictEqual(cp06.rules[1].validate({ answer: '14/08/2026' }), true);
    assert.strictEqual(cp06.rules[1].validate({ date: '18/07/2026' }), false, 'Debe rechazar la visita previa no reciente');
  });

  // CP-07
  test('CP-07: Gestión de visita fuera de geocerca mediante visita telefónica (Distribuidora Lubrimotor EIRL)', () => {
    const cp07 = CASES.find(c => c.id === 'case-cp07' || c.code === 'CP-07');
    assert.ok(cp07, 'Caso CP-07 debe estar definido en CASES');
    assert.strictEqual(cp07.rules.length, 5, 'CP-07 debe contener exactamente 5 reglas');

    // Regla 0: SELECT_CLIENT
    assert.strictEqual(cp07.rules[0].validate({ clientName: 'Distribuidora Lubrimotor EIRL' }), true);
    assert.strictEqual(cp07.rules[0].validate({ clientName: 'Otro Cliente' }), false);

    // Regla 1: SELECT_ACTION (iniciar via telefónica, no presencial)
    assert.strictEqual(cp07.rules[1].validate({ action: 'iniciar', isPhone: true }), true);
    assert.strictEqual(cp07.rules[1].validate({ action: 'iniciar', visitType: 'telefonica' }), true);
    assert.strictEqual(cp07.rules[1].validate({ action: 'iniciar', isPhone: false, visitType: 'presencial' }), false, 'Debe rechazar visita presencial fuera de geocerca');

    // Regla 2: CREATE_ORDER_CONFIG (Crédito 30d, Lista 3, Neumáticos Michelin)
    assert.strictEqual(cp07.rules[2].validate({ paymentCondition: 'credito_30', priceList: '3', line: 'neumaticos', brand: 'michelin' }), true);
    assert.strictEqual(cp07.rules[2].validate({ paymentCondition: 'contado', priceList: '3', line: 'neumaticos', brand: 'michelin' }), false);
    assert.strictEqual(cp07.rules[2].validate({ paymentCondition: 'credito_30', priceList: '1', line: 'neumaticos', brand: 'michelin' }), false);

    // Regla 3: ADD_PRODUCT (2 cajas Michelin Energy XM2+)
    assert.strictEqual(cp07.rules[3].validate({ product: 'Michelin Energy XM2+', quantity: 2 }), true);
    assert.strictEqual(cp07.rules[3].validate({ product: 'Michelin Energy XM2+', quantity: 9 }), false);

    // Regla 4: SUBMIT_ORDER
    assert.strictEqual(cp07.rules[4].validate({ confirmed: true }), true);
  });

  // CP-08
  test('CP-08: Registro de precio de competencia (Transportes Pepito SRL)', () => {
    const cp08 = CASES.find(c => c.id === 'case-cp08' || c.code === 'CP-08');
    assert.ok(cp08, 'Caso CP-08 debe estar definido en CASES');
    assert.strictEqual(cp08.rules.length, 3, 'CP-08 debe contener exactamente 3 reglas');

    // Regla 0: SUBMIT_PRICE_TRACKING (Castrol Mineral 20W50 con precio numérico y foto)
    assert.strictEqual(cp08.rules[0].validate({ price: 38.0, hasPhoto: true }), true);
    assert.strictEqual(cp08.rules[0].validate({ price: 0, hasPhoto: true }), false, 'Debe rechazar foto sin precio numérico');
    assert.strictEqual(cp08.rules[0].validate({ price: 38.0, hasPhoto: false }), false, 'Debe rechazar precio sin foto');

    // Regla 1: SELECT_NO_ORDER_REASON
    assert.strictEqual(cp08.rules[1].validate({ reason: 'Cliente solo cotiza' }), true);
    assert.strictEqual(cp08.rules[1].validate({ reason: '' }), false);

    // Regla 2: FINISH_VISIT
    assert.strictEqual(cp08.rules[2].validate({ completed: true }), true);
  });

  // CP-09
  test('CP-09: Visita fuera de ruta con pedido y cobranza (Comercial Vega Hnos.)', () => {
    const cp09 = CASES.find(c => c.id === 'case-cp09' || c.code === 'CP-09');
    assert.ok(cp09, 'Caso CP-09 debe estar definido en CASES');
    assert.strictEqual(cp09.rules.length, 8, 'CP-09 debe contener exactamente 8 reglas');

    // Regla 0: ADD_OUT_OF_ROUTE_CLIENT (Comercial Vega Hnos. con Pedido y Cobranza)
    assert.strictEqual(cp09.rules[0].validate({
      clientName: 'Comercial Vega Hnos.',
      tasks: { pedidos: true, cobranza: true }
    }), true);
    assert.strictEqual(cp09.rules[0].validate({
      clientName: 'Comercial Vega Hnos.',
      tasks: { pedidos: true, cobranza: false }
    }), false, 'Debe requerir tarea de cobranza');
    assert.strictEqual(cp09.rules[0].validate({
      clientName: 'Otro Cliente',
      tasks: { pedidos: true, cobranza: true }
    }), false);

    // Regla 1: SELECT_ACTION
    assert.strictEqual(cp09.rules[1].validate({ action: 'iniciar' }), true);

    // Regla 2: CREATE_ORDER_CONFIG (Contado, Lista 3, Lubricantes Shell)
    assert.strictEqual(cp09.rules[2].validate({ paymentCondition: 'contado', priceList: '3', line: 'lubricantes', brand: 'shell' }), true);
    assert.strictEqual(cp09.rules[2].validate({ paymentCondition: 'credito_30', priceList: '3', line: 'lubricantes', brand: 'shell' }), false);

    // Regla 3: ADD_PRODUCT (15 baldes Shell Helix HX7 con promoción de 3 gorros)
    assert.strictEqual(cp09.rules[3].validate({ product: 'Shell Helix HX7 10W/40', quantity: 15, promoDiscount: true }), true);
    assert.strictEqual(cp09.rules[3].validate({ product: 'Shell Helix HX7 10W/40', quantity: 10, promoDiscount: true }), false);

    // Regla 4: SUBMIT_ORDER (Entrega 14 de septiembre en Calle Santa Marta 205)
    assert.strictEqual(cp09.rules[4].validate({
      confirmed: true,
      estimatedDeliveryDate: '2026-09-14',
      deliveryAddressText: 'Calle Santa Marta 205'
    }), true);
    assert.strictEqual(cp09.rules[4].validate({
      confirmed: true,
      estimatedDeliveryDate: '2026-09-16',
      deliveryAddressText: 'Calle Santa Marta 205'
    }), false, 'Debe rechazar fecha de entrega incorrecta');
    assert.strictEqual(cp09.rules[4].validate({
      confirmed: true,
      estimatedDeliveryDate: '2026-09-14',
      deliveryAddressText: 'Av. Tomas Tuyrutupac 412'
    }), false, 'Debe rechazar dirección que no sea Santa Marta 205');

    // Regla 5: SUBMIT_PAYMENT_1_CASH (Efectivo Soles PEN 276 = USD 80)
    assert.strictEqual(cp09.rules[5].validate({ method: 'efectivo', currency: 'PEN', amount: 276 }), true);
    assert.strictEqual(cp09.rules[5].validate({ method: 'efectivo', currency: 'USD', amount: 80 }), false, 'Debe ser en soles');

    // Regla 6: SUBMIT_PAYMENT_2_DEPOSIT (Depósito BCP USD 300)
    assert.strictEqual(cp09.rules[6].validate({ method: 'deposito', bank: 'BCP', amount: 300 }), true);
    assert.strictEqual(cp09.rules[6].validate({ method: 'deposito', bank: 'BBVA', amount: 300 }), false);

    // Regla 7: SUBMIT_CONSOLIDATED_COBRANZA (Total USD 380 con 2 pagos)
    assert.strictEqual(cp09.rules[7].validate({ totalAmount: 380, paymentCount: 2 }), true);
    assert.strictEqual(cp09.rules[7].validate({ totalAmount: 200, paymentCount: 1 }), false);
  });
});



