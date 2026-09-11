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
  let isPodiumVisible = false;

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ================= SISTEMA DE MODALES CENTRADOS (ALERT Y CONFIRM) =================
  let activeDialogResolve = null;

  function showCustomAlert(options = {}) {
    return new Promise((resolve) => {
      const modal = document.getElementById('portal-dialog-modal');
      const titleEl = document.getElementById('dialog-title');
      const msgEl = document.getElementById('dialog-message');
      const iconEl = document.getElementById('dialog-icon-circle');
      const btnCancel = document.getElementById('btn-dialog-cancel');
      const btnConfirm = document.getElementById('btn-dialog-confirm');

      if (!modal) {
        window.alert(options.message || '');
        resolve(true);
        return;
      }

      activeDialogResolve = resolve;

      if (titleEl) titleEl.textContent = options.title || 'Información';
      if (msgEl) msgEl.textContent = options.message || '';

      if (iconEl) {
        iconEl.textContent = options.icon || 'ℹ️';
        iconEl.className = 'dialog-icon-circle ' + (options.iconType || (options.icon === '✅' ? 'success' : (options.icon === '🔒' ? 'warning' : 'info')));
      }

      if (btnCancel) btnCancel.style.display = 'none';
      if (btnConfirm) {
        btnConfirm.textContent = options.confirmText || 'Entendido';
        btnConfirm.className = 'btn-primary';
      }

      modal.style.display = 'flex';
      modal.classList.add('active');
    });
  }

  function showCustomConfirm(options = {}) {
    return new Promise((resolve) => {
      const modal = document.getElementById('portal-dialog-modal');
      const titleEl = document.getElementById('dialog-title');
      const msgEl = document.getElementById('dialog-message');
      const iconEl = document.getElementById('dialog-icon-circle');
      const btnCancel = document.getElementById('btn-dialog-cancel');
      const btnConfirm = document.getElementById('btn-dialog-confirm');

      if (!modal) {
        const res = window.confirm(options.message || '');
        resolve(res);
        return;
      }

      activeDialogResolve = resolve;

      if (titleEl) titleEl.textContent = options.title || 'Confirmación';
      if (msgEl) msgEl.textContent = options.message || '';

      if (iconEl) {
        iconEl.textContent = options.icon || '⚠️';
        iconEl.className = 'dialog-icon-circle ' + (options.confirmDanger ? 'danger' : (options.icon === '🏆' ? 'success' : 'warning'));
      }

      if (btnCancel) {
        btnCancel.style.display = 'inline-flex';
        btnCancel.textContent = options.cancelText || 'Cancelar';
      }

      if (btnConfirm) {
        btnConfirm.textContent = options.confirmText || 'Confirmar';
        btnConfirm.className = options.confirmDanger ? 'btn-primary btn-dialog-danger' : 'btn-primary';
      }

      modal.style.display = 'flex';
      modal.classList.add('active');
    });
  }

  function closeCustomDialog(result = false) {
    const modal = document.getElementById('portal-dialog-modal');
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
    }
    if (activeDialogResolve) {
      const resolve = activeDialogResolve;
      activeDialogResolve = null;
      resolve(result);
    }
  }

  function handleDialogConfirm() {
    closeCustomDialog(true);
  }

  function handleDialogCancel() {
    closeCustomDialog(false);
  }

  function dismissDialog() {
    closeCustomDialog(false);
  }

  // ================= INICIALIZACIÓN =================
  document.addEventListener('DOMContentLoaded', () => {
    initAuthListener();
    initMessageListener();
    initLiveStream();
    initFirebaseRealtimeListeners();

    const dialogModal = document.getElementById('portal-dialog-modal');
    if (dialogModal) {
      dialogModal.addEventListener('click', (e) => {
        if (e.target === dialogModal) dismissDialog();
      });
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') dismissDialog();
    });

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

  async function applyUserSession(user) {
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('top-navbar').style.display = 'flex';
    document.getElementById('user-greeting').textContent = 'Hola, ' + user.name;
    document.getElementById('user-role-badge').textContent = user.role.toUpperCase();

    // Sincronizar estado actual de publicación del podio
    isPodiumVisible = await Storage.getPodiumStatus();
    updatePodiumControlsUI(isPodiumVisible);

    const rankingAdminControls = document.getElementById('ranking-admin-controls');
    if (rankingAdminControls) {
      rankingAdminControls.style.display = user.role === 'admin' ? 'inline-flex' : 'none';
    }

    if (user.role === 'admin') {
      setupNavigation([
        { id: 'admin-dashboard', label: 'Dashboard & Monitor en Vivo' },
        { id: 'ranking-view', label: 'Ranking General & Podio' },
        { id: 'admin-historial', label: 'Historial de Calificaciones' }
      ]);
      await renderAdminDashboard();
      await renderResultsTable('admin-results-table');
    } else {
      setupNavigation([
        { id: 'asesor-eval-intro', label: 'Evaluación Práctica' },
        { id: 'ranking-view', label: 'Ranking General & Podio' },
        { id: 'asesor-notas', label: 'Mis Calificaciones' }
      ]);
      await renderResultsTable('asesor-results-table', user.username);
    }

    await renderLeaderboard();
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

    if (navElement) {
      navElement.classList.add('active');
    } else {
      // Activar el botón correspondiente en la barra de navegación superior
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach(item => {
        const text = (item.textContent || '').toLowerCase();
        if (
          (containerId === 'ranking-view' && text.includes('ranking')) ||
          (containerId === 'asesor-notas' && text.includes('calificaciones')) ||
          (containerId === 'asesor-eval-intro' && text.includes('evaluación')) ||
          (containerId === 'admin-dashboard' && text.includes('dashboard')) ||
          (containerId === 'admin-historial' && text.includes('historial'))
        ) {
          item.classList.add('active');
        }
      });
    }

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

  function updatePodiumControlsUI(visible) {
    // 1. Controles en Admin Dashboard
    const adminBadge = document.getElementById('admin-podium-badge');
    const adminBtn = document.getElementById('btn-admin-toggle-podium');
    if (adminBadge) {
      if (visible) {
        adminBadge.textContent = '🟢 Podio Publicado (Visible a Asesores)';
        adminBadge.style.background = '#16a34a';
        adminBadge.style.color = '#ffffff';
      } else {
        adminBadge.textContent = '🔒 Podio Oculto a Asesores';
        adminBadge.style.background = '#475569';
        adminBadge.style.color = '#f1f5f9';
      }
    }
    if (adminBtn) {
      if (visible) {
        adminBtn.textContent = '🔒 Ocultar Podio a Asesores';
        adminBtn.style.background = '#dc2626';
      } else {
        adminBtn.textContent = '📢 Mostrar Podio a Asesores';
        adminBtn.style.background = 'var(--yellow)';
      }
    }

    // 2. Controles en Ranking View
    const rankingBadge = document.getElementById('ranking-podium-badge');
    const rankingBtn = document.getElementById('btn-ranking-toggle-podium');
    if (rankingBadge) {
      if (visible) {
        rankingBadge.textContent = '🟢 Podio Publicado';
        rankingBadge.style.background = '#16a34a';
        rankingBadge.style.color = '#ffffff';
      } else {
        rankingBadge.textContent = '🔒 Podio Oculto';
        rankingBadge.style.background = '#475569';
        rankingBadge.style.color = '#f1f5f9';
      }
    }
    if (rankingBtn) {
      if (visible) {
        rankingBtn.textContent = '🔒 Ocultar Podio';
        rankingBtn.style.background = '#dc2626';
      } else {
        rankingBtn.textContent = '📢 Mostrar Podio';
        rankingBtn.style.background = 'var(--yellow)';
      }
    }
  }

  async function togglePodiumVisibility() {
    const user = Auth.getCurrentUser();
    if (!user || user.role !== 'admin') {
      await showCustomAlert({
        title: 'Acceso Restringido',
        message: 'Solo los administradores pueden cambiar la visibilidad del podio oficial.',
        icon: '🔒'
      });
      return;
    }

    const nextState = !isPodiumVisible;
    isPodiumVisible = await Storage.setPodiumStatus(nextState);
    updatePodiumControlsUI(isPodiumVisible);
    await renderLeaderboard();
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

    // Actualizar controles de podio
    isPodiumVisible = await Storage.getPodiumStatus();
    updatePodiumControlsUI(isPodiumVisible);

    // Renderizar analítica de casos críticos
    await renderErrorAnalytics();

    // Sincronizar monitor en vivo inmediatamente con el estado del backend
    await updateLiveMonitor();
  }

  async function renderErrorAnalytics() {
    const tableBody = document.getElementById('top-error-cases-table');
    if (!tableBody) return;

    const data = await Storage.getErrorAnalytics();
    const cases = data.topErrorCases || [];

    if (cases.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:16px;">No hay evaluaciones con errores registradas aún.</td></tr>`;
      return;
    }

    tableBody.innerHTML = cases.map((c, index) => {
      let badgeStyle = 'background:#e8f8f0; color:#27ae60; font-weight:700;';
      if (c.severity === 'ALTA') {
        badgeStyle = 'background:#fee2e2; color:#ef4444; font-weight:800;';
      } else if (c.severity === 'MEDIA') {
        badgeStyle = 'background:#fef3c7; color:#d97706; font-weight:800;';
      }

      const commonErrorsHtml = (c.commonErrors && c.commonErrors.length > 0)
        ? c.commonErrors.map(e => `<div style="font-size:11px; color:var(--text-dark); margin-bottom:2px;">• <span style="color:#b91c1c;">${escapeHtml(e.message)}</span> <b>(${e.count}×)</b></div>`).join('')
        : '<span style="color:var(--text-muted); font-size:11px;">Sin errores registrados</span>';

      return `
        <tr>
          <td><span class="rank-badge rank-other">#${index + 1}</span></td>
          <td><b>${c.caseCode}</b></td>
          <td style="max-width:260px; font-size:12px; font-weight:600;">${escapeHtml(c.caseTitle)}</td>
          <td style="text-align:center;"><b>${c.attempts}</b></td>
          <td style="text-align:center;"><span style="color:var(--danger); font-weight:800; font-size:14px;">${c.totalErrors}</span></td>
          <td style="text-align:center; font-weight:700;">${c.errorRate}</td>
          <td style="text-align:center;"><span class="badge" style="${badgeStyle}; padding:4px 8px;">${c.severity}</span></td>
          <td style="max-width:320px;">${commonErrorsHtml}</td>
        </tr>
      `;
    }).join('');
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
          if (data && data.type === 'PODIUM_STATUS_CHANGED') {
            isPodiumVisible = Boolean(data.podiumVisible);
            updatePodiumControlsUI(isPodiumVisible);
            renderLeaderboard();
          } else if (data && (data.step || data.advisor)) {
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

  // ================= SINCRONIZACIÓN EN TIEMPO REAL CON FIREBASE CLOUD =================
  function initFirebaseRealtimeListeners() {
    const fb = window.UyapayServices && window.UyapayServices.Firebase;
    const cloudBadge = document.getElementById('firebase-cloud-badge');

    if (fb && fb.isConfigured()) {
      const ready = fb.init();
      if (ready) {
        if (cloudBadge) {
          cloudBadge.style.display = 'inline-flex';
          cloudBadge.textContent = '☁️ Firebase Cloud';
          cloudBadge.style.background = '#ecfdf5';
          cloudBadge.style.color = '#059669';
          cloudBadge.style.borderColor = '#a7f3d0';
        }

        // 1. Escuchar cambios de podio en tiempo real (Asesores y Admin)
        fb.onPodiumStatusChange(async (visible) => {
          console.log('🔥 [Firebase Realtime] Estado del podio recibido:', visible);
          isPodiumVisible = visible;
          updatePodiumControlsUI(visible);
          await renderLeaderboard();
        });

        // 2. Escuchar resultados en tiempo real (Para el Administrador y Ranking)
        fb.onResultsChange(async (cloudResults) => {
          console.log(`🔥 [Firebase Realtime] ${cloudResults.length} resultados actualizados en la nube.`);
          await renderLeaderboard();

          const currentUser = Auth.getCurrentUser();
          if (currentUser) {
            if (currentUser.role === 'admin') {
              await renderAdminDashboard();
              await renderResultsTable('admin-results-table');
            } else {
              await renderResultsTable('asesor-results-table', currentUser.username);
            }
          }
        });

        // 3. Escuchar monitor en vivo en la nube
        fb.onLiveEvent((liveData) => {
          if (liveData) {
            applyLiveStatus(liveData);
            if (liveData.detail) {
              appendLiveFeed(liveData, true);
            }
          }
        });

        return;
      }
    }

    // Si Firebase no está configurado aún con credenciales reales:
    if (cloudBadge) {
      cloudBadge.style.display = 'inline-flex';
      cloudBadge.textContent = '💾 Modo Local';
      cloudBadge.style.background = '#f1f5f9';
      cloudBadge.style.color = '#64748b';
      cloudBadge.style.borderColor = '#cbd5e1';
      cloudBadge.title = 'Configura Firebase en js/services/firebase-config.js para habilitar tiempo real en la nube';
    }
  }

  // ================= RANKING GENERAL Y PODIO (RF-MVP-042 A 047) =================
  async function renderLeaderboard() {
    isPodiumVisible = await Storage.getPodiumStatus();
    updatePodiumControlsUI(isPodiumVisible);

    const currentUser = Auth.getCurrentUser();
    const isAdmin = currentUser && currentUser.role === 'admin';

    const lockedCard = document.getElementById('podium-locked-state');
    const activeContainer = document.getElementById('podium-active-container');
    const rankingAdminControls = document.getElementById('ranking-admin-controls');

    if (rankingAdminControls) {
      rankingAdminControls.style.display = isAdmin ? 'inline-flex' : 'none';
    }

    // Si es un asesor y el podio NO está publicado por el administrador: mostrar estado bloqueado
    if (!isAdmin && !isPodiumVisible) {
      if (lockedCard) lockedCard.style.display = 'block';
      if (activeContainer) activeContainer.style.display = 'none';
      return;
    }

    // Si es administrador O si el podio fue publicado oficialmente para los asesores
    if (lockedCard) lockedCard.style.display = 'none';
    if (activeContainer) activeContainer.style.display = 'block';

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
              <div class="podium-advisor">${escapeHtml(top2.advisorName || top2.username)}</div>
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
              <div class="podium-advisor">${escapeHtml(top1.advisorName || top1.username)}</div>
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
              <div class="podium-advisor">${escapeHtml(top3.advisorName || top3.username)}</div>
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
            <td><b>${escapeHtml(item.advisorName || item.username)}</b></td>
            <td>${escapeHtml(item.caseTitle)}</td>
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

    const isAdminTable = tableId === 'admin-results-table';

    if (data.length === 0) {
      const colSpan = isAdminTable ? 7 : 6;
      tableBody.innerHTML = `<tr><td colspan="${colSpan}" style="text-align:center; color:var(--text-muted); padding:20px;">No hay evaluaciones registradas aún.</td></tr>`;
      return;
    }

    tableBody.innerHTML = data.map(item => {
      const badgeClass = item.status === 'Aprobado' ? 'badge-success' : 'badge-danger';
      const auditCol = isAdminTable
        ? `<td style="text-align:center;">
             <button class="btn-secondary" style="font-size:11px; padding:4px 10px; width:auto; cursor:pointer;" onclick="window.UyapayPortal.showAdminErrorDetails('${item.id}')">
               🔍 Ver Detalle (${item.errors} err)
             </button>
           </td>`
        : '';

      const displayTitle = isAdminTable ? item.caseTitle : getCleanCaseTitle({ title: item.caseTitle });
      return `
        <tr>
          <td><b>${escapeHtml(item.advisorName || item.username)}</b></td>
          <td>${escapeHtml(displayTitle)}</td>
          <td><span class="badge ${badgeClass}">${item.score}</span></td>
          <td>${item.errors} errores</td>
          <td><span class="badge ${badgeClass}">${item.status}</span></td>
          <td style="font-size:12px; color:var(--text-muted);">${item.completedAt} (⏱️ ${item.formattedDuration || '00:00'})</td>
          ${auditCol}
        </tr>
      `;
    }).join('');
  }

  // ================= AUDITORÍA DE ERRORES EXCLUSIVA ADMIN =================
  async function showAdminErrorDetails(resultId) {
    const currentUser = Auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      await showCustomAlert({
        title: 'Acceso Restringido',
        message: 'Acceso restringido únicamente a administradores.',
        icon: '🔒'
      });
      return;
    }

    const results = await Storage.getResults();
    const result = results.find(r => r.id === resultId);
    if (!result) {
      await showCustomAlert({
        title: 'No Encontrado',
        message: 'Evaluación no encontrada en los registros.',
        icon: '🔍'
      });
      return;
    }

    const modal = document.getElementById('admin-error-detail-modal');
    if (!modal) return;

    document.getElementById('modal-audit-subtitle').textContent =
      `Asesor: ${result.advisorName || result.username} • Fecha: ${result.completedAt}`;

    const summaryEl = document.getElementById('modal-audit-summary');
    const badgeClass = result.status === 'Aprobado' ? 'badge-success' : 'badge-danger';
    summaryEl.innerHTML = `
      <div class="personal-meta-card" style="flex:1; min-width:120px;">
        <div class="personal-meta-label">Puntaje Final</div>
        <div class="personal-meta-val"><span class="badge ${badgeClass}" style="font-size:13px;">${result.score}</span></div>
      </div>
      <div class="personal-meta-card" style="flex:1; min-width:120px;">
        <div class="personal-meta-label">Tiempo Total</div>
        <div class="personal-meta-val">⏱️ ${result.formattedDuration || '00:00'}</div>
      </div>
      <div class="personal-meta-card" style="flex:1; min-width:120px;">
        <div class="personal-meta-label">Total Errores</div>
        <div class="personal-meta-val" style="color:var(--danger);">${result.errors}</div>
      </div>
      <div class="personal-meta-card" style="flex:1; min-width:120px;">
        <div class="personal-meta-label">Estado Global</div>
        <div class="personal-meta-val">${result.status}</div>
      </div>
    `;

    const casesListEl = document.getElementById('modal-audit-cases-list');
    const casesDetails = result.casesDetails || [];

    if (casesDetails.length > 0) {
      casesListEl.innerHTML = casesDetails.map((cs, idx) => {
        const errorLogs = (cs.actionsLog || []).filter(a => a.type === 'ERROR');
        const caseStatusBadge = cs.completed
          ? `<span class="badge badge-success" style="font-size:11px;">Completado (${cs.score || '20/20'})</span>`
          : `<span class="badge badge-danger" style="font-size:11px;">No completado (${cs.score || '0/20'})</span>`;

        let errorDetailsHtml = '';
        if (errorLogs.length > 0) {
          errorDetailsHtml = errorLogs.map(err => `
            <div class="audit-error-item">
              <div class="audit-error-time">⏱️ ${err.time || ''} • Paso: ${escapeHtml(err.step || 'Validación')}</div>
              <div class="audit-error-desc">❌ ${escapeHtml(err.detail || 'Acción errónea o fuera de secuencia')}</div>
            </div>
          `).join('');
        } else {
          errorDetailsHtml = `<div style="color:var(--success); font-size:12px; padding:10px 14px;">✓ Sin errores registrados en este caso.</div>`;
        }

        return `
          <div class="audit-case-card">
            <div class="audit-case-header">
              <span><b>Caso ${idx + 1} (${cs.caseCode || 'B2C'}):</b> ${escapeHtml(cs.client || cs.caseTitle || '')}</span>
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:11px; color:var(--text-muted);">${cs.errors || 0} error(es)</span>
                ${caseStatusBadge}
              </div>
            </div>
            ${errorDetailsHtml}
          </div>
        `;
      }).join('');
    } else {
      // Si fue evaluación previa o monocaso, revisar interactions
      const interactions = result.interactions || [];
      const errorLogs = interactions.filter(a => a.type === 'ERROR');
      if (errorLogs.length > 0) {
        casesListEl.innerHTML = errorLogs.map(err => `
          <div class="audit-error-item">
            <div class="audit-error-time">⏱️ ${err.time || ''} • ${escapeHtml(err.step || 'Error')}</div>
            <div class="audit-error-desc">❌ ${escapeHtml(err.detail || 'Falla')}</div>
          </div>
        `).join('');
      } else {
        casesListEl.innerHTML = `<div style="color:var(--success); font-size:13px; padding:16px; text-align:center;">✓ El asesor no cometió ningún error en esta evaluación.</div>`;
      }
    }

    modal.style.display = 'flex';
    modal.classList.add('active');
  }

  function closeAuditModal() {
    const modal = document.getElementById('admin-error-detail-modal');
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
    }
  }

  // ================= EVALUACIÓN MULTI-CASO EN PESTAÑAS (5 CASOS) =================
  let evaluationCases = [];
  let currentActiveTab = 0;

  /**
   * Selección balanceada de 5 casos estratificados por áreas de competencia:
   * 1. Venta Regular & Catálogo Base (B2C-01, B2C-02, B2C-03, B2C-04)
   * 2. Reglas Comerciales, Listas de Precio & Moneda (B2C-06, B2C-08, B2C-09, B2C-10, B2C-11, B2C-14)
   * 3. Promociones, Bonificaciones & Exclusión Mutua (B2C-07, B2C-20, B2C-21)
   * 4. Gestión de Ruta, Historial & Justificaciones (B2C-15, B2C-16, B2C-17, B2C-22)
   * 5. Cobranzas, Cotizaciones & Cierre Operativo (B2C-05, B2C-18, B2C-19, B2C-23)
   * 
   * Incluye filtro anti-repetición respecto al último intento del asesor.
   */
  function selectFiveEvaluationCases() {
    // Casos Oficiales de Evaluación Práctica UYAPAY Asesor B2C
    // Secuencia fija sin shuffle (CP-05 a CP-09)
    const fixedEvaluationCaseIds = ['case-cp05', 'case-cp06', 'case-cp07', 'case-cp08', 'case-cp09'];
    const selectedCases = fixedEvaluationCaseIds
      .map(id => Cases.find(c => c.id === id || c.code === id.replace('case-', '').toUpperCase() || (c.aliases && c.aliases.includes(id))))
      .filter(Boolean);

    if (selectedCases.length === 5) {
      return selectedCases;
    }
    // Fallback de seguridad si no se encuentran
    return Cases.slice(0, 5);
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

  function getCleanCaseTitle(c) {
    if (!c) return 'Situación Comercial';
    if (c.publicTitle) return c.publicTitle;
    let t = c.title || '';
    t = t.replace(/^Caso\s*\d+\s*:\s*/i, '');
    t = t.replace(/\[.*?\]\s*/g, '');
    t = t.replace(/B2C-\d+\s*[:-]?\s*/gi, '');
    return t.trim() || 'Atención Comercial';
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
          <span>Caso ${index + 1}</span>
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
        detail: `Cargó situación para ${activeCase.client}`,
        type: 'INFO',
        errors: Evaluator.getActiveEvaluation() ? Evaluator.getActiveEvaluation().totalErrors : 0
      });
    }

    // Actualizar encabezados y panel de situación (sin revelar códigos internos ni trampas)
    const caseOrdinalBadgeEl = document.getElementById('case-ordinal-badge');
    const caseCodeEl = document.getElementById('case-code');
    const moduleBadgeEl = document.getElementById('case-module-badge');
    const tabStatusEl = document.getElementById('case-tab-status');
    const titleEl = document.getElementById('case-title');
    const clientNameEl = document.getElementById('case-client-name');
    const clientAddressEl = document.getElementById('case-client-address');
    const addressContainer = document.getElementById('case-address-container');
    const instructionsEl = document.getElementById('case-instructions');

    if (caseOrdinalBadgeEl) caseOrdinalBadgeEl.textContent = `Caso ${tabIndex + 1} de 5`;
    if (caseCodeEl) caseCodeEl.textContent = `Caso ${tabIndex + 1} de 5`;
    if (moduleBadgeEl) moduleBadgeEl.textContent = activeCase.module || 'Ventas B2C';
    if (titleEl) titleEl.textContent = getCleanCaseTitle(activeCase);
    if (clientNameEl) clientNameEl.textContent = activeCase.client || 'Cliente en ruta';
    if (clientAddressEl) clientAddressEl.textContent = activeCase.clientAddress || 'En ruta asignada';
    if (addressContainer) addressContainer.style.display = activeCase.clientAddress ? 'flex' : 'none';
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

    // Actualizar botones de navegación: exactamente 50% cada uno, uniforme y con disabled en inactivo
    const btnPrev = document.getElementById('btn-prev-tab');
    const btnNext = document.getElementById('btn-next-tab');
    const btnFinish = document.getElementById('btn-finish-exam');
    const isLastTab = tabIndex === evaluationCases.length - 1;

    if (btnPrev) {
      btnPrev.style.display = 'inline-flex';
      btnPrev.style.visibility = 'visible';
      btnPrev.disabled = (tabIndex === 0);
    }

    if (isLastTab) {
      if (btnNext) btnNext.style.display = 'none';
      if (btnFinish) {
        btnFinish.style.display = 'inline-flex';
        btnFinish.disabled = false;
      }
    } else {
      if (btnNext) {
        btnNext.style.display = 'inline-flex';
        btnNext.disabled = false;
      }
      if (btnFinish) {
        btnFinish.style.display = 'none';
      }
    }

    // Refrescar clases de tabs
    renderEvaluationTabs();

    // Cargar o conmutar simulador móvil sin recargar iframe para eliminar parpadeo blanco
    const frame = document.getElementById('simulador-frame');
    if (frame && user) {
      const targetUrl = `simulator.html?user=${encodeURIComponent(user.username)}&case=${activeCase.id}&tab=${tabIndex}&autologin=1&v=2.4`;
      
      let isAlreadyLoaded = false;
      try {
        isAlreadyLoaded = Boolean(
          frame.dataset.loaded === 'true' &&
          frame.contentWindow &&
          frame.contentWindow.location.href.includes('simulator.html')
        );
      } catch (e) {
        isAlreadyLoaded = Boolean(frame.dataset.loaded === 'true' && frame.contentWindow);
      }

      if (isAlreadyLoaded) {
        // Conmutación instantánea en caliente sin recargar el iframe
        frame.contentWindow.postMessage({
          type: 'PORTAL_SET_CASE',
          caseId: activeCase.id,
          tabIndex: tabIndex,
          username: user.username
        }, '*');
      } else {
        // Carga inicial o recuperación limpia con token de tiempo para evitar about:blank
        frame.onload = () => {
          frame.dataset.loaded = 'true';
        };
        frame.src = `${targetUrl}&_t=${Date.now()}`;
      }
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

  async function cancelExam() {
    const confirmed = await showCustomConfirm({
      title: '¿Cancelar Evaluación?',
      message: '¿Estás seguro de cancelar la evaluación?\nSe perderá el avance de los 5 casos prácticos.',
      icon: '⚠️',
      confirmText: 'Sí, Cancelar',
      cancelText: 'Continuar Examen',
      confirmDanger: true
    });
    if (!confirmed) return;

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

    // Notificar al simulador para que limpie su estado sin destruir el iframe
    const frame = document.getElementById('simulador-frame');
    if (frame && frame.contentWindow) {
      frame.contentWindow.postMessage({
        type: 'PORTAL_RESET_SIMULATOR'
      }, '*');
    }

    document.getElementById('evaluation-arena').style.display = 'none';
    document.getElementById('top-navbar').style.display = 'flex';
    document.getElementById('asesor-eval-intro').classList.add('active');
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
            setTimeout(async () => {
              const confirmed = await showCustomConfirm({
                title: '¡5 Casos Completados!',
                message: '🎉 ¡Has completado los 5 casos de la evaluación!\n\n¿Deseas finalizar y enviar tu evaluación ahora?',
                icon: '🏆',
                confirmText: 'Finalizar y Enviar',
                cancelText: 'Revisar Casos'
              });
              if (confirmed) {
                finishFullExam();
              }
            }, 400);
          } else {
            // Avanzar automáticamente a la siguiente pestaña no completada
            const nextIncomplete = Evaluator.getAllCaseStates().findIndex((cs, i) => !cs.completed && i > currentTab);
            const targetTab = nextIncomplete !== -1 ? nextIncomplete : Evaluator.getAllCaseStates().findIndex(cs => !cs.completed);
            if (targetTab !== -1) {
              setTimeout(async () => {
                await showCustomAlert({
                  title: 'Caso Completado',
                  message: `✅ Caso ${currentTab + 1} completado. Avanzando al Caso ${targetTab + 1}.`,
                  icon: '✅'
                });
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
      const confirmed = await showCustomConfirm({
        title: 'Casos Incompletos',
        message: `Aún tienes ${incomplete} caso(s) sin completar.\n\n¿Estás seguro de enviar la evaluación ahora? Los casos no completados se calificarán con puntuación parcial.`,
        icon: '⚠️',
        confirmText: 'Enviar de Todos Modos',
        cancelText: 'Volver y Completar',
        confirmDanger: true
      });
      if (!confirmed) return;
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

    // Notificar al simulador para que limpie su estado sin destruir el iframe
    const frame = document.getElementById('simulador-frame');
    if (frame && frame.contentWindow) {
      frame.contentWindow.postMessage({
        type: 'PORTAL_RESET_SIMULATOR'
      }, '*');
    }

    document.getElementById('evaluation-arena').style.display = 'none';
    document.getElementById('top-navbar').style.display = 'flex';

    // Activar inmediatamente de fondo la vista de Ranking General & Podio (evita pantalla blanca)
    switchTab('ranking-view');

    const currentUser = Auth.getCurrentUser();
    if (currentUser && currentUser.role === 'admin') {
      await renderAdminDashboard();
    }

    // Mostrar modal exclusivo con los resultados personales y tiempo del asesor
    showPersonalResultModal(saved);
  }

  function showPersonalResultModal(result) {
    const modal = document.getElementById('personal-result-modal');
    if (!modal) return;

    const scoreEl = document.getElementById('modal-user-score');
    if (scoreEl) scoreEl.textContent = result.score || `${result.numericScore} / 20`;

    const statusBadge = document.getElementById('modal-user-status-badge');
    const badgeClass = result.status === 'Aprobado' ? 'badge-success' : 'badge-danger';
    if (statusBadge) {
      statusBadge.innerHTML = `<span class="badge ${badgeClass}" style="font-size:13px; padding:5px 14px;">${result.status}</span>`;
    }

    const timeEl = document.getElementById('modal-user-time');
    if (timeEl) timeEl.textContent = result.formattedDuration || '00:00';

    const casesEl = document.getElementById('modal-user-cases');
    if (casesEl) casesEl.textContent = `${result.completedCasesCount || 0} de ${result.totalCasesCount || 5}`;

    const errorsEl = document.getElementById('modal-user-errors');
    if (errorsEl) errorsEl.textContent = result.errors !== undefined ? result.errors : 0;

    const casesListEl = document.getElementById('modal-user-cases-list');
    const casesDetails = result.casesDetails || [];
    if (casesListEl) {
      if (casesDetails.length > 0) {
        casesListEl.innerHTML = casesDetails.map((cs, idx) => {
          const isComp = cs.completed;
          const rowClass = isComp ? 'completed' : 'failed';
          const errText = cs.errors === 0 ? 'Sin errores' : `${cs.errors} error(es)`;
          return `
            <div class="case-result-row ${rowClass}">
              <div>
                <b>Caso ${idx + 1}:</b> ${escapeHtml(cs.client ? `${cs.client} — ${getCleanCaseTitle({ title: cs.caseTitle })}` : getCleanCaseTitle({ title: cs.caseTitle }))}
                <div style="font-size:11px; color:var(--text-muted);">${errText}</div>
              </div>
              <div style="text-align:right;">
                <span class="badge ${isComp ? 'badge-success' : 'badge-danger'}">${cs.score || '20 / 20'}</span>
              </div>
            </div>
          `;
        }).join('');
      } else {
        casesListEl.innerHTML = '';
      }
    }

    modal.style.display = 'flex';
    modal.classList.add('active');
  }

  function closePersonalModal() {
    const modal = document.getElementById('personal-result-modal');
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
    }
    // Redirigir a la sección de Ranking y Podio
    switchTab('ranking-view');
  }

  function goToRanking() {
    closePersonalModal();
    switchTab('ranking-view');
  }

  function goToMyGrades() {
    closePersonalModal();
    switchTab('ranking-view');
  }

  // ================= EXPORTACIÓN DE REPORTES (CSV Y EXCEL) =================
  async function exportReport(format = 'csv') {
    const results = await Storage.getResults();
    if (!results || results.length === 0) {
      await showCustomAlert({
        title: 'Sin Evaluaciones',
        message: 'No hay evaluaciones registradas para exportar en este momento.',
        icon: '📊'
      });
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    if (format === 'csv') {
      const headers = [
        'ID_Evaluacion',
        'Asesor',
        'Usuario',
        'Caso_Codigo',
        'Caso_Titulo',
        'Calificacion',
        'Puntaje_Numerico',
        'Errores',
        'Max_Errores',
        'Estado',
        'Duracion_Segundos',
        'Tiempo_Formateado',
        'Fecha_Hora',
        'Detalle_Casos'
      ];

      const rows = results.map(r => {
        const details = (r.casesDetails || []).map(cd => `${cd.caseCode || 'B2C'}: ${cd.score || '20/20'} (${cd.errors || 0} err)`).join(' | ');
        return [
          r.id,
          `"${(r.advisorName || r.username || '').replace(/"/g, '""')}"`,
          `"${(r.username || '').replace(/"/g, '""')}"`,
          `"${(r.caseCode || '').replace(/"/g, '""')}"`,
          `"${(r.caseTitle || '').replace(/"/g, '""')}"`,
          `"${(r.score || '').replace(/"/g, '""')}"`,
          r.numericScore !== undefined ? r.numericScore : 20,
          r.errors !== undefined ? r.errors : 0,
          r.maxErrors !== undefined ? r.maxErrors : 2,
          `"${(r.status || '').replace(/"/g, '""')}"`,
          r.durationSeconds || 0,
          `"${(r.formattedDuration || '00:00').replace(/"/g, '""')}"`,
          `"${(r.completedAt || '').replace(/"/g, '""')}"`,
          `"${details.replace(/"/g, '""')}"`
        ].join(',');
      });

      // UTF-8 BOM (\uFEFF) para visualización correcta en Excel en español
      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `reporte_evaluaciones_uyapay_${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // Exportación a Excel nativo HTML Workbook (.xls)
      let tableHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
          <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Evaluaciones UYAPAY</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
          <style>
            table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
            th { background-color: #107c41; color: #ffffff; font-weight: bold; border: 1px solid #0b582e; padding: 8px; text-align: left; }
            td { border: 1px solid #dcdcdc; padding: 6px 8px; font-size: 12px; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .aprobado { background-color: #d4edda; color: #155724; font-weight: bold; }
            .desaprobado { background-color: #f8d7da; color: #721c24; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Reporte Oficial de Evaluaciones - UYAPAY B2C</h2>
          <p>Generado el: ${new Date().toLocaleString('es-PE')}</p>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Asesor</th>
                <th>Usuario</th>
                <th>Caso</th>
                <th>Calificación</th>
                <th>Puntaje</th>
                <th>Errores</th>
                <th>Estado</th>
                <th>Tiempo</th>
                <th>Fecha y Hora</th>
                <th>Detalle de los 5 Casos</th>
              </tr>
            </thead>
            <tbody>
      `;

      results.forEach(r => {
        const details = (r.casesDetails || []).map(cd => `${cd.caseCode || 'B2C'}: ${cd.score || '20/20'} (${cd.errors || 0} err)`).join(' | ');
        const statusClass = r.status === 'Aprobado' ? 'aprobado' : 'desaprobado';
        tableHtml += `
          <tr>
            <td>${escapeHtml(r.id)}</td>
            <td><b>${escapeHtml(r.advisorName || r.username)}</b></td>
            <td>${escapeHtml(r.username)}</td>
            <td>${escapeHtml(r.caseTitle || r.caseCode)}</td>
            <td><b>${escapeHtml(r.score)}</b></td>
            <td>${r.numericScore !== undefined ? r.numericScore : 20}</td>
            <td>${r.errors !== undefined ? r.errors : 0}</td>
            <td class="${statusClass}">${escapeHtml(r.status)}</td>
            <td>${escapeHtml(r.formattedDuration || '00:00')}</td>
            <td>${escapeHtml(r.completedAt)}</td>
            <td>${escapeHtml(details)}</td>
          </tr>
        `;
      });

      tableHtml += `
            </tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `reporte_evaluaciones_uyapay_${timestamp}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
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
    togglePodiumVisibility: togglePodiumVisibility,
    showAdminErrorDetails: showAdminErrorDetails,
    closeAuditModal: closeAuditModal,
    closePersonalModal: closePersonalModal,
    goToRanking: goToRanking,
    goToMyGrades: goToMyGrades,
    exportReport: exportReport,
    resetData: async () => {
      const confirmed = await showCustomConfirm({
        title: '¿Restablecer Base de Datos?',
        message: '¿Estás seguro de restablecer todos los registros y reiniciar el ranking general?',
        icon: '🗑️',
        confirmText: 'Sí, Restablecer',
        cancelText: 'Cancelar',
        confirmDanger: true
      });
      if (confirmed) {
        await Storage.resetAll();
        location.reload();
      }
    },
    handleDialogConfirm: handleDialogConfirm,
    handleDialogCancel: handleDialogCancel,
    dismissDialog: dismissDialog
  };
})();

