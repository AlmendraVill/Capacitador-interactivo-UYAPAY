/**
 * Lógica del Simulador Móvil UYAPAY (Desacoplado)
 * Cumple con RF-MVP-008 a RF-MVP-015 y la Regla Fundamental de Arquitectura:
 * "El simulador no conoce la lógica de puntuación; solo emite eventos y refleja estados".
 */

(function() {
  const state = {
    currentStep: 'En pantalla de Login Móvil',
    selectedClient: '',
    advisorUsername: 'alvaro',
    currentCaseId: 'case-1'
  };

  // Parámetros URL
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('user')) state.advisorUsername = urlParams.get('user');
  if (urlParams.get('case')) state.currentCaseId = urlParams.get('case');

  // Enviar eventos de acción al Portal Padre (Evaluador)
  function emitSimulatorEvent(eventName, payload = {}) {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'SIMULATOR_EVENT',
        eventName: eventName,
        payload: {
          advisor: state.advisorUsername,
          caseId: state.currentCaseId,
          ...payload
        }
      }, '*');
    }
  }

  // Notificación flotante (Toast)
  function showHint(msg, isError = true) {
    const h = document.getElementById('hintBox');
    if (!h) return;
    h.textContent = msg;
    h.className = 'hint show ' + (isError ? 'error-hint' : 'success-hint');
    setTimeout(() => {
      h.classList.remove('show');
    }, 2800);
  }

  // Transición entre pantallas de la app
  function navigateTo(screenId, stepLabel) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');
    if (stepLabel) state.currentStep = stepLabel;
  }

  // Login en la app móvil simulada
  function handleAppLogin() {
    const userInput = (document.getElementById('userIn').value || '').trim();
    if (!userInput) {
      showHint('Ingresa tu usuario móvil asignado.', true);
      return;
    }

    emitSimulatorEvent('MOBILE_LOGIN', { username: userInput });
    // Navegación fluida a Visitas
    navigateTo('s-visitas', 'Plan de Visitas');
  }

  // Apertura de menú inferior (Bottom sheet)
  function openClientOptions(clientName) {
    state.selectedClient = clientName;
    const modal = document.getElementById('optionsModal');
    if (modal) modal.classList.add('active');

    emitSimulatorEvent('CLIENT_OPTIONS_OPENED', { clientName: clientName });
  }

  function closeClientOptions() {
    const modal = document.getElementById('optionsModal');
    if (modal) modal.classList.remove('active');
  }

  // Selección de acción dentro del modal de opciones
  function selectOption(actionKey) {
    closeClientOptions();

    // 1. Notificar selección del cliente
    emitSimulatorEvent('SELECT_CLIENT', { clientName: state.selectedClient });

    // 2. Notificar la acción solicitada
    emitSimulatorEvent('SELECT_ACTION', { action: actionKey, clientName: state.selectedClient });
  }

  // Enviar evaluación final
  function finishSimulation() {
    emitSimulatorEvent('SUBMIT_EVALUATION', {
      clientName: state.selectedClient
    });
  }

  // Escuchar respuestas y directivas del Motor de Evaluación (Portal)
  window.addEventListener('message', (event) => {
    if (!event.data || !event.data.type) return;

    // Directiva: Error detectado por el evaluador
    if (event.data.type === 'EVALUATOR_FEEDBACK_ERROR') {
      showHint(event.data.message || 'Acción incorrecta.', true);
    }

    // Directiva: Acción aprobada por el evaluador
    if (event.data.type === 'EVALUATOR_STEP_APPROVED') {
      if (event.data.nextScreen) {
        navigateTo(event.data.nextScreen, event.data.stepLabel);
      }
      if (event.data.message) {
        showHint(event.data.message, false);
      }
    }
  });

  // Exponer API para el HTML del simulador
  window.UyapaySimulator = {
    login: handleAppLogin,
    go: navigateTo,
    openOptions: openClientOptions,
    closeOptions: closeClientOptions,
    checkOption: selectOption,
    finish: finishSimulation,
    hint: (msg) => showHint(msg, false)
  };

  // Inicialización al cargar la ventana
  window.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('userIn');
    if (input && state.advisorUsername) {
      input.value = state.advisorUsername;
    }
  });
})();
