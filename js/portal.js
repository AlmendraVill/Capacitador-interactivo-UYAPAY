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
  }

  function appendLiveFeed(actionEntry) {
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

    feed.prepend(item);
  }

  // Monitor en tiempo real multi-dispositivo vía Server-Sent Events (SSE)
  function initLiveStream() {
    if (typeof EventSource !== 'undefined' && location.protocol.startsWith('http')) {
      try {
        const stream = new EventSource('/api/live-events/stream');
        stream.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            appendLiveFeed(data);

            const stepEl = document.getElementById('live-step');
            const errorsEl = document.getElementById('live-errors');
            const advisorEl = document.getElementById('live-advisor');

            if (stepEl) stepEl.textContent = data.step || '-';
            if (errorsEl) errorsEl.textContent = data.errors !== undefined ? data.errors : 0;
            if (advisorEl && data.advisor) advisorEl.textContent = data.advisor;
          } catch (err) {}
        };
      } catch (e) {}
    }
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

  // ================= EVALUACIÓN / SIMULADOR =================
  function startExam() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const selector = document.getElementById('eval-case-selector');
    const selectedCaseId = selector ? selector.value : 'case-2';
    const activeCase = Cases.find(c => c.id === selectedCaseId) || Cases[1] || Cases[0];
    currentCaseIndex = Cases.findIndex(c => c.id === activeCase.id);

    document.querySelectorAll('.container').forEach(c => c.classList.remove('active'));
    document.getElementById('top-navbar').style.display = 'none';
    document.getElementById('evaluation-arena').style.display = 'flex';

    // Cargar información del caso
    document.getElementById('case-title').textContent = activeCase.title;
    document.getElementById('case-instructions').textContent = activeCase.instructions;
    document.getElementById('case-code').textContent = `Módulo: ${activeCase.module} (${activeCase.code})`;

    const timerEl = document.getElementById('exam-timer');
    if (timerEl) timerEl.textContent = '00:00';

    // Iniciar cronómetro y motor de evaluación desacoplado
    Evaluator.startEvaluation(user, activeCase, (seconds, formatted) => {
      if (timerEl) timerEl.textContent = formatted;
    });

    const liveAdvisorEl = document.getElementById('live-advisor');
    if (liveAdvisorEl) liveAdvisorEl.textContent = user.name;

    // Cargar iframe con el caso seleccionado
    const frame = document.getElementById('simulador-frame');
    frame.src = `simulator.html?user=${encodeURIComponent(user.username)}&case=${activeCase.id}`;
  }

  function updateCasePreview(caseId) {
    const c = Cases.find(item => item.id === caseId);
    if (!c) return;

    const titleEl = document.getElementById('preview-title');
    const descEl = document.getElementById('preview-desc');
    if (titleEl) titleEl.textContent = c.title;

    if (descEl) {
      if (c.id === 'case-2') {
        descEl.innerHTML = `
          • <b>Cliente:</b> Distribuidora Kanchis EIRL (Crédito 30d, Lista OF)<br>
          • <b>Fotos obligatorias:</b> Registro de fotos inicial y final de visita.<br>
          • <b>Pedido:</b> 3 cajas Michelin Energy XM2+ ($55 c/u) con promo de $10 USD.<br>
          • <b>Resultado esperado:</b> Liquidación neta de <b>USD 150.35</b> tras aplicar 3% de crédito.
        `;
      } else if (c.id === 'case-1') {
        descEl.innerHTML = `
          • <b>Cliente:</b> Ferretería Los Andes S.A.C. (Juan Perez - Contado, Lista 1)<br>
          • <b>Pedido:</b> 8 baldes Shell Helix HX7 10W/40 ($22 c/u = $176).<br>
          • <b>Promoción:</b> Regalo de 2 botellas Shell Helix Plus.<br>
          • <b>Resultado esperado:</b> Total USD 176 - 5% contado ($8.80) → <b>USD 167.20</b> + regalo.
        `;
      } else {
        descEl.textContent = c.instructions;
      }
    }
  }

  function cancelExam() {
    if (confirm("¿Estás seguro de cancelar la evaluación? Se perderá el avance actual.")) {
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
          await handleEvaluationCompleted();
          return;
        }

        // Procesar en Evaluator
        const evalResult = Evaluator.processAction(eventName, payload);

        // Actualizar Monitor Local
        const stepEl = document.getElementById('live-step');
        const errorsEl = document.getElementById('live-errors');
        if (stepEl) stepEl.textContent = evalResult.progress || '-';
        if (errorsEl) errorsEl.textContent = evalResult.errors !== undefined ? evalResult.errors : 0;

        if (evalResult.logEntry) {
          appendLiveFeed(evalResult.logEntry);
          
          // Replicar en Backend para monitores remotos
          const currentUser = Auth.getCurrentUser();
          Storage.sendLiveEvent({
            advisor: (currentUser && currentUser.name) || payload.advisor || 'Asesor',
            step: evalResult.logEntry.step,
            detail: evalResult.logEntry.detail,
            type: evalResult.logEntry.type,
            errors: evalResult.errors || 0
          });
        }

        // Responder al simulador
        if (frameWindow) {
          if (evalResult.success) {
            if (evalResult.isCaseComplete) {
              frameWindow.postMessage({
                type: 'EVALUATOR_STEP_APPROVED',
                nextScreen: 's-dashboard',
                stepLabel: 'Visita Iniciada con Éxito',
                message: '¡Excelente! Iniciaste la visita indicada.'
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

  async function handleEvaluationCompleted() {
    const finalResult = Evaluator.finishEvaluation();
    if (!finalResult) return;

    // Guardar persistentemente en SQLite / API
    const saved = await Storage.saveResult(finalResult);

    const frame = document.getElementById('simulador-frame');
    if (frame) frame.src = '';

    document.getElementById('evaluation-arena').style.display = 'none';
    document.getElementById('top-navbar').style.display = 'flex';

    await renderLeaderboard();
    const currentUser = Auth.getCurrentUser();
    if (currentUser && currentUser.role === 'admin') {
      await renderAdminDashboard();
      switchTab('ranking-view');
    } else {
      switchTab('ranking-view');
    }

    alert(
      `🎉 ¡Evaluación Completada!\n\n` +
      `• Asesor: ${saved.advisorName}\n` +
      `• Estado: ${saved.status}\n` +
      `• Calificación: ${saved.score}\n` +
      `• Tiempo empleado: ${saved.formattedDuration}\n` +
      `• Errores cometidos: ${saved.errors}\n\n` +
      `Tu resultado ha sido guardado permanentemente en la base de datos y actualizado en el Ranking.`
    );
  }

  window.UyapayPortal = {
    logout: () => Auth.logout(),
    startExam: startExam,
    cancelExam: cancelExam,
    switchTab: switchTab,
    updateCasePreview: updateCasePreview,
    resetData: async () => {
      if (confirm('¿Restablecer base de datos y reiniciar el ranking?')) {
        await Storage.resetAll();
        location.reload();
      }
    }
  };
})();
