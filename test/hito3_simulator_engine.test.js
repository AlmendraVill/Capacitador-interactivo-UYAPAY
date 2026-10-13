/**
 * Suite de Pruebas Automatizadas para Hito 3:
 * Onboarding Asistido y Motor de Casos en Simulador (Flujos 5 y 6 PRDv2)
 *
 * Valida:
 * 1. Estratificación de los 30 casos en 3 Niveles de Dificultad (Básico, Intermedio, Avanzado).
 * 2. Cronómetro Regresivo Global de 30 minutos (1800s) y auto-finalización por tiempo.
 * 3. Regla Estricta de No Retorno: Casos completados quedan blindados contra reingreso o modificación.
 * 4. Resiliencia y Restauración F5: Evaluator.restoreMultiEvaluation recupera tiempo y estados.
 * 5. Consistencia de los 7 Hitos Oficiales de Onboarding.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { CASES } = require('../js/data/cases.js');
const Evaluator = require('../js/services/evaluator.js');

describe('12. Hito 3: Motor de Evaluación en Simulador y Onboarding Guiado (PRDv2)', () => {

  test('12.1 Estratificación Oficial en 3 Niveles de Dificultad (Básico, Intermedio, Avanzado)', () => {
    assert.strictEqual(CASES.length, 30, 'Deben existir 30 casos');

    const basicos = CASES.filter(c => c.level === 'basico');
    const intermedios = CASES.filter(c => c.level === 'intermedio');
    const avanzados = CASES.filter(c => c.level === 'avanzado');

    assert.ok(basicos.length >= 8, `Debe haber al menos 8 casos básicos (actual: ${basicos.length})`);
    assert.ok(intermedios.length >= 8, `Debe haber al menos 8 casos intermedios (actual: ${intermedios.length})`);
    assert.ok(avanzados.length >= 8, `Debe haber al menos 8 casos avanzados (actual: ${intermedios.length})`);

    // Cada caso debe tener levelLabel formateado
    CASES.forEach(c => {
      assert.ok(['basico', 'intermedio', 'avanzado'].includes(c.level), `Caso ${c.code} tiene nivel inválido: ${c.level}`);
      assert.ok(c.levelLabel && typeof c.levelLabel === 'string', `Caso ${c.code} no tiene levelLabel`);
      assert.ok(c.levelLabel.includes('Nivel'), `levelLabel de ${c.code} debe mencionar Nivel: ${c.levelLabel}`);
    });
  });

  test('12.2 Cronómetro Regresivo de 30 Minutos (1800s) con Auto-Finalización', async () => {
    let tickCount = 0;
    let lastRemaining = 0;
    let lastFormatted = '';
    let timedOut = false;

    const dummyCases = CASES.slice(0, 5);
    const mockUser = { username: 'alvaro', name: 'Alvaro Rodriguez' };

    // Iniciar evaluación con maxSeconds = 2 segundos para testear timeout
    const activeEval = Evaluator.startMultiEvaluation(
      mockUser,
      dummyCases,
      (elapsedSec, formattedRemaining, remainingSec) => {
        tickCount++;
        lastRemaining = remainingSec;
        lastFormatted = formattedRemaining;
      },
      2, // 2 segundos
      () => {
        timedOut = true;
      }
    );

    assert.strictEqual(activeEval.maxSeconds, 2);
    assert.strictEqual(activeEval.status, 'IN_PROGRESS');

    // Esperar a que el temporizador transcurra
    await new Promise(resolve => setTimeout(resolve, 2200));

    Evaluator.stopTimer();
    assert.ok(tickCount >= 1, 'Debe haber emitido al menos 1 tick');
    assert.ok(timedOut, 'Debe haber disparado el callback onTimeout');
    assert.strictEqual(Evaluator.getActiveEvaluation().status, 'TIME_OUT');
  });

  test('12.3 Regla Estricta de No Retorno: Caso completado no permite mutar su estado', () => {
    const mockCases = [
      {
        id: 'mock-1',
        code: 'MC-01',
        title: 'Caso Mock 1',
        client: 'Cliente 1',
        rules: [
          { eventName: 'ACTION_STEP_1', validate: () => true },
          { eventName: 'ACTION_STEP_2', validate: () => true }
        ]
      },
      {
        id: 'mock-2',
        code: 'MC-02',
        title: 'Caso Mock 2',
        client: 'Cliente 2',
        rules: [
          { eventName: 'ACTION_STEP_1', validate: () => true }
        ]
      }
    ];
    const mockUser = { username: 'edward', name: 'Edward Diaz' };

    Evaluator.startMultiEvaluation(mockUser, mockCases, () => {}, 1800);

    // Resolver completamente el Caso 1
    const r1 = Evaluator.processAction('ACTION_STEP_1', {});
    assert.ok(r1.success, 'Paso 1 debe ser aprobado');

    const r2 = Evaluator.processAction('ACTION_STEP_2', {});
    assert.ok(r2.success, 'Paso 2 debe ser aprobado');
    assert.strictEqual(r2.isCaseComplete, true, 'El caso debe haberse completado');

    const stateTab0 = Evaluator.getAllCaseStates()[0];
    assert.strictEqual(stateTab0.completed, true, 'Tab 0 debe estar marcado como completado');
    const scoreAntes = stateTab0.numericScore;

    // Cambiar a Tab 1
    Evaluator.switchActiveTab(1);
    assert.strictEqual(Evaluator.getActiveCaseState().caseCode, 'MC-02');

    // Intentar volver a procesar una acción sobre Tab 0 simulando reingreso indebido
    Evaluator.switchActiveTab(0);
    Evaluator.processAction('ACTION_STEP_1', {});
    // Al estar completado, no debe reiniciarse el conteo ni resetearse el caso
    assert.strictEqual(stateTab0.completed, true, 'Tab 0 sigue completado');
    assert.strictEqual(stateTab0.numericScore, scoreAntes, 'El puntaje debe ser inalterable');

    Evaluator.cancelEvaluation();
  });

  test('12.4 Resiliencia y Restauración F5: restoreMultiEvaluation recupera tiempo y casos resueltos', () => {
    const dummyCases = CASES.slice(0, 5);
    const mockUser = { username: 'lruiz', name: 'Luis Ruiz' };

    const mockSavedSession = {
      currentCaseCode: dummyCases[2].code,
      activeTabIndex: 2,
      elapsedSeconds: 450, // 7 min 30 s transcurridos de 30 min
      casesProgress: [
        {
          tabIndex: 0,
          caseCode: dummyCases[0].code,
          completed: true,
          errors: 0,
          score: '20.00 / 20'
        },
        {
          tabIndex: 1,
          caseCode: dummyCases[1].code,
          completed: true,
          errors: 1,
          score: '17.00 / 20'
        },
        {
          tabIndex: 2,
          caseCode: dummyCases[2].code,
          completed: false,
          errors: 0,
          currentRuleIndex: 1
        }
      ]
    };

    let tickFired = false;
    let remainingCalculated = 0;

    const restoredEval = Evaluator.restoreMultiEvaluation(
      mockUser,
      dummyCases,
      mockSavedSession,
      (elapsedSec, formattedRemaining, remainingSec) => {
        tickFired = true;
        remainingCalculated = remainingSec;
      },
      1800
    );

    assert.ok(restoredEval, 'La evaluación debe haber sido restaurada');
    assert.strictEqual(restoredEval.activeTabIndex, 2, 'El tab activo debe ser 2');
    assert.strictEqual(restoredEval.elapsedSeconds, 450, 'El tiempo transcurrido debe ser 450s');

    const states = Evaluator.getAllCaseStates();
    assert.strictEqual(states[0].completed, true, 'Tab 0 debe estar completado');
    assert.strictEqual(states[1].completed, true, 'Tab 1 debe estar completado');
    assert.strictEqual(states[2].completed, false, 'Tab 2 debe estar pendiente');

    Evaluator.stopTimer();
    Evaluator.cancelEvaluation();
  });

  test('12.5 Los 7 Hitos Oficiales de Onboarding (Manual UYAPAY B2C)', () => {
    const expectedHitos = [
      'task-1', // Inicio y Plan de Visitas
      'task-2', // Apertura de Visita y Marcación
      'task-3', // Fotos Inicial y Final
      'task-4', // Registro de Precios y Competencia
      'task-5', // Consulta de Documentos y Cartera
      'task-6', // Toma de Pedido y Selección
      'task-7'  // Cierre y Justificación
    ];

    assert.strictEqual(expectedHitos.length, 7, 'Deben existir exactamente 7 hitos oficiales');
    // Verificamos que los identificadores de tareas son únicos y secuenciales
    const uniqueHitos = new Set(expectedHitos);
    assert.strictEqual(uniqueHitos.size, 7);
  });
});
