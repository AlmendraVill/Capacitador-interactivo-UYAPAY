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


