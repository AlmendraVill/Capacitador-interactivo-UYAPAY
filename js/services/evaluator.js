/**
 * Motor de Evaluación y Puntuación Desacoplado (EvaluatorService)
 * Implementa los requisitos RF-MVP-026 a RF-MVP-035.
 * 
 * Responsabilidades:
 * 1. Control del cronómetro de resolución en tiempo real (RF-MVP-019/024/034).
 * 2. Validación de eventos recibidos del simulador contra las reglas del caso (RF-MVP-028/029).
 * 3. Detección de errores y omisiones de proceso (RF-MVP-022).
 * 4. Cálculo configurable de la calificación en escala vigesimal (RF-MVP-032/033).
 */
window.UyapayServices = window.UyapayServices || {};

(function() {
  let activeEvaluation = null;
  let timerInterval = null;

  function padZero(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${padZero(mins)}:${padZero(secs)}`;
  }

  window.UyapayServices.Evaluator = {
    /**
     * Inicia una nueva sesión de evaluación
     * @param {object} user - Usuario evaluado
     * @param {object} caseData - Caso práctico a evaluar
     * @param {function} onTick - Callback para actualizar la UI del cronómetro cada segundo
     */
    startEvaluation(user, caseData, onTick) {
      this.stopTimer();

      activeEvaluation = {
        user: user || { username: 'alvaro', name: 'Alvaro Rodriguez' },
        caseData: caseData,
        startTime: Date.now(),
        elapsedSeconds: 0,
        currentRuleIndex: 0,
        errors: 0,
        actionsLog: [],
        status: 'IN_PROGRESS'
      };

      // Iniciar cronómetro en vivo
      timerInterval = setInterval(() => {
        if (!activeEvaluation) return;
        activeEvaluation.elapsedSeconds = Math.floor((Date.now() - activeEvaluation.startTime) / 1000);
        if (typeof onTick === 'function') {
          onTick(activeEvaluation.elapsedSeconds, formatTime(activeEvaluation.elapsedSeconds));
        }
      }, 1000);

      return activeEvaluation;
    },

    getActiveEvaluation() {
      return activeEvaluation;
    },

    stopTimer() {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    },

    /**
     * Procesa y audita un evento emitido por el simulador móvil
     * @param {string} eventName - Nombre del evento ('SELECT_CLIENT', 'SELECT_ACTION', etc.)
     * @param {object} payload - Información asociada a la acción del usuario
     */
    processAction(eventName, payload = {}) {
      if (!activeEvaluation || activeEvaluation.status !== 'IN_PROGRESS') {
        return { success: false, message: 'No hay evaluación activa en curso.', isCaseComplete: false };
      }

      const caseData = activeEvaluation.caseData;
      const expectedRule = (caseData.rules && caseData.rules[activeEvaluation.currentRuleIndex]) || null;
      const timeStamp = new Date().toLocaleTimeString('es-PE');

      // 1. Manejo de eventos informativos o de navegación interna
      if (eventName === 'MOBILE_LOGIN') {
        const logEntry = {
          time: timeStamp,
          type: 'INFO',
          step: 'Login Móvil',
          detail: `Asesor ingresó al móvil como: ${payload.username}`
        };
        activeEvaluation.actionsLog.push(logEntry);
        return {
          success: true,
          isInformative: true,
          logEntry: logEntry,
          progress: 'Revisando Plan de Visitas',
          errors: activeEvaluation.errors
        };
      }

      if (eventName === 'CLIENT_OPTIONS_OPENED') {
        const logEntry = {
          time: timeStamp,
          type: 'INFO',
          step: 'Apertura de Opciones',
          detail: `Abrió opciones del cliente: ${payload.clientName}`
        };
        activeEvaluation.actionsLog.push(logEntry);
        return {
          success: true,
          isInformative: true,
          logEntry: logEntry,
          progress: `Consultando a ${payload.clientName}`,
          errors: activeEvaluation.errors
        };
      }

      // 2. Validación de regla esperada
      if (expectedRule && expectedRule.eventName === eventName) {
        let isCorrect = false;
        if (typeof expectedRule.validate === 'function') {
          isCorrect = Boolean(expectedRule.validate(payload));
        } else if (expectedRule.expectedValue !== undefined) {
          isCorrect = payload[Object.keys(payload)[0]] === expectedRule.expectedValue;
        }

        if (isCorrect) {
          // Acción aprobada
          activeEvaluation.currentRuleIndex++;
          const isCaseComplete = activeEvaluation.currentRuleIndex >= caseData.rules.length;
          const logEntry = {
            time: timeStamp,
            type: 'SUCCESS',
            step: expectedRule.description || eventName,
            detail: `Correcto: ${expectedRule.description || eventName}`
          };
          activeEvaluation.actionsLog.push(logEntry);

          return {
            success: true,
            isCorrect: true,
            isCaseComplete: isCaseComplete,
            logEntry: logEntry,
            progress: isCaseComplete ? 'Visita iniciada con éxito' : `Paso ${activeEvaluation.currentRuleIndex} completado`,
            errors: activeEvaluation.errors
          };
        } else {
          // Acción errónea (cliente equivocado o acción no requerida)
          activeEvaluation.errors++;
          const logEntry = {
            time: timeStamp,
            type: 'ERROR',
            step: 'Acción Incorrecta',
            detail: expectedRule.errorMessage || 'Acción no coincide con el caso.'
          };
          activeEvaluation.actionsLog.push(logEntry);

          return {
            success: false,
            isCorrect: false,
            message: expectedRule.errorMessage || 'Acción incorrecta para este caso.',
            logEntry: logEntry,
            progress: `Error en paso ${activeEvaluation.currentRuleIndex + 1}`,
            errors: activeEvaluation.errors
          };
        }
      }

      // 3. Acción inesperada fuera de flujo
      activeEvaluation.errors++;
      const unexpectedError = 'Acción fuera del flujo esperado para este caso.';
      const logEntry = {
        time: timeStamp,
        type: 'ERROR',
        step: 'Fuera de Secuencia',
        detail: unexpectedError
      };
      activeEvaluation.actionsLog.push(logEntry);

      return {
        success: false,
        isCorrect: false,
        message: unexpectedError,
        logEntry: logEntry,
        progress: 'Secuencia interrumpida',
        errors: activeEvaluation.errors
      };
    },

    /**
     * Finaliza la evaluación, computa la calificación vigesimal y consolida el resultado
     */
    finishEvaluation() {
      if (!activeEvaluation) return null;

      this.stopTimer();
      activeEvaluation.status = 'COMPLETED';

      const durationSeconds = activeEvaluation.elapsedSeconds;
      const scoring = activeEvaluation.caseData.scoring || {
        maxScore: 20,
        penaltyPerError: 4,
        maxErrorsAllowed: 2
      };

      const numericScore = Math.max(0, scoring.maxScore - (activeEvaluation.errors * scoring.penaltyPerError));
      const passed = activeEvaluation.errors <= scoring.maxErrorsAllowed;

      const result = {
        id: 'eval-' + Date.now(),
        caseId: activeEvaluation.caseData.id,
        caseCode: activeEvaluation.caseData.code,
        caseTitle: activeEvaluation.caseData.title,
        username: activeEvaluation.user.username,
        advisorName: activeEvaluation.user.name,
        errors: activeEvaluation.errors,
        maxErrorsAllowed: scoring.maxErrorsAllowed,
        numericScore: numericScore,
        score: `${numericScore} / ${scoring.maxScore}`,
        status: passed ? 'Aprobado' : 'Desaprobado',
        durationSeconds: durationSeconds,
        formattedDuration: formatTime(durationSeconds),
        completedAt: new Date().toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'medium' }),
        interactions: activeEvaluation.actionsLog
      };

      activeEvaluation = null;
      return result;
    },

    cancelEvaluation() {
      this.stopTimer();
      activeEvaluation = null;
    },

    formatDuration(secs) {
      return formatTime(secs);
    }
  };
})();
