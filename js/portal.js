/**
 * Lógica principal del Portal UYAPAY (index.html)
 * Gestiona autenticación, navegación, panel de control, monitor en vivo vía SSE,
 * motor de evaluación desacoplado, cronómetro y ranking general con podio.
 */

(function() {
  const Storage = window.UyapayServices.Storage;
  const Auth = window.UyapayServices.Auth;
  const Evaluator = window.UyapayServices.Evaluator;
  const Cases = window.UyapayData.CASES;

  let currentCaseIndex = 0;

  // ================= INICIALIZACIÓN =================
  document.addEventListener('DOMContentLoaded', () => {
    initAuthListener();
    initMessageListener();
    initLiveStream();

    const session = Auth.getCurrentUser();
    if (session) {
      applyUserSession(session);
    }
  });

  // ================= AUTENTICACIÓN =================
  function initAuthListener() {
    const loginBtn = document.getElementById('btn-login');
    if (loginBtn) {
      loginBtn.addEventListener('click', handleLogin);
    }

    const userInput = document.getElementById('username');
    const passInput = document.getElementById('password');
    [userInput, passInput].forEach(inp => {
      if (inp) {
        inp.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') handleLogin();
        });
      }
    });
  }

  async function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('login-error');

    const result = await Auth.login(username, password);
    if (!result.success) {
      errorEl.textContent = result.message;
      errorEl.style.display = 'block';
      return;
    }

    errorEl.style.display = 'none';
    applyUserSession(result.user);
  }

  function applyUserSession(user) {
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('top-navbar').style.display = 'flex';
    document.getElementById('user-greeting').textContent = 'Hola, ' + user.name;
    document.getElementById('user-role-badge').textContent = user.role.toUpperCase();

    if (user.role === 'admin') {
      setupNavigation([
        { id: 'admin-dashboard', label: 'Dashboard & Monitor en Vivo' },
        { id: 'ranking-view', label: 'Ranking General & Podio' },
        { id: 'admin-historial', label: 'Historial de Calificaciones' }
      ]);
      renderAdminDashboard();
      renderResultsTable('admin-results-table');
    } else {
      setupNavigation([
        { id: 'asesor-eval-intro', label: 'Evaluación Práctica' },
        { id: 'ranking-view', label: 'Ranking General & Podio' },
        { id: 'asesor-notas', label: 'Mis Calificaciones' }
      ]);
      renderResultsTable('asesor-results-table', user.username);
    }

    renderLeaderboard();
  }

  function setupNavigation(tabs) {
    const navContainer = document.getElementById('nav-links-container');
    navContainer.innerHTML = '';

    tabs.forEach((tab, index) => {
      const btn = document.createElement('div');
      btn.className = 'nav-item' + (index === 0 ? ' active' : '');
      btn.textContent = tab.label;
      btn.onclick = () => switchTab(tab.id, btn);
      navContainer.appendChild(btn);
    });

    switchTab(tabs[0].id, navContainer.firstChild);
  }

  function switchTab(containerId, navElement) {
    document.querySelectorAll('.container').forEach(c => c.classList.remove('active'));
    document.getElementById('evaluation-arena').style.display = 'none';

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const target = document.getElementById(containerId);
    if (target) target.classList.add('active');
    if (navElement) navElement.classList.add('active');

    // Refrescar vistas según pestaña activa
    const currentUser = Auth.getCurrentUser();
    if (containerId === 'ranking-view') {
      renderLeaderboard();
    } else if (containerId === 'admin-dashboard') {
      renderAdminDashboard();
    } else if (containerId === 'admin-historial' && currentUser) {
      renderResultsTable('admin-results-table');
    } else if (containerId === 'asesor-notas' && currentUser) {
      renderResultsTable('asesor-results-table', currentUser.username);
    }
  }

  // ================= PANEL ADMINISTRADOR Y MONITOR =================
  async function renderAdminDashboard() {
    const results = await Storage.getResults();
    const totalEvals = results.length;
    const passedEvals = results.filter(r => r.status === 'Aprobado').length;

    const totalEl = document.getElementById('stat-total-evals');
    const passedEl = document.getElementById('stat-passed-evals');
    if (totalEl) totalEl.textContent = totalEvals;
    if (passedEl) passedEl.textContent = passedEvals;

    // Sincronizar monitor en vivo inmediatamente con el estado del backend
    await updateLiveMonitor();
  }

  function applyLiveStatus(data) {
    if (!data) return;
    const stepEl = document.getElementById('live-step');
    const errorsEl = document.getElementById('live-errors');
    const advisorEl = document.getElementById('live-advisor');

    if (stepEl && data.step) stepEl.textContent = data.step;
    if (errorsEl && data.errors !== undefined) errorsEl.textContent = data.errors;
    if (advisorEl && data.advisor) advisorEl.textContent = data.advisor;
  }

  function appendLiveFeed(actionEntry, prepend = true) {
    const feed = document.getElementById('live-feed-list');
    if (!feed) return;

    if (feed.children.length === 1 && feed.firstElementChild.textContent.includes('Esperando')) {
      feed.innerHTML = '';
    }

    const item = document.createElement('div');
    const typeClass = actionEntry.type === 'ERROR' ? 'error' : (actionEntry.type === 'SUCCESS' ? 'success' : '');
    item.className = 'live-feed-item ' + typeClass;
    item.innerHTML = `
      <span><b>${actionEntry.step || 'Acción'}:</b> ${actionEntry.detail || ''}</span>
      <span class="live-feed-time">${actionEntry.time || actionEntry.created_at || ''}</span>
    `;

    if (prepend) {
      feed.prepend(item);
    } else {
      feed.appendChild(item);
    }
  }

  async function updateLiveMonitor() {
    try {
      const liveData = await Storage.getLiveStatus();
      if (!liveData) return;

      if (liveData.current) {
        applyLiveStatus(liveData.current);
      }

      if (Array.isArray(liveData.history) && liveData.history.length > 0) {
        const feed = document.getElementById('live-feed-list');
        if (feed && (feed.children.length === 0 || feed.firstElementChild.textContent.includes('Esperando'))) {
          feed.innerHTML = '';
          liveData.history.slice(0, 15).forEach(item => {
            appendLiveFeed(item, false);
          });
        }
      }
    } catch (e) {}
  }

  // Monitor en tiempo real multi-dispositivo vía Server-Sent Events (SSE) + Polling de respaldo
  let liveEventSource = null;
  let livePollInterval = null;

  function initLiveStream() {
    if (typeof EventSource !== 'undefined' && location.protocol.startsWith('http')) {
      connectEventSource();
    }

    // Polling de respaldo continuo cada 3s para garantizar sincronización entre dispositivos
    if (!livePollInterval) {
      livePollInterval = setInterval(() => {
        const adminDashboard = document.getElementById('admin-dashboard');
        if (adminDashboard && adminDashboard.classList.contains('active')) {
          updateLiveMonitor();
        }
      }, 3000);
    }
  }

  function connectEventSource() {
    try {
      if (liveEventSource) {
        liveEventSource.close();
      }

      liveEventSource = new EventSource('/api/live-events/stream');

      liveEventSource.onopen = () => {
        const liveIndicator = document.querySelector('.live-indicator');
        if (liveIndicator) liveIndicator.style.background = '#27ae60';
      };

      liveEventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data && (data.step || data.advisor)) {
            applyLiveStatus(data);
            if (data.detail) {
              appendLiveFeed(data, true);
            }
          }
        } catch (err) {}
      };

      liveEventSource.onerror = () => {
        // En caso de caída de SSE, reintentar la conexión
        if (liveEventSource) {
          liveEventSource.close();
          liveEventSource = null;
        }
        setTimeout(connectEventSource, 4000);
      };
    } catch (e) {}
  }

  // ================= RANKING GENERAL Y PODIO (RF-MVP-042 A 047) =================
  async function renderLeaderboard() {
    const leaderboard = await Storage.getLeaderboard();
    const podiumEl = document.getElementById('podium-wrapper');
    const tableBody = document.getElementById('leaderboard-results-table');

    // 1. Renderizar Podio (Top 3)
    if (podiumEl) {
      if (leaderboard.length === 0) {
        podiumEl.innerHTML = `<div style="color:var(--text-muted); text-align:center; padding:20px;">Aún no hay participantes en el podio.</div>`;
      } else {
        const top1 = leaderboard[0] || null;
        const top2 = leaderboard[1] || null;
        const top3 = leaderboard[2] || null;

        let html = '';

        if (top2) {
          html += `
            <div class="podium-card silver">
              <div class="podium-medal">🥈</div>
              <div class="podium-advisor">${top2.advisorName || top2.username}</div>
              <div class="podium-score">${top2.score}</div>
              <div class="podium-meta">
                <span>⏱️ ${top2.formattedDuration || '00:00'}</span>
                <span>❌ ${top2.errors} err</span>
              </div>
            </div>
          `;
        }

        if (top1) {
          html += `
            <div class="podium-card gold">
              <div class="podium-medal">🥇</div>
              <div class="podium-advisor">${top1.advisorName || top1.username}</div>
              <div class="podium-score">${top1.score}</div>
              <div class="podium-meta">
                <span>⏱️ ${top1.formattedDuration || '00:00'}</span>
                <span>❌ ${top1.errors} err</span>
              </div>
            </div>
          `;
        }

        if (top3) {
          html += `
            <div class="podium-card bronze">
              <div class="podium-medal">🥉</div>
              <div class="podium-advisor">${top3.advisorName || top3.username}</div>
              <div class="podium-score">${top3.score}</div>
              <div class="podium-meta">
                <span>⏱️ ${top3.formattedDuration || '00:00'}</span>
                <span>❌ ${top3.errors} err</span>
              </div>
            </div>
          `;
        }

        podiumEl.innerHTML = html;
      }
    }

    // 2. Renderizar Tabla General de Posiciones
    if (tableBody) {
      if (leaderboard.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:20px;">No hay evaluaciones registradas en el ranking.</td></tr>`;
        return;
      }

      tableBody.innerHTML = leaderboard.map(item => {
        let badgeRankClass = 'rank-other';
        if (item.rank === 1) badgeRankClass = 'rank-1';
        else if (item.rank === 2) badgeRankClass = 'rank-2';
        else if (item.rank === 3) badgeRankClass = 'rank-3';

        const statusBadgeClass = item.status === 'Aprobado' ? 'badge-success' : 'badge-danger';

        return `
          <tr>
            <td><span class="rank-badge ${badgeRankClass}">#${item.rank}</span></td>
            <td><b>${item.advisorName || item.username}</b></td>
            <td>${item.caseTitle}</td>
            <td><span class="badge ${statusBadgeClass}">${item.score}</span></td>
            <td><b>⏱️ ${item.formattedDuration || '00:00'}</b></td>
            <td>${item.errors} errores</td>
            <td><span class="badge ${statusBadgeClass}">${item.status}</span></td>
            <td style="font-size:12px; color:var(--text-muted);">${item.completedAt}</td>
          </tr>
        `;
      }).join('');
    }
  }

  // ================= TABLAS DE RESULTADOS =================
  async function renderResultsTable(tableId, filterUsername = null) {
    const tableBody = document.getElementById(tableId);
    if (!tableBody) return;

    let data = await Storage.getResults();
    if (filterUsername) {
      data = data.filter(d => (d.username || '').toLowerCase() === filterUsername.toLowerCase());
    }

    if (data.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:20px;">No hay evaluaciones registradas aún.</td></tr>`;
      return;
    }

    tableBody.innerHTML = data.map(item => {
      const badgeClass = item.status === 'Aprobado' ? 'badge-success' : 'badge-danger';
      return `
        <tr>
          <td><b>${item.advisorName || item.username}</b></td>
          <td>${item.caseTitle}</td>
          <td><span class="badge ${badgeClass}">${item.score}</span></td>
          <td>${item.errors} errores</td>
          <td><span class="badge ${badgeClass}">${item.status}</span></td>
          <td style="font-size:12px; color:var(--text-muted);">${item.completedAt} (⏱️ ${item.formattedDuration || '00:00'})</td>
        </tr>
      `;
    }).join('');
  }

  // ================= EVALUACIÓN MULTI-CASO EN PESTAÑAS (5 CASOS) =================
  let evaluationCases = [];
  let currentActiveTab = 0;

  function selectFiveEvaluationCases() {
    const all = [...Cases];
    // Algoritmo de barajado Fisher-Yates
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all.slice(0, 5);
  }

  function startExam() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    // 1. Cargar 5 de los 21 casos disponibles
    evaluationCases = selectFiveEvaluationCases();
    currentActiveTab = 0;

    // 2. Ocultar portal y activar arena de examen
    document.querySelectorAll('.container').forEach(c => c.classList.remove('active'));
    document.getElementById('top-navbar').style.display = 'none';
    document.getElementById('evaluation-arena').style.display = 'flex';

    const timerEl = document.getElementById('exam-timer');
    if (timerEl) timerEl.textContent = '00:00';

    // 3. Iniciar cronómetro continuo y motor multi-caso
    Evaluator.startMultiEvaluation(user, evaluationCases, (seconds, formatted) => {
      if (timerEl) timerEl.textContent = formatted;
    });

    const liveAdvisorEl = document.getElementById('live-advisor');
    if (liveAdvisorEl) liveAdvisorEl.textContent = user.name;

    // Notificar de inmediato al monitor en vivo del administrador
    Storage.sendLiveEvent({
      advisor: user.name || user.username,
      step: 'Inicio de Evaluación',
      detail: `Inició batería de 5 casos prácticos (Caso 1: ${evaluationCases[0].code})`,
      type: 'INFO',
      errors: 0
    });

    // 4. Renderizar pestañas y cargar el primer caso
    renderEvaluationTabs();
    loadCaseInTab(0);
  }

  function renderEvaluationTabs() {
    const tabsBar = document.getElementById('eval-tabs-bar');
    if (!tabsBar) return;

    const caseStates = Evaluator.getAllCaseStates();

    tabsBar.innerHTML = evaluationCases.map((c, index) => {
      const state = caseStates[index] || {};
      const isCompleted = state.completed;
      const isActive = index === currentActiveTab;

      let classes = 'eval-tab-item';
      if (isActive) classes += ' active';
      if (isCompleted) classes += ' completed';

      const statusIcon = isCompleted ? '✅' : (isActive ? '⏳' : '⚪');

      return `
        <button class="${classes}" id="tab-btn-${index}" onclick="window.UyapayPortal.switchCaseTab(${index})">
          <span class="tab-pill-num">${index + 1}</span>
          <span>${c.code}</span>
          <span id="tab-status-icon-${index}">${statusIcon}</span>
        </button>
      `;
    }).join('');
  }

  function loadCaseInTab(tabIndex) {
    if (tabIndex < 0 || tabIndex >= evaluationCases.length) return;
    currentActiveTab = tabIndex;
    Evaluator.switchActiveTab(tabIndex);

    const activeCase = evaluationCases[tabIndex];
    const caseState = Evaluator.getActiveCaseState() || {};
    const user = Auth.getCurrentUser();

    // Notificar cambio de caso en el monitor en vivo
    if (user) {
      Storage.sendLiveEvent({
        advisor: user.name || user.username,
        step: `Tab ${tabIndex + 1}: ${activeCase.code}`,
        detail: `Cargó instrucciones para ${activeCase.client}`,
        type: 'INFO',
        errors: Evaluator.getActiveEvaluation() ? Evaluator.getActiveEvaluation().totalErrors : 0
      });
    }

    // Actualizar encabezados y panel izquierdo
    const caseCodeEl = document.getElementById('case-code');
    const moduleBadgeEl = document.getElementById('case-module-badge');
    const tabStatusEl = document.getElementById('case-tab-status');
    const titleEl = document.getElementById('case-title');
    const clientNameEl = document.getElementById('case-client-name');
    const instructionsEl = document.getElementById('case-instructions');

    if (caseCodeEl) caseCodeEl.textContent = `Caso ${tabIndex + 1} de 5 • ${activeCase.code}`;
    if (moduleBadgeEl) moduleBadgeEl.textContent = activeCase.module || 'Ventas B2C';
    if (titleEl) titleEl.textContent = activeCase.title;
    if (clientNameEl) clientNameEl.textContent = activeCase.client || 'Cliente en ruta';
    if (instructionsEl) instructionsEl.textContent = activeCase.instructions;

    if (tabStatusEl) {
      if (caseState.completed) {
        tabStatusEl.textContent = '✅ Completado';
        tabStatusEl.className = 'badge badge-success';
      } else {
        tabStatusEl.textContent = '⏳ En evaluación';
        tabStatusEl.className = 'badge badge-warning';
      }
    }

    // Actualizar botones de navegación
    const btnPrev = document.getElementById('btn-prev-tab');
    const btnNext = document.getElementById('btn-next-tab');
    const btnFinish = document.getElementById('btn-finish-exam');

    if (btnPrev) btnPrev.style.visibility = tabIndex === 0 ? 'hidden' : 'visible';
    
    // Verificar si todos los casos están completos
    const allCompleted = Evaluator.getAllCaseStates().every(cs => cs.completed);
    if (btnFinish) {
      btnFinish.style.display = (allCompleted || tabIndex === evaluationCases.length - 1) ? 'inline-block' : 'none';
    }
    if (btnNext) {
      btnNext.style.display = tabIndex === evaluationCases.length - 1 ? 'none' : 'inline-block';
    }

    // Refrescar clases de tabs
    renderEvaluationTabs();

    // Cargar simulador móvil para este caso específico
    const frame = document.getElementById('simulador-frame');
    if (frame && user) {
      frame.src = `simulator.html?user=${encodeURIComponent(user.username)}&case=${activeCase.id}&tab=${tabIndex}&autologin=1`;
    }
  }

  function nextTab() {
    if (currentActiveTab < evaluationCases.length - 1) {
      loadCaseInTab(currentActiveTab + 1);
    }
  }

  function prevTab() {
    if (currentActiveTab > 0) {
      loadCaseInTab(currentActiveTab - 1);
    }
  }

  function cancelExam() {
    if (confirm("¿Estás seguro de cancelar la evaluación? Se perderá el avance de los 5 casos.")) {
      const user = Auth.getCurrentUser();
      if (user) {
        Storage.sendLiveEvent({
          advisor: user.name || user.username,
          step: 'Evaluación Cancelada',
          detail: 'El asesor canceló la evaluación.',
          type: 'ERROR',
          errors: Evaluator.getActiveEvaluation() ? Evaluator.getActiveEvaluation().totalErrors : 0
        });
      }
      Evaluator.cancelEvaluation();
      const frame = document.getElementById('simulador-frame');
      frame.src = '';
      document.getElementById('evaluation-arena').style.display = 'none';
      document.getElementById('top-navbar').style.display = 'flex';
      document.getElementById('asesor-eval-intro').classList.add('active');
    }
  }

  // ================= COMUNICACIÓN BIDIRECCIONAL CON EL SIMULADOR =================
  function initMessageListener() {
    window.addEventListener('message', async (event) => {
      if (!event.data || !event.data.type) return;

      const frame = document.getElementById('simulador-frame');
      const frameWindow = frame ? frame.contentWindow : null;

      if (event.data.type === 'SIMULATOR_EVENT') {
        const eventName = event.data.eventName;
        const payload = event.data.payload || {};

        if (eventName === 'SUBMIT_EVALUATION') {
          // Caso completado en el simulador
          const currentTab = currentActiveTab;
          const completedCase = evaluationCases[currentTab] || {};
          const evalResult = Evaluator.processAction('SUBMIT_ORDER', { confirmed: true });

          renderEvaluationTabs();
          loadCaseInTab(currentTab);

          const currentUser = Auth.getCurrentUser();
          Storage.sendLiveEvent({
            advisor: (currentUser && currentUser.name) || payload.advisor || 'Asesor',
            step: `Caso ${currentTab + 1} (${completedCase.code || 'B2C'}) Completado`,
            detail: `Completó satisfactoriamente el caso de ${completedCase.client || 'cliente'}`,
            type: 'SUCCESS',
            errors: Evaluator.getActiveEvaluation() ? Evaluator.getActiveEvaluation().totalErrors : 0
          });

          const allCompleted = Evaluator.getAllCaseStates().every(cs => cs.completed);
          if (allCompleted) {
            setTimeout(() => {
              if (confirm("🎉 ¡Has completado los 5 casos de la evaluación!\n\n¿Deseas finalizar y enviar tu evaluación ahora?")) {
                finishFullExam();
              }
            }, 400);
          } else {
            // Avanzar automáticamente a la siguiente pestaña no completada
            const nextIncomplete = Evaluator.getAllCaseStates().findIndex((cs, i) => !cs.completed && i > currentTab);
            const targetTab = nextIncomplete !== -1 ? nextIncomplete : Evaluator.getAllCaseStates().findIndex(cs => !cs.completed);
            if (targetTab !== -1) {
              setTimeout(() => {
                alert(`✅ Caso ${currentTab + 1} completado. Avanzando al Caso ${targetTab + 1}.`);
                loadCaseInTab(targetTab);
              }, 300);
            }
          }
          return;
        }

        // Procesar en Evaluator
        const evalResult = Evaluator.processAction(eventName, payload);

        // Actualizar Monitor Local
        const stepEl = document.getElementById('live-step');
        const errorsEl = document.getElementById('live-errors');
        if (stepEl) stepEl.textContent = evalResult.progress || '-';
        if (errorsEl) errorsEl.textContent = evalResult.totalErrors !== undefined ? evalResult.totalErrors : 0;

        if (evalResult.logEntry) {
          appendLiveFeed(evalResult.logEntry, true);
          
          // Replicar en Backend para monitores remotos
          const currentUser = Auth.getCurrentUser();
          Storage.sendLiveEvent({
            advisor: (currentUser && currentUser.name) || payload.advisor || 'Asesor',
            step: evalResult.logEntry.step,
            detail: evalResult.logEntry.detail,
            type: evalResult.logEntry.type,
            errors: evalResult.totalErrors || 0
          });
        }

        // Si la regla completó el caso
        if (evalResult.isCaseComplete) {
          renderEvaluationTabs();
          const tabStatusEl = document.getElementById('case-tab-status');
          if (tabStatusEl) {
            tabStatusEl.textContent = '✅ Completado';
            tabStatusEl.className = 'badge badge-success';
          }
        }

        // Responder al simulador
        if (frameWindow) {
          if (evalResult.success) {
            if (evalResult.isCaseComplete) {
              frameWindow.postMessage({
                type: 'EVALUATOR_STEP_APPROVED',
                nextScreen: 's-dashboard',
                stepLabel: 'Caso Completado',
                message: '¡Excelente! Has cumplido las reglas de este caso.'
              }, '*');
            } else if (!evalResult.isInformative) {
              frameWindow.postMessage({
                type: 'EVALUATOR_STEP_APPROVED',
                message: 'Paso correcto.'
              }, '*');
            }
          } else {
            frameWindow.postMessage({
              type: 'EVALUATOR_FEEDBACK_ERROR',
              message: evalResult.message
            }, '*');
          }
        }
      }
    });
  }

  async function finishFullExam() {
    const states = Evaluator.getAllCaseStates();
    const incomplete = states.filter(cs => !cs.completed).length;

    if (incomplete > 0) {
      if (!confirm(`Aún tienes ${incomplete} caso(s) sin completar. ¿Estás seguro de enviar la evaluación ahora? Los casos no completados se calificarán con puntuación parcial.`)) {
        return;
      }
    }

    const finalResult = Evaluator.finishMultiEvaluation();
    if (!finalResult) return;

    // Guardar persistentemente en SQLite / API
    const saved = await Storage.saveResult(finalResult);

    // Notificar al monitor en vivo del administrador
    Storage.sendLiveEvent({
      advisor: saved.advisorName || saved.username,
      step: 'Evaluación Finalizada',
      detail: `Resultado: ${saved.score} (${saved.status}) • Errores: ${saved.errors} • Tiempo: ${saved.formattedDuration}`,
      type: saved.status === 'Aprobado' ? 'SUCCESS' : 'ERROR',
      errors: saved.errors
    });

    const frame = document.getElementById('simulador-frame');
    if (frame) frame.src = '';

    document.getElementById('evaluation-arena').style.display = 'none';
    document.getElementById('top-navbar').style.display = 'flex';

    await renderLeaderboard();
    const currentUser = Auth.getCurrentUser();
    if (currentUser && currentUser.role === 'admin') {
      await renderAdminDashboard();
    }
    switchTab('ranking-view');

    // Desglose de notas por caso
    const breakdown = (saved.casesDetails || [])
      .map((cs, idx) => `• Caso ${idx + 1} (${cs.caseCode}): ${cs.score} (${cs.errors} errores)`)
      .join('\n');

    alert(
      `🎉 ¡Evaluación de 5 Casos Finalizada!\n\n` +
      `• Asesor: ${saved.advisorName}\n` +
      `• Estado Global: ${saved.status}\n` +
      `• Calificación Final: ${saved.score}\n` +
      `• Casos Completados: ${saved.completedCasesCount} de 5\n` +
      `• Tiempo Total: ${saved.formattedDuration}\n` +
      `• Total de Errores: ${saved.errors}\n\n` +
      `Desglose por Caso:\n${breakdown}\n\n` +
      `Tu calificación y tiempo han sido registrados permanentemente en el Ranking Oficial.`
    );
  }

  window.UyapayPortal = {
    logout: () => Auth.logout(),
    startExam: startExam,
    cancelExam: cancelExam,
    switchTab: switchTab,
    switchCaseTab: loadCaseInTab,
    nextTab: nextTab,
    prevTab: prevTab,
    finishFullExam: finishFullExam,
    resetData: async () => {
      if (confirm('¿Restablecer base de datos y reiniciar el ranking?')) {
        await Storage.resetAll();
        location.reload();
      }
    }
  };
})();

