/**
 * Lógica principal del Portal UYAPAY (index.html)
 * Gestiona autenticación, navegación, panel de control, monitor en vivo vía SSE,
 * motor de evaluación desacoplado, cronómetro y ranking general con podio.
 */

(function() {
  window.UyapayPortal = window.UyapayPortal || {};
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
  function initApp() {
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

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
    const userInput = document.getElementById('username');
    const passInput = document.getElementById('password');
    const username = (userInput ? userInput.value : '').trim();
    let password = (passInput ? passInput.value : '').trim();
    if (!password) {
      password = '123';
    }
    const errorEl = document.getElementById('login-error');

    try {
      const result = await Auth.login(username, password);
      if (!result.success) {
        if (errorEl) {
          errorEl.textContent = result.message || 'Error al iniciar sesión.';
          errorEl.style.display = 'block';
        }
        return;
      }

      if (errorEl) errorEl.style.display = 'none';
      await applyUserSession(result.user);
    } catch (err) {
      console.error('[Login Error]', err);
      if (errorEl) {
        errorEl.textContent = err.message || 'Error inesperado al iniciar sesión.';
        errorEl.style.display = 'block';
      }
    }
  }

  window.UyapayPortal.login = handleLogin;

  function isUserStaff(user) {
    if (!user) return false;
    const roles = [user.role, ...(user.roles || [])].map(r => String(r).toLowerCase());
    return roles.some(r => ['admin', 'administrador', 'editor', 'revisor', 'supervisor', 'facilitador'].includes(r));
  }

  // ================= ARQUITECTURA DE NAVEGACIÓN GLOBAL (PRDv2 Sección 3) =================
  let currentMainMenu = 'resultados';
  let currentSubMenu = 'ranking-view';

  function getAuthorizedSubmenus(menuKey, user) {
    if (!user) return [];
    const isStaff = isUserStaff(user);
    const role = (user.role || '').toLowerCase();
    const isAdmin = role === 'admin' || role === 'administrador';
    const isRevisor = role === 'revisor' || role === 'supervisor';
    const isEditor = role === 'editor';

    // 1. CAPACITACIÓN
    if (menuKey === 'capacitacion') {
      return [
        { id: 'training-view', label: '📚 Módulos y Videos' },
        { id: 'onboarding-view', label: '🚀 Onboarding' },
        { id: 'knowledge-view', label: '💡 Base de Conocimiento' }
      ];
    }

    // 2. EVALUACIÓN
    if (menuKey === 'evaluacion') {
      const items = [
        { id: 'asesor-eval-intro', label: '📱 Simulador B2C' }
      ];
      if (isStaff) {
        items.push({ id: 'calendar-view', label: '📅 Calendario y Convocatorias' });
      } else {
        items.push({ id: 'calendar-view', label: '📅 Mi Calendario' });
      }
      return items;
    }

    // 3. RESULTADOS (con compatibilidad si se invoca como 'ranking' o 'admin')
    if (menuKey === 'resultados' || menuKey === 'ranking' || menuKey === 'admin') {
      const items = [
        { id: 'ranking-view', label: '🏆 Podio y Ranking' }
      ];
      if (!isStaff) {
        items.push({ id: 'asesor-notas', label: '📊 Mis Calificaciones' });
      } else {
        if (isAdmin || isRevisor) {
          items.push({ id: 'admin-dashboard', label: '📡 Monitor en Vivo' });
        }
        items.push({ id: 'admin-historial', label: '📋 Historial y Auditoría' });
        if (isAdmin) {
          items.push({ id: 'admin-mgmt-view', label: '👥 Usuarios y Roles' });
        }
      }
      return items;
    }

    return [];
  }

  function switchMainMenu(menuKey, targetSubId = null) {
    const normalizedKey = (menuKey === 'ranking' || menuKey === 'admin') ? 'resultados' : menuKey;
    currentMainMenu = normalizedKey;
    const user = Auth.getCurrentUser();

    // Actualizar clase activa en los 3 menús principales del Navbar
    document.querySelectorAll('#main-nav-links .nav-item').forEach(el => el.classList.remove('active'));
    const activeMainEl = document.getElementById(`main-nav-${normalizedKey}`) || document.getElementById(`main-nav-${menuKey}`);
    if (activeMainEl) activeMainEl.classList.add('active');

    // Renderizar Menú Secundario (Subnav Bar)
    const subnavBar = document.getElementById('subnav-bar');
    const subnavContainer = document.getElementById('subnav-links-container');
    const submenus = getAuthorizedSubmenus(normalizedKey, user);

    if (submenus.length > 0) {
      subnavBar.style.display = 'flex';
      const validSub = submenus.find(s => s.id === targetSubId);
      const activeSub = validSub ? validSub.id : submenus[0].id;

      subnavContainer.innerHTML = submenus.map(sub => `
        <div class="subnav-item ${sub.id === activeSub ? 'active' : ''}" id="subnav-item-${sub.id}" onclick="window.UyapayPortal.switchSubMenu('${sub.id}')">
          ${sub.label}
        </div>
      `).join('');

      switchSubMenu(activeSub, false);
    } else {
      subnavBar.style.display = 'none';
    }
  }

  function switchSubMenu(containerId, updatePill = true) {
    currentSubMenu = containerId;

    // Ocultar todos los contenedores principales y arena de evaluación
    document.querySelectorAll('.container').forEach(c => c.classList.remove('active'));
    const evalArena = document.getElementById('evaluation-arena');
    if (evalArena) evalArena.style.display = 'none';

    // Activar contenedor meta
    const target = document.getElementById(containerId);
    if (target) {
      target.classList.add('active');
    }

    if (updatePill) {
      document.querySelectorAll('#subnav-links-container .subnav-item').forEach(el => el.classList.remove('active'));
      const activePill = document.getElementById(`subnav-item-${containerId}`);
      if (activePill) activePill.classList.add('active');
    }

    // Refrescar vistas según pestaña activa
    const currentUser = Auth.getCurrentUser();
    if (containerId === 'ranking-view') {
      renderLeaderboard();
    } else if (containerId === 'admin-dashboard') {
      renderAdminDashboard();
    } else if (containerId === 'calendar-view') {
      renderCalendarView();
    } else if (containerId === 'admin-historial' && currentUser) {
      renderResultsTable('admin-results-table');
    } else if (containerId === 'asesor-notas' && currentUser) {
      renderResultsTable('asesor-results-table', currentUser.username);
    } else if (containerId === 'training-view') {
      renderTrainingView();
    } else if (containerId === 'onboarding-view') {
      renderOnboardingView();
    } else if (containerId === 'knowledge-view') {
      renderKnowledgeView();
    } else if (containerId === 'profile-view' && currentUser) {
      renderProfileView(currentUser);
    } else if (containerId === 'admin-mgmt-view') {
      renderAdminMgmtView();
    }
  }

  // Compatibilidad hacia atrás
  function switchTab(containerId) {
    if (containerId === 'ranking-view') {
      switchMainMenu('resultados', 'ranking-view');
    } else if (containerId === 'admin-dashboard') {
      switchMainMenu('resultados', 'admin-dashboard');
    } else if (containerId === 'admin-historial') {
      switchMainMenu('resultados', 'admin-historial');
    } else if (containerId === 'asesor-notas') {
      switchMainMenu('resultados', 'asesor-notas');
    } else if (containerId === 'admin-mgmt-view') {
      switchMainMenu('resultados', 'admin-mgmt-view');
    } else if (containerId === 'training-view') {
      switchMainMenu('capacitacion', 'training-view');
    } else if (containerId === 'onboarding-view') {
      switchMainMenu('capacitacion', 'onboarding-view');
    } else if (containerId === 'knowledge-view') {
      switchMainMenu('capacitacion', 'knowledge-view');
    } else if (containerId === 'asesor-eval-intro') {
      switchMainMenu('evaluacion', 'asesor-eval-intro');
    } else if (containerId === 'calendar-view') {
      switchMainMenu('evaluacion', 'calendar-view');
    } else {
      switchSubMenu(containerId);
    }
  }

  function showSection(sectionKey) {
    if (sectionKey === 'training') {
      switchMainMenu('capacitacion', 'training-view');
    } else if (sectionKey === 'evaluations' || sectionKey === 'eval') {
      switchMainMenu('evaluacion', 'asesor-eval-intro');
    } else if (sectionKey === 'results' || sectionKey === 'ranking') {
      switchMainMenu('resultados', 'ranking-view');
    }
  }

  async function applyUserSession(user) {
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('top-navbar').style.display = 'flex';
    document.getElementById('user-greeting').textContent = user.name ? user.name.split(' ')[0] : 'Usuario';
    document.getElementById('user-role-badge').textContent = (user.role || 'ASESOR').toUpperCase();

    // Sincronizar estado actual de publicación del podio
    isPodiumVisible = await Storage.getPodiumStatus();
    updatePodiumControlsUI(isPodiumVisible);

    const isStaff = isUserStaff(user);

    const rankingAdminControls = document.getElementById('ranking-admin-controls');
    if (rankingAdminControls) {
      rankingAdminControls.style.display = isStaff ? 'inline-flex' : 'none';
    }

    // Enrutamiento inicial por rol según PRDv2 (Flujo 1):
    // - Editor: Aterriza en Capacitación (Modo Edición)
    // - Participante, Revisor, Administrador: Aterrizan en Resultados (Podio y Ranking)
    if (user.role === 'editor') {
      switchMainMenu('capacitacion', 'training-view');
    } else {
      switchMainMenu('resultados', 'ranking-view');
    }

    await updateNavbarProfileBadges(user);
    await checkGatekeeperStatus(user);

    // Comprobar si hay una evaluación en curso activa (resiliencia ante F5)
    if (!isStaff) {
      await checkActiveEvaluationSession(user);
    }
  }

  // ================= DRAWER LATERAL DE PERFIL (FLUJO 8 PRDv2) =================
  async function toggleProfileDrawer() {
    const panel = document.getElementById('profile-drawer-panel');
    if (!panel) return;

    if (panel.classList.contains('open')) {
      closeProfileDrawer();
    } else {
      await openProfileDrawer();
    }
  }

  async function openProfileDrawer() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const backdrop = document.getElementById('profile-drawer-backdrop');
    const panel = document.getElementById('profile-drawer-panel');
    if (backdrop) backdrop.classList.add('active');
    if (panel) panel.classList.add('open');

    // Cargar datos en el drawer
    const nameEl = document.getElementById('drawer-user-name');
    const handleEl = document.getElementById('drawer-user-handle');
    const roleEl = document.getElementById('drawer-user-role');
    if (nameEl) nameEl.textContent = user.name || 'Asesor UYAPAY';
    if (handleEl) handleEl.textContent = '@' + (user.username || 'usuario');
    if (roleEl) roleEl.textContent = (user.role || 'asesor').toUpperCase();

    try {
      const profile = await safeApiFetch('/api/gamification/my-profile').catch(() => null);
      if (profile) {
        const xpEl = document.getElementById('drawer-xp-count');
        if (xpEl && profile.stats && profile.stats.globalPoints !== undefined) {
          xpEl.textContent = `⚡ ${profile.stats.globalPoints} XP`;
        }
        if (profile.badges && Array.isArray(profile.badges)) {
          const unlockedCount = profile.badges.filter(b => b.unlocked).length;
          const countEl = document.getElementById('drawer-badges-unlocked');
          if (countEl) countEl.textContent = `${unlockedCount} / ${profile.badges.length} Desbloqueadas`;
          
          const badgesListEl = document.getElementById('drawer-badges-list');
          if (badgesListEl) {
            badgesListEl.innerHTML = profile.badges.map(b => `
              <div style="background:${b.unlocked ? '#f8fafc' : '#f1f5f9'}; border:1px solid ${b.unlocked ? '#cbd5e1' : '#e2e8f0'}; border-radius:10px; padding:10px; text-align:center; opacity:${b.unlocked ? '1' : '0.55'};">
                <div style="font-size:24px;">${b.icon || '🏅'}</div>
                <div style="font-size:11px; font-weight:700; color:var(--text-dark); margin-top:4px;">${escapeHtml(b.name)}</div>
                <div style="font-size:9.5px; color:var(--text-muted); margin-top:2px;">${b.unlocked ? '✅ Conseguida' : '🔒 Bloqueada'}</div>
              </div>
            `).join('');
          }
        }
      }
    } catch (e) {
      console.warn('Error poblando drawer de perfil:', e);
    }
  }

  function closeProfileDrawer() {
    const backdrop = document.getElementById('profile-drawer-backdrop');
    const panel = document.getElementById('profile-drawer-panel');
    if (backdrop) backdrop.classList.remove('active');
    if (panel) panel.classList.remove('open');
  }

  function goToFullProfile() {
    closeProfileDrawer();
    const currentUser = Auth.getCurrentUser();
    if (currentUser) {
      document.querySelectorAll('.container').forEach(c => c.classList.remove('active'));
      const profileView = document.getElementById('profile-view');
      if (profileView) profileView.classList.add('active');
      renderProfileView(currentUser);
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
  let rawLeaderboardData = [];
  let currentAdvisorHistoryData = null;
  let currentActiveHistoryTab = 'all';
  let currentFeedbackTarget = null;

  function formatShortDate(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const mon = String(d.getMonth() + 1).padStart(2, '0');
      let hours = d.getHours();
      const mins = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12 || 12;
      return `${day}/${mon} ${hours}:${mins} ${ampm}`;
    } catch (e) {
      return String(dateStr);
    }
  }

  function launchConfetti() {
    const canvas = document.getElementById('podium-confetti-canvas');
    if (!canvas) return;
    canvas.style.display = 'block';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    const particles = [];
    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#fbbf24'];

    for (let i = 0; i < 140; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * (canvas.height * 0.4),
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 5,
        vy: Math.random() * 3 + 2,
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 8
      });
    }

    let frames = 0;
    function renderConfetti() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotSpeed;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });
      frames++;
      if (frames < 150) {
        requestAnimationFrame(renderConfetti);
      } else {
        canvas.style.display = 'none';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    renderConfetti();
  }

  // Actualizar métricas del panel de supervisión SSE (Flujo 9)
  async function updateSupervisorConsole() {
    try {
      const analytics = await Storage.getErrorAnalytics();
      if (!analytics) return;

      const totalEl = document.getElementById('telemetry-total-evals');
      const passedEl = document.getElementById('telemetry-passed-evals');
      const failedEl = document.getElementById('telemetry-failed-evals');
      const rateEl = document.getElementById('telemetry-pass-rate');

      if (totalEl) totalEl.textContent = analytics.totalEvaluations || 0;
      if (passedEl) passedEl.textContent = analytics.passedEvaluations || 0;
      if (failedEl) failedEl.textContent = analytics.failedEvaluations || 0;
      if (rateEl) rateEl.textContent = `${analytics.passRate || 0}%`;

      const criticalListEl = document.getElementById('telemetry-critical-cases-list');
      if (criticalListEl) {
        const cases = analytics.criticalCases || analytics.topErrorCases || [];
        if (cases.length === 0) {
          criticalListEl.innerHTML = `<div style="color:#94a3b8; font-size:12px;">Sin casos con errores registrados.</div>`;
        } else {
          criticalListEl.innerHTML = cases.slice(0, 4).map((c, idx) => `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; padding:3px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
              <div>
                <b>${idx + 1}. ${escapeHtml(c.caseCode || 'CP')}:</b> ${escapeHtml(c.caseTitle || '')}
              </div>
              <div style="font-weight:700; color:${c.severity === 'ALTA' ? '#ef4444' : (c.severity === 'MEDIA' ? '#f59e0b' : '#10b981')};">
                ➔ ${c.errorRate || 0} err/intento (${c.severity || 'BAJA'})
              </div>
            </div>
          `).join('');
        }
      }
    } catch (e) {}
  }

  // Actualizar el banner directo interactivo de evaluación (Flujo 2)
  async function updateDirectActionBanner(currentUser) {
    const banner = document.getElementById('ranking-direct-action-banner');
    if (!banner || !currentUser) return;

    try {
      const gk = await Storage.getGatekeeperStatus(currentUser.id || currentUser.username);
      if (gk && gk.has_blocking_evaluation) {
        banner.style.display = 'flex';
        banner.className = 'ranking-direct-banner active-pending';
        const titleEl = document.getElementById('ranking-direct-title');
        const subEl = document.getElementById('ranking-direct-subtitle');
        const btnEl = document.getElementById('btn-ranking-direct-start');
        if (titleEl) titleEl.textContent = `🚀 Evaluación Pendiente: ${gk.evaluation_title || 'Prueba Oficial'}`;
        if (subEl) subEl.textContent = 'Tienes una evaluación programada obligatoria. Pulsa el botón para rendirla ahora.';
        if (btnEl) btnEl.textContent = 'Iniciar Evaluación Programada ➔';
      } else {
        banner.style.display = 'flex';
        banner.className = 'ranking-direct-banner';
        const titleEl = document.getElementById('ranking-direct-title');
        const subEl = document.getElementById('ranking-direct-subtitle');
        const btnEl = document.getElementById('btn-ranking-direct-start');
        if (titleEl) titleEl.textContent = 'Simulador Móvil UYAPAY B2C';
        if (subEl) subEl.textContent = 'Sin evaluaciones pendientes en este momento. Puedes practicar libremente.';
        if (btnEl) btnEl.textContent = 'Practicar en Simulador ➔';
      }
    } catch (e) {
      banner.style.display = 'none';
    }
  }

  // Renderizar la sección "Agregados Recientemente" (Novedades de Capacitación - Flujo 2)
  async function renderRecentTrainingInRanking() {
    const container = document.getElementById('recent-training-cards-container');
    if (!container) return;

    try {
      const data = await Storage.getRecentTraining();
      const items = data.recentItems || [];

      if (items.length === 0) {
        container.innerHTML = `<div style="color:var(--text-muted); font-size:12px; text-align:center; padding:12px;">No hay materiales agregados recientemente.</div>`;
        return;
      }

      container.innerHTML = items.map(item => `
        <div class="recent-training-card" onclick="window.UyapayPortal.openRecentTraining('${item.moduleId}', '${item.id}')">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="font-size:11px; font-weight:700; color:#2563eb; background:#eff6ff; padding:2px 8px; border-radius:10px;">
              ${item.moduleIcon || '📁'} ${escapeHtml(item.moduleTitle || 'Módulo')}
            </span>
            <span style="font-size:11px; color:#64748b;">${escapeHtml(item.date || '')}</span>
          </div>
          <div style="font-size:13px; font-weight:700; color:#1e293b; margin:4px 0;">
            ${escapeHtml(item.title)}
          </div>
          <div style="font-size:11px; color:#64748b; display:flex; align-items:center; gap:4px;">
            <span>⏱️</span>
            <span>${escapeHtml(item.estimatedTime || '3 min')}</span>
          </div>
        </div>
      `).join('');
    } catch (e) {
      container.innerHTML = `<div style="color:var(--text-muted); font-size:12px; text-align:center;">No se pudieron cargar novedades.</div>`;
    }
  }

  function openRecentTraining(moduleId, videoId) {
    showSection('training');
  }

  // ================= RENDERIZADO PRINCIPAL DE RANKING Y PODIO =================
  async function renderLeaderboard() {
    isPodiumVisible = await Storage.getPodiumStatus();
    updatePodiumControlsUI(isPodiumVisible);

    const currentUser = Auth.getCurrentUser();
    const isSupervisorRole = currentUser && ['admin', 'administrador', 'revisor', 'editor', 'facilitador'].includes(currentUser.role.toLowerCase());
    const isRevisorOrAdmin = currentUser && ['admin', 'administrador', 'revisor'].includes(currentUser.role.toLowerCase());

    const lockedCard = document.getElementById('podium-locked-state');
    const activeContainer = document.getElementById('podium-active-container');
    const rankingAdminControls = document.getElementById('ranking-admin-controls');
    const supervisorConsole = document.getElementById('ranking-supervisor-console');
    const thActions = document.getElementById('th-supervision-actions');
    const btnExport = document.getElementById('btn-ranking-export');

    if (rankingAdminControls) {
      rankingAdminControls.style.display = isSupervisorRole ? 'inline-flex' : 'none';
    }

    if (supervisorConsole) {
      supervisorConsole.style.display = isRevisorOrAdmin ? 'block' : 'none';
      if (isRevisorOrAdmin) {
        await updateSupervisorConsole();
      }
    }

    if (thActions) {
      thActions.style.display = isSupervisorRole ? '' : 'none';
    }
    if (btnExport) {
      btnExport.style.display = isSupervisorRole ? 'inline-block' : 'none';
    }

    // Si es participante y el podio está oculto: mostrar pantalla de espera
    if (!isSupervisorRole && !isPodiumVisible) {
      if (lockedCard) lockedCard.style.display = 'block';
      if (activeContainer) activeContainer.style.display = 'none';
      return;
    }

    if (lockedCard) lockedCard.style.display = 'none';
    if (activeContainer) activeContainer.style.display = 'block';

    // Cargar novedades de capacitación y banner directo
    await renderRecentTrainingInRanking();
    if (currentUser) {
      await updateDirectActionBanner(currentUser);
    }

    rawLeaderboardData = await Storage.getLeaderboard();
    const podiumEl = document.getElementById('podium-wrapper');

    // 1. Renderizar Podio Olímpico Asimétrico Top 3 (1° al Centro, 2° a la Derecha, 3° a la Izquierda)
    if (podiumEl) {
      if (rawLeaderboardData.length === 0) {
        podiumEl.innerHTML = `<div style="color:var(--text-muted); text-align:center; padding:20px;">Aún no hay participantes registrados en el ranking.</div>`;
      } else {
        const top1 = rawLeaderboardData[0] || null;
        const top2 = rawLeaderboardData[1] || null;
        const top3 = rawLeaderboardData[2] || null;

        let html = '';

        // 🥉 3° Lugar (Izquierda, Menor Elevación)
        if (top3) {
          html += `
            <div class="podium-card olympic-card bronze-left">
              <div>
                <div class="olympic-medal-crown">🥉</div>
                <span class="olympic-laurel-badge">3° Lugar</span>
                <div class="olympic-advisor-name" title="${escapeHtml(top3.advisorName || top3.username)}">
                  ${top3.pinnedBadge ? top3.pinnedBadge.icon + ' ' : ''}${escapeHtml(top3.advisorName || top3.username)}
                </div>
                <div class="olympic-score-badge">${top3.numericScore !== undefined ? top3.numericScore + ' / 20' : top3.score}</div>
                <div style="font-size:12px; font-weight:700; color:#d97706;">${top3.totalXp || 0} XP Acumulados</div>
              </div>
              <div>
                <div class="olympic-meta-row">
                  <span>⏱️ ${top3.formattedDuration || '00:00'}</span>
                  <span>❌ ${top3.errors} err</span>
                  <span>🔄 ${top3.attempts || 1} int</span>
                </div>
                <div class="olympic-date-stamp">${formatShortDate(top3.completedAt)}</div>
              </div>
            </div>
          `;
        }

        // 🥇 1° Lugar (Centro, Más Elevado y Destacado)
        if (top1) {
          html += `
            <div class="podium-card olympic-card gold-center">
              <div>
                <div class="olympic-medal-crown">🥇</div>
                <span class="olympic-laurel-badge">🏆 1° Lugar (Oro)</span>
                <div class="olympic-advisor-name" title="${escapeHtml(top1.advisorName || top1.username)}">
                  ${top1.pinnedBadge ? top1.pinnedBadge.icon + ' ' : ''}${escapeHtml(top1.advisorName || top1.username)}
                </div>
                <div class="olympic-score-badge" style="color:#b45309;">${top1.numericScore !== undefined ? top1.numericScore + ' / 20' : top1.score}</div>
                <div style="font-size:13px; font-weight:800; color:#b45309;">${top1.totalXp || 0} XP Acumulados</div>
              </div>
              <div>
                <div class="olympic-meta-row" style="color:#854d0e; font-weight:600;">
                  <span>⏱️ ${top1.formattedDuration || '00:00'}</span>
                  <span>❌ ${top1.errors} err</span>
                  <span>🔄 ${top1.attempts || 1} int</span>
                </div>
                <div class="olympic-date-stamp">${formatShortDate(top1.completedAt)}</div>
              </div>
            </div>
          `;
        }

        // 🥈 2° Lugar (Derecha, Altura Media)
        if (top2) {
          html += `
            <div class="podium-card olympic-card silver-right">
              <div>
                <div class="olympic-medal-crown">🥈</div>
                <span class="olympic-laurel-badge">2° Lugar</span>
                <div class="olympic-advisor-name" title="${escapeHtml(top2.advisorName || top2.username)}">
                  ${top2.pinnedBadge ? top2.pinnedBadge.icon + ' ' : ''}${escapeHtml(top2.advisorName || top2.username)}
                </div>
                <div class="olympic-score-badge" style="color:#475569;">${top2.numericScore !== undefined ? top2.numericScore + ' / 20' : top2.score}</div>
                <div style="font-size:12px; font-weight:700; color:#475569;">${top2.totalXp || 0} XP Acumulados</div>
              </div>
              <div>
                <div class="olympic-meta-row">
                  <span>⏱️ ${top2.formattedDuration || '00:00'}</span>
                  <span>❌ ${top2.errors} err</span>
                  <span>🔄 ${top2.attempts || 1} int</span>
                </div>
                <div class="olympic-date-stamp">${formatShortDate(top2.completedAt)}</div>
              </div>
            </div>
          `;
        }

        podiumEl.innerHTML = html;
      }
    }

    // 2. Renderizar Tabla General de Posiciones con fila sticky del usuario
    renderLeaderboardRows(rawLeaderboardData, isSupervisorRole, currentUser);
  }

  function renderLeaderboardRows(items, isSupervisorRole, currentUser) {
    const tableBody = document.getElementById('leaderboard-results-table');
    if (!tableBody) return;

    if (items.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="${isSupervisorRole ? 5 : 4}" style="text-align:center; color:var(--text-muted); padding:24px;">No hay evaluaciones que coincidan con la búsqueda.</td></tr>`;
      return;
    }

    const currentUsername = currentUser ? (currentUser.username || '').toLowerCase() : '';

    tableBody.innerHTML = items.map(item => {
      let badgeRankClass = 'rank-other';
      if (item.rank === 1) badgeRankClass = 'rank-1';
      else if (item.rank === 2) badgeRankClass = 'rank-2';
      else if (item.rank === 3) badgeRankClass = 'rank-3';

      const isSelf = currentUsername && (item.username || '').toLowerCase() === currentUsername;
      const rowSelfClass = isSelf ? 'ranking-row-self' : '';

      return `
        <tr class="${rowSelfClass}">
          <td><span class="rank-badge ${badgeRankClass}">#${item.rank}</span></td>
          <td>
            <div style="display:flex; align-items:center; gap:8px;">
              <span>${item.pinnedBadge ? item.pinnedBadge.icon : '👤'}</span>
              <b>${escapeHtml(item.advisorName || item.username)}</b>
              ${isSelf ? '<span class="badge" style="background:#10b981; color:#fff; font-size:10px; padding:2px 8px; border-radius:10px;">Tú</span>' : ''}
            </div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">
              ⏱️ ${item.formattedDuration || '00:00'} | ❌ ${item.errors} err | 🔄 ${item.attempts || 1} int
            </div>
          </td>
          <td>
            <button class="ranking-score-clickable" onclick="window.UyapayPortal.handleScoreClick('${item.userId || item.username}', '${escapeHtml(item.username)}')" title="Clic para ver desglose de evaluaciones">
              <span>🏆 ${item.totalXp || 0} XP</span>
              <span style="font-size:11px; opacity:0.8;">(${item.numericScore !== undefined ? item.numericScore + '/20' : item.score})</span>
              <span>🔍</span>
            </button>
          </td>
          <td style="font-size:12px; color:var(--text-muted);">${formatShortDate(item.completedAt)}</td>
          ${isSupervisorRole ? `
            <td style="text-align:center;">
              <button class="btn-secondary" style="font-size:11px; padding:4px 8px; margin-right:4px;" onclick="window.UyapayPortal.openFeedbackModal('SUGGESTION', '${item.userId || item.username}', '${escapeHtml(item.advisorName)}')">💡 Sugerir</button>
              <button class="btn-secondary" style="font-size:11px; padding:4px 8px;" onclick="window.UyapayPortal.openFeedbackModal('CONGRATULATION', '${item.userId || item.username}', '${escapeHtml(item.advisorName)}')">🎉 Felicitar</button>
            </td>
          ` : ''}
        </tr>
      `;
    }).join('');
  }

  function filterLeaderboardTable(query) {
    const clean = (query || '').toLowerCase().trim();
    const currentUser = Auth.getCurrentUser();
    const isSupervisorRole = currentUser && ['admin', 'administrador', 'revisor', 'editor', 'facilitador'].includes(currentUser.role.toLowerCase());

    if (!clean) {
      renderLeaderboardRows(rawLeaderboardData, isSupervisorRole, currentUser);
      return;
    }

    const filtered = rawLeaderboardData.filter(item => 
      (item.advisorName || '').toLowerCase().includes(clean) ||
      (item.username || '').toLowerCase().includes(clean)
    );
    renderLeaderboardRows(filtered, isSupervisorRole, currentUser);
  }

  function startScheduledFromRanking() {
    showSection('evaluations');
  }

  function exportLeaderboardExcel() {
    const token = (typeof Auth !== 'undefined' && Auth.getToken) ? Auth.getToken() : null;
    const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
    window.location.href = `/api/admin/export?format=excel${tokenParam}`;
  }

  // ================= MODAL NIVEL 1: HISTORIAL DE EVALUACIONES =================
  async function handleScoreClick(targetId, targetUsername) {
    const currentUser = Auth.getCurrentUser();
    if (!currentUser) return;

    const isSupervisorRole = ['admin', 'administrador', 'revisor', 'editor', 'facilitador'].includes(currentUser.role.toLowerCase());
    const isSelf = (currentUser.username || '').toLowerCase() === (targetUsername || '').toLowerCase();

    if (!isSelf && !isSupervisorRole) {
      await showCustomAlert({
        title: 'Control de Privacidad',
        message: 'Por normas de seguridad y privacidad, los participantes solo pueden auditar su propio historial personal de evaluaciones.',
        icon: '🔒'
      });
      return;
    }

    await openAdvisorHistory(targetId || targetUsername);
  }

  async function openAdvisorHistory(advisorId) {
    const modal = document.getElementById('modal-advisor-history');
    if (!modal) return;

    modal.style.display = 'flex';
    const container = document.getElementById('hist-modal-list-container');
    if (container) {
      container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted);">Cargando historial forense...</div>`;
    }

    const data = await Storage.getAdvisorHistory(advisorId);
    if (!data || !data.success) {
      if (container) container.innerHTML = `<div style="color:var(--danger); text-align:center; padding:20px;">${escapeHtml((data && data.message) || 'Error al obtener historial.')}</div>`;
      return;
    }

    currentAdvisorHistoryData = data;
    currentActiveHistoryTab = 'all';

    // Rellenar cabecera y resumen
    const nameEl = document.getElementById('hist-modal-advisor-name');
    const roleEl = document.getElementById('hist-modal-advisor-role');
    const xpEl = document.getElementById('hist-modal-total-xp');
    const simEl = document.getElementById('hist-modal-sim-count');
    const quizEl = document.getElementById('hist-modal-quiz-count');
    const theoEl = document.getElementById('hist-modal-theo-count');

    if (nameEl) nameEl.textContent = `Historial de Evaluaciones: ${data.advisor.name || data.advisor.username}`;
    if (roleEl) roleEl.textContent = `Rol: ${data.advisor.role.toUpperCase()} | Usuario: @${data.advisor.username}`;
    if (xpEl) xpEl.textContent = `${data.summary.consolidatedXp || 0} XP`;
    if (simEl) simEl.textContent = `${data.summary.simulatorCount || 0} evals`;
    if (quizEl) quizEl.textContent = `${data.summary.quizzesPassed || 0} aprobados`;
    if (theoEl) theoEl.textContent = `${data.summary.theoreticalPassed || 0} aprobados`;

    renderHistoryTabContent('all');
  }

  function filterHistoryTab(tab) {
    currentActiveHistoryTab = tab;
    ['all', 'sim', 'quiz', 'theo'].forEach(t => {
      const btn = document.getElementById(`tab-filter-${t}`);
      if (btn) btn.classList.toggle('active', t === tab);
    });
    renderHistoryTabContent(tab);
  }

  function renderHistoryTabContent(tab) {
    if (!currentAdvisorHistoryData) return;
    const container = document.getElementById('hist-modal-list-container');
    if (!container) return;

    const evals = currentAdvisorHistoryData.evaluations || {};
    let list = [];

    if (tab === 'all') {
      list = [
        ...(evals.simulator || []),
        ...(evals.quizzes || []),
        ...(evals.questionnaires || [])
      ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    } else if (tab === 'sim') {
      list = evals.simulator || [];
    } else if (tab === 'quiz') {
      list = evals.quizzes || [];
    } else if (tab === 'theo') {
      list = evals.questionnaires || [];
    }

    if (list.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted); font-size:13px;">No hay evaluaciones registradas en esta categoría.</div>`;
      return;
    }

    container.innerHTML = list.map(item => {
      let typeBadge = '';
      let typeCode = '';
      if (item.type === 'SIMULATOR') {
        typeBadge = `<span class="badge" style="background:#0284c7; color:#fff; font-size:11px;">📱 Simulador Móvil</span>`;
        typeCode = 'simulator';
      } else if (item.type === 'QUIZ') {
        typeBadge = `<span class="badge" style="background:#8b5cf6; color:#fff; font-size:11px;">🎓 Quiz Kahoot</span>`;
        typeCode = 'quiz';
      } else {
        typeBadge = `<span class="badge" style="background:#d97706; color:#fff; font-size:11px;">📝 Cuestionario Teórico</span>`;
        typeCode = 'questionnaire';
      }

      const isPassed = (item.status === 'Aprobado' || item.passed);
      const statusBadge = `<span class="badge ${isPassed ? 'badge-success' : 'badge-danger'}" style="font-size:11px;">${isPassed ? 'Aprobado' : 'Desaprobado'}</span>`;

      return `
        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:12px 16px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
              ${typeBadge}
              ${statusBadge}
              <span style="font-size:11px; color:#64748b;">${formatShortDate(item.date)}</span>
            </div>
            <div style="font-size:14px; font-weight:700; color:#1e293b;">
              ${escapeHtml(item.title || item.code || 'Evaluación')}
            </div>
            <div style="font-size:12px; color:#64748b; margin-top:2px;">
              Nota: <b>${item.score || 0}</b> | ${item.duration ? `⏱️ ${item.duration} | ` : ''} ${item.errors !== undefined ? `❌ ${item.errors} errores` : ''} ${item.xpEarned ? `| ⭐ +${item.xpEarned} XP` : ''}
            </div>
          </div>
          <div>
            <button class="btn-secondary" style="font-size:12px; padding:6px 14px;" onclick="window.UyapayPortal.openEvaluationAudit('${typeCode}', '${item.id}')">
              Ver Detalle Completo ➔
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function closeAdvisorHistoryModal() {
    const modal = document.getElementById('modal-advisor-history');
    if (modal) modal.style.display = 'none';
  }

  // ================= MODAL NIVEL 2: AUDITORÍA FORENSE ÍTEM POR ÍTEM =================
  async function openEvaluationAudit(type, id) {
    const histModal = document.getElementById('modal-advisor-history');
    if (histModal) histModal.style.display = 'none';

    const auditModal = document.getElementById('modal-forensic-audit');
    if (!auditModal) return;

    auditModal.style.display = 'flex';
    const container = document.getElementById('audit-modal-items-container');
    const banner = document.getElementById('audit-modal-meta-banner');
    if (container) container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted);">Cargando autopsia forense...</div>`;

    const data = await Storage.getEvaluationAudit(type, id);
    if (!data || !data.success) {
      if (container) container.innerHTML = `<div style="color:var(--danger); text-align:center; padding:20px;">${escapeHtml((data && data.message) || 'No se pudo cargar la auditoría.')}</div>`;
      return;
    }

    if (banner) {
      if (type === 'simulator') {
        const ev = data.evaluation;
        banner.innerHTML = `
          <div>
            <b>Asesor:</b> ${escapeHtml(ev.advisorName || ev.username)} (@${escapeHtml(ev.username)})<br>
            <b>Caso Evaluado:</b> ${escapeHtml(ev.caseCode)} - ${escapeHtml(ev.caseTitle)}
          </div>
          <div style="text-align:right;">
            <b>Calificación:</b> <span class="badge ${ev.status === 'Aprobado' ? 'badge-success' : 'badge-danger'}">${ev.score}</span><br>
            <span style="font-size:12px; color:#64748b;">⏱️ ${ev.duration} | ❌ ${ev.errors} errores | 📅 ${formatShortDate(ev.completedAt)}</span>
          </div>
        `;
      } else if (type === 'quiz') {
        const sub = data.submission;
        banner.innerHTML = `
          <div>
            <b>Evaluación:</b> Quiz de Video: ${escapeHtml(sub.title)}
          </div>
          <div style="text-align:right;">
            <b>Puntaje:</b> <span class="badge ${sub.passed ? 'badge-success' : 'badge-danger'}">${sub.score} / ${sub.maxScore}</span><br>
            <span style="font-size:12px; color:#64748b;">📅 ${formatShortDate(sub.submittedAt)}</span>
          </div>
        `;
      } else if (type === 'questionnaire') {
        const sub = data.submission;
        banner.innerHTML = `
          <div>
            <b>Cuestionario:</b> ${escapeHtml(sub.title)}
          </div>
          <div style="text-align:right;">
            <b>Nota Vigesimal:</b> <span class="badge ${sub.passed ? 'badge-success' : 'badge-danger'}">${sub.score.toFixed(1)} / 20</span> (+${sub.xpEarned || 0} XP)<br>
            <span style="font-size:12px; color:#64748b;">⏱️ ${Math.floor((sub.durationSeconds || 0) / 60)}m ${((sub.durationSeconds || 0) % 60)}s | 📅 ${formatShortDate(sub.submittedAt)}</span>
          </div>
        `;
      }
    }

    if (container) {
      if (type === 'simulator') {
        const cases = data.cases || [];
        if (cases.length === 0) {
          container.innerHTML = `<div style="text-align:center; padding:20px; color:#64748b;">Evaluación registrada sin desglose multi-caso.</div>`;
        } else {
          container.innerHTML = cases.map((c, idx) => `
            <div style="background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:14px; margin-bottom:12px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-weight:700; color:#1e293b; font-size:13px;">Caso ${idx + 1}: ${escapeHtml(c.caseCode || '')} - ${escapeHtml(c.caseTitle || '')}</span>
                <span class="badge ${c.completed ? 'badge-success' : 'badge-danger'}">${c.completed ? 'Completado' : 'Incompleto'}</span>
              </div>
              <div style="font-size:12px; color:#64748b; margin-bottom:8px;">
                Cliente: <b>${escapeHtml(c.client || '')}</b> | ⏱️ ${c.duration || '00:00'} | ❌ ${c.errors || 0} errores
              </div>
              ${(c.actionsLog || []).filter(a => a.type === 'ERROR').length > 0 ? `
                <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:10px; margin-top:8px;">
                  <b style="color:#b91c1c; font-size:11px; text-transform:uppercase;">Fallas Operativas Cometidas:</b>
                  <ul style="margin:4px 0 0 16px; padding:0; font-size:12px; color:#991b1b;">
                    ${c.actionsLog.filter(a => a.type === 'ERROR').map(err => `<li>[${escapeHtml(err.step || 'Paso')}]: ${escapeHtml(err.detail || 'Error')}</li>`).join('')}
                  </ul>
                </div>
              ` : '<div style="font-size:12px; color:#15803d; font-weight:600;">✅ Ejecución impecable sin errores operativos en este caso.</div>'}
            </div>
          `).join('');
        }
      } else {
        // Quizzes y Cuestionarios Teóricos (Pregunta por pregunta)
        const answers = data.answers || [];
        if (answers.length === 0) {
          container.innerHTML = `<div style="text-align:center; padding:20px; color:#64748b;">No hay respuestas registradas en esta sumisión.</div>`;
        } else {
          container.innerHTML = answers.map((ans, idx) => {
            const isCorrect = Boolean(ans.isCorrect);
            return `
              <div style="background:#fff; border:1.5px solid ${isCorrect ? '#86efac' : '#fca5a5'}; border-radius:10px; padding:14px; margin-bottom:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                  <span style="font-weight:700; color:#1e293b; font-size:13px;">Pregunta ${idx + 1}: ${escapeHtml(ans.questionText || '')}</span>
                  <span class="badge ${isCorrect ? 'badge-success' : 'badge-danger'}">${isCorrect ? 'Correcta (+Pts)' : 'Incorrecta (0 Pts)'}</span>
                </div>
                <div style="font-size:12.5px; margin:6px 0; color:#334155;">
                  Respuesta del Asesor: <b style="color:${isCorrect ? '#15803d' : '#b91c1c'};">${escapeHtml(Array.isArray(ans.userAnswer) ? ans.userAnswer.join(', ') : (ans.userAnswer || ans.selectedOption || '-'))}</b>
                </div>
                ${!isCorrect && (ans.correctAnswer || ans.correctOption) ? `
                  <div style="font-size:12.5px; color:#15803d; margin-bottom:6px;">
                    Respuesta Correcta Oficial: <b>${escapeHtml(Array.isArray(ans.correctAnswer) ? ans.correctAnswer.join(', ') : (ans.correctAnswer || ans.correctOption))}</b>
                  </div>
                ` : ''}
                ${ans.explanation ? `
                  <div style="background:#f8fafc; border-left:3px solid #3b82f6; padding:8px 12px; font-size:12px; color:#475569; margin-top:8px;">
                    <b>Explicación Pedagógica:</b> ${escapeHtml(ans.explanation)}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('');
        }
      }
    }
  }

  function closeForensicAuditModal() {
    const auditModal = document.getElementById('modal-forensic-audit');
    if (auditModal) auditModal.style.display = 'none';

    // Volver a abrir el modal de historial
    const histModal = document.getElementById('modal-advisor-history');
    if (histModal) histModal.style.display = 'flex';
  }

  // ================= MODAL FEEDBACK Y FELICITACIONES (SUPERVISIÓN - FLUJO 7) =================
  function openFeedbackModal(type, targetId, advisorName) {
    currentFeedbackTarget = { advisorId: targetId, advisorName: advisorName };
    const modal = document.getElementById('modal-supervisor-feedback');
    if (!modal) return;

    modal.style.display = 'flex';
    const subTitle = document.getElementById('feedback-modal-subtitle');
    if (subTitle) subTitle.textContent = `Asesor: ${advisorName}`;

    // Seleccionar radio button correspondiente
    const radio = document.querySelector(`input[name="feedback-type"][value="${type}"]`);
    if (radio) radio.checked = true;
    toggleFeedbackType(type);

    const txt = document.getElementById('feedback-message-text');
    if (txt) {
      txt.value = (type === 'CONGRATULATION')
        ? `¡Felicitaciones ${advisorName} por tu destacada participación en el ranking con un rendimiento sobresaliente!`
        : `Hola ${advisorName}, te sugerimos repasar los procedimientos comerciales de este módulo para reforzar tu efectividad en ruta.`;
    }
  }

  function toggleFeedbackType(type) {
    const topicGroup = document.getElementById('feedback-topic-group');
    const modalTitle = document.getElementById('feedback-modal-title');
    if (topicGroup) {
      topicGroup.style.display = (type === 'SUGGESTION') ? 'block' : 'none';
    }
    if (modalTitle) {
      modalTitle.textContent = (type === 'CONGRATULATION') ? '🎉 Escribir Nota de Felicitación' : '💡 Sugerir Temas de Refuerzo';
    }
  }

  async function submitSupervisorFeedback() {
    if (!currentFeedbackTarget) return;

    const typeRadio = document.querySelector('input[name="feedback-type"]:checked');
    const type = typeRadio ? typeRadio.value : 'SUGGESTION';
    const topicSelect = document.getElementById('feedback-topic-select');
    const topicOrModule = topicSelect ? topicSelect.value : '';
    const messageInput = document.getElementById('feedback-message-text');
    const message = messageInput ? messageInput.value.trim() : '';

    if (!message) {
      await showCustomAlert({ title: 'Campo Requerido', message: 'Por favor redacta el mensaje de retroalimentación.', icon: '⚠️' });
      return;
    }

    const res = await Storage.sendFeedback(currentFeedbackTarget.advisorId, {
      type: type,
      topicOrModule: (type === 'SUGGESTION') ? topicOrModule : '',
      message: message
    });

    closeFeedbackModal();

    if (res && res.success) {
      await showCustomAlert({
        title: type === 'CONGRATULATION' ? '🎉 Felicitación Enviada' : '💡 Recomendación Registrada',
        message: res.message || 'La retroalimentación ha sido enviada exitosamente al perfil del asesor.',
        icon: '✅'
      });
    } else {
      await showCustomAlert({
        title: 'Error',
        message: (res && res.message) || 'No se pudo registrar la retroalimentación.',
        icon: '❌'
      });
    }
  }

  function closeFeedbackModal() {
    const modal = document.getElementById('modal-supervisor-feedback');
    if (modal) modal.style.display = 'none';
    currentFeedbackTarget = null;
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
   * Selección balanceada de 5 casos estratificados por áreas de competencia (Catálogo de 30 Casos Oficiales):
   * 1. Venta Regular & Catálogo Base (CP-01, CP-04, CP-06, CP-12, CP-15, CP-20, CP-25)
   * 2. Reglas Comerciales, Listas de Precio & Moneda (CP-02, CP-05, CP-13, CP-17, CP-18, CP-24, CP-28)
   * 3. Promociones, Bonificaciones & Exclusión Mutua (CP-03, CP-07, CP-14, CP-19, CP-30)
   * 4. Gestión de Ruta, Historial, GPS & Justificaciones (CP-08, CP-09, CP-10, CP-22, CP-27)
   * 5. Cobranzas, Liquidación & Cierre Operativo (CP-11, CP-16, CP-21, CP-23, CP-26, CP-29)
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

  // ---- PERSISTENCIA Y SINCRONIZACIÓN DE SESIÓN (Flujo 6 PRDv2) ----
  async function syncSimulatorSession(elapsed) {
    const user = Auth.getCurrentUser();
    if (!user || !evaluationCases || !evaluationCases.length) return;
    const states = Evaluator.getAllCaseStates();
    const activeCase = evaluationCases[currentActiveTab] || evaluationCases[0];
    try {
      await Storage.saveSimulatorSession({
        currentCaseCode: activeCase.code,
        activeTabIndex: currentActiveTab,
        elapsedSeconds: elapsed !== undefined ? elapsed : (Evaluator.getActiveEvaluation() ? Evaluator.getActiveEvaluation().elapsedSeconds : 0),
        casesProgress: states.map((s, idx) => ({
          tabIndex: idx,
          caseId: s.caseId,
          caseCode: s.caseCode,
          currentRuleIndex: s.currentRuleIndex,
          completed: s.completed,
          errors: s.errors,
          score: s.score,
          actionsLog: s.actionsLog
        }))
      });
    } catch (e) {
      console.warn('Error al sincronizar sesión de simulador:', e);
    }
  }

  async function checkActiveEvaluationSession(user) {
    try {
      const sessionResult = await Storage.getSimulatorSession();
      if (!sessionResult || !sessionResult.hasActiveSession || !sessionResult.session) {
        return false;
      }

      const session = sessionResult.session;
      if (session.elapsedSeconds >= 1800) {
        await Storage.clearSimulatorSession();
        return false;
      }

      let recoveredCases = [];
      if (Array.isArray(session.casesProgress) && session.casesProgress.length > 0) {
        recoveredCases = session.casesProgress.map(cp => {
          return Cases.find(c => c.code === cp.caseCode || c.id === cp.caseId);
        }).filter(Boolean);
      }

      if (recoveredCases.length < 5) {
        evaluationCases = selectFiveEvaluationCases();
      } else {
        evaluationCases = recoveredCases;
      }

      currentActiveTab = session.activeTabIndex || 0;

      // Desplegar arena de evaluación
      document.querySelectorAll('.container').forEach(c => c.classList.remove('active'));
      document.getElementById('top-navbar').style.display = 'none';
      document.getElementById('evaluation-arena').style.display = 'flex';

      const timerEl = document.getElementById('exam-timer');
      const liveAdvisorEl = document.getElementById('live-advisor');
      if (liveAdvisorEl) liveAdvisorEl.textContent = user.name;

      Evaluator.restoreMultiEvaluation(
        user,
        evaluationCases,
        session,
        (elapsedSec, formattedRemaining, remainingSec) => {
          if (timerEl) {
            timerEl.textContent = formattedRemaining;
            if (remainingSec <= 300) {
              timerEl.classList.add('timer-warning');
            } else {
              timerEl.classList.remove('timer-warning');
            }
          }
          if (elapsedSec % 10 === 0) {
            syncSimulatorSession(elapsedSec);
          }
        },
        1800,
        () => {
          handleExamTimeout();
        }
      );

      renderEvaluationTabs();

      const states = Evaluator.getAllCaseStates();
      let tabToLoad = currentActiveTab;
      if (states[tabToLoad] && states[tabToLoad].completed) {
        const firstIncomplete = states.findIndex(s => !s.completed);
        if (firstIncomplete !== -1) tabToLoad = firstIncomplete;
      }

      loadCaseInTab(tabToLoad, true);

      showCustomAlert({
        title: 'Evaluación Reanudada (Resiliencia F5)',
        message: '🔄 Se detectó una evaluación en curso activa. El cronómetro y tus casos resueltos se han restaurado.',
        icon: '🔄'
      });

      return true;
    } catch (err) {
      console.warn('Error al verificar sesión de simulador:', err);
      return false;
    }
  }

  async function handleExamTimeout() {
    await showCustomAlert({
      title: 'Tiempo Límite Agotado (30:00)',
      message: '⏰ El tiempo límite de 30 minutos para la evaluación ha concluido.\n\nEl sistema cerrará y calificará automáticamente tu examen con los casos resueltos hasta el momento.',
      icon: '⏰'
    });
    finishFullExam(true);
  }

  function startExam() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    // 1. Cargar 5 de los 30 casos disponibles
    evaluationCases = selectFiveEvaluationCases();
    currentActiveTab = 0;

    // 2. Ocultar portal y activar arena de examen
    document.querySelectorAll('.container').forEach(c => c.classList.remove('active'));
    document.getElementById('top-navbar').style.display = 'none';
    document.getElementById('evaluation-arena').style.display = 'flex';

    const timerEl = document.getElementById('exam-timer');
    if (timerEl) {
      timerEl.textContent = '30:00';
      timerEl.classList.remove('timer-warning');
    }

    // 3. Iniciar cronómetro continuo regresivo de 30 minutos (1800s) y motor multi-caso
    Evaluator.startMultiEvaluation(
      user,
      evaluationCases,
      (elapsedSec, formattedRemaining, remainingSec) => {
        if (timerEl) {
          timerEl.textContent = formattedRemaining;
          if (remainingSec <= 300) {
            timerEl.classList.add('timer-warning');
          } else {
            timerEl.classList.remove('timer-warning');
          }
        }
        if (elapsedSec % 10 === 0) {
          syncSimulatorSession(elapsedSec);
        }
      },
      1800,
      () => {
        handleExamTimeout();
      }
    );

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

    // Guardar sesión inicial en SQLite
    syncSimulatorSession(0);

    // 4. Renderizar pestañas y cargar el primer caso
    renderEvaluationTabs();
    loadCaseInTab(0, true);
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
      if (isCompleted) classes += ' completed locked';

      const statusIcon = isCompleted ? '✅ 🔒' : (isActive ? '⏳' : '⚪');

      return `
        <button class="${classes}" id="tab-btn-${index}" onclick="window.UyapayPortal.switchCaseTab(${index})" ${isCompleted && !isActive ? 'title="Caso completado y bloqueado"' : ''}>
          <span class="tab-pill-num">${index + 1}</span>
          <span>Caso ${index + 1}</span>
          <span id="tab-status-icon-${index}">${statusIcon}</span>
        </button>
      `;
    }).join('');
  }

  function loadCaseInTab(tabIndex, force = false) {
    if (tabIndex < 0 || tabIndex >= evaluationCases.length) return;

    const states = Evaluator.getAllCaseStates();
    const targetCaseState = states[tabIndex] || {};

    // REGLA ESTRICTA DE NO RETORNO:
    // Si el caso ya fue completado y no se fuerza la carga, bloquear el reingreso
    if (!force && targetCaseState.completed) {
      showCustomAlert({
        title: 'Caso Finalizado y Bloqueado',
        message: `🔒 El Caso ${tabIndex + 1} ya fue enviado y completado.\n\nPor política de evaluación estricta, no se permite volver a editar o revisar casos resueltos. Por favor, selecciona una pestaña pendiente.`,
        icon: '🔒'
      });
      return;
    }

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
    const caseLevelBadgeEl = document.getElementById('case-level-badge');
    const moduleBadgeEl = document.getElementById('case-module-badge');
    const tabStatusEl = document.getElementById('case-tab-status');
    const titleEl = document.getElementById('case-title');
    const clientNameEl = document.getElementById('case-client-name');
    const clientAddressEl = document.getElementById('case-client-address');
    const addressContainer = document.getElementById('case-address-container');
    const instructionsEl = document.getElementById('case-instructions');

    if (caseOrdinalBadgeEl) caseOrdinalBadgeEl.textContent = `Caso ${tabIndex + 1} de 5`;
    if (caseCodeEl) caseCodeEl.textContent = `Caso ${tabIndex + 1} de 5`;

    // Badge de Nivel de Dificultad (Estratificación PRDv2)
    if (caseLevelBadgeEl) {
      const level = activeCase.level || 'basico';
      const label = activeCase.levelLabel || (level === 'avanzado' ? '🔴 Nivel 3: Avanzado' : (level === 'intermedio' ? '🟡 Nivel 2: Intermedio' : '🟢 Nivel 1: Básico'));
      caseLevelBadgeEl.textContent = label;
      if (level === 'avanzado') {
        caseLevelBadgeEl.style.background = '#fee2e2';
        caseLevelBadgeEl.style.color = '#b91c1c';
        caseLevelBadgeEl.style.borderColor = '#fca5a5';
      } else if (level === 'intermedio') {
        caseLevelBadgeEl.style.background = '#fef3c7';
        caseLevelBadgeEl.style.color = '#b45309';
        caseLevelBadgeEl.style.borderColor = '#fde68a';
      } else {
        caseLevelBadgeEl.style.background = '#dcfce7';
        caseLevelBadgeEl.style.color = '#15803d';
        caseLevelBadgeEl.style.borderColor = '#bbf7d0';
      }
    }

    if (moduleBadgeEl) moduleBadgeEl.textContent = activeCase.module || 'Ventas B2C';
    if (titleEl) titleEl.textContent = getCleanCaseTitle(activeCase);
    if (clientNameEl) clientNameEl.textContent = activeCase.client || 'Cliente en ruta';
    if (clientAddressEl) clientAddressEl.textContent = activeCase.clientAddress || 'En ruta asignada';
    if (addressContainer) addressContainer.style.display = activeCase.clientAddress ? 'flex' : 'none';
    if (instructionsEl) instructionsEl.textContent = activeCase.instructions;

    if (tabStatusEl) {
      if (caseState.completed) {
        tabStatusEl.textContent = '✅ Completado 🔒';
        tabStatusEl.className = 'badge badge-success';
      } else {
        tabStatusEl.textContent = '⏳ En evaluación';
        tabStatusEl.className = 'badge badge-warning';
      }
    }

    // Actualizar botones de navegación respetando casos no resueltos
    const btnPrev = document.getElementById('btn-prev-tab');
    const btnNext = document.getElementById('btn-next-tab');
    const btnFinish = document.getElementById('btn-finish-exam');
    const hasRemainingAhead = states.some((s, idx) => idx > tabIndex && !s.completed);
    const hasRemainingBehind = states.some((s, idx) => idx < tabIndex && !s.completed);

    if (btnPrev) {
      btnPrev.style.display = 'inline-flex';
      btnPrev.disabled = !hasRemainingBehind;
    }

    if (!hasRemainingAhead) {
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

    // Sincronizar sesión ante cambio de tab
    syncSimulatorSession();

    // Refrescar clases de tabs
    renderEvaluationTabs();

    // Cargar o conmutar simulador móvil con aislamiento limpio
    const frame = document.getElementById('simulador-frame');
    if (frame && user) {
      const targetUrl = `simulator.html?user=${encodeURIComponent(user.username)}&case=${activeCase.id}&tab=${tabIndex}&autologin=1&v=2.5`;
      
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
        frame.onload = () => {
          frame.dataset.loaded = 'true';
        };
        frame.src = `${targetUrl}&_t=${Date.now()}`;
      }
    }
  }

  function nextTab() {
    const states = Evaluator.getAllCaseStates();
    let target = -1;
    for (let i = currentActiveTab + 1; i < evaluationCases.length; i++) {
      if (!states[i] || !states[i].completed) {
        target = i;
        break;
      }
    }
    if (target === -1) {
      for (let i = 0; i < currentActiveTab; i++) {
        if (!states[i] || !states[i].completed) {
          target = i;
          break;
        }
      }
    }

    if (target !== -1) {
      loadCaseInTab(target);
    } else {
      showCustomAlert({
        title: 'Evaluación Completada',
        message: '¡Has completado todos los casos de la evaluación! Haz clic en "Finalizar y Enviar Evaluación" para culminar tu examen.',
        icon: '🏆'
      });
    }
  }

  function prevTab() {
    const states = Evaluator.getAllCaseStates();
    let target = -1;
    for (let i = currentActiveTab - 1; i >= 0; i--) {
      if (!states[i] || !states[i].completed) {
        target = i;
        break;
      }
    }
    if (target !== -1) {
      loadCaseInTab(target);
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
    await Storage.clearSimulatorSession();

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

      // Eventos de Onboarding Guiado (7 Hitos)
      if (event.data.type === 'ONBOARDING_STEP_COMPLETED') {
        const taskId = event.data.taskId;
        if (taskId) {
          const state = await getOnboardingState();
          state[taskId] = true;
          await saveOnboardingState(state);
          await renderOnboardingView();
        }
        return;
      }

      if (event.data.type === 'ONBOARDING_FINISHED') {
        const state = await getOnboardingState();
        ONBOARDING_TASKS.forEach(t => { state[t.id] = true; });
        await saveOnboardingState(state);
        await renderOnboardingView();

        closeOnboardingSimulator();

        await showCustomAlert({
          title: '¡Inducción Oficial Completada!',
          message: '🌟 ¡Felicitaciones! Has completado satisfactoriamente los 7 hitos del Onboarding Guiado UYAPAY B2C.\n\nSe ha desbloqueado la Evaluación Práctica de Inducción y tu insignia oficial Pionero UYAPAY.',
          icon: '🎓'
        });
        return;
      }

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
          syncSimulatorSession();

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
                  title: 'Caso Completado y Bloqueado',
                  message: `✅ Caso ${currentTab + 1} completado satisfactoriamente.\n🔒 Esta pestaña ha quedado bloqueada para evitar modificaciones.\n\nAvanzando al Caso ${targetTab + 1}.`,
                  icon: '✅'
                });
                loadCaseInTab(targetTab, true);
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
            tabStatusEl.textContent = '✅ Completado 🔒';
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

  async function finishFullExam(forced = false) {
    const states = Evaluator.getAllCaseStates();
    const incomplete = states.filter(cs => !cs.completed).length;

    if (!forced && incomplete > 0) {
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

    // Limpiar sesión activa en backend y localStorage
    await Storage.clearSimulatorSession();

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
          const hasProgress = (cs.currentRuleIndex || 0) > 0;
          const rowClass = isComp ? 'completed' : (hasProgress ? 'warning' : 'failed');
          const errText = (cs.errors === 0 || cs.errors === undefined) ? 'Sin errores' : `${cs.errors} error(es)`;
          const pct = cs.completionRate !== undefined ? cs.completionRate : (hasProgress ? Math.round((cs.currentRuleIndex / (cs.totalSteps || 1)) * 100) : 0);
          const statusText = isComp
            ? '✅ Resuelto al 100%'
            : (hasProgress ? `⏳ Incompleto (Avance: ${pct}%)` : '❌ Sin resolver (0%)');
          const badgeClass = isComp ? 'badge-success' : (cs.numericScore >= 11 ? 'badge-warning' : 'badge-danger');

          return `
            <div class="case-result-row ${rowClass}">
              <div>
                <b>Caso ${idx + 1}:</b> ${escapeHtml(cs.client ? `${cs.client} — ${getCleanCaseTitle({ title: cs.caseTitle })}` : getCleanCaseTitle({ title: cs.caseTitle }))}
                <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">
                  <span>${statusText}</span> • <span>${errText}</span>
                </div>
              </div>
              <div style="text-align:right;">
                <span class="badge ${badgeClass}">${cs.score || '00 / 20'}</span>
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
          r.numericScore !== undefined ? r.numericScore : 0,
          r.errors !== undefined ? r.errors : 0,
          r.maxErrors !== undefined ? r.maxErrors : 6,
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
            <td>${r.numericScore !== undefined ? r.numericScore : 0}</td>
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

  // =========================================================================
  // MÓDULOS DE REQUISITOS.PDF (CAPACITACIÓN, KAHOOT, ONBOARDING, CONOCIMIENTO, PERFIL, ADMIN)
  // =========================================================================

  // Helper para cabeceras con token de autenticación
  function getAuthHeaders() {
    const user = Auth.getCurrentUser();
    const headers = { 'Content-Type': 'application/json' };
    if (user && user.token) {
      headers['Authorization'] = 'Bearer ' + user.token;
    }
    if (user && user.role) {
      headers['x-user-role'] = user.role;
    }
    return headers;
  }

  // Resolver de URLs de API resiliente (apunta a :3000 si se ejecuta en Live Server :5500 u otro puerto)
  function resolveApiUrl(path) {
    if (typeof window !== 'undefined' && window.location) {
      const port = window.location.port;
      const isCustomDevServer = port && !['3000', '3100', '3101', '3102', '3103', '3104', '3105'].includes(port);
      if (window.location.protocol === 'file:' || isCustomDevServer) {
        return 'http://localhost:3000' + path;
      }
    }
    return path;
  }

  // Cliente HTTP seguro que valida Content-Type JSON y evita crashes por respuestas HTML
  async function safeApiFetch(path, options = {}) {
    const targetUrl = resolveApiUrl(path);
    const headers = { ...getAuthHeaders(), ...(options.headers || {}) };
    let res;
    try {
      res = await fetch(targetUrl, { ...options, headers });
    } catch (netErr) {
      throw new Error(`No se pudo conectar con el servidor backend (http://localhost:3000). ¿Está ejecutándose 'node server.js'?`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        throw new Error(`El servidor devolvió una página HTML en vez de datos JSON. Si estás usando Live Server (puerto 5500), ejecuta 'npm start' y abre http://localhost:3000.`);
      }
      throw new Error(`Respuesta no válida del servidor (Content-Type: ${contentType}).`);
    }

    const data = await res.json();
    if (!res.ok) {
      const errMsg = (data && data.message) || `Error del servidor HTTP ${res.status}`;
      throw new Error(errMsg);
    }
    return data;
  }

  // 1. Actualizar insignias y XP en el Navbar
  async function updateNavbarProfileBadges(user) {
    if (!user) return;
    try {
      const res = await safeApiFetch('/api/gamification/my-profile');
      const xpBadge = document.getElementById('user-xp-badge');
      const badgeDisplay = document.getElementById('user-badge-display');
      if (xpBadge && res.stats) {
        xpBadge.textContent = `⚡ ${res.stats.globalPoints || 0} XP`;
        xpBadge.style.display = 'inline-flex';
      }
      if (badgeDisplay && res.badges && res.badges.length > 0) {
        const topBadge = res.badges[0];
        badgeDisplay.textContent = `${topBadge.icon} ${topBadge.name}`;
        badgeDisplay.style.display = 'inline-flex';
      } else if (badgeDisplay) {
        badgeDisplay.textContent = '🌟 Asesor B2C';
        badgeDisplay.style.display = 'inline-flex';
      }
    } catch (e) {
      console.warn('[Navbar] No se pudo cargar perfil de gamificación:', e.message);
    }
  }

  // 2. Módulo de Capacitación y Biblioteca de Videos
  let activeVideosList = [];
  let currentVideoForModal = null;

  async function renderTrainingView(selectedModuleId = null) {
    const pillsContainer = document.getElementById('training-module-pills');
    const videosContainer = document.getElementById('training-videos-grid');
    if (!pillsContainer || !videosContainer) return;

    pillsContainer.innerHTML = '<div style="color:var(--text-muted); padding:10px;">Cargando módulos...</div>';
    videosContainer.innerHTML = '<div style="color:var(--text-muted); padding:20px;">Cargando catálogo audiovisual...</div>';

    let modules = [];
    let videos = [];

    try {
      const [mRes, vRes] = await Promise.all([
        safeApiFetch('/api/training/modules'),
        safeApiFetch(`/api/training/videos${selectedModuleId ? '?moduleId=' + encodeURIComponent(selectedModuleId) : ''}`)
      ]);
      modules = Array.isArray(mRes) ? mRes : [];
      videos = Array.isArray(vRes) ? vRes : [];
    } catch (fetchErr) {
      console.warn('[Training] Error cargando desde API, activando fallback local:', fetchErr.message);
      // Fallback local a los 5 módulos temáticos oficiales de Requisitos.pdf
      modules = [
        { id: 'mod-01', code: 'VENTAS', title: 'Ventas y Toma de Pedidos B2C', description: 'Configuración comercial, pedidos contado/crédito, bonificaciones y regalos.', icon: '🛒', order_num: 1 },
        { id: 'mod-02', code: 'COBRANZAS', title: 'Cobranzas y Liquidación de Ruta', description: 'Cobranzas mixtas (efectivo + voucher), recibos provisionales y arqueo diario.', icon: '💰', order_num: 2 },
        { id: 'mod-03', code: 'RUTA_GPS', title: 'Gestión de Ruta, GPS y Tareas', description: 'Plan de visitas, geocerca de 50m, bypass justificado y tareas T1 a T5.', icon: '📍', order_num: 3 },
        { id: 'mod-04', code: 'POLITICAS', title: 'Políticas Comerciales y Promociones', description: 'Listas de precios Oficina/1/2/3/4 y exclusión mutua de promociones combo.', icon: '🏷️', order_num: 4 },
        { id: 'mod-05', code: 'DOCUMENTOS', title: 'Documentos Electrónicos y Cartera', description: 'Consulta de facturas electrónicas, notas de crédito y estados de cuenta.', icon: '📄', order_num: 5 }
      ];
      videos = [];
    }

    activeVideosList = videos;

    // Renderizar píldoras de módulo
    let pillsHtml = `
      <button class="training-pill ${!selectedModuleId ? 'active' : ''}" onclick="window.UyapayPortal.renderTrainingByModule(null)">
        🌐 Todos los Módulos
      </button>
    `;
    modules.forEach(m => {
      const isActive = selectedModuleId === m.id;
      pillsHtml += `
        <button class="training-pill ${isActive ? 'active' : ''}" onclick="window.UyapayPortal.renderTrainingByModule('${m.id}')">
          ${m.icon || '📁'} ${escapeHtml(m.title)}
        </button>
      `;
    });
    pillsContainer.innerHTML = pillsHtml;

    // Renderizar tarjetas de videos
    if (videos.length === 0) {
      videosContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align:center; padding:40px 20px; color:var(--text-muted);">
          ${selectedModuleId ? 'No hay videos registrados en este módulo.' : 'No hay cápsulas de video disponibles en este momento. Conéctate a http://localhost:3000 para sincronizar el catálogo.'}
        </div>
      `;
      return;
    }

    let videosHtml = '';
    videos.forEach(v => {
      const mins = Math.floor((v.duration_seconds || 180) / 60);
      const secs = (v.duration_seconds || 180) % 60;
      const durationStr = `${mins}:${secs < 10 ? '0' : ''}${secs} min`;

      let quizBadgeHtml = '';
      if (v.userPassed) {
        quizBadgeHtml = `<span class="badge badge-success" style="font-size:11px;">✓ Quiz Aprobado (${v.userBestScore}/20)</span>`;
      } else if (v.quizId) {
        quizBadgeHtml = `<span class="badge badge-warning" style="font-size:11px;">⚡ Quiz Disponible</span>`;
      }

      videosHtml += `
        <div class="video-card">
          <div class="video-thumb-wrapper" onclick="window.UyapayPortal.openVideoModal('${v.id}')">
            <div class="video-play-btn">▶</div>
            <span class="video-duration-tag">⏱️ ${durationStr}</span>
          </div>
          <div class="video-card-body">
            <div style="font-size:11px; font-weight:700; color:var(--yellow-dark); text-transform:uppercase; margin-bottom:4px;">
              ${escapeHtml(v.module_title || 'Capacitación')}
            </div>
            <h3 class="video-card-title">${escapeHtml(v.title)}</h3>
            <p class="video-card-desc">${escapeHtml(v.description || 'Cápsula formativa oficial.')}</p>
            <div class="video-card-footer">
              <div>${quizBadgeHtml}</div>
              <div style="display:flex; gap:8px;">
                <button class="btn-secondary" style="font-size:12px; padding:6px 12px;" onclick="window.UyapayPortal.openVideoModal('${v.id}')">Ver Video</button>
                ${v.quizId ? `<button class="btn-primary" style="font-size:12px; padding:6px 14px; background:linear-gradient(135deg, #f59e0b 0%, #d97706 100%);" onclick="window.UyapayPortal.startKahootQuiz('${v.id}')">🎮 Quiz</button>` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    });
    videosContainer.innerHTML = videosHtml;
  }

  function openVideoModal(videoId) {
    const video = activeVideosList.find(v => v.id === videoId);
    if (!video) return;
    currentVideoForModal = video;

    const modal = document.getElementById('video-player-modal');
    const titleEl = document.getElementById('modal-video-title');
    const subtitleEl = document.getElementById('modal-video-subtitle');
    const descEl = document.getElementById('modal-video-desc');
    const videoEl = document.getElementById('modal-video-element');
    const btnQuiz = document.getElementById('btn-launch-quiz-from-video');

    if (titleEl) titleEl.textContent = video.title;
    if (subtitleEl) subtitleEl.textContent = video.module_title || 'Módulo UYAPAY B2C';
    if (descEl) descEl.textContent = video.description || '';
    if (videoEl) {
      videoEl.src = video.video_url;
      videoEl.load();
    }
    if (btnQuiz) {
      btnQuiz.style.display = video.quizId ? 'inline-flex' : 'none';
    }

    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('active');
    }
  }

  function closeVideoModal() {
    const modal = document.getElementById('video-player-modal');
    const videoEl = document.getElementById('modal-video-element');
    if (videoEl) {
      videoEl.pause();
      videoEl.removeAttribute('src');
      videoEl.load();
    }
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
    }
  }

  function launchQuizFromCurrentVideo() {
    if (!currentVideoForModal) return;
    const vidId = currentVideoForModal.id;
    closeVideoModal();
    startKahootQuiz(vidId);
  }

  // 3. Arena de Quiz estilo Kahoot!
  let currentKahootQuiz = null;
  let currentKahootIndex = 0;
  let currentKahootAnswers = {};
  let kahootTimerInterval = null;
  let kahootSecondsLeft = 20;
  let kahootStreak = 0;

  async function startKahootQuiz(videoId) {
    try {
      try {
        currentKahootQuiz = await safeApiFetch(`/api/training/videos/${videoId}/quiz`);
      } catch (err) {
        showCustomAlert({
          title: 'Quiz No Disponible',
          message: 'Este video no tiene un cuestionario de refuerzo configurado todavía o el servidor no respondió.',
          icon: 'ℹ️'
        });
        return;
      }

      currentKahootIndex = 0;
      currentKahootAnswers = {};
      kahootStreak = 0;

      // Ocultar otras vistas y mostrar arena
      document.querySelectorAll('.container').forEach(c => c.classList.remove('active'));
      const arena = document.getElementById('kahoot-quiz-arena');
      if (arena) {
        arena.style.display = 'block';
        arena.classList.add('active');
      }

      const titleEl = document.getElementById('kahoot-quiz-title');
      if (titleEl) titleEl.textContent = currentKahootQuiz.title || 'Desafío de Microaprendizaje';

      renderKahootQuestion(0);
    } catch (e) {
      showCustomAlert({ title: 'Error', message: e.message, icon: '⚠️' });
    }
  }

  function renderKahootQuestion(index) {
    if (!currentKahootQuiz || !currentKahootQuiz.questions || index >= currentKahootQuiz.questions.length) {
      finishKahootQuiz();
      return;
    }

    currentKahootIndex = index;
    const q = currentKahootQuiz.questions[index];

    // Actualizar contadores
    const counterEl = document.getElementById('kahoot-question-counter');
    if (counterEl) counterEl.textContent = `Pregunta ${index + 1} de ${currentKahootQuiz.questions.length}`;

    const streakBadge = document.getElementById('kahoot-streak-badge');
    if (streakBadge) streakBadge.textContent = `🔥 Racha: ${kahootStreak}`;

    const questionBox = document.getElementById('kahoot-question-box');
    if (questionBox) questionBox.textContent = q.questionText;

    // Configuración estética de las 4 opciones de colores estilo Kahoot
    const shapes = [
      { class: 'kahoot-red', icon: '▲', label: 'Triángulo' },
      { class: 'kahoot-blue', icon: '◆', label: 'Rombo' },
      { class: 'kahoot-yellow', icon: '●', label: 'Círculo' },
      { class: 'kahoot-green', icon: '■', label: 'Cuadrado' }
    ];

    const answersGrid = document.getElementById('kahoot-answers-grid');
    if (answersGrid) {
      answersGrid.innerHTML = '';
      q.options.forEach((opt, optIdx) => {
        const shape = shapes[optIdx % shapes.length];
        const btn = document.createElement('button');
        btn.className = `kahoot-btn ${shape.class}`;
        btn.innerHTML = `
          <span class="kahoot-shape">${shape.icon}</span>
          <span style="flex:1;">${escapeHtml(opt.option_text)}</span>
        `;
        btn.onclick = () => selectKahootOption(q.id, opt.id, opt.option_text);
        answersGrid.appendChild(btn);
      });
    }

    // Iniciar temporizador regresivo de 20 segundos
    kahootSecondsLeft = 20;
    const timerEl = document.getElementById('kahoot-timer');
    if (timerEl) {
      timerEl.textContent = kahootSecondsLeft;
      timerEl.classList.remove('warning');
    }

    if (kahootTimerInterval) clearInterval(kahootTimerInterval);
    kahootTimerInterval = setInterval(() => {
      kahootSecondsLeft--;
      if (timerEl) {
        timerEl.textContent = kahootSecondsLeft;
        if (kahootSecondsLeft <= 5) timerEl.classList.add('warning');
      }
      if (kahootSecondsLeft <= 0) {
        clearInterval(kahootTimerInterval);
        handleKahootTimeout(q.id);
      }
    }, 1000);
  }

  function selectKahootOption(questionId, optionId, optionText) {
    if (kahootTimerInterval) clearInterval(kahootTimerInterval);
    currentKahootAnswers[questionId] = optionId;

    // Feedback inmediato de respuesta (RF-010)
    showKahootFeedback(true, 'Opción seleccionada con éxito.');
  }

  function handleKahootTimeout(questionId) {
    currentKahootAnswers[questionId] = null;
    kahootStreak = 0;
    showKahootFeedback(false, '¡Tiempo agotado! Responde dentro del límite de 20 segundos para obtener bonos de velocidad.');
  }

  function showKahootFeedback(hasAnswered, customMsg) {
    const modal = document.getElementById('kahoot-feedback-modal');
    const iconEl = document.getElementById('kahoot-feedback-icon');
    const titleEl = document.getElementById('kahoot-feedback-title');
    const textEl = document.getElementById('kahoot-feedback-text');
    const ruleBox = document.getElementById('kahoot-feedback-rule-box');
    const ruleText = document.getElementById('kahoot-feedback-rule-text');

    if (hasAnswered) {
      kahootStreak++;
      if (iconEl) iconEl.textContent = '🎉';
      if (titleEl) titleEl.textContent = '¡Respuesta Registrada!';
      if (textEl) textEl.textContent = `Has respondido a tiempo. ¡Racha actual de ${kahootStreak} aciertos!`;
      if (ruleBox) ruleBox.style.display = 'none';
    } else {
      if (iconEl) iconEl.textContent = '⏰';
      if (titleEl) titleEl.textContent = '¡Tiempo Finalizado!';
      if (textEl) textEl.textContent = customMsg;
      if (ruleBox) {
        ruleBox.style.display = 'block';
        if (ruleText) ruleText.textContent = 'Las reglas de UYAPAY B2C requieren precisión en la selección de productos y listas de precios.';
      }
    }

    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('active');
    }
  }

  function nextKahootQuestion() {
    const modal = document.getElementById('kahoot-feedback-modal');
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
    }

    renderKahootQuestion(currentKahootIndex + 1);
  }

  async function finishKahootQuiz() {
    if (kahootTimerInterval) clearInterval(kahootTimerInterval);

    try {
      const result = await safeApiFetch(`/api/training/quizzes/${currentKahootQuiz.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers: currentKahootAnswers })
      });

      const modal = document.getElementById('kahoot-summary-modal');
      const scoreEl = document.getElementById('kahoot-summary-score');
      const statusBadge = document.getElementById('kahoot-summary-status-badge');
      const xpEl = document.getElementById('kahoot-summary-xp');
      const correctEl = document.getElementById('kahoot-summary-correct');

      if (scoreEl) scoreEl.textContent = result.formattedScore || `${result.score} / 20`;
      if (statusBadge) {
        statusBadge.innerHTML = result.passed
          ? `<span class="badge badge-success" style="font-size:13px; padding:4px 14px;">✓ Aprobado</span>`
          : `<span class="badge badge-danger" style="font-size:13px; padding:4px 14px;">Desaprobado</span>`;
      }
      if (xpEl) xpEl.textContent = result.passed ? `+${result.score} XP` : '0 XP';
      if (correctEl) correctEl.textContent = `${result.correctAnswers} de ${result.totalQuestions}`;

      if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
      }

      // Actualizar medalla y XP en navbar
      const currentUser = Auth.getCurrentUser();
      if (currentUser) updateNavbarProfileBadges(currentUser);

    } catch (e) {
      showCustomAlert({ title: 'Error al enviar Quiz', message: e.message, icon: '⚠️' });
    }
  }

  function closeKahootSummary() {
    const modal = document.getElementById('kahoot-summary-modal');
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
    }
    exitKahootQuiz();
  }

  function exitKahootQuiz() {
    if (kahootTimerInterval) clearInterval(kahootTimerInterval);
    const arena = document.getElementById('kahoot-quiz-arena');
    if (arena) {
      arena.classList.remove('active');
      arena.style.display = 'none';
    }
    // Regresar a la vista de capacitación
    switchTab('training-view');
  }

  // 4. Capacitador Paso a Paso e Inducción (Onboarding de 7 Hitos Oficiales PRDv2)
  const ONBOARDING_TASKS = [
    {
      id: 'task-1',
      code: 'H1',
      title: 'Inicio de Sesión y Selección de Agencia',
      desc: 'Ingreso con credenciales corporativas y selección opcional de sede asignada (Arequipa/Cusco) en el drawer.',
      icon: '🔐'
    },
    {
      id: 'task-2',
      code: 'H2',
      title: 'Reconocimiento de Interfaces y Tipo de Cambio',
      desc: 'Navegación por barra inferior (Inicio, Visitas, Pedidos) y lectura del indicador del tipo de cambio oficial del día.',
      icon: '📱'
    },
    {
      id: 'task-3',
      code: 'H3',
      title: 'Menú Secundario / Drawer Lateral Completo',
      desc: 'Exploración de Mis Clientes, Estados de Cuenta en PDF, Historial de Visitas a 6 meses y Documentos Electrónicos.',
      icon: '📑'
    },
    {
      id: 'task-4',
      code: 'H4',
      title: 'Proyección de Ventas por Familia de Productos',
      desc: 'Ingreso de metas por familias (Rimula Multigrado, Spirax, Shell Premium, Neumáticos, Repuestos Hyundai) y guardado.',
      icon: '📊'
    },
    {
      id: 'task-5',
      code: 'H5',
      title: 'Plan de Visitas, Geocerca y Contingencias de Ruta',
      desc: 'Verificación de radio GPS de 50 metros, cambio de almacén/dirección, reseteo de coordenadas y visita telefónica (máx. 5/día).',
      icon: '📍'
    },
    {
      id: 'task-6',
      code: 'H6',
      title: 'Secuencia Operativa de Visita (Tareas T1 a T5)',
      desc: 'Scoring A/1, fotos obligatorias antes/después, tracking de precios, toma de pedido con listas y cobranza con voucher/retención.',
      icon: '🛒'
    },
    {
      id: 'task-7',
      code: 'H7',
      title: 'Cierre de Visita, Justificación y Seguimiento',
      desc: 'Cierre de visita formal, justificación de tareas omitidas, seguimiento del pedido y obtención de la insignia Pionero UYAPAY.',
      icon: '🏁'
    }
  ];

  let cachedOnboardingState = null;

  async function getOnboardingState() {
    const user = Auth.getCurrentUser();
    const localKey = `uyapay_onboarding_${user ? user.username : 'guest'}`;

    if (cachedOnboardingState) return cachedOnboardingState;

    try {
      if (user) {
        const data = await safeApiFetch('/api/training/onboarding/progress');
        if (data) {
          const state = {};
          if (Array.isArray(data.completedTasks)) {
            data.completedTasks.forEach(tId => state[tId] = true);
          }
          cachedOnboardingState = state;
          try { localStorage.setItem(localKey, JSON.stringify(state)); } catch (e) {}
          return state;
        }
      }
    } catch (e) {}

    try {
      cachedOnboardingState = JSON.parse(localStorage.getItem(localKey)) || {};
      return cachedOnboardingState;
    } catch (e) {
      return {};
    }
  }

  async function saveOnboardingState(state) {
    cachedOnboardingState = state;
    const user = Auth.getCurrentUser();
    const localKey = `uyapay_onboarding_${user ? user.username : 'guest'}`;

    try {
      localStorage.setItem(localKey, JSON.stringify(state));
    } catch (e) {}

    try {
      if (user) {
        const completedTasks = Object.keys(state).filter(k => Boolean(state[k]));
        await safeApiFetch('/api/training/onboarding/progress', {
          method: 'POST',
          body: JSON.stringify({
            completedTasks: completedTasks,
            examUnlocked: completedTasks.length >= ONBOARDING_TASKS.length
          })
        });
      }
    } catch (e) {}
  }

  async function renderOnboardingView() {
    const container = document.getElementById('onboarding-tasks-list');
    const progressBar = document.getElementById('onboarding-progress-bar');
    const progressText = document.getElementById('onboarding-progress-text');
    const statusPill = document.getElementById('onboarding-status-pill');
    const btnExam = document.getElementById('btn-start-onboarding-exam');
    if (!container) return;

    const state = await getOnboardingState();
    let completedCount = 0;

    let html = '';
    ONBOARDING_TASKS.forEach((task, idx) => {
      const isDone = Boolean(state[task.id]);
      if (isDone) completedCount++;

      html += `
        <div class="onboarding-task-card ${isDone ? 'completed' : ''}">
          <div style="display:flex; align-items:center; gap:16px;">
            <div class="onboarding-task-icon">${task.icon}</div>
            <div>
              <div style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Hito ${idx + 1} de 7 • ${task.code}</div>
              <h4 style="margin:2px 0 4px 0; font-size:15px; color:var(--text-dark);">${escapeHtml(task.title)}</h4>
              <p style="margin:0; font-size:12.5px; color:var(--text-muted); line-height:1.4;">${escapeHtml(task.desc)}</p>
            </div>
          </div>
          <div>
            <button class="btn-${isDone ? 'secondary' : 'primary'}" style="width:auto; font-size:12.5px; padding:8px 16px;" onclick="window.UyapayPortal.toggleOnboardingTask('${task.id}')">
              ${isDone ? '✓ Completado' : 'Completar Hito'}
            </button>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;

    const pct = Math.round((completedCount / ONBOARDING_TASKS.length) * 100);
    if (progressBar) progressBar.style.width = pct + '%';
    if (progressText) progressText.textContent = `${pct}% Completado (${completedCount} de 7 hitos)`;
    if (statusPill) {
      if (pct === 100) {
        statusPill.textContent = '🌟 Inducción Completada';
        statusPill.style.background = '#dcfce7';
        statusPill.style.color = '#16a34a';
      } else {
        statusPill.textContent = 'En progreso';
        statusPill.style.background = '#fef3c7';
        statusPill.style.color = '#b45309';
      }
    }

    if (btnExam) {
      if (pct === 100) {
        btnExam.disabled = false;
        btnExam.textContent = '🚀 Iniciar Evaluación Práctica ➔';
        btnExam.style.background = 'var(--success)';
      } else {
        btnExam.disabled = true;
        btnExam.textContent = `🔒 Bloqueado (Faltan ${7 - completedCount} hitos)`;
        btnExam.style.background = 'var(--yellow)';
      }
    }
  }

  async function toggleOnboardingTask(taskId) {
    const state = await getOnboardingState();
    state[taskId] = !state[taskId];
    await saveOnboardingState(state);
    await renderOnboardingView();
  }

  function startOnboardingExam() {
    showCustomAlert({
      title: 'Evaluación de Onboarding',
      message: '¡Felicitaciones por completar el recorrido guiado!\n\nSe iniciará una sesión práctica en el simulador móvil para validar tu inducción y desbloquear tu insignia Pionero UYAPAY.',
      icon: '🎓'
    }).then(() => {
      startExam();
    });
  }

  function openOnboardingSimulator() {
    const user = Auth.getCurrentUser();
    const modal = document.getElementById('onboarding-simulator-modal');
    const frame = document.getElementById('onboarding-simulador-frame');
    if (!modal || !frame) return;

    const username = user ? user.username : 'asesor';
    frame.src = `simulator.html?mode=onboarding&step=0&user=${encodeURIComponent(username)}&autologin=1&_t=${Date.now()}`;
    modal.style.display = 'flex';
  }

  function closeOnboardingSimulator() {
    const modal = document.getElementById('onboarding-simulator-modal');
    const frame = document.getElementById('onboarding-simulador-frame');
    if (modal) modal.style.display = 'none';
    if (frame) frame.src = '';
  }

  // 5. Base de Conocimiento (FAQs & Reglas de Negocio)
  const DEFAULT_FAQS = [
    { id: 'faq-01', category: 'Precios', question: '¿Cómo elijo la lista de precios adecuada para un cliente minorista?', answer: 'En el menú del cliente dentro de Uyapay Móvil, dirígete a Datos Comerciales. La lista Oficina es la tarifa estándar sugerida; para clientes con volumen regular usa Lista 1 o 2.' },
    { id: 'faq-02', category: 'Ruta y Visitas', question: '¿Qué hacer si un cliente no se encuentra en su negocio al visitarlo?', answer: 'Debes registrar la visita marcando "No Contactado" y seleccionar el motivo correspondiente (local cerrado, titular ausente). Recuerda adjuntar la foto del frontis del local para validar el geoposicionamiento.' },
    { id: 'faq-03', category: 'Cobranzas', question: '¿Cómo registro un pago mixto (efectivo y transferencia bancaria)?', answer: 'En la pantalla de cobranza, ingresa el monto en efectivo y agrega un segundo medio seleccionando "Transferencia / Depósito". Es obligatorio ingresar el número de operación bancaria y verificar que coincida con el voucher físico o digital.' },
    { id: 'faq-04', category: 'Pedidos', question: '¿Qué plazo tengo para anular o modificar un pedido ingresado?', answer: 'Los pedidos pueden modificarse mientras estén en estado "Borrador" o "En Cola de Sincronización". Una vez sincronizados con la central, cualquier anulación debe solicitarse a la jefatura de ventas con justificación comercial.' },
    { id: 'faq-05', category: 'Inventario', question: '¿Cómo verifico el stock en tiempo real antes de confirmar el pedido?', answer: 'Al seleccionar un artículo, la ficha del producto muestra el stock disponible en almacén central. Si un producto está marcado como "Agotado" o con stock menor al solicitado, el sistema emitirá una alerta preventiva.' }
  ];

  const DEFAULT_RULES = [
    { id: 'rule-01', category: 'Listas de Precio', title: 'Jerarquía y Segmentación de Listas de Precios', content: 'En el canal minorista B2C, la lista Oficina representa el precio base sugerido. Las listas 1, 2 y 3 otorgan precios más competitivos según el volumen y la antigüedad del cliente. Para clientes corporativos B2B se aplican las listas 5, 6, 7 y 8 según autorización crediticia.' },
    { id: 'rule-02', category: 'Tareas en Ruta', title: 'Secuencia Obligatoria de Tareas de Visita (T1 a T5)', content: 'Toda visita en ruta debe cumplir con el flujo estándar: T1 Inicio de Visita → T2 Registro Fotográfico de Exhibición Inicial y Final → T3 Tracking de Precios de Competencia (o registro del motivo de omisión justificado) → T4 Verificación de Cartera y Deudas → T5 Toma de Pedido o Justificación formal de Cierre.' },
    { id: 'rule-03', category: 'Créditos', title: 'Política de Clientes Morosos y Bloqueos de Venta', content: 'Clientes con deudas vencidas mayores a 40 días se consideran en tramo moroso o dudoso. Para emitir un nuevo pedido a crédito es obligatorio amortizar primero la deuda vencida o solicitar autorización excepcional al área de créditos.' },
    { id: 'rule-04', category: 'Liquidación', title: 'Cuadre y Consolidado Diario Obligatorio', content: 'Al concluir las visitas del día, todo asesor debe generar la "Liquidación de Cobranza Diaria". El arqueo debe cuadrar exactamente los soles, dólares y vouchers antes de la entrega formal en caja.' }
  ];

  let activeFaqsList = DEFAULT_FAQS;
  let activeRulesList = DEFAULT_RULES;
  let currentKnowledgeSubtab = 'faqs';

  async function renderKnowledgeView() {
    try {
      const [faqs, rules] = await Promise.all([
        safeApiFetch('/api/knowledge/faqs'),
        safeApiFetch('/api/knowledge/rules')
      ]);

      activeFaqsList = Array.isArray(faqs) ? faqs : DEFAULT_FAQS;
      activeRulesList = Array.isArray(rules) ? rules : DEFAULT_RULES;
    } catch (e) {
      console.warn('[Conocimiento] Servidor backend no disponible, cargando catálogo local resiliente:', e.message);
      activeFaqsList = DEFAULT_FAQS;
      activeRulesList = DEFAULT_RULES;
    }
    filterKnowledge();
  }

  function switchKnowledgeSubtab(subtab) {
    currentKnowledgeSubtab = subtab;
    const btnFaqs = document.getElementById('btn-tab-faqs');
    const btnRules = document.getElementById('btn-tab-rules');
    const faqsContainer = document.getElementById('knowledge-faqs-container');
    const rulesContainer = document.getElementById('knowledge-rules-container');

    if (btnFaqs) btnFaqs.className = `training-pill ${subtab === 'faqs' ? 'active' : ''}`;
    if (btnRules) btnRules.className = `training-pill ${subtab === 'rules' ? 'active' : ''}`;

    if (faqsContainer) faqsContainer.style.display = subtab === 'faqs' ? 'block' : 'none';
    if (rulesContainer) rulesContainer.style.display = subtab === 'rules' ? 'block' : 'none';
  }

  function filterKnowledge() {
    const searchInput = document.getElementById('knowledge-search');
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();

    const faqsContainer = document.getElementById('knowledge-faqs-container');
    const rulesContainer = document.getElementById('knowledge-rules-container');

    // Filtrar FAQs
    const filteredFaqs = activeFaqsList.filter(f =>
      !query || f.question.toLowerCase().includes(query) || f.answer.toLowerCase().includes(query) || f.category.toLowerCase().includes(query)
    );

    if (faqsContainer) {
      if (filteredFaqs.length === 0) {
        faqsContainer.innerHTML = '<div style="color:var(--text-muted); padding:20px; text-align:center;">No se encontraron preguntas frecuentes con esa búsqueda.</div>';
      } else {
        faqsContainer.innerHTML = filteredFaqs.map((f, i) => `
          <div class="faq-accordion-item" id="faq-item-${i}">
            <div class="faq-header" onclick="window.UyapayPortal.toggleFaqAccordion(${i})">
              <span>❓ ${escapeHtml(f.question)}</span>
              <span style="font-size:12px; color:var(--text-muted);">▼</span>
            </div>
            <div class="faq-content">
              <div style="font-size:11px; font-weight:700; color:var(--yellow-dark); text-transform:uppercase; margin-bottom:6px;">Categoría: ${escapeHtml(f.category)}</div>
              ${escapeHtml(f.answer)}
            </div>
          </div>
        `).join('');
      }
    }

    // Filtrar Reglas
    const filteredRules = activeRulesList.filter(r =>
      !query || r.title.toLowerCase().includes(query) || r.content.toLowerCase().includes(query) || r.category.toLowerCase().includes(query)
    );

    if (rulesContainer) {
      if (filteredRules.length === 0) {
        rulesContainer.innerHTML = '<div style="color:var(--text-muted); padding:20px; text-align:center;">No se encontraron reglas de negocio con esa búsqueda.</div>';
      } else {
        rulesContainer.innerHTML = filteredRules.map(r => `
          <div class="business-rule-card">
            <div style="font-size:11px; font-weight:700; color:var(--yellow-dark); text-transform:uppercase; margin-bottom:4px;">${escapeHtml(r.category)}</div>
            <h4 class="business-rule-title">${escapeHtml(r.title)}</h4>
            <div class="business-rule-content">${escapeHtml(r.content)}</div>
          </div>
        `).join('');
      }
    }
  }

  function toggleFaqAccordion(idx) {
    const item = document.getElementById(`faq-item-${idx}`);
    if (item) item.classList.toggle('open');
  }

  // 6. Perfil del Asesor & Vitrina de Insignias
  async function renderProfileView(user) {
    try {
      const [profile, recs] = await Promise.all([
        safeApiFetch('/api/gamification/my-profile').catch(() => ({ user, stats: { globalPoints: 0, bestScore: 0, badgesUnlockedCount: 0, totalBadgesCount: 6 }, badges: [] })),
        safeApiFetch(`/api/integration/recommendations/${user.username}`).catch(() => ({ recommendations: [] }))
      ]);

      // Rellenar datos del Hero
      const nameEl = document.getElementById('profile-name');
      const userEl = document.getElementById('profile-username');
      const roleEl = document.getElementById('profile-role');
      const xpEl = document.getElementById('profile-xp');
      const bestScoreEl = document.getElementById('profile-best-score');
      const badgesCountEl = document.getElementById('profile-badges-count');

      if (nameEl) nameEl.textContent = profile.user ? profile.user.name : user.name;
      if (userEl) userEl.textContent = '@' + (profile.user ? profile.user.username : user.username);
      if (roleEl) roleEl.textContent = (profile.user ? profile.user.role : user.role).toUpperCase();

      if (xpEl && profile.stats) xpEl.textContent = `${profile.stats.globalPoints || 0} XP`;
      if (bestScoreEl && profile.stats) bestScoreEl.textContent = `${profile.stats.bestScore || 0} / 20`;
      if (badgesCountEl && profile.stats) badgesCountEl.textContent = `${profile.stats.badgesUnlockedCount || 0} / ${profile.stats.totalBadgesCount || 6}`;

      // Renderizar vitrina de insignias
      const badgesGrid = document.getElementById('profile-badges-grid');
      if (badgesGrid && profile.badges) {
        badgesGrid.innerHTML = profile.badges.map(b => `
          <div class="badge-item-card ${b.unlocked ? 'unlocked' : 'locked'}">
            <div class="badge-big-icon">${b.icon || '🏅'}</div>
            <div class="badge-item-name">${escapeHtml(b.name)}</div>
            <div class="badge-item-desc">${escapeHtml(b.description)}</div>
            <div style="font-size:10.5px; margin-top:8px; font-weight:700; color:${b.unlocked ? 'var(--success)' : 'var(--text-muted)'};">
              ${b.unlocked ? '✓ Desbloqueada' : '🔒 Bloqueada'}
            </div>
          </div>
        `).join('');
      }

      // Renderizar temas sugeridos
      const recsList = document.getElementById('profile-recommendations-list');
      if (recsList) {
        if (!recs.hasRecommendations || (!recs.detectedWeaknesses || recs.detectedWeaknesses.length === 0)) {
          recsList.innerHTML = `
            <div style="font-size:13px; color:#059669; font-weight:600;">
              ✨ ¡Excelente desempeño! No se detectan debilidades operativas críticas en tus evaluaciones recientes.
            </div>
          `;
        } else {
          let recsHtml = '<div style="display:flex; flex-direction:column; gap:10px;">';
          (recs.recommendedVideos || []).forEach(rv => {
            recsHtml += `
              <div style="background:#ffffff; border:1px solid #fed7aa; border-radius:8px; padding:10px 14px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <div style="font-size:11px; font-weight:700; color:#ea580c; text-transform:uppercase;">Video Sugerido</div>
                  <div style="font-size:13.5px; font-weight:700; color:var(--text-dark);">${escapeHtml(rv.title)}</div>
                </div>
                <button class="btn-primary" style="width:auto; padding:6px 14px; font-size:12px;" onclick="window.UyapayPortal.openVideoModal('${rv.id}')">Ver Video</button>
              </div>
            `;
          });
          (recs.recommendedRules || []).forEach(rr => {
            recsHtml += `
              <div style="background:#ffffff; border:1px solid #fed7aa; border-radius:8px; padding:10px 14px;">
                <div style="font-size:11px; font-weight:700; color:#ea580c; text-transform:uppercase;">Regla de Negocio a Reforzar</div>
                <div style="font-size:13.5px; font-weight:700; color:var(--text-dark);">${escapeHtml(rr.title)}</div>
                <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">${escapeHtml(rr.content)}</div>
              </div>
            `;
          });
          recsHtml += '</div>';
          recsList.innerHTML = recsHtml;
        }
      }

    } catch (e) {
      console.warn('[Perfil] Error al renderizar perfil:', e.message);
    }
  }

  // 7. Suite Administrativa (CRUD Usuarios, Roles y Casos)
  async function renderAdminMgmtView() {
    renderAdminUsersTable();
    renderAdminCasesTable();
  }

  function switchAdminTab(tab) {
    const btnUsers = document.getElementById('btn-adm-tab-users');
    const btnCases = document.getElementById('btn-adm-tab-cases');
    const panelUsers = document.getElementById('admin-users-panel');
    const panelCases = document.getElementById('admin-cases-panel');

    if (btnUsers) btnUsers.className = `admin-subtab ${tab === 'users' ? 'active' : ''}`;
    if (btnCases) btnCases.className = `admin-subtab ${tab === 'cases' ? 'active' : ''}`;

    if (panelUsers) panelUsers.style.display = tab === 'users' ? 'block' : 'none';
    if (panelCases) panelCases.style.display = tab === 'cases' ? 'block' : 'none';
  }

  async function renderAdminUsersTable() {
    const tbody = document.getElementById('admin-users-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Cargando nómina de usuarios...</td></tr>';

    try {
      const users = await safeApiFetch('/api/users-mgmt');
      if (!Array.isArray(users)) throw new Error('Respuesta no válida del servidor.');

      tbody.innerHTML = users.map(u => {
        const isActive = u.status === 'active';
        const rolePills = (u.roles || [u.role]).map(r => `<span class="badge" style="background:#e0f2fe; color:#0369a1; font-size:10.5px; margin-right:4px;">${escapeHtml(r)}</span>`).join('');

        return `
          <tr>
            <td><b>${escapeHtml(u.username)}</b></td>
            <td>${escapeHtml(u.name)}</td>
            <td>${escapeHtml(u.email || '-')}</td>
            <td>${rolePills}</td>
            <td>
              <span class="badge ${isActive ? 'badge-success' : 'badge-danger'}" style="font-size:11px;">
                ${isActive ? 'Activo' : 'Inactivo'}
              </span>
            </td>
            <td style="text-align:center;">
              <div style="display:inline-flex; gap:6px;">
                <button class="btn-secondary" style="font-size:11px; padding:5px 10px;" onclick="window.UyapayPortal.openEditUserModal('${u.id}', '${escapeHtml(u.username)}', '${escapeHtml(u.name)}', '${escapeHtml(u.email || '')}', '${u.role}')">Editar</button>
                <button class="btn-${isActive ? 'secondary' : 'primary'}" style="font-size:11px; padding:5px 10px; ${isActive ? 'color:#dc2626;' : ''}" onclick="window.UyapayPortal.toggleUserStatus('${u.id}')">
                  ${isActive ? 'Inactivar' : 'Activar'}
                </button>
                <button class="btn-secondary" style="font-size:11px; padding:5px 10px;" onclick="window.UyapayPortal.openAdminRolesModal('${u.id}', '${escapeHtml(u.name)}')">Roles</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="6" class="error-msg" style="display:table-cell;">Error: ${escapeHtml(e.message)}</td></tr>`;
    }
  }

  function renderAdminCasesTable() {
    const tbody = document.getElementById('admin-cases-table-body');
    if (!tbody) return;

    tbody.innerHTML = Cases.map(c => `
      <tr>
        <td><b>${escapeHtml(c.code)}</b></td>
        <td>${escapeHtml(c.title)}</td>
        <td><span class="badge badge-warning" style="font-size:11px;">${escapeHtml(c.module || 'Ventas B2C')}</span></td>
        <td>${escapeHtml(c.client || '-')}</td>
        <td><span class="badge badge-success" style="font-size:11px;">Activo en Simulador</span></td>
      </tr>
    `).join('');
  }

  function openCreateUserModal() {
    const modal = document.getElementById('admin-user-modal');
    document.getElementById('admin-user-modal-title').textContent = 'Crear Nuevo Usuario';
    document.getElementById('modal-user-id').value = '';
    document.getElementById('modal-user-username').value = '';
    document.getElementById('modal-user-username').disabled = false;
    document.getElementById('modal-user-fullname').value = '';
    document.getElementById('modal-user-email').value = '';
    document.getElementById('modal-user-role-select').value = 'asesor';
    document.getElementById('modal-user-password').value = '123';
    document.getElementById('modal-user-pass-group').style.display = 'block';

    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('active');
    }
  }

  function openEditUserModal(id, username, name, email, role) {
    const modal = document.getElementById('admin-user-modal');
    document.getElementById('admin-user-modal-title').textContent = 'Editar Usuario';
    document.getElementById('modal-user-id').value = id;
    document.getElementById('modal-user-username').value = username;
    document.getElementById('modal-user-username').disabled = true;
    document.getElementById('modal-user-fullname').value = name;
    document.getElementById('modal-user-email').value = email;
    document.getElementById('modal-user-role-select').value = role;
    document.getElementById('modal-user-pass-group').style.display = 'none';

    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('active');
    }
  }

  function closeAdminUserModal() {
    const modal = document.getElementById('admin-user-modal');
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
    }
  }

  async function saveAdminUser() {
    const id = document.getElementById('modal-user-id').value;
    const username = document.getElementById('modal-user-username').value.trim();
    const name = document.getElementById('modal-user-fullname').value.trim();
    const email = document.getElementById('modal-user-email').value.trim();
    const role = document.getElementById('modal-user-role-select').value;
    const password = document.getElementById('modal-user-password').value.trim();

    if (!name || (!id && !username)) {
      showCustomAlert({ title: 'Campos requeridos', message: 'Nombre y usuario son obligatorios.', icon: '⚠️' });
      return;
    }

    try {
      let data;
      if (id) {
        // Editar usuario existente
        data = await safeApiFetch(`/api/users-mgmt/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ name, email, role })
        });
      } else {
        // Crear nuevo usuario
        data = await safeApiFetch('/api/users-mgmt', {
          method: 'POST',
          body: JSON.stringify({ username, name, email, role, password })
        });
      }

      closeAdminUserModal();
      showCustomAlert({ title: 'Éxito', message: data.message || 'Usuario guardado correctamente.', icon: '✅' });
      renderAdminUsersTable();
    } catch (e) {
      showCustomAlert({ title: 'Error', message: e.message, icon: '⚠️' });
    }
  }

  async function toggleUserStatus(userId) {
    try {
      const data = await safeApiFetch(`/api/users-mgmt/${userId}/toggle-status`, {
        method: 'PATCH'
      });
      renderAdminUsersTable();
    } catch (e) {
      showCustomAlert({ title: 'Error', message: e.message, icon: '⚠️' });
    }
  }

  async function openAdminRolesModal(userId, userName) {
    const modal = document.getElementById('admin-roles-modal');
    document.getElementById('modal-roles-user-id').value = userId;
    document.getElementById('modal-roles-subtitle').textContent = `Usuario: ${userName}`;

    // Resetear checkboxes
    ['participante', 'facilitador', 'editor', 'admin'].forEach(r => {
      const chk = document.getElementById(`chk-role-${r}`);
      if (chk) chk.checked = false;
    });

    try {
      const roles = await safeApiFetch(`/api/users-mgmt/${userId}/roles`);
      if (Array.isArray(roles)) {
        roles.forEach(r => {
          const chk = document.getElementById(`chk-role-${r.code}`);
          if (chk) chk.checked = true;
        });
      }
    } catch (e) {}

    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('active');
    }
  }

  function closeAdminRolesModal() {
    const modal = document.getElementById('admin-roles-modal');
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
    }
  }

  async function saveUserRoles() {
    const userId = document.getElementById('modal-roles-user-id').value;
    const selectedRoles = [];
    ['participante', 'facilitador', 'editor', 'admin'].forEach(r => {
      const chk = document.getElementById(`chk-role-${r}`);
      if (chk && chk.checked) selectedRoles.push(chk.value);
    });

    if (selectedRoles.length === 0) {
      showCustomAlert({ title: 'Atención', message: 'Debes asignar al menos un rol al usuario.', icon: '⚠️' });
      return;
    }

    try {
      const data = await safeApiFetch(`/api/users-mgmt/${userId}/roles`, {
        method: 'PUT',
        body: JSON.stringify({ roleIds: selectedRoles })
      });

      closeAdminRolesModal();
      showCustomAlert({ title: 'Éxito', message: (data && data.message) || 'Roles actualizados correctamente.', icon: '✅' });
      renderAdminUsersTable();
    } catch (e) {
      showCustomAlert({ title: 'Error', message: e.message, icon: '⚠️' });
    }
  }


  // ================= 7. CALENDARIO DE EVALUACIONES Y CUESTIONARIOS TEÓRICOS (FLUJO 12 PRDv2) =================
  let calendarCurrentYear = new Date().getFullYear();
  let calendarCurrentMonth = new Date().getMonth();
  let cachedCalendarEvents = [];
  let cachedQuestionnaires = [];
  let selectedCalendarEvent = null;
  let builderQuestions = [];
  let activeQuestionnaireExam = null;
  let questionnaireTimerInterval = null;
  let questionnaireElapsedSeconds = 0;
  let questionnaireUserAnswers = {};
  let activeGatekeeperBlock = null;

  const MONTH_NAMES_ES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Verificación y actualización de estado de bloqueo Gatekeeper (Algoritmo 3 PRDv2)
  async function checkGatekeeperStatus(user) {
    const banner = document.getElementById('gatekeeper-status-banner');
    if (!banner) return;
    if (!user) {
      banner.style.display = 'none';
      return;
    }

    try {
      const res = await Storage.getGatekeeperStatus(user.username || user.id);
      if (res && res.status === 'LOCKED' && res.has_blocking_evaluation) {
        activeGatekeeperBlock = res.evaluation;
        banner.style.display = 'flex';
        const titleEl = document.getElementById('gatekeeper-banner-title');
        const msgEl = document.getElementById('gatekeeper-banner-msg');
        if (titleEl) {
          titleEl.textContent = `Bloqueo Operativo Activo (Gatekeeper) • ${res.evaluation.title || 'Evaluación Obligatoria'}`;
        }
        if (msgEl) {
          msgEl.textContent = `Tienes una evaluación obligatoria programada para hoy (${res.evaluation.scheduledDate || 'hoy'}). Tus operaciones comerciales y rutas están restringidas hasta que rindas la prueba.`;
        }
      } else {
        activeGatekeeperBlock = null;
        banner.style.display = 'none';
      }
    } catch (e) {
      console.warn('[Gatekeeper] Error al verificar estado:', e);
      banner.style.display = 'none';
    }
  }

  function handleGatekeeperAction() {
    if (!activeGatekeeperBlock) {
      switchTab('calendar-view');
      return;
    }

    if (activeGatekeeperBlock.type === 'CUESTIONARIO') {
      const evt = cachedCalendarEvents.find(e => e.id === activeGatekeeperBlock.eventId);
      const qId = evt ? evt.questionnaireId : null;
      if (qId) {
        startQuestionnaireExam(qId);
      } else {
        switchTab('calendar-view');
      }
    } else {
      // SIMULADOR
      switchTab('asesor-eval-intro');
    }
  }

  // Renderizado del Calendario Mensual
  async function renderCalendarView(year = calendarCurrentYear, month = calendarCurrentMonth) {
    calendarCurrentYear = year;
    calendarCurrentMonth = month;

    const titleEl = document.getElementById('calendar-month-title');
    if (titleEl) {
      titleEl.textContent = `${MONTH_NAMES_ES[calendarCurrentMonth]} ${calendarCurrentYear}`;
    }

    const currentUser = Auth.getCurrentUser();
    const isStaff = isUserStaff(currentUser);

    // Ajustar visibilidad de botones de creación para personal autorizado
    const btnCreateQ = document.getElementById('btn-global-create-questionnaire');
    const btnSchedule = document.getElementById('btn-schedule-new-eval');
    if (btnCreateQ) btnCreateQ.style.display = isStaff ? 'inline-flex' : 'none';
    if (btnSchedule) btnSchedule.style.display = isStaff ? 'inline-flex' : 'none';

    try {
      const [events, questionnaires] = await Promise.all([
        Storage.getCalendarEvents(),
        Storage.getQuestionnaires()
      ]);

      cachedCalendarEvents = Array.isArray(events) ? events : [];
      cachedQuestionnaires = Array.isArray(questionnaires) ? questionnaires : [];

      renderCalendarDaysGrid(calendarCurrentYear, calendarCurrentMonth, isStaff);
      renderQuestionnairesBank(cachedQuestionnaires, isStaff);
    } catch (e) {
      console.error('[Calendario] Error al cargar datos:', e);
    }
  }

  function renderCalendarDaysGrid(year, month, isStaff) {
    const grid = document.getElementById('calendar-days-grid');
    if (!grid) return;

    grid.innerHTML = '';

    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Lunes = 0, Domingo = 6
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const totalCells = (firstDayIndex + daysInMonth > 35) ? 42 : 35;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement('div');

      if (i < firstDayIndex) {
        // Días del mes previo
        const dayNum = daysInPrevMonth - firstDayIndex + i + 1;
        cell.className = 'calendar-day-cell other-month';
        cell.innerHTML = `<div class="calendar-day-number">${dayNum}</div>`;
      } else if (i < firstDayIndex + daysInMonth) {
        // Días del mes corriente
        const dayNum = i - firstDayIndex + 1;
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        const isToday = dateStr === todayStr;

        cell.className = `calendar-day-cell${isToday ? ' today' : ''}`;
        cell.id = `cal-cell-${dateStr}`;

        // Eventos en este día
        const matchingEvents = cachedCalendarEvents.filter(evt => {
          const s = evt.startDate;
          const e = evt.endDate || evt.startDate;
          return dateStr >= s && dateStr <= e;
        });

        let eventsHtml = '';
        matchingEvents.forEach(evt => {
          const isSim = evt.evaluationType === 'SIMULADOR';
          const icon = isSim ? '📱' : '📝';
          const pillClass = isSim ? 'simulator' : 'questionnaire';
          eventsHtml += `
            <div class="calendar-event-pill ${pillClass}" title="${escapeHtml(evt.title)} (${evt.completedCount}/${evt.totalAssigned} finalizados)" onclick="event.stopPropagation(); window.UyapayPortal.openEventDetailsModal('${evt.id}')">
              ${icon} ${escapeHtml(evt.title)}
            </div>
          `;
        });

        cell.innerHTML = `
          <div class="calendar-day-number">
            <span>${dayNum}</span>
            ${isToday ? '<span style="font-size:10px; color:var(--yellow-dark);">HOY</span>' : ''}
          </div>
          <div style="flex:1; overflow-y:auto;">${eventsHtml}</div>
        `;

        if (isStaff) {
          cell.onclick = () => openScheduleModal(dateStr);
        }
      } else {
        // Días del mes siguiente
        const dayNum = i - (firstDayIndex + daysInMonth) + 1;
        cell.className = 'calendar-day-cell other-month';
        cell.innerHTML = `<div class="calendar-day-number">${dayNum}</div>`;
      }

      grid.appendChild(cell);
    }
  }

  function renderQuestionnairesBank(questionnaires, isStaff) {
    const container = document.getElementById('questionnaires-list-container');
    const badge = document.getElementById('questionnaires-count-badge');
    if (!container) return;

    if (badge) {
      badge.textContent = `${questionnaires.length} Cuestionario${questionnaires.length === 1 ? '' : 's'}`;
    }

    if (questionnaires.length === 0) {
      container.innerHTML = '<div style="color:var(--text-muted); padding:20px; grid-column:1/-1; text-align:center;">No hay cuestionarios teóricos registrados en el banco institucional.</div>';
      return;
    }

    container.innerHTML = questionnaires.map(q => `
      <div class="card" style="padding:16px; border:1px solid #e9d5ff; background:#faf5ff;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
          <div style="font-size:24px;">📝</div>
          <span class="badge" style="background:#ede9fe; color:#6d28d9; font-weight:700;">+${q.xpReward || 50} XP</span>
        </div>
        <h4 style="margin:0 0 6px 0; font-size:15px; color:#5b21b6;">${escapeHtml(q.title)}</h4>
        <p style="font-size:12.5px; color:var(--text-muted); margin:0 0 12px 0; line-height:1.4;">${escapeHtml(q.description || 'Evaluación de políticas comerciales y normativas operativas.')}</p>
        <div style="display:flex; gap:12px; font-size:12px; color:#7c3aed; font-weight:600; margin-bottom:14px;">
          <span>⏱️ ${q.durationMinutes || 20} min</span>
          <span>❓ ${q.questionCount || 0} preguntas</span>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn-primary" style="flex:1; padding:7px 12px; font-size:12px; background:#7c3aed;" onclick="window.UyapayPortal.startQuestionnaireExam('${q.id}')">Rendir Examen ➔</button>
          ${isStaff ? `<button class="btn-secondary" style="width:auto; padding:7px 10px; font-size:12px;" onclick="window.UyapayPortal.openScheduleModal(null, '${q.id}')">📅 Programar</button>` : ''}
        </div>
      </div>
    `).join('');
  }

  function changeCalendarMonth(delta) {
    calendarCurrentMonth += delta;
    if (calendarCurrentMonth > 11) {
      calendarCurrentMonth = 0;
      calendarCurrentYear++;
    } else if (calendarCurrentMonth < 0) {
      calendarCurrentMonth = 11;
      calendarCurrentYear--;
    }
    renderCalendarView(calendarCurrentYear, calendarCurrentMonth);
  }

  function goToToday() {
    const now = new Date();
    calendarCurrentYear = now.getFullYear();
    calendarCurrentMonth = now.getMonth();
    renderCalendarView(calendarCurrentYear, calendarCurrentMonth);
  }

  // ================= MODAL DE PROGRAMACIÓN DE EVALUACIONES =================
  async function openScheduleModal(initialDate = null, defaultQuestionnaireId = null) {
    const modal = document.getElementById('schedule-eval-modal');
    if (!modal) return;

    const titleInput = document.getElementById('schedule-title-input');
    const startInput = document.getElementById('schedule-start-date');
    const endInput = document.getElementById('schedule-end-date');
    const questSelect = document.getElementById('schedule-quest-select');
    const advisorsContainer = document.getElementById('schedule-advisors-list');
    const selectAllCb = document.getElementById('schedule-select-all');

    if (titleInput) titleInput.value = '';
    const today = new Date().toISOString().split('T')[0];
    if (startInput) startInput.value = initialDate || today;
    if (endInput) endInput.value = initialDate || today;
    if (selectAllCb) selectAllCb.checked = false;

    // Poblar cuestionarios en el selector
    if (questSelect) {
      questSelect.innerHTML = cachedQuestionnaires.map(q => `<option value="${q.id}">${escapeHtml(q.title)} (${q.durationMinutes} min - +${q.xpReward} XP)</option>`).join('');
      if (defaultQuestionnaireId) {
        questSelect.value = defaultQuestionnaireId;
      }
    }

    // Ajustar radio y paneles según cuestionario por defecto
    const simRadio = document.querySelector('input[name="schedule-type-radio"][value="SIMULADOR"]');
    const questRadio = document.querySelector('input[name="schedule-type-radio"][value="CUESTIONARIO"]');
    if (defaultQuestionnaireId && questRadio) {
      questRadio.checked = true;
    } else if (simRadio) {
      simRadio.checked = true;
    }
    toggleScheduleTypeFields();

    // Cargar asesores oficiales
    if (advisorsContainer) {
      advisorsContainer.innerHTML = '<div style="color:var(--text-muted); font-size:12px;">Cargando nómina de asesores...</div>';
      try {
        let users = await safeApiFetch('/api/users').catch(() => []);
        if (!Array.isArray(users) || users.length === 0) {
          users = await safeApiFetch('/api/users-mgmt').catch(() => []);
        }
        const advisors = Array.isArray(users) ? users.filter(u => (u.role === 'asesor' || u.role === 'participante') && u.status !== 'inactive') : [];
        const listToRender = advisors.length > 0 ? advisors : [
          { id: 'usr-edward', username: 'edward', name: 'Edward Velásquez' },
          { id: 'usr-almendra', username: 'almendra', name: 'Almendra Villafuerte' },
          { id: 'usr-carlos', username: 'carlos', name: 'Carlos Mendoza' },
          { id: 'usr-jorge', username: 'jorge', name: 'Jorge Huamán' },
          { id: 'usr-maria', username: 'maria', name: 'María Paredes' }
        ];

        advisorsContainer.innerHTML = listToRender.map(adv => `
          <label style="display:flex; align-items:center; gap:8px; font-size:13px; cursor:pointer; padding:2px 0;">
            <input type="checkbox" name="schedule-advisor-cb" value="${adv.id || adv.username}">
            <span><b>${escapeHtml(adv.name)}</b> <span style="color:var(--text-muted);">(@${escapeHtml(adv.username)})</span></span>
          </label>
        `).join('');
      } catch (err) {
        advisorsContainer.innerHTML = '<div style="color:var(--danger); font-size:12px;">Error al cargar nómina de asesores.</div>';
      }
    }

    modal.style.display = 'flex';
  }

  function closeScheduleModal() {
    const modal = document.getElementById('schedule-eval-modal');
    if (modal) modal.style.display = 'none';
  }

  function toggleScheduleTypeFields() {
    const selectedRadio = document.querySelector('input[name="schedule-type-radio"]:checked');
    const type = selectedRadio ? selectedRadio.value : 'SIMULADOR';

    const simOpts = document.getElementById('schedule-simulator-opts');
    const questOpts = document.getElementById('schedule-quest-opts');

    if (simOpts) simOpts.style.display = type === 'SIMULADOR' ? 'block' : 'none';
    if (questOpts) questOpts.style.display = type === 'CUESTIONARIO' ? 'block' : 'none';
  }

  function toggleSelectAllAdvisors(checked) {
    const cbs = document.querySelectorAll('input[name="schedule-advisor-cb"]');
    cbs.forEach(cb => { cb.checked = checked; });
  }

  async function saveScheduledEvaluation() {
    const typeRadio = document.querySelector('input[name="schedule-type-radio"]:checked');
    const evaluationType = typeRadio ? typeRadio.value : 'SIMULADOR';
    const title = (document.getElementById('schedule-title-input')?.value || '').trim();
    const startDate = document.getElementById('schedule-start-date')?.value;
    const endDate = document.getElementById('schedule-end-date')?.value || startDate;
    const simLevel = document.getElementById('schedule-sim-level')?.value || 'basico';
    const questionnaireId = evaluationType === 'CUESTIONARIO' ? document.getElementById('schedule-quest-select')?.value : null;

    const checkedBoxes = document.querySelectorAll('input[name="schedule-advisor-cb"]:checked');
    const assignedUsers = Array.from(checkedBoxes).map(cb => cb.value);

    if (!title) {
      showCustomAlert({ title: 'Campo Obligatorio', message: 'Por favor ingresa un título para la evaluación programada.', icon: '⚠️' });
      return;
    }
    if (!startDate) {
      showCustomAlert({ title: 'Fecha Requerida', message: 'Por favor selecciona la fecha de inicio.', icon: '⚠️' });
      return;
    }
    if (evaluationType === 'CUESTIONARIO' && !questionnaireId) {
      showCustomAlert({ title: 'Cuestionario Requerido', message: 'Selecciona un cuestionario para programar la prueba.', icon: '⚠️' });
      return;
    }
    if (assignedUsers.length === 0) {
      showCustomAlert({ title: 'Asesores Requeridos', message: 'Debes convocar al menos a un asesor comercial para esta evaluación.', icon: '⚠️' });
      return;
    }

    try {
      const payload = {
        title,
        evaluationType,
        level: simLevel,
        questionnaireId,
        startDate,
        endDate,
        assignedUsers
      };

      const res = await Storage.createCalendarEvent(payload);
      if (!res.success && res.message) {
        throw new Error(res.message);
      }

      closeScheduleModal();
      await showCustomAlert({
        title: 'Programación Exitosa',
        message: `✅ Se programó la evaluación "${title}" para ${assignedUsers.length} asesor(es).\nEl algoritmo Gatekeeper mantendrá el bloqueo operativo activo en las fechas asignadas hasta que cada asesor rinda la prueba.`,
        icon: '✅'
      });

      await renderCalendarView();
      await checkGatekeeperStatus(Auth.getCurrentUser());
    } catch (e) {
      showCustomAlert({ title: 'Error al Programar', message: e.message, icon: '⚠️' });
    }
  }

  // ================= MODAL DE DETALLES DE EVENTO =================
  function openEventDetailsModal(eventId) {
    const modal = document.getElementById('event-details-modal');
    selectedCalendarEvent = cachedCalendarEvents.find(e => e.id === eventId);
    if (!modal || !selectedCalendarEvent) return;

    const currentUser = Auth.getCurrentUser();
    const isStaff = isUserStaff(currentUser);

    const titleEl = document.getElementById('event-detail-title');
    const subEl = document.getElementById('event-detail-subtitle');
    const typeBadge = document.getElementById('event-detail-type-badge');
    const datesBadge = document.getElementById('event-detail-dates-badge');
    const progressText = document.getElementById('event-detail-progress-text');
    const progressBar = document.getElementById('event-detail-progress-bar');
    const advisorsList = document.getElementById('event-detail-advisors-list');
    const btnDelete = document.getElementById('btn-delete-event');
    const btnTake = document.getElementById('btn-take-event-eval');

    if (titleEl) titleEl.textContent = selectedCalendarEvent.title;
    if (subEl) {
      subEl.textContent = selectedCalendarEvent.evaluationType === 'SIMULADOR'
        ? `Nivel: ${selectedCalendarEvent.level || 'Básico'}`
        : `Cuestionario: ${selectedCalendarEvent.questionnaireTitle || selectedCalendarEvent.title}`;
    }

    const isSim = selectedCalendarEvent.evaluationType === 'SIMULADOR';
    if (typeBadge) {
      typeBadge.textContent = isSim ? '📱 Simulador Móvil' : '📝 Cuestionario Teórico';
      typeBadge.style.background = isSim ? '#dbeafe' : '#f3e8ff';
      typeBadge.style.color = isSim ? '#1e40af' : '#6b21a8';
    }

    if (datesBadge) {
      datesBadge.textContent = `Vigencia: ${selectedCalendarEvent.startDate} al ${selectedCalendarEvent.endDate || selectedCalendarEvent.startDate}`;
    }

    const compCount = selectedCalendarEvent.completedCount || 0;
    const totCount = selectedCalendarEvent.totalAssigned || 0;
    const rate = selectedCalendarEvent.completionRate || 0;

    if (progressText) progressText.textContent = `${compCount} de ${totCount} convocados (${rate}%)`;
    if (progressBar) progressBar.style.width = `${rate}%`;

    if (btnDelete) btnDelete.style.display = isStaff ? 'inline-block' : 'none';
    if (btnTake) {
      btnTake.style.display = 'inline-block';
    }

    if (advisorsList) {
      const assigned = selectedCalendarEvent.assignedUsers || [];
      if (assigned.length === 0) {
        advisorsList.innerHTML = '<div style="color:var(--text-muted); font-size:12px;">Sin asesores asignados.</div>';
      } else {
        advisorsList.innerHTML = assigned.map(adv => `
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:12.5px; padding:4px 0; border-bottom:1px solid #f1f5f9;">
            <span>👤 <b>${escapeHtml(adv.name || adv.username)}</b> <span style="color:var(--text-muted); font-size:11px;">(@${escapeHtml(adv.username)})</span></span>
            <span class="badge" style="font-size:11px; background:#f1f5f9; color:#475569;">Convocado</span>
          </div>
        `).join('');
      }
    }

    modal.style.display = 'flex';
  }

  function closeEventDetailsModal() {
    const modal = document.getElementById('event-details-modal');
    if (modal) modal.style.display = 'none';
  }

  async function deleteCurrentEvent() {
    if (!selectedCalendarEvent) return;
    const confirmed = await showCustomConfirm({
      title: '¿Eliminar Convocatoria?',
      message: `¿Estás seguro de eliminar "${selectedCalendarEvent.title}" del calendario?\nSe eliminarán las asignaciones y se liberará el bloqueo Gatekeeper asociado.`,
      icon: '🗑️',
      confirmText: 'Sí, Eliminar',
      confirmDanger: true
    });

    if (confirmed) {
      await Storage.deleteCalendarEvent(selectedCalendarEvent.id);
      closeEventDetailsModal();
      await renderCalendarView();
      await checkGatekeeperStatus(Auth.getCurrentUser());
    }
  }

  function takeEvaluationFromEvent() {
    if (!selectedCalendarEvent) return;
    const evt = selectedCalendarEvent;
    closeEventDetailsModal();

    if (evt.evaluationType === 'CUESTIONARIO' && evt.questionnaireId) {
      startQuestionnaireExam(evt.questionnaireId);
    } else {
      switchTab('asesor-eval-intro');
    }
  }

  // ================= CREADOR DE CUESTIONARIOS TEÓRICOS (ESTILO GOOGLE FORMS) =================
  function openQuestionnaireBuilderModal() {
    const modal = document.getElementById('questionnaire-builder-modal');
    if (!modal) return;

    const titleInput = document.getElementById('builder-title');
    const descInput = document.getElementById('builder-desc');
    const durInput = document.getElementById('builder-duration');
    const xpInput = document.getElementById('builder-xp');

    if (titleInput) titleInput.value = '';
    if (descInput) descInput.value = '';
    if (durInput) durInput.value = 20;
    if (xpInput) xpInput.value = 50;

    builderQuestions = [];
    addBuilderQuestion(); // 1 pregunta inicial por defecto

    modal.style.display = 'flex';
  }

  function closeQuestionnaireBuilderModal() {
    const modal = document.getElementById('questionnaire-builder-modal');
    if (modal) modal.style.display = 'none';
  }

  function addBuilderQuestion() {
    const qId = 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    builderQuestions.push({
      id: qId,
      text: '',
      type: 'single', // 'single', 'multiple', 'boolean'
      options: ['Alternativa 1', 'Alternativa 2'],
      correctAnswers: ['Alternativa 1'],
      explanation: ''
    });
    renderBuilderQuestions();
  }

  function removeBuilderQuestion(qIndex) {
    if (builderQuestions.length <= 1) {
      showCustomAlert({ title: 'Mínimo de Preguntas', message: 'El cuestionario debe contener al menos 1 pregunta.', icon: 'ℹ️' });
      return;
    }
    builderQuestions.splice(qIndex, 1);
    renderBuilderQuestions();
  }

  function setBuilderQuestionType(qIndex, type) {
    const q = builderQuestions[qIndex];
    if (!q) return;
    q.type = type;

    if (type === 'boolean') {
      q.options = ['Verdadero', 'Falso'];
      q.correctAnswers = ['Verdadero'];
    } else if (type === 'single') {
      if (q.options.length < 2) q.options = ['Alternativa 1', 'Alternativa 2'];
      q.correctAnswers = [q.options[0]];
    } else if (type === 'multiple') {
      if (q.options.length < 2) q.options = ['Alternativa 1', 'Alternativa 2'];
      q.correctAnswers = [q.options[0]];
    }
    renderBuilderQuestions();
  }

  function addBuilderOption(qIndex) {
    const q = builderQuestions[qIndex];
    if (!q || q.type === 'boolean') return;
    const newOpt = `Alternativa ${q.options.length + 1}`;
    q.options.push(newOpt);
    renderBuilderQuestions();
  }

  function removeBuilderOption(qIndex, optIndex) {
    const q = builderQuestions[qIndex];
    if (!q || q.type === 'boolean') return;
    if (q.options.length <= 2) {
      showCustomAlert({ title: 'Mínimo de Alternativas', message: 'Debe haber al menos 2 alternativas por pregunta.', icon: 'ℹ️' });
      return;
    }
    const removedOpt = q.options.splice(optIndex, 1)[0];
    q.correctAnswers = q.correctAnswers.filter(ca => ca !== removedOpt);
    if (q.correctAnswers.length === 0 && q.options.length > 0) {
      q.correctAnswers = [q.options[0]];
    }
    renderBuilderQuestions();
  }

  function toggleBuilderCorrectAnswer(qIndex, optValue) {
    const q = builderQuestions[qIndex];
    if (!q) return;

    if (q.type === 'single' || q.type === 'boolean') {
      q.correctAnswers = [optValue];
    } else if (q.type === 'multiple') {
      if (q.correctAnswers.includes(optValue)) {
        if (q.correctAnswers.length > 1) {
          q.correctAnswers = q.correctAnswers.filter(ca => ca !== optValue);
        }
      } else {
        q.correctAnswers.push(optValue);
      }
    }
    renderBuilderQuestions();
  }

  function updateBuilderQuestionField(qIndex, field, value) {
    if (builderQuestions[qIndex]) {
      builderQuestions[qIndex][field] = value;
    }
  }

  function updateBuilderOptionValue(qIndex, optIndex, newValue) {
    const q = builderQuestions[qIndex];
    if (!q) return;
    const oldVal = q.options[optIndex];
    q.options[optIndex] = newValue;
    const caIdx = q.correctAnswers.indexOf(oldVal);
    if (caIdx !== -1) {
      q.correctAnswers[caIdx] = newValue;
    }
  }

  function renderBuilderQuestions() {
    const container = document.getElementById('builder-questions-container');
    if (!container) return;

    container.innerHTML = builderQuestions.map((q, qIndex) => {
      const isBoolean = q.type === 'boolean';
      const isMultiple = q.type === 'multiple';

      const optionsHtml = q.options.map((opt, optIndex) => {
        const isCorrect = q.correctAnswers.includes(opt);
        return `
          <div class="builder-option-row">
            <input type="${isMultiple ? 'checkbox' : 'radio'}" name="correct-marker-${qIndex}" ${isCorrect ? 'checked' : ''} onchange="window.UyapayPortal.toggleBuilderCorrectAnswer(${qIndex}, '${escapeHtml(opt)}')" title="Marcar como respuesta correcta">
            <input type="text" class="input" style="flex:1; padding:6px 10px; font-size:13px;" value="${escapeHtml(opt)}" ${isBoolean ? 'readonly' : ''} oninput="window.UyapayPortal.updateBuilderOptionValue(${qIndex}, ${optIndex}, this.value)">
            ${!isBoolean ? `<button class="btn-secondary" style="width:28px; height:28px; padding:0; line-height:1; font-size:12px; color:#ef4444;" onclick="window.UyapayPortal.removeBuilderOption(${qIndex}, ${optIndex})" title="Eliminar opción">✕</button>` : ''}
          </div>
        `;
      }).join('');

      return `
        <div class="builder-question-item">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <b style="font-size:13.5px; color:#6d28d9;">Pregunta #${qIndex + 1}</b>
            <div style="display:flex; gap:8px; align-items:center;">
              <select class="input" style="width:auto; padding:4px 8px; font-size:12px;" onchange="window.UyapayPortal.setBuilderQuestionType(${qIndex}, this.value)">
                <option value="single" ${q.type === 'single' ? 'selected' : ''}>Opción Única</option>
                <option value="multiple" ${q.type === 'multiple' ? 'selected' : ''}>Varias Respuestas</option>
                <option value="boolean" ${q.type === 'boolean' ? 'selected' : ''}>Verdadero / Falso</option>
              </select>
              <button class="btn-secondary" style="width:auto; padding:4px 8px; font-size:11px; color:#ef4444;" onclick="window.UyapayPortal.removeBuilderQuestion(${qIndex})">🗑️</button>
            </div>
          </div>

          <div style="margin-bottom:12px;">
            <input type="text" class="input" placeholder="Enunciado de la pregunta..." value="${escapeHtml(q.text)}" oninput="window.UyapayPortal.updateBuilderQuestionField(${qIndex}, 'text', this.value)">
          </div>

          <div style="margin-bottom:12px;">
            <div style="font-size:11.5px; font-weight:700; color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">Alternativas y Respuesta Correcta:</div>
            ${optionsHtml}
            ${!isBoolean ? `<button class="btn-secondary" style="width:auto; padding:4px 10px; font-size:11.5px; margin-top:4px;" onclick="window.UyapayPortal.addBuilderOption(${qIndex})">+ Agregar Alternativa</button>` : ''}
          </div>

          <div>
            <label style="font-size:11.5px; font-weight:700; color:var(--text-muted); display:block; margin-bottom:4px; text-transform:uppercase;">Justificación Pedagógica (Feedback didáctico):</label>
            <input type="text" class="input" placeholder="Explicación que verá el asesor tras finalizar la prueba..." value="${escapeHtml(q.explanation)}" oninput="window.UyapayPortal.updateBuilderQuestionField(${qIndex}, 'explanation', this.value)">
          </div>
        </div>
      `;
    }).join('');
  }

  async function saveTheoreticalQuestionnaire() {
    const title = (document.getElementById('builder-title')?.value || '').trim();
    const description = (document.getElementById('builder-desc')?.value || '').trim();
    const durationMinutes = parseInt(document.getElementById('builder-duration')?.value || '20', 10);
    const xpReward = parseInt(document.getElementById('builder-xp')?.value || '50', 10);

    if (!title) {
      showCustomAlert({ title: 'Título Requerido', message: 'Por favor ingresa un título para el cuestionario.', icon: '⚠️' });
      return;
    }
    if (builderQuestions.length === 0) {
      showCustomAlert({ title: 'Preguntas Requeridas', message: 'Debes incluir al menos una pregunta.', icon: '⚠️' });
      return;
    }

    for (let i = 0; i < builderQuestions.length; i++) {
      const q = builderQuestions[i];
      if (!q.text.trim()) {
        showCustomAlert({ title: 'Pregunta Incompleta', message: `La Pregunta #${i + 1} no tiene enunciado.`, icon: '⚠️' });
        return;
      }
      if (!q.correctAnswers || q.correctAnswers.length === 0) {
        showCustomAlert({ title: 'Respuesta Faltante', message: `La Pregunta #${i + 1} no tiene marcada ninguna respuesta correcta.`, icon: '⚠️' });
        return;
      }
    }

    try {
      const payload = {
        title,
        description,
        durationMinutes,
        xpReward,
        questions: builderQuestions
      };

      const res = await Storage.createQuestionnaire(payload);
      if (!res.success && res.message) {
        throw new Error(res.message);
      }

      closeQuestionnaireBuilderModal();
      await showCustomAlert({
        title: 'Cuestionario Creado',
        message: `✅ El cuestionario "${title}" fue registrado con éxito en el catálogo institucional.`,
        icon: '✅'
      });

      await renderCalendarView();
    } catch (e) {
      showCustomAlert({ title: 'Error al Guardar', message: e.message, icon: '⚠️' });
    }
  }

  // ================= RESOLUCIÓN DE CUESTIONARIOS TEÓRICOS =================
  async function startQuestionnaireExam(questionnaireId) {
    const modal = document.getElementById('take-questionnaire-modal');
    if (!modal) return;

    try {
      const q = await Storage.getQuestionnaireById(questionnaireId);
      if (!q) {
        throw new Error('No se pudo cargar la información del cuestionario.');
      }

      activeQuestionnaireExam = q;
      questionnaireElapsedSeconds = 0;
      questionnaireUserAnswers = {};

      const examView = document.getElementById('take-quest-exam-view');
      const resultView = document.getElementById('take-quest-result-view');
      if (examView) examView.style.display = 'block';
      if (resultView) resultView.style.display = 'none';

      const titleEl = document.getElementById('take-quest-title');
      const descEl = document.getElementById('take-quest-desc');
      if (titleEl) titleEl.textContent = q.title;
      if (descEl) descEl.textContent = q.description || 'Evaluación de conocimientos teóricos y normativas oficiales.';

      renderTakeQuestions(q.questions);

      // Iniciar cronómetro regresivo
      const totalSeconds = (q.durationMinutes || 20) * 60;
      startQuestionnaireTimer(totalSeconds);

      modal.style.display = 'flex';
    } catch (e) {
      showCustomAlert({ title: 'Error al Iniciar Examen', message: e.message, icon: '⚠️' });
    }
  }

  function startQuestionnaireTimer(totalSeconds) {
    if (questionnaireTimerInterval) clearInterval(questionnaireTimerInterval);
    const timerEl = document.getElementById('take-quest-timer');

    function updateDisplay() {
      const remaining = Math.max(0, totalSeconds - questionnaireElapsedSeconds);
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      if (timerEl) {
        timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        if (remaining <= 60) {
          timerEl.style.color = '#dc2626';
          timerEl.style.background = '#fee2e2';
        } else {
          timerEl.style.color = '#7c3aed';
          timerEl.style.background = '#ede9fe';
        }
      }
      if (remaining <= 0) {
        clearInterval(questionnaireTimerInterval);
        showCustomAlert({ title: 'Tiempo Agotado', message: 'El tiempo límite ha concluido. El cuestionario se enviará automáticamente.', icon: '⏱️' });
        submitQuestionnaireExam(true);
      }
    }

    updateDisplay();
    questionnaireTimerInterval = setInterval(() => {
      questionnaireElapsedSeconds++;
      updateDisplay();
    }, 1000);
  }

  function renderTakeQuestions(questions = []) {
    const container = document.getElementById('take-quest-questions-container');
    if (!container) return;

    container.innerHTML = questions.map((qu, qIdx) => {
      const isMultiple = qu.type === 'multiple';
      const typeLabel = isMultiple ? 'Varias Respuestas' : (qu.type === 'boolean' ? 'Verdadero o Falso' : 'Opción Única');

      const optionsHtml = (qu.options || []).map((opt, optIdx) => `
        <div class="take-option-item" id="take-opt-${qIdx}-${optIdx}" onclick="window.UyapayPortal.onTakeOptionSelected(${qIdx}, '${qu.id}', '${escapeHtml(opt)}', ${isMultiple})">
          <div style="width:20px; height:20px; border-radius:${isMultiple ? '4px' : '50%'}; border:2px solid #cbd5e1; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700;" class="take-opt-indicator"></div>
          <span style="flex:1;">${escapeHtml(opt)}</span>
        </div>
      `).join('');

      return `
        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:18px; margin-bottom:18px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span class="badge" style="background:#ede9fe; color:#6d28d9; font-size:11px;">Pregunta ${qIdx + 1} de ${questions.length}</span>
            <span style="font-size:11px; color:var(--text-muted);">${typeLabel}</span>
          </div>
          <h4 style="margin:0 0 14px 0; font-size:14.5px; color:var(--text-dark);">${escapeHtml(qu.text)}</h4>
          <div>${optionsHtml}</div>
        </div>
      `;
    }).join('');
  }

  function onTakeOptionSelected(qIdx, quId, optionValue, isMultiple) {
    if (!isMultiple) {
      questionnaireUserAnswers[quId] = optionValue;
    } else {
      let current = questionnaireUserAnswers[quId];
      if (!Array.isArray(current)) current = [];
      if (current.includes(optionValue)) {
        current = current.filter(v => v !== optionValue);
      } else {
        current.push(optionValue);
      }
      questionnaireUserAnswers[quId] = current;
    }

    // Actualizar estilos en UI
    const qu = activeQuestionnaireExam.questions[qIdx];
    (qu.options || []).forEach((opt, optIdx) => {
      const el = document.getElementById(`take-opt-${qIdx}-${optIdx}`);
      if (!el) return;
      const isSelected = isMultiple
        ? (questionnaireUserAnswers[quId] || []).includes(opt)
        : questionnaireUserAnswers[quId] === opt;

      if (isSelected) {
        el.classList.add('selected');
        const ind = el.querySelector('.take-opt-indicator');
        if (ind) {
          ind.style.borderColor = '#7c3aed';
          ind.style.background = '#7c3aed';
          ind.style.color = '#fff';
          ind.textContent = '✓';
        }
      } else {
        el.classList.remove('selected');
        const ind = el.querySelector('.take-opt-indicator');
        if (ind) {
          ind.style.borderColor = '#cbd5e1';
          ind.style.background = 'transparent';
          ind.style.color = 'transparent';
          ind.textContent = '';
        }
      }
    });
  }

  async function submitQuestionnaireExam(force = false) {
    if (!activeQuestionnaireExam) return;

    const totalQuestions = activeQuestionnaireExam.questions.length;
    const answeredCount = Object.keys(questionnaireUserAnswers).filter(k => {
      const val = questionnaireUserAnswers[k];
      return Array.isArray(val) ? val.length > 0 : Boolean(val);
    }).length;

    if (!force && answeredCount < totalQuestions) {
      const proceed = await showCustomConfirm({
        title: 'Preguntas Sin Responder',
        message: `Has respondido ${answeredCount} de ${totalQuestions} preguntas.\n¿Deseas enviar el cuestionario de todas formas?`,
        icon: '⚠️',
        confirmText: 'Sí, Enviar',
        cancelText: 'Seguir Respondiendo'
      });
      if (!proceed) return;
    }

    if (questionnaireTimerInterval) clearInterval(questionnaireTimerInterval);

    try {
      const res = await Storage.submitQuestionnaire(
        activeQuestionnaireExam.id,
        questionnaireUserAnswers,
        questionnaireElapsedSeconds
      );

      if (!res.success && res.message) {
        throw new Error(res.message);
      }

      // Mostrar vista de resultados
      const examView = document.getElementById('take-quest-exam-view');
      const resultView = document.getElementById('take-quest-result-view');
      if (examView) examView.style.display = 'none';
      if (resultView) resultView.style.display = 'block';

      const iconEl = document.getElementById('take-result-icon');
      const titleEl = document.getElementById('take-result-status-title');
      const msgEl = document.getElementById('take-result-msg');
      const scoreEl = document.getElementById('take-result-score');
      const badgeEl = document.getElementById('take-result-badge');
      const xpEl = document.getElementById('take-result-xp');
      const breakdownEl = document.getElementById('take-result-breakdown');

      if (iconEl) iconEl.textContent = res.passed ? '🎉' : '⚠️';
      if (titleEl) titleEl.textContent = res.passed ? '¡Evaluación Aprobada!' : 'Evaluación Desaprobada';
      if (msgEl) {
        msgEl.textContent = res.passed
          ? 'Has superado satisfactoriamente los criterios teóricos de UYAPAY B2C.'
          : 'La nota mínima aprobatoria es 12.0 / 20. Revisa la justificación didáctica a continuación para reforzar tus conocimientos.';
      }
      if (scoreEl) scoreEl.textContent = `${res.numericScore} / 20`;
      if (badgeEl) {
        badgeEl.textContent = res.status;
        badgeEl.style.color = res.passed ? 'var(--success)' : 'var(--danger)';
      }
      if (xpEl) xpEl.textContent = `+${res.xpEarned} XP`;

      if (breakdownEl && Array.isArray(res.feedback)) {
        breakdownEl.innerHTML = res.feedback.map(fb => `
          <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <b style="font-size:13px;">${escapeHtml(fb.text)}</b>
              <span class="badge" style="font-size:11px; ${fb.isCorrect ? 'background:#dcfce7; color:#15803d;' : 'background:#fee2e2; color:#b91c1c;'}">
                ${fb.isCorrect ? '✓ Correcto' : '✗ Incorrecto'}
              </span>
            </div>
            <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">
              Tu respuesta: <b style="color:${fb.isCorrect ? '#15803d' : '#b91c1c'};">${escapeHtml(Array.isArray(fb.givenAnswer) ? fb.givenAnswer.join(', ') : (fb.givenAnswer || 'Sin responder'))}</b>
              ${!fb.isCorrect ? ` • Respuesta correcta: <b style="color:#15803d;">${escapeHtml(fb.correctAnswers.join(', '))}</b>` : ''}
            </div>
            <div style="font-size:11.5px; color:#4338ca; background:#eef2ff; padding:6px 10px; border-radius:6px;">
              💡 <b>Justificación Didáctica:</b> ${escapeHtml(fb.explanation)}
            </div>
          </div>
        `).join('');
      }

      // Auto-desbloquear Gatekeeper si correspondía
      const currentUser = Auth.getCurrentUser();
      await checkGatekeeperStatus(currentUser);
      await updateNavbarProfileBadges(currentUser);
    } catch (e) {
      showCustomAlert({ title: 'Error al Enviar', message: e.message, icon: '⚠️' });
    }
  }

  function closeTakeQuestionnaireModal() {
    if (questionnaireTimerInterval) clearInterval(questionnaireTimerInterval);
    const modal = document.getElementById('take-questionnaire-modal');
    if (modal) modal.style.display = 'none';
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
        title: '¿Limpiar Todas las Evaluaciones?',
        message: '¿Estás seguro de eliminar todas las evaluaciones y reiniciar el ranking?\n\nLa base de datos quedará completamente limpia (0 evaluaciones) tanto en la nube (Firebase) como en el servidor local. Solo figurarán los asesores que rindan el examen.',
        icon: '🗑️',
        confirmText: 'Sí, Limpiar Todo',
        cancelText: 'Cancelar',
        confirmDanger: true
      });
      if (confirmed) {
        await Storage.resetAll();
        await showCustomAlert({
          title: 'Base de Datos Limpia',
          message: '✅ Todas las evaluaciones han sido eliminadas.\nLa base de datos ahora está en blanco (0 evaluaciones) y lista para recibir a los asesores reales.',
          icon: '✅'
        });
        location.reload();
      }
    },
    handleDialogConfirm: handleDialogConfirm,
    handleDialogCancel: handleDialogCancel,
    dismissDialog: dismissDialog,

    // Métodos de Gatekeeper
    handleGatekeeperAction: handleGatekeeperAction,

    // Métodos de Calendario de Evaluaciones
    renderCalendarView: renderCalendarView,
    changeCalendarMonth: changeCalendarMonth,
    goToToday: goToToday,
    openScheduleModal: openScheduleModal,
    closeScheduleModal: closeScheduleModal,
    toggleScheduleTypeFields: toggleScheduleTypeFields,
    toggleSelectAllAdvisors: toggleSelectAllAdvisors,
    saveScheduledEvaluation: saveScheduledEvaluation,
    openEventDetailsModal: openEventDetailsModal,
    closeEventDetailsModal: closeEventDetailsModal,
    deleteCurrentEvent: deleteCurrentEvent,
    takeEvaluationFromEvent: takeEvaluationFromEvent,

    // Métodos de Creador de Cuestionarios (Google Forms)
    openQuestionnaireBuilderModal: openQuestionnaireBuilderModal,
    closeQuestionnaireBuilderModal: closeQuestionnaireBuilderModal,
    addBuilderQuestion: addBuilderQuestion,
    removeBuilderQuestion: removeBuilderQuestion,
    setBuilderQuestionType: setBuilderQuestionType,
    addBuilderOption: addBuilderOption,
    removeBuilderOption: removeBuilderOption,
    toggleBuilderCorrectAnswer: toggleBuilderCorrectAnswer,
    updateBuilderQuestionField: updateBuilderQuestionField,
    updateBuilderOptionValue: updateBuilderOptionValue,
    saveTheoreticalQuestionnaire: saveTheoreticalQuestionnaire,

    // Métodos de Resolución de Cuestionarios
    startQuestionnaireExam: startQuestionnaireExam,
    onTakeOptionSelected: onTakeOptionSelected,
    closeTakeQuestionnaireModal: closeTakeQuestionnaireModal,
    submitQuestionnaireExam: submitQuestionnaireExam,

    // Métodos de Capacitación y Videos
    renderTrainingByModule: renderTrainingView,
    openVideoModal: openVideoModal,
    closeVideoModal: closeVideoModal,
    launchQuizFromCurrentVideo: launchQuizFromCurrentVideo,

    // Métodos de Quiz estilo Kahoot
    startKahootQuiz: startKahootQuiz,
    nextKahootQuestion: nextKahootQuestion,
    closeKahootSummary: closeKahootSummary,
    exitKahootQuiz: exitKahootQuiz,

    // Métodos de Capacitador Paso a Paso (Onboarding)
    toggleOnboardingTask: toggleOnboardingTask,
    startOnboardingExam: startOnboardingExam,
    openOnboardingSimulator: openOnboardingSimulator,
    closeOnboardingSimulator: closeOnboardingSimulator,

    // Métodos de Base de Conocimiento (FAQs y Reglas)
    switchKnowledgeSubtab: switchKnowledgeSubtab,
    filterKnowledge: filterKnowledge,
    toggleFaqAccordion: toggleFaqAccordion,

    // Métodos de Suite Administrativa
    switchAdminTab: switchAdminTab,
    openCreateUserModal: openCreateUserModal,
    openEditUserModal: openEditUserModal,
    closeAdminUserModal: closeAdminUserModal,
    saveAdminUser: saveAdminUser,
    toggleUserStatus: toggleUserStatus,
    openAdminRolesModal: openAdminRolesModal,
    closeAdminRolesModal: closeAdminRolesModal,
    saveUserRoles: saveUserRoles,

    // Métodos de Hito 5: Ranking, Podio, Auditoría y Feedback
    handleScoreClick: handleScoreClick,
    openAdvisorHistory: openAdvisorHistory,
    closeAdvisorHistoryModal: closeAdvisorHistoryModal,
    filterHistoryTab: filterHistoryTab,
    openEvaluationAudit: openEvaluationAudit,
    closeForensicAuditModal: closeForensicAuditModal,
    openFeedbackModal: openFeedbackModal,
    closeFeedbackModal: closeFeedbackModal,
    toggleFeedbackType: toggleFeedbackType,
    submitSupervisorFeedback: submitSupervisorFeedback,
    filterLeaderboardTable: filterLeaderboardTable,
    exportLeaderboardExcel: exportLeaderboardExcel,
    startScheduledFromRanking: startScheduledFromRanking,
    openRecentTraining: openRecentTraining,

    // Navegación de 3 Menús Principales y Submenús (PRDv2 Sección 3)
    switchMainMenu: switchMainMenu,
    switchSubMenu: switchSubMenu,
    showSection: showSection,

    // Drawer Lateral de Perfil (Flujo 8 PRDv2)
    openProfileDrawer: openProfileDrawer,
    closeProfileDrawer: closeProfileDrawer,
    toggleProfileDrawer: toggleProfileDrawer,
    goToFullProfile: goToFullProfile
  };
})();

