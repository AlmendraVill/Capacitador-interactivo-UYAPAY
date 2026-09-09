/**
 * Motor de Evaluación y Puntuación Desacoplado (EvaluatorService)
 * Soporta Evaluación Multi-Caso en Pestañas (5 casos en tabs) y cronómetro continuo.
 * Implementa los requisitos RF-MVP-026 a RF-MVP-035 y nuevo Flujo 2.
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
     * Inicia una sesión de evaluación multi-caso (5 casos en pestañas)
     * @param {object} user - Usuario evaluado
     * @param {Array} casesArray - Batería de 5 casos seleccionados
     * @param {function} onTick - Callback del cronómetro continuo cada segundo
     */
    startMultiEvaluation(user, casesArray, onTick) {
      this.stopTimer();

      const cases = Array.isArray(casesArray) && casesArray.length > 0
        ? casesArray
        : (window.UyapayData && window.UyapayData.CASES ? window.UyapayData.CASES.slice(0, 5) : []);

      activeEvaluation = {
        user: user || { username: 'alvaro', name: 'Alvaro Rodriguez' },
        cases: cases,
        activeTabIndex: 0,
        startTime: Date.now(),
        elapsedSeconds: 0,
        caseStates: cases.map(c => ({
          caseId: c.id,
          caseCode: c.code,
          caseTitle: c.title,
          client: c.client,
          currentRuleIndex: 0,
          errors: 0,
          completed: false,
          actionsLog: [],
          numericScore: 20,
          score: '20 / 20'
        })),
        totalErrors: 0,
        status: 'IN_PROGRESS'
      };

      // Cronómetro global continuo para toda la evaluación (no se reinicia al cambiar de tab)
      timerInterval = setInterval(() => {
        if (!activeEvaluation) return;
        activeEvaluation.elapsedSeconds = Math.floor((Date.now() - activeEvaluation.startTime) / 1000);
        if (typeof onTick === 'function') {
          onTick(activeEvaluation.elapsedSeconds, formatTime(activeEvaluation.elapsedSeconds));
        }
      }, 1000);

      return activeEvaluation;
    },

    // Compatibilidad monocaso
    startEvaluation(user, singleCase, onTick) {
      return this.startMultiEvaluation(user, [singleCase], onTick);
    },

    getActiveEvaluation() {
      return activeEvaluation;
    },

    getActiveTab() {
      return activeEvaluation ? activeEvaluation.activeTabIndex : 0;
    },

    switchActiveTab(newIndex) {
      if (!activeEvaluation || newIndex < 0 || newIndex >= activeEvaluation.cases.length) return;
      activeEvaluation.activeTabIndex = newIndex;
    },

    getActiveCase() {
      if (!activeEvaluation) return null;
      return activeEvaluation.cases[activeEvaluation.activeTabIndex] || null;
    },

    getActiveCaseState() {
      if (!activeEvaluation) return null;
      return activeEvaluation.caseStates[activeEvaluation.activeTabIndex] || null;
    },

    getAllCaseStates() {
      if (!activeEvaluation) return [];
      return activeEvaluation.caseStates;
    },

    stopTimer() {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    },

    /**
     * Procesa y audita un evento emitido por el simulador móvil en la pestaña activa
     * @param {string} eventName - Nombre del evento ('SELECT_CLIENT', 'CREATE_ORDER_CONFIG', etc.)
     * @param {object} payload - Información asociada a la acción del usuario
     */
    processAction(eventName, payload = {}) {
      if (!activeEvaluation || activeEvaluation.status !== 'IN_PROGRESS') {
        return { success: false, message: 'No hay evaluación activa en curso.', isCaseComplete: false };
      }

      const activeTab = activeEvaluation.activeTabIndex;
      const currentCase = activeEvaluation.cases[activeTab];
      const caseState = activeEvaluation.caseStates[activeTab];
      const timeStamp = new Date().toLocaleTimeString('es-PE');

      // Si el caso ya fue completado
      if (caseState.completed && eventName !== 'MOBILE_LOGIN') {
        return {
          success: true,
          isInformative: true,
          message: 'Este caso ya ha sido completado.',
          progress: 'Caso completado',
          isCaseComplete: true,
          tabIndex: activeTab,
          caseState: caseState
        };
      }

      // Eventos puramente informativos
      if (eventName === 'MOBILE_LOGIN') {
        const logEntry = {
          time: timeStamp,
          type: 'INFO',
          step: `[Tab ${activeTab + 1}] Login Móvil`,
          detail: `Asesor ingresó al móvil como: ${payload.username}`
        };
        caseState.actionsLog.push(logEntry);
        return {
          success: true,
          isInformative: true,
          logEntry: logEntry,
          progress: 'Revisando Plan de Visitas',
          errors: caseState.errors,
          totalErrors: activeEvaluation.totalErrors,
          tabIndex: activeTab
        };
      }

      if (eventName === 'CLIENT_OPTIONS_OPENED') {
        const logEntry = {
          time: timeStamp,
          type: 'INFO',
          step: `[Tab ${activeTab + 1}] Apertura de Opciones`,
          detail: `Abrió opciones de: ${payload.clientName}`
        };
        caseState.actionsLog.push(logEntry);
        return {
          success: true,
          isInformative: true,
          logEntry: logEntry,
          progress: `Consultando cliente`,
          errors: caseState.errors,
          totalErrors: activeEvaluation.totalErrors,
          tabIndex: activeTab
        };
      }

      // En visitas telefónicas o remotas (Caso 16), el registro de fotos es opcional y no debe penalizar
      if ((currentCase.isPhoneVisit || currentCase.id === 'case-16') && eventName === 'SAVE_PHOTOS') {
        const logEntry = {
          time: timeStamp,
          type: 'INFO',
          step: `[Tab ${activeTab + 1}] Fotos Opcionales`,
          detail: 'Fotos registradas en atención telefónica (no penalizable).'
        };
        caseState.actionsLog.push(logEntry);
        return {
          success: true,
          isInformative: true,
          logEntry: logEntry,
          progress: 'Atención telefónica',
          errors: caseState.errors,
          totalErrors: activeEvaluation.totalErrors,
          tabIndex: activeTab,
          caseState: caseState
        };
      }

      // Validación contra las reglas del caso en este tab
      const expectedRule = (currentCase.rules && currentCase.rules[caseState.currentRuleIndex]) || null;

      if (expectedRule && expectedRule.eventName === eventName) {
        let isCorrect = false;
        if (typeof expectedRule.validate === 'function') {
          isCorrect = Boolean(expectedRule.validate(payload));
        } else if (expectedRule.expectedValue !== undefined) {
          isCorrect = payload[Object.keys(payload)[0]] === expectedRule.expectedValue;
        }

        if (isCorrect) {
          caseState.currentRuleIndex++;
          const isCaseComplete = caseState.currentRuleIndex >= (currentCase.rules ? currentCase.rules.length : 1);
          
          if (isCaseComplete) {
            caseState.completed = true;
            caseState.numericScore = Math.max(0, 20 - (caseState.errors * 4));
            caseState.score = `${caseState.numericScore} / 20`;
          }

          const logEntry = {
            time: timeStamp,
            type: 'SUCCESS',
            step: `[Tab ${activeTab + 1}] ${expectedRule.description || eventName}`,
            detail: `Correcto en ${currentCase.code}: ${expectedRule.description || eventName}`
          };
          caseState.actionsLog.push(logEntry);

          return {
            success: true,
            isCorrect: true,
            isCaseComplete: isCaseComplete,
            logEntry: logEntry,
            progress: isCaseComplete ? `Caso ${activeTab + 1} completado` : `Paso ${caseState.currentRuleIndex} completado`,
            errors: caseState.errors,
            totalErrors: activeEvaluation.totalErrors,
            tabIndex: activeTab,
            caseState: caseState
          };
        } else {
          // Error en el paso esperado
          caseState.errors++;
          activeEvaluation.totalErrors++;
          caseState.numericScore = Math.max(0, 20 - (caseState.errors * 4));
          caseState.score = `${caseState.numericScore} / 20`;

          const logEntry = {
            time: timeStamp,
            type: 'ERROR',
            step: `[Tab ${activeTab + 1}] Acción Incorrecta`,
            detail: expectedRule.errorMessage || `Error en ${currentCase.code}`
          };
          caseState.actionsLog.push(logEntry);

          return {
            success: false,
            isCorrect: false,
            message: expectedRule.errorMessage || 'Acción no coincide con los datos del caso.',
            logEntry: logEntry,
            progress: `Error en paso ${caseState.currentRuleIndex + 1}`,
            errors: caseState.errors,
            totalErrors: activeEvaluation.totalErrors,
            tabIndex: activeTab,
            caseState: caseState
          };
        }
      }

      // Si es SUBMIT_ORDER o SUBMIT_EVALUATION fuera del índice estricto pero finaliza el caso
      if (eventName === 'SUBMIT_ORDER' || eventName === 'SUBMIT_EVALUATION') {
        caseState.completed = true;
        caseState.numericScore = Math.max(0, 20 - (caseState.errors * 4));
        caseState.score = `${caseState.numericScore} / 20`;
        const logEntry = {
          time: timeStamp,
          type: 'SUCCESS',
          step: `[Tab ${activeTab + 1}] Cierre de Orden`,
          detail: `Caso ${currentCase.code} finalizado.`
        };
        caseState.actionsLog.push(logEntry);

        return {
          success: true,
          isCorrect: true,
          isCaseComplete: true,
          logEntry: logEntry,
          progress: `Caso ${activeTab + 1} completado`,
          errors: caseState.errors,
          totalErrors: activeEvaluation.totalErrors,
          tabIndex: activeTab,
          caseState: caseState
        };
      }

      // Acción fuera de secuencia
      caseState.errors++;
      activeEvaluation.totalErrors++;
      caseState.numericScore = Math.max(0, 20 - (caseState.errors * 4));
      caseState.score = `${caseState.numericScore} / 20`;

      const unexpectedError = `Acción fuera del flujo esperado para ${currentCase.code}.`;
      const logEntry = {
        time: timeStamp,
        type: 'ERROR',
        step: `[Tab ${activeTab + 1}] Fuera de Secuencia`,
        detail: unexpectedError
      };
      caseState.actionsLog.push(logEntry);

      return {
        success: false,
        isCorrect: false,
        message: unexpectedError,
        logEntry: logEntry,
        progress: 'Secuencia interrumpida',
        errors: caseState.errors,
        totalErrors: activeEvaluation.totalErrors,
        tabIndex: activeTab,
        caseState: caseState
      };
    },

    /**
     * Finaliza la evaluación global consolidando los 5 casos y el tiempo total
     */
    finishMultiEvaluation() {
      if (!activeEvaluation) return null;

      this.stopTimer();
      activeEvaluation.status = 'COMPLETED';

      const durationSeconds = activeEvaluation.elapsedSeconds;
      const totalCases = activeEvaluation.caseStates.length;
      
      // Asegurar que cada caso calcule su nota
      activeEvaluation.caseStates.forEach(cs => {
        if (!cs.completed && cs.currentRuleIndex === 0) {
          // Caso no intentado: nota proporcional o mínima
          cs.numericScore = Math.max(0, 20 - (cs.errors * 4) - 10);
        } else {
          cs.numericScore = Math.max(0, 20 - (cs.errors * 4));
        }
        cs.score = `${cs.numericScore} / 20`;
      });

      // Calificación consolidada: promedio de los casos
      const sumScores = activeEvaluation.caseStates.reduce((acc, cs) => acc + cs.numericScore, 0);
      const avgScore = totalCases > 0 ? Math.round(sumScores / totalCases) : 20;
      const totalErrors = activeEvaluation.totalErrors;
      const completedCount = activeEvaluation.caseStates.filter(cs => cs.completed).length;

      // Criterio de aprobación: promedio >= 11 y errores <= 6 en los 5 casos
      const passed = avgScore >= 11 && totalErrors <= 6;

      const casesCodes = activeEvaluation.cases.map(c => c.code).join(', ');

      const result = {
        id: 'eval-' + Date.now(),
        caseId: 'multi-5-cases',
        caseCode: '5 Casos B2C',
        caseTitle: `Evaluación de 5 Casos (${casesCodes})`,
        username: activeEvaluation.user.username,
        advisorName: activeEvaluation.user.name,
        errors: totalErrors,
        maxErrorsAllowed: 6,
        numericScore: avgScore,
        score: `${avgScore} / 20`,
        status: passed ? 'Aprobado' : 'Desaprobado',
        durationSeconds: durationSeconds,
        formattedDuration: formatTime(durationSeconds),
        completedAt: new Date().toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'medium' }),
        completedCasesCount: completedCount,
        totalCasesCount: totalCases,
        casesDetails: activeEvaluation.caseStates,
        interactions: activeEvaluation.caseStates.flatMap(cs => cs.actionsLog)
      };

      activeEvaluation = null;
      return result;
    },

    finishEvaluation() {
      return this.finishMultiEvaluation();
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
