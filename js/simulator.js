/**
 * Controlador del Simulador Móvil UYAPAY
 * Soporta Catálogo Dinámico Multi-Marca (Shell, Michelin, BFGoodrich, Hyundai)
 * Soporta Flujos Borde: GPS Bypass telefónico, justificación de tareas incompletas, cotizaciones tipo 3,
 * cobranza mixta con voucher, exclusión mutua de promociones, filtro de deuda vencida, visitas fuera de ruta y liquidación.
 * Totalmente desacoplado: emite eventos hacia el Evaluador sin calcular notas internamente.
 */

(function() {
  const state = {
    advisorUsername: 'alvaro',
    currentCaseId: 'case-1',
    currentTabIndex: 0,
    selectedClient: '',
    photos: { 1: false, 2: false },
    isPhoneVisit: false,
    orderConfig: {
      paymentCondition: '',
      priceList: '',
      line: '',
      brand: ''
    },
    catalogQuantities: {},
    catalogPromos: {},
    selectedCatalogProduct: null,
    detailQty: 1,
    detailDescuentoAprov: 0,
    detailPromoChecked: false,
    catalogSearchQuery: '',
    catalogSelectedTab: 'combo',
    cart: {
      productId: '',
      product: 'Shell Helix HX7 10W/40',
      sku: 'B-734807',
      line: 'lubricantes',
      brand: 'shell',
      unitPrice: 22.0,
      qty: 8,
      promoDiscount: true,
      promoType: 'gift',
      promoDiscountAmount: 0.0,
      promoLabel: '🎁 Regalo: 2 botellas Shell Helix Plus 10W-40 (108203)'
    }
  };

  // Leer parámetros de la URL
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('user')) state.advisorUsername = urlParams.get('user');
  if (urlParams.get('case')) state.currentCaseId = urlParams.get('case');
  if (urlParams.get('tab')) state.currentTabIndex = parseInt(urlParams.get('tab'), 10) || 0;

  function getCaseData() {
    if (window.UyapayData && window.UyapayData.CASES) {
      return window.UyapayData.CASES.find(c => c.id === state.currentCaseId) || window.UyapayData.CASES[0];
    }
    return null;
  }

  function getMasterProducts() {
    if (window.UyapayData && window.UyapayData.PRODUCTS) {
      return window.UyapayData.PRODUCTS;
    }
    return [];
  }

  // Emisor central de eventos hacia el Portal Padre (Evaluador)
  function emitSimulatorEvent(eventName, payload = {}) {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'SIMULATOR_EVENT',
        eventName: eventName,
        payload: {
          advisor: state.advisorUsername,
          caseId: state.currentCaseId,
          tabIndex: state.currentTabIndex,
          ...payload
        }
      }, '*');
    }
  }

  function showHint(msg, isError = true) {
    const h = document.getElementById('hintBox');
    if (!h) return;
    h.textContent = msg;
    h.className = 'hint show ' + (isError ? 'error-hint' : 'success-hint');
    setTimeout(() => {
      h.classList.remove('show');
    }, 2800);
  }

  // ================= TAREAS EN VISITA: TASK CAROUSEL OFICIAL =================
  let currentVisitTaskIndex = 0;
  const visitTaskTitles = ['INICIO', 'FOTOS', 'PRECIOS', 'PEDIDOS'];

  function goToVisitTask(index) {
    if (index < 0) index = 0;
    if (index > 3) index = 3;
    currentVisitTaskIndex = index;

    // Actualizar título en barra
    const titleEl = document.getElementById('task-nav-current-title');
    if (titleEl) titleEl.textContent = visitTaskTitles[index];

    // Actualizar dots indicadores
    for (let i = 0; i < 4; i++) {
      const dot = document.getElementById(`dot-task-${i}`);
      if (dot) {
        if (i === index) dot.classList.add('active');
        else dot.classList.remove('active');
      }
    }

    // Actualizar slides visibles
    const slideIds = ['task-slide-inicio', 'task-slide-fotos', 'task-slide-precios', 'task-slide-pedidos'];
    slideIds.forEach((sId, idx) => {
      const el = document.getElementById(sId);
      if (el) {
        if (idx === index) el.classList.add('active');
        else el.classList.remove('active');
      }
    });

    // Asegurarse de que s-cliente-inicio sea la pantalla activa
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById('s-cliente-inicio');
    if (target) target.classList.add('active');
  }

  function prevVisitTask() {
    goToVisitTask(currentVisitTaskIndex - 1);
  }

  function nextVisitTask() {
    goToVisitTask(currentVisitTaskIndex + 1);
  }

  function toggleTaskDropdown() {
    const modal = document.getElementById('taskDropdownModal');
    if (modal) modal.classList.toggle('active');
  }

  function closeTaskDropdown() {
    const modal = document.getElementById('taskDropdownModal');
    if (modal) modal.classList.remove('active');
  }

  function openPhotoHistoryModal() {
    const modal = document.getElementById('photoHistoryModal');
    if (modal) modal.classList.add('active');
  }

  function closePhotoHistoryModal() {
    const modal = document.getElementById('photoHistoryModal');
    if (modal) modal.classList.remove('active');
  }

  function onInicioContinue() {
    const currentCase = getCaseData();
    if (currentCase && (currentCase.isPhoneVisit || state.currentCaseId === 'case-16')) {
      goToVisitTask(3); // En atención telefónica va directo a pedidos
    } else {
      goToVisitTask(1); // FOTOS
    }
  }

  function onPreciosContinue() {
    goToVisitTask(3); // Avanza a PEDIDOS
  }

  function onPedidosContinue() {
    if (state.cart && state.cart.qty > 0) {
      showHint('Visita completada exitosamente.', false);
      navigateTo('s-dashboard');
    } else {
      showHint('Presiona "＋ CREAR PEDIDO O COTIZACIÓN" para emitir la orden.', true);
    }
  }

  function switchPriceSubtab(tabKey) {
    const tabReg = document.getElementById('subtab-reg-precios');
    const tabRes = document.getElementById('subtab-resumen-precios');
    if (tabKey === 'registro') {
      if (tabReg) tabReg.classList.add('active');
      if (tabRes) tabRes.classList.remove('active');
      showHint('Modo: Registro de precios por producto.', false);
    } else {
      if (tabReg) tabReg.classList.remove('active');
      if (tabRes) tabRes.classList.add('active');
      showHint('Modo: Resumen comparativo.', false);
    }
  }

  function toggleSkuAccordion(skuIndex) {
    const body = document.getElementById(`sku-body-${skuIndex}`);
    const arrow = document.getElementById(`sku-arrow-${skuIndex}`);
    if (body) {
      const isHidden = (body.style.display === 'none' || !body.style.display);
      body.style.display = isHidden ? 'block' : 'none';
      if (arrow) arrow.textContent = isHidden ? '∧' : '∨';
    }
  }

  function onCompetitorPriceInput(skuIndex) {
    const status = document.getElementById(`sku-status-${skuIndex}`);
    if (status) status.textContent = '1 de 3 registrados';
    const fill = document.getElementById('price-progress-fill');
    const avance = document.getElementById('price-avance-val');
    if (fill) fill.style.width = '25%';
    if (avance) avance.textContent = '1 (10.0%)';
  }

  function uploadPurchaseDoc() {
    showHint('Documento adjuntado: Factura de compra proveedor.', false);
  }

  function navigateTo(screenId) {
    if (screenId === 's-fotos') {
      goToVisitTask(1);
      return;
    }
    if (screenId === 's-pedidos-menu') {
      goToVisitTask(3);
      return;
    }
    if (screenId === 's-precios') {
      goToVisitTask(2);
      return;
    }
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');
  }

  // 1. Inicialización de Visitas y Clientes según el Caso Activo
  function initializeCaseEnvironment() {
    const currentCase = getCaseData();
    if (!currentCase) return;

    state.selectedClient = currentCase.client;
    state.cart = {
      productId: '',
      product: currentCase.product || 'Shell Helix HX7 10W/40',
      sku: '',
      line: currentCase.line || 'lubricantes',
      brand: currentCase.brand || 'shell',
      unitPrice: currentCase.unitPrice || 22.0,
      qty: currentCase.expectedQty || 1,
      promoDiscount: currentCase.promoDiscount !== false,
      promoType: currentCase.promoType || (currentCase.promoDiscount ? 'gift' : 'none'),
      promoDiscountAmount: currentCase.promoDiscountAmount || 0.0,
      promoLabel: currentCase.promoLabel || 'Promoción oficial'
    };

    // Pre-poblar los selectores y tarjetas en s-nuevo-pedido (Flujo 2)
    const selCli = document.getElementById('sel-cliente');
    const lblCli = document.getElementById('lbl-sel-cliente');
    const selCond = document.getElementById('sel-condicion');
    const lblCond = document.getElementById('lbl-sel-condicion');
    const selList = document.getElementById('sel-lista');
    const lblList = document.getElementById('lbl-sel-lista');
    const selLine = document.getElementById('sel-linea');
    const lblLine = document.getElementById('lbl-sel-linea');
    const selBrand = document.getElementById('sel-marca');
    const lblBrand = document.getElementById('lbl-sel-marca');

    if (selCli) {
      selCli.innerHTML = `<option value="${state.selectedClient}">${state.selectedClient.toUpperCase()}</option>`;
      selCli.value = state.selectedClient;
    }
    if (lblCli) lblCli.textContent = state.selectedClient.toUpperCase();

    if (selCond && currentCase.paymentCondition) {
      selCond.value = currentCase.paymentCondition;
      if (lblCond && selCond.selectedIndex >= 0) {
        lblCond.textContent = selCond.options[selCond.selectedIndex].text;
      }
    }
    if (selList && currentCase.priceList) {
      selList.value = currentCase.priceList;
      if (lblList && selList.selectedIndex >= 0) {
        lblList.textContent = selList.options[selList.selectedIndex].text;
      }
    }
    if (selLine && currentCase.line) {
      selLine.value = currentCase.line;
      if (lblLine && selLine.selectedIndex >= 0) {
        lblLine.textContent = selLine.options[selLine.selectedIndex].text;
      }
      // Asegurar opciones de marcas válidas
      if (selBrand) {
        if (currentCase.line === 'lubricantes') {
          selBrand.innerHTML = `<option value="shell">SHELL</option>`;
        } else if (currentCase.line === 'neumaticos') {
          selBrand.innerHTML = `<option value="michelin">MICHELIN</option><option value="bfgoodrich">BFGOODRICH</option>`;
        } else if (currentCase.line === 'repuestos') {
          selBrand.innerHTML = `<option value="hyundai">HYUNDAI</option>`;
        }
      }
    }
    if (selBrand && currentCase.brand) {
      selBrand.value = currentCase.brand;
      if (lblBrand && selBrand.selectedIndex >= 0) {
        lblBrand.textContent = selBrand.options[selBrand.selectedIndex].text;
      }
    }

    const cliLista = document.getElementById('cli-lista-header');
    if (cliLista && currentCase.priceList) cliLista.textContent = `Lista ${currentCase.priceList}`;

    // Renderizar lista de clientes en la ruta oficial (s-visitas - plan de visitas 1.png)
    const listContainer = document.getElementById('client-list-cards');
    if (listContainer) {
      const isOutRouteCase = (state.currentCaseId === 'case-11' || state.currentCaseId === 'case-22');
      const targetClient = currentCase.client;
      const targetAddr = currentCase.clientAddress || 'AV. RUTA PRINCIPAL 100';

      const mockDistractors = [
        { name: 'Ferretería Los Andes S.A.C.', address: 'AV. TOMAS TUYRUTUPAC 412' },
        { name: 'Distribuidora Kanchis EIRL', address: 'AV. INDUSTRIAL 104' },
        { name: 'Comercial Vega Hnos.', address: 'CALLE MERCADERES 301' },
        { name: 'Transportes del Sur SAC', address: 'KM 12 VARIANTE UCHUMAYO' },
        { name: 'Grupo Ferretero Miraflores', address: 'AV. SAN JERONIMO 210' },
        { name: 'Autopartes El Rápido', address: 'JR. PIEROLA 540' },
        { name: 'Servicentro El Faro', address: 'AV. DOLORES 880' },
        { name: 'Taller Hyundai Express', address: 'AV. PARRA 314' }
      ].filter(d => !d.name.toLowerCase().includes(targetClient.toLowerCase().slice(0, 7)));

      let html = '';
      if (!isOutRouteCase) {
        html += `
          <div class="client-card-official is-in-progress" onclick="window.UyapaySimulator.openOptions('${targetClient}')">
            <div class="client-card-pin-circle">
              <span>📍</span>
            </div>
            <div class="client-card-content">
              <div class="client-card-title-row">
                <span class="client-card-name">${targetClient.toUpperCase()}</span>
                <span class="client-card-chevron">∨</span>
              </div>
              <div class="client-card-address">${targetAddr}</div>
              <div class="client-card-status-row">
                <span class="client-drag-handle">⋮⋮</span>
                <span class="status-badge-in-course">EN CURSO</span>
                <span class="client-card-time">🕒 11:31</span>
              </div>
            </div>
          </div>
        `;
      }

      mockDistractors.slice(0, isOutRouteCase ? 4 : 3).forEach(d => {
        html += `
          <div class="client-card-official" onclick="window.UyapaySimulator.openOptions('${d.name}')">
            <div class="client-card-pin-circle">
              <span>📍</span>
            </div>
            <div class="client-card-content">
              <div class="client-card-title-row">
                <span class="client-card-name">${d.name.toUpperCase()}</span>
                <span class="client-card-chevron">∨</span>
              </div>
              <div class="client-card-address">${d.address}</div>
              <div class="client-card-status-row">
                <span class="client-drag-handle">⋮⋮</span>
                <span class="status-badge-pending">PENDIENTE</span>
              </div>
            </div>
          </div>
        `;
      });

      listContainer.innerHTML = html;
    }

    // Configurar acción del botón principal en datos del cliente según tipo de visita
    const btnAction = document.getElementById('btn-cliente-main-action');
    if (btnAction) {
      if (currentCase.isPhoneVisit || state.currentCaseId === 'case-16') {
        btnAction.textContent = 'Continuar a Pedidos (Atención Remota) ›';
        btnAction.onclick = () => navigateTo('s-pedidos-menu');
      } else {
        btnAction.textContent = 'Continuar a Fotos de Visita ›';
        btnAction.onclick = () => navigateTo('s-fotos');
      }
    }
  }

  // 2. Login dentro del smartphone
  function handleAppLogin() {
    const userInput = (document.getElementById('userIn').value || '').trim();
    if (!userInput) {
      showHint('Ingresa tu usuario móvil asignado.', true);
      return;
    }

    emitSimulatorEvent('MOBILE_LOGIN', { username: userInput });
    navigateTo('s-visitas');
  }

  // 2.1 Navegación por Tabs Oficiales (Inicio, Visitas, Pedidos)
  function selectNavTab(tabKey) {
    document.querySelectorAll('.tabs-app .tab-item').forEach(t => t.classList.remove('active'));
    const activeTabs = [
      document.getElementById(`nav-tab-${tabKey}`),
      document.getElementById(`nav-tab-${tabKey}-dash`),
      document.getElementById(`nav-tab-${tabKey}-ped`)
    ];
    activeTabs.forEach(t => { if (t) t.classList.add('active'); });

    if (tabKey === 'visitas') {
      navigateTo('s-visitas');
    } else if (tabKey === 'pedidos') {
      renderOrdersTrackingList();
      navigateTo('s-pedidos-seguimiento');
    } else if (tabKey === 'inicio') {
      updateDashboardAdvisorGreeting();
      navigateTo('s-inicio');
    }
  }

  function updateDashboardAdvisorGreeting() {
    const greetingEl = document.getElementById('dashboard-advisor-name');
    if (greetingEl) {
      const name = state.advisorUsername ? (state.advisorUsername.charAt(0).toUpperCase() + state.advisorUsername.slice(1)) : 'Betsy Ramos';
      greetingEl.textContent = `¡Hola ${name}!`;
    }
  }

  function selectAnalysisTab(tabKey) {
    const tabCob = document.getElementById('subtab-analisis-cobranza');
    const tabVen = document.getElementById('subtab-analisis-ventas');
    const dotCob = document.getElementById('dot-analisis-cobranza');
    const dotVen = document.getElementById('dot-analisis-ventas');

    if (tabKey === 'cobranza') {
      if (tabCob) tabCob.classList.add('active');
      if (tabVen) tabVen.classList.remove('active');
      if (dotCob) dotCob.style.display = 'block';
      if (dotVen) dotVen.style.display = 'none';
      showHint('Métricas de Cobranza activas.', false);
    } else {
      if (tabVen) tabVen.classList.add('active');
      if (tabCob) tabCob.classList.remove('active');
      if (dotVen) dotVen.style.display = 'block';
      if (dotCob) dotCob.style.display = 'none';
      showHint('Métricas de Proyección de Ventas activas.', false);
    }
  }

  // 2.2 Pestañas Circulares: Pendientes vs Realizadas (plan de visitas 1.png)
  function selectVisitTab(tabKey) {
    const tabPend = document.getElementById('tab-pendientes');
    const tabReal = document.getElementById('tab-realizadas');
    const dotPend = document.getElementById('dot-subtab-pend');
    const dotReal = document.getElementById('dot-subtab-real');
    const listContainer = document.getElementById('client-list-cards');

    if (tabKey === 'pendientes') {
      if (tabPend) tabPend.classList.add('active');
      if (tabReal) tabReal.classList.remove('active');
      if (dotPend) dotPend.style.display = 'block';
      if (dotReal) dotReal.style.display = 'none';
      initializeCaseEnvironment();
    } else {
      if (tabReal) tabReal.classList.add('active');
      if (tabPend) tabPend.classList.remove('active');
      if (dotReal) dotReal.style.display = 'block';
      if (dotPend) dotPend.style.display = 'none';
      if (listContainer) {
        listContainer.innerHTML = `
          <div style="text-align:center; padding:36px 16px; color:var(--text-light); font-size:13px;">
            <div style="font-size:32px; margin-bottom:8px;">📋</div>
            <b style="color:var(--text-dark); display:block; margin-bottom:4px;">Sin visitas realizadas aún</b>
            <p style="margin:0; font-size:11px; line-height:1.4;">Las visitas concretadas y auditadas en esta jornada se listarán en esta sección.</p>
          </div>
        `;
      }
    }
  }

  // 2.3 Menú Lateral Secundario (Drawer - menu secundario.png)
  function openSecondaryDrawer() {
    const drawer = document.getElementById('secondary-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    const userName = document.getElementById('drawer-user-name');
    if (userName && state.advisorUsername) {
      userName.textContent = state.advisorUsername.toUpperCase();
    }
    if (drawer) drawer.classList.add('open');
    if (backdrop) backdrop.classList.add('show');
  }

  function closeSecondaryDrawer() {
    const drawer = document.getElementById('secondary-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('show');
  }

  // 2.4 Acordeón de Progreso (plan de visitas 2.png)
  let isProgressExpanded = false;
  function toggleProgressDetails() {
    isProgressExpanded = !isProgressExpanded;
    const details = document.getElementById('progress-details-expanded');
    const icon = document.getElementById('progress-chevron-icon');
    if (details) {
      details.style.display = isProgressExpanded ? 'block' : 'none';
    }
    if (icon) {
      icon.textContent = isProgressExpanded ? '∧' : '∨';
    }
  }

  // 2.5 Seguimiento de Pedidos Oficial (seguimiento de pedidos.png)
  let trackedOrders = [
    { code: 'P004-022322', time: '08:21 AM', client: 'SERVICIOS GARCIA GLOBAL S.A.C.', total: 'USD 86.00', status: 'APROBADO', statusClass: 'status-aprobado' },
    { code: 'P004-022321', time: '08:08 AM', client: 'MAQUERA CALIZAYA YOVIER', total: 'USD 161.00', status: 'EMITIDO', statusClass: 'status-emitido' },
    { code: 'P004-022320', time: '06:47 AM', client: 'REPRESENTACIONES AXEL IMPORT E.I.R.L.', total: 'PEN 276.00', status: 'APROBADO', statusClass: 'status-aprobado' }
  ];

  let currentOrderSubtab = 'pedidos';
  let currentOrderFilter = 'recientes';
  let orderSearchQuery = '';

  function renderOrdersTrackingList() {
    const container = document.getElementById('orders-today-items');
    if (!container) return;

    if (currentOrderSubtab === 'cotizaciones') {
      container.innerHTML = `
        <div style="text-align:center; padding:28px 16px; color:#6b7280; font-size:12.5px;">
          <p style="margin:0;">No hay cotizaciones registradas para hoy.</p>
        </div>
      `;
      return;
    }

    let filtered = [...trackedOrders];
    if (orderSearchQuery) {
      const q = orderSearchQuery.toLowerCase();
      filtered = filtered.filter(o => o.client.toLowerCase().includes(q) || o.code.toLowerCase().includes(q));
    }

    let html = '';
    if (state.cart && state.cart.qty > 0 && state.finalOrderTotal) {
      html += `
        <div class="order-tracking-card is-recent" onclick="window.UyapaySimulator.hint('Orden emitida durante la sesión actual')">
          <div class="order-card-header">
            <span class="order-code-bold">P004-022323</span>
            <span class="order-time-lbl">🕒 Ahora</span>
          </div>
          <div class="order-client-lbl">${state.selectedClient.toUpperCase()}</div>
          <div class="order-card-footer">
            <span class="order-total-lbl">USD ${state.finalOrderTotal.toFixed(2)} <small>(con IGV)</small></span>
            <span class="order-status-badge status-emitido">ENVIADO ›</span>
          </div>
        </div>
      `;
    }

    filtered.forEach(ord => {
      html += `
        <div class="order-tracking-card" onclick="window.UyapaySimulator.hint('Detalle de orden: ${ord.code}')">
          <div class="order-card-header">
            <span class="order-code-bold">${ord.code}</span>
            <span class="order-time-lbl">🕒 ${ord.time}</span>
          </div>
          <div class="order-client-lbl">${ord.client}</div>
          <div class="order-card-footer">
            <span class="order-total-lbl">${ord.total} <small>(con IGV)</small></span>
            <span class="order-status-badge ${ord.statusClass}">${ord.status} ›</span>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  function selectOrderSubtab(subtab) {
    currentOrderSubtab = subtab;
    const tabPed = document.getElementById('subtab-pedidos-list');
    const tabCot = document.getElementById('subtab-cotizaciones-list');
    const dotPed = document.getElementById('dot-ped-list');
    const dotCot = document.getElementById('dot-cot-list');

    if (subtab === 'pedidos') {
      if (tabPed) tabPed.classList.add('active');
      if (tabCot) tabCot.classList.remove('active');
      if (dotPed) dotPed.style.display = 'block';
      if (dotCot) dotCot.style.display = 'none';
    } else {
      if (tabCot) tabCot.classList.add('active');
      if (tabPed) tabPed.classList.remove('active');
      if (dotCot) dotCot.style.display = 'block';
      if (dotPed) dotPed.style.display = 'none';
    }
    renderOrdersTrackingList();
  }

  function selectOrderFilter(filterKey) {
    currentOrderFilter = filterKey;
    const fRec = document.getElementById('ped-filter-recientes');
    const fPend = document.getElementById('ped-filter-pendientes');
    if (filterKey === 'recientes') {
      if (fRec) fRec.classList.add('active');
      if (fPend) fPend.classList.remove('active');
    } else {
      if (fPend) fPend.classList.add('active');
      if (fRec) fRec.classList.remove('active');
    }
    renderOrdersTrackingList();
  }

  function onOrderSearch(query) {
    orderSearchQuery = (query || '').trim();
    renderOrdersTrackingList();
  }

  function clearOrderSearch() {
    const inp = document.getElementById('order-search-input');
    if (inp) inp.value = '';
    orderSearchQuery = '';
    renderOrdersTrackingList();
  }

  // 3. Filtros del Plan de Visitas
  function selectFilter(filterKey) {
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    const pillMap = {
      'todos': 'pill-todos',
      'deuda_vencida': 'pill-deuda',
      'sin_visita': 'pill-sin-visita',
      'sin_compra': 'pill-sin-compra',
      'documentos': 'pill-documentos'
    };
    const targetPill = document.getElementById(pillMap[filterKey] || 'pill-todos');
    if (targetPill) targetPill.classList.add('active');

    emitSimulatorEvent('SELECT_FILTER', { filter: filterKey });

    const listContainer = document.getElementById('client-list-cards');
    if (listContainer && filterKey === 'deuda_vencida') {
      listContainer.innerHTML = `
        <div class="client-card" style="border-left: 4px solid #e74c3c;" onclick="window.UyapaySimulator.openOptions('Distribuidora Kanchis EIRL')">
          <div class="pin" style="color:#e74c3c;">⚠️</div>
          <div>
            <div class="client-name">DISTRIBUIDORA KANCHIS EIRL <span style="background:#e74c3c; color:#fff; font-size:10px; padding:2px 6px; border-radius:4px; margin-left:4px;">DEUDA VENCIDA</span></div>
            <div class="client-address">AV. INDUSTRIAL 104 - Saldo Moroso: USD 840.00</div>
          </div>
        </div>
      `;
      showHint('Filtro aplicado: Clientes con deuda vencida.', false);
    } else if (filterKey === 'todos') {
      initializeCaseEnvironment();
    }
  }

  // 4. Visitas y Opciones del Cliente
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

  function selectOption(actionKey) {
    closeClientOptions();

    if (actionKey === 'ver_deuda') {
      emitSimulatorEvent('SELECT_CLIENT', { clientName: state.selectedClient });
      emitSimulatorEvent('VIEW_DEBTS', { verified: true, viewed: true, clientName: state.selectedClient });
      showHint(`Perfil auditado: ${state.selectedClient} registra saldo moroso vencido de USD 840.00.`, false);
      if (state.currentCaseId === 'case-21') {
        const finishTitle = document.getElementById('finish-title');
        const finishDesc = document.getElementById('finish-desc');
        if (finishTitle) finishTitle.textContent = '¡Cartera Morosa Auditada!';
        if (finishDesc) finishDesc.innerHTML = 'Se priorizó y auditó a Distribuidora Kanchis EIRL (Deuda: USD 840.00) con éxito.';
        navigateTo('s-dashboard');
      }
      return;
    }

    if (actionKey === 'historial') {
      emitSimulatorEvent('SELECT_CLIENT', { clientName: state.selectedClient });
      openHistoryModal();
      return;
    }

    if (actionKey === 'iniciar') {
      if (state.currentCaseId === 'case-11' || state.currentCaseId === 'case-22') {
        emitSimulatorEvent('SELECT_ACTION', { action: actionKey, clientName: state.selectedClient });
      } else if (state.currentCaseId === 'case-15') {
        emitSimulatorEvent('SELECT_ACTION', { action: actionKey, clientName: state.selectedClient });
      } else {
        emitSimulatorEvent('SELECT_CLIENT', { clientName: state.selectedClient });
        emitSimulatorEvent('SELECT_ACTION', { action: actionKey, clientName: state.selectedClient });
      }

      if (state.currentCaseId === 'case-16') {
        openGpsModal();
        return;
      }
      setupVisitInProgressView(state.selectedClient);
      navigateTo('s-cliente-inicio');
      return;
    }

    // 1. Notificar selección del cliente
    emitSimulatorEvent('SELECT_CLIENT', { clientName: state.selectedClient });

    // 2. Notificar la acción solicitada
    emitSimulatorEvent('SELECT_ACTION', { action: actionKey, clientName: state.selectedClient });
  }

  // 4.1 Historial de Visitas Previas (Caso 15)
  function openHistoryModal() {
    const modal = document.getElementById('historyModal');
    if (modal) modal.classList.add('active');
  }

  function closeHistoryModal() {
    const modal = document.getElementById('historyModal');
    if (modal) modal.classList.remove('active');
  }

  function submitHistoryDate() {
    const input = document.getElementById('historial-fecha-input');
    const fechaVal = (input && input.value) ? input.value.trim() : '14/08/2026';
    emitSimulatorEvent('SUBMIT_INQUIRY_ANSWER', {
      clientName: state.selectedClient,
      date: fechaVal,
      answer: fechaVal
    });
    closeHistoryModal();
    showHint(`Historial auditado: última visita ${fechaVal} registrada correctamente.`, false);
    openClientOptions(state.selectedClient);
  }

  // 5. Validación Geocerca GPS (Caso 16)
  function openGpsModal() {
    const modal = document.getElementById('gpsModal');
    if (modal) modal.classList.add('active');
  }

  function closeGpsModal() {
    const modal = document.getElementById('gpsModal');
    if (modal) modal.classList.remove('active');
  }

  function confirmVisitType(visitType) {
    closeGpsModal();
    const isPhone = visitType === 'telefonica';
    state.isPhoneVisit = isPhone;
    emitSimulatorEvent('SELECT_VISIT_TYPE', {
      visitType: visitType,
      isPhoneVisit: isPhone
    });
    if (isPhone) {
      showHint('Visita Telefónica activada (bypass geocerca 50m autorizado).', false);
      const cliHeader = document.getElementById('cli-nombre-header');
      if (cliHeader) cliHeader.textContent = state.selectedClient + ' (Telefónica)';

      const btnAction = document.getElementById('btn-cliente-main-action');
      if (btnAction) {
        btnAction.textContent = 'Continuar a Pedidos (Atención Remota) ›';
        btnAction.onclick = () => navigateTo('s-pedidos-menu');
      }

      navigateTo('s-cliente-inicio');
    } else {
      showHint('Bloqueo GPS: No se puede iniciar visita presencial a más de 50 metros.', true);
    }
  }

  // 6. Justificación de Tareas Incompletas (Caso 17)
  function openIncompleteTasksModal() {
    const modal = document.getElementById('incompleteTaskModal');
    if (modal) modal.classList.add('active');
  }

  function closeIncompleteTasksModal() {
    const modal = document.getElementById('incompleteTaskModal');
    if (modal) modal.classList.remove('active');
  }

  function submitIncompleteTask() {
    const selTask = document.getElementById('sel-incomplete-task');
    const selReason = document.getElementById('sel-incomplete-reason');
    const taskId = selTask ? selTask.value : 'T5';
    const reason = selReason ? selReason.value : 'Cliente muy ocupado';

    emitSimulatorEvent('JUSTIFY_INCOMPLETE_TASK', {
      taskId: taskId,
      reason: reason
    });

    emitSimulatorEvent('FINISH_VISIT', {
      confirmed: true,
      justified: true,
      taskId: taskId,
      reason: reason
    });

    closeIncompleteTasksModal();
    const finishTitle = document.getElementById('finish-title');
    const finishDesc = document.getElementById('finish-desc');
    if (finishTitle) finishTitle.textContent = '¡Visita Finalizada con Justificación!';
    if (finishDesc) finishDesc.innerHTML = `Se registró formalmente el cierre de visita con motivo: <b>${reason}</b> para la tarea ${taskId}.`;
    navigateTo('s-dashboard');
  }

  // 7. Cobranza Mixta (Caso 19)
  function openCobranzaModal() {
    const modal = document.getElementById('cobranzaModal');
    if (modal) modal.classList.add('active');
  }

  function closeCobranzaModal() {
    const modal = document.getElementById('cobranzaModal');
    if (modal) modal.classList.remove('active');
  }

  function submitCobranza() {
    const cashVal = parseFloat(document.getElementById('cobranza-cash')?.value || '200');
    const depVal = parseFloat(document.getElementById('cobranza-deposit')?.value || '150');

    emitSimulatorEvent('COLLECT_DEBTS', {
      cashAmount: cashVal,
      depositAmount: depVal,
      voucher: 'OP-948201.jpg',
      currency: 'USD'
    });

    emitSimulatorEvent('CONFIRM_RECEIPTS', {
      confirmed: true,
      total: cashVal + depVal,
      receiptsCount: 2
    });

    closeCobranzaModal();
    showHint('Recibos provisionales emitidos y confirmados exitosamente.', false);

    if (state.currentCaseId === 'case-19') {
      const finishTitle = document.getElementById('finish-title');
      const finishDesc = document.getElementById('finish-desc');
      if (finishTitle) finishTitle.textContent = '¡Cobranza Mixta Consolidada!';
      if (finishDesc) finishDesc.innerHTML = `Se emitieron y transmitieron los recibos provisionales por <b>USD ${(cashVal + depVal).toFixed(2)}</b> (Efectivo + Depósito bancario con voucher).`;
      navigateTo('s-dashboard');
    }
  }

  // 8. Visitas Fuera de Ruta Oficiales (agregar visita al plan.png)
  function onOutRouteClientChange(clientVal) {
    const lblClient = document.getElementById('lbl-outroute-client');
    const selClient = document.getElementById('sel-outroute-client');
    const selAddr = document.getElementById('sel-outroute-address');
    const lblAddr = document.getElementById('lbl-outroute-address');

    if (lblClient && selClient && selClient.selectedIndex >= 0) {
      lblClient.textContent = selClient.options[selClient.selectedIndex].text;
    }

    if (selAddr) {
      if (clientVal === 'Repuestos Central Chincha') {
        selAddr.innerHTML = `
          <option value="CALLE COMERCIO 120 - CHINCHA" selected>CALLE COMERCIO 120 - CHINCHA</option>
          <option value="AV. BENAVIDES 302 - CHINCHA">AV. BENAVIDES 302 - CHINCHA</option>
        `;
      } else if (clientVal === 'Autopartes El Rápido') {
        selAddr.innerHTML = `
          <option value="JR. PIEROLA 540" selected>JR. PIEROLA 540</option>
          <option value="AV. MARISCAL CASTILLA 110">AV. MARISCAL CASTILLA 110</option>
        `;
      } else {
        selAddr.innerHTML = `
          <option value="AV. PRINCIPAL 100" selected>AV. PRINCIPAL 100</option>
        `;
      }
      if (lblAddr && selAddr.selectedIndex >= 0) {
        lblAddr.textContent = selAddr.options[selAddr.selectedIndex].text;
      }
    }
  }

  function onOutRouteAddressChange(addrVal) {
    const lblAddr = document.getElementById('lbl-outroute-address');
    const selAddr = document.getElementById('sel-outroute-address');
    if (lblAddr && selAddr && selAddr.selectedIndex >= 0) {
      lblAddr.textContent = selAddr.options[selAddr.selectedIndex].text;
    }
  }

  function selectPlanClientMode(mode) {
    const tabPres = document.getElementById('subtab-plan-presencial');
    const tabTel = document.getElementById('subtab-plan-telefonica');
    const dotPres = document.getElementById('dot-plan-presencial');
    const dotTel = document.getElementById('dot-plan-telefonica');
    if (mode === 'presencial') {
      if (tabPres) tabPres.classList.add('active');
      if (tabTel) tabTel.classList.remove('active');
      if (dotPres) dotPres.style.display = 'block';
      if (dotTel) dotTel.style.display = 'none';
    } else {
      if (tabTel) tabTel.classList.add('active');
      if (tabPres) tabPres.classList.remove('active');
      if (dotTel) dotTel.style.display = 'block';
      if (dotPres) dotPres.style.display = 'none';
    }
  }

  function openOutRouteModal() {
    const selClient = document.getElementById('sel-outroute-client');
    const lblClient = document.getElementById('lbl-outroute-client');
    if (selClient) {
      if (state.currentCaseId === 'case-11') {
        selClient.value = 'Repuestos Central Chincha';
      } else if (state.currentCaseId === 'case-22') {
        selClient.value = 'Autopartes El Rápido';
      }
      if (lblClient && selClient.selectedIndex >= 0) {
        lblClient.textContent = selClient.options[selClient.selectedIndex].text;
      }
      onOutRouteClientChange(selClient.value);
    }
    navigateTo('s-agregar-cliente-plan');
  }

  function closeOutRouteModal() {
    navigateTo('s-visitas');
  }

  function submitOutRouteVisit() {
    const selClient = document.getElementById('sel-outroute-client');
    const clientName = selClient ? selClient.value : (state.currentCaseId === 'case-11' ? 'Repuestos Central Chincha' : 'Autopartes El Rápido');
    const selAddr = document.getElementById('sel-outroute-address');
    const address = selAddr ? selAddr.value : (state.currentCaseId === 'case-11' ? 'CALLE COMERCIO 120 - CHINCHA' : 'JR. PIEROLA 540');

    state.selectedClient = clientName;

    emitSimulatorEvent('CREATE_OUT_ROUTE_VISIT', {
      clientName: clientName,
      address: address,
      outRoute: true
    });

    showHint(`Cliente ${clientName} agregado exitosamente al plan.`, false);
    navigateTo('s-visitas');

    const listContainer = document.getElementById('client-list-cards');
    if (listContainer) {
      const newCard = `
        <div class="client-card-official is-in-progress" onclick="window.UyapaySimulator.openOptions('${clientName}')">
          <div class="client-card-pin-circle">
            <span>📍</span>
          </div>
          <div class="client-card-content">
            <div class="client-card-title-row">
              <span class="client-card-name">${clientName.toUpperCase()}</span>
              <span class="client-card-chevron">∨</span>
            </div>
            <div class="client-card-address">${address}</div>
            <div class="client-card-status-row">
              <span class="client-drag-handle">⋮⋮</span>
              <span class="status-badge-in-course">EN CURSO</span>
              <span class="client-card-time">🕒 Ahora</span>
            </div>
          </div>
        </div>
      `;
      listContainer.innerHTML = newCard + listContainer.innerHTML;
    }
  }

  // 9. Liquidación de Cobranza Diaria (Caso 23)
  function openSettlementModal() {
    emitSimulatorEvent('VIEW_SETTLEMENT', { viewed: true });
    const modal = document.getElementById('settlementModal');
    if (modal) modal.classList.add('active');
  }

  function closeSettlementModal() {
    const modal = document.getElementById('settlementModal');
    if (modal) modal.classList.remove('active');
  }

  function submitSettlement() {
    emitSimulatorEvent('SUBMIT_SETTLEMENT', {
      confirmed: true,
      totalCashSol: 1480,
      totalCashUsd: 200,
      totalDepositUsd: 150,
      pendingReceipts: 0
    });

    closeSettlementModal();
    const finishTitle = document.getElementById('finish-title');
    const finishDesc = document.getElementById('finish-desc');
    if (finishTitle) finishTitle.textContent = '¡Liquidación de Cobranza Cerrada!';
    if (finishDesc) finishDesc.innerHTML = 'Se transmitió el arqueo de cobranza diaria a SOLAR sin descuadres.';
    navigateTo('s-dashboard');
  }

  // 10. Fotos de Visita (Tarea FOTOS del Carrusel)
  function takePhoto(photoId) {
    state.photos[photoId] = true;
    const thumbBox = document.getElementById(`thumb-box-${photoId}`);
    const icon = document.getElementById(`icon-photo-${photoId}`);

    if (thumbBox) thumbBox.style.display = 'inline-block';
    if (icon) {
      icon.textContent = '✓';
      icon.style.color = 'var(--success-color)';
    }

    const label = photoId === 1 ? 'Presentación Inicial' : photoId === 2 ? 'Presentación Final' : 'Material Publicitario';
    showHint(`${label} capturada correctamente.`, false);
  }

  function submitPhotos() {
    if (!state.photos[1] || !state.photos[2]) {
      showHint('El manual exige registrar ambas fotos (inicial y final).', true);
      emitSimulatorEvent('SAVE_PHOTOS', {
        initialPhoto: Boolean(state.photos[1]),
        finalPhoto: Boolean(state.photos[2])
      });
      return;
    }

    emitSimulatorEvent('SAVE_PHOTOS', {
      initialPhoto: true,
      finalPhoto: true
    });

    showHint('Fotos de exhibición guardadas. Avanzando a Pedidos...', false);
    goToVisitTask(3); // Avanza a la tarea PEDIDOS del carrusel
  }

  // 10.1 Gestión de Visita en Progreso, Temporizador y Perfil Oficial
  let visitTimerInterval = null;
  let visitSeconds = 0;

  function startVisitTimer() {
    if (visitTimerInterval) clearInterval(visitTimerInterval);
    visitSeconds = 0;
    const timerText = document.getElementById('visit-timer-text');
    if (timerText) timerText.textContent = '00:00';
    visitTimerInterval = setInterval(() => {
      visitSeconds++;
      const mins = Math.floor(visitSeconds / 60);
      const secs = visitSeconds % 60;
      const fmt = `${mins < 10 ? '0' + mins : mins}:${secs < 10 ? '0' + secs : secs}`;
      if (timerText) timerText.textContent = fmt;
    }, 1000);
  }

  function setupVisitInProgressView(clientName) {
    startVisitTimer();
    const currentCase = getCaseData();
    const isKanchis = (clientName || '').toLowerCase().includes('kanchis') || state.currentCaseId === 'case-21';
    const resolvedClient = clientName || (currentCase ? currentCase.client : 'CONDO CCORIMANYA MARINO');

    // Cabecera Topbar Amarilla
    const cliHeader = document.getElementById('cli-nombre-header');
    if (cliHeader) cliHeader.textContent = resolvedClient.toUpperCase();

    // Scoring Oficial (Página 1: INICIO)
    const scoringVenta = document.getElementById('scoring-venta-val');
    const scoringCobranza = document.getElementById('scoring-cobranza-val');
    if (scoringVenta) scoringVenta.textContent = isKanchis ? 'D' : (currentCase && currentCase.scoringGrade ? currentCase.scoringGrade : 'C');
    if (scoringCobranza) scoringCobranza.textContent = isKanchis ? '3' : '1';

    // Perfil Personal del Cliente
    const perfilDesc = document.getElementById('cli-perfil-desc');
    if (perfilDesc) {
      if (isKanchis) {
        perfilDesc.textContent = 'Distribuidora Kanchis EIRL presenta facturas morosas con vencimiento superior a 30 días. Requiere regularización de cobranza antes de emitir pedidos.';
      } else if (resolvedClient.toLowerCase().includes('andes')) {
        perfilDesc.textContent = 'Ferretería Los Andes S.A.C. es un cliente preferencial A1 con excelente rotación en lubricantes Shell. Prioriza promociones con bonificación en especie.';
      } else {
        perfilDesc.textContent = `${resolvedClient} es un cliente que se destaca por su trato amable y receptividad a ofertas comerciales según la línea asignada.`;
      }
    }

    // Perfil Comercial Oficial (Página 1: INICIO)
    const cpRazon = document.getElementById('cp-razon-social');
    const cpDir = document.getElementById('cp-direccion');
    const cpCond = document.getElementById('cp-condicion');
    const cpRuc = document.getElementById('cp-ruc');
    const cpLista = document.getElementById('cp-lista');
    const cpPendiente = document.getElementById('cp-pendiente-val');
    const lineaAuth = document.getElementById('cli-linea-auth');
    const lineaDisp = document.getElementById('cli-linea-disp');
    const lineaUsed = document.getElementById('cli-linea-used');
    const creditBar = document.getElementById('credit-bar-fill');

    if (cpRazon) cpRazon.textContent = resolvedClient.toUpperCase();
    if (cpDir) cpDir.textContent = currentCase ? (currentCase.clientAddress || 'CALLE YARABAMBA MZ Y LT 9') : 'CALLE YARABAMBA MZ Y LT 9';
    if (cpCond) cpCond.textContent = (currentCase && currentCase.paymentCondition ? currentCase.paymentCondition : 'CONTADO').toUpperCase();
    if (cpRuc) cpRuc.textContent = isKanchis ? '20451829101' : '10459721270';
    if (cpLista) cpLista.textContent = `LISTA ${currentCase ? (currentCase.priceList || '3') : '3'}`;

    if (isKanchis) {
      if (cpPendiente) {
        cpPendiente.textContent = 'USD 840.00 (Vencido)';
        cpPendiente.style.color = 'var(--error-color)';
      }
      if (lineaAuth) lineaAuth.textContent = 'USD 2,500.00';
      if (lineaDisp) lineaDisp.textContent = 'USD 1,660.00';
      if (lineaUsed) lineaUsed.textContent = 'USD 840.00';
      if (creditBar) creditBar.style.width = '34%';
    } else {
      if (cpPendiente) {
        cpPendiente.textContent = '$0.00';
        cpPendiente.style.color = 'var(--success-color)';
      }
      if (lineaAuth) lineaAuth.textContent = 'USD 2,500.00';
      if (lineaDisp) lineaDisp.textContent = 'USD 2,500.00';
      if (lineaUsed) lineaUsed.textContent = 'USD 0.00';
      if (creditBar) creditBar.style.width = '0%';
    }

    // Resetear fotos en Página 2: FOTOS
    state.photos = { 1: false, 2: false, 3: false };
    [1, 2, 3].forEach(id => {
      const box = document.getElementById(`thumb-box-${id}`);
      const icon = document.getElementById(`icon-photo-${id}`);
      if (box) box.style.display = 'none';
      if (icon) {
        icon.textContent = '+';
        icon.style.color = '#6b7280';
      }
    });

    // Resetear pedidos emitidos en Página 4: PEDIDOS
    const ordersList = document.getElementById('visit-orders-list');
    if (ordersList) {
      ordersList.innerHTML = `
        <div id="visit-orders-empty-state" style="text-align:center; padding:30px 10px; color:var(--text-light);">
          <div style="font-size:36px; margin-bottom:8px;">📦</div>
          <div style="font-size:13px; font-weight:600; color:var(--text-medium);">No hay pedidos emitidos</div>
          <div style="font-size:11px; margin-top:2px;">Presiona el botón de arriba para iniciar un pedido o cotización.</div>
        </div>
      `;
    }

    // Ubicar el carrusel en la Tarea 1: INICIO
    goToVisitTask(0);
  }

  // Modales Fase 3: Comparar Precios, Docs y Contacto
  function openComparePricesModal() {
    const modal = document.getElementById('comparePricesModal');
    if (modal) modal.classList.add('active');
  }

  function closeComparePricesModal() {
    const modal = document.getElementById('comparePricesModal');
    if (modal) modal.classList.remove('active');
  }

  function submitPriceTracking() {
    closeComparePricesModal();
    const badgePrecios = document.getElementById('task-badge-precios');
    if (badgePrecios) {
      badgePrecios.textContent = 'Registrado ✅';
      badgePrecios.className = 'task-status-badge done';
    }
    showHint('Relevamiento de precios de competencia registrado correctamente.', false);
  }

  function openDocsModal() {
    const modal = document.getElementById('docsModal');
    if (modal) modal.classList.add('active');
  }

  function closeDocsModal() {
    const modal = document.getElementById('docsModal');
    if (modal) modal.classList.remove('active');
  }

  function openContactModal() {
    const modal = document.getElementById('contactModal');
    if (modal) modal.classList.add('active');
  }

  function closeContactModal() {
    const modal = document.getElementById('contactModal');
    if (modal) modal.classList.remove('active');
  }

  function submitContactUpdate() {
    closeContactModal();
    const badgeContacto = document.getElementById('task-badge-contacto');
    if (badgeContacto) {
      badgeContacto.textContent = 'Actualizado ✅';
      badgeContacto.className = 'task-status-badge done';
    }
    showHint('Datos de contacto actualizados correctamente en SOLAR.', false);
  }

  // 11. Métodos Oficiales para Nuevo Pedido (Flujo 2)
  function onOrderClientChange() {
    const sel = document.getElementById('sel-cliente');
    const lbl = document.getElementById('lbl-sel-cliente');
    if (sel && lbl && sel.selectedIndex >= 0) {
      lbl.textContent = sel.options[sel.selectedIndex].text;
    }
  }

  function onOrderConditionChange() {
    const sel = document.getElementById('sel-condicion');
    const lbl = document.getElementById('lbl-sel-condicion');
    if (sel && lbl && sel.selectedIndex >= 0) {
      lbl.textContent = sel.options[sel.selectedIndex].text;
    }
  }

  function onOrderPriceListChange() {
    const sel = document.getElementById('sel-lista');
    const lbl = document.getElementById('lbl-sel-lista');
    if (sel && lbl && sel.selectedIndex >= 0) {
      lbl.textContent = sel.options[sel.selectedIndex].text;
    }
  }

  function onOrderLineChange() {
    const selLine = document.getElementById('sel-linea');
    const lblLine = document.getElementById('lbl-sel-linea');
    const selBrand = document.getElementById('sel-marca');
    const lblBrand = document.getElementById('lbl-sel-marca');

    if (selLine && lblLine && selLine.selectedIndex >= 0) {
      lblLine.textContent = selLine.options[selLine.selectedIndex].text;
      const lineVal = selLine.value;

      if (selBrand) {
        if (lineVal === 'lubricantes') {
          selBrand.innerHTML = `<option value="shell" selected>SHELL</option>`;
        } else if (lineVal === 'neumaticos') {
          selBrand.innerHTML = `
            <option value="michelin" selected>MICHELIN</option>
            <option value="bfgoodrich">BFGOODRICH</option>
          `;
        } else if (lineVal === 'repuestos') {
          selBrand.innerHTML = `<option value="hyundai" selected>HYUNDAI</option>`;
        }
        if (lblBrand && selBrand.selectedIndex >= 0) {
          lblBrand.textContent = selBrand.options[selBrand.selectedIndex].text;
        }
      }
    }
  }

  function onOrderBrandChange() {
    const sel = document.getElementById('sel-marca');
    const lbl = document.getElementById('lbl-sel-marca');
    if (sel && lbl && sel.selectedIndex >= 0) {
      lbl.textContent = sel.options[sel.selectedIndex].text;
    }
  }

  function toggleOrderCurrency(isSoles) {
    state.orderCurrency = isSoles ? 'PEN' : 'USD';
    const lblSoles = document.getElementById('lbl-curr-soles');
    const lblDolares = document.getElementById('lbl-curr-dolares');
    if (lblSoles) {
      if (isSoles) lblSoles.classList.add('active');
      else lblSoles.classList.remove('active');
    }
    if (lblDolares) {
      if (!isSoles) lblDolares.classList.add('active');
      else lblDolares.classList.remove('active');
    }
    showHint(`Moneda de pedido seleccionada: ${isSoles ? 'Soles (PEN)' : 'Dólares (USD)'}`, false);
  }

  function onAddProductClick() {
    submitOrderConfig();
  }

  function onCompletarPedido() {
    if (state.cart && state.cart.qty > 0 && state.cart.product) {
      renderConfirmationOrderSummary();
      navigateTo('s-resumen-pedido');
    } else {
      showHint('Debes agregar al menos un producto antes de completar.', true);
    }
  }

  function renderOrderCartInNuevoPedido() {
    const list = document.getElementById('nuevo-pedido-cart-list');
    const btnComp = document.getElementById('btn-completar-pedido');
    if (!list) return;

    if (state.cart && state.cart.qty > 0 && state.cart.product) {
      const totalItem = (state.cart.qty * state.cart.unitPrice).toFixed(2);
      list.innerHTML = `
        <div class="task-card" style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-size:13px; font-weight:700; color:var(--text-dark);">${state.cart.product}</div>
            <div style="font-size:11px; color:var(--text-light); margin-top:2px;">
              Cant: <b>${state.cart.qty}</b> | P.U.: USD ${state.cart.unitPrice.toFixed(2)}
              ${state.cart.promoDiscount ? `<span style="color:var(--success-color); margin-left:4px;">🎁 Promo</span>` : ''}
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:13.5px; font-weight:700; color:var(--text-dark);">USD ${totalItem}</div>
            <span style="font-size:10px; color:var(--text-light);">(con IGV)</span>
          </div>
        </div>
      `;
      if (btnComp) {
        btnComp.className = 'btn-completar-disabled btn-completar-active';
        btnComp.disabled = false;
      }
    } else {
      list.innerHTML = '';
      if (btnComp) {
        btnComp.className = 'btn-completar-disabled';
        btnComp.disabled = true;
      }
    }
  }

  function submitOrderConfig() {
    const condicion = document.getElementById('sel-condicion')?.value || 'contado';
    const lista = document.getElementById('sel-lista')?.value || '3';
    const linea = document.getElementById('sel-linea')?.value || 'lubricantes';
    const marca = document.getElementById('sel-marca')?.value || 'shell';

    if (!condicion || !lista || !linea || !marca) {
      showHint('Completa todos los campos obligatorios del pedido.', true);
      return;
    }

    state.orderConfig = {
      paymentCondition: condicion,
      priceList: lista,
      line: linea,
      brand: marca
    };

    emitSimulatorEvent('CREATE_ORDER_CONFIG', state.orderConfig);
    renderCatalogProducts(linea, marca);
    navigateTo('s-catalogo-producto');
  }

  // 12. Renderizado Oficial de Selección de Producto (Flujo 3)
  function renderCatalogProducts(linea, marca) {
    const container = document.getElementById('catalog-products-container');
    const subtitleBadge = document.getElementById('catalog-subtitle-badge');

    if (subtitleBadge) {
      subtitleBadge.textContent = `${(linea || 'lubricantes').toUpperCase()}: ${(marca || 'shell').toUpperCase()}`;
    }

    const allProducts = getMasterProducts();
    const currSymbol = state.orderCurrency === 'PEN' ? 'S/' : '$';

    // Filtrar productos por línea y marca
    let matchingProducts = allProducts.filter(p => p.line === linea && p.brand === marca);

    if (matchingProducts.length === 0) {
      matchingProducts = allProducts.filter(p => p.brand === marca);
    }
    if (matchingProducts.length === 0) {
      matchingProducts = allProducts.filter(p => p.line === linea);
    }

    // Filtro por búsqueda si existe
    if (state.catalogSearchQuery) {
      const q = state.catalogSearchQuery;
      matchingProducts = matchingProducts.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.format && p.format.toLowerCase().includes(q))
      );
    }

    if (!container) return;

    if (matchingProducts.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:32px 16px;">
          <p style="color:var(--text-light); font-size:13px; font-weight:600;">No se encontraron productos en este almacén.</p>
        </div>
      `;
      return;
    }

    let cardsHtml = '';
    matchingProducts.forEach(prod => {
      let icon = '🛢️';
      if (prod.line === 'neumaticos') icon = '🛞';
      else if (prod.line === 'repuestos') icon = '⚙️';

      cardsHtml += `
        <div class="product-list-card" onclick="window.UyapaySimulator.openProductDetail('${prod.id}')">
          <div class="product-thumb-square">
            <span>${icon}</span>
          </div>
          <div class="product-card-details">
            <div class="product-sku-lbl">${prod.sku}</div>
            <div class="product-name-lbl">${prod.name}</div>
            <div class="product-cat-lbl">${prod.format || 'COMBO'}</div>
            <div class="product-card-bottom">
              <span class="product-price-lbl">${currSymbol}${prod.unitPrice.toFixed(2)}</span>
              <span class="product-stock-lbl">Disponible: ${prod.stock || 15}</span>
            </div>
          </div>
          <div style="display:flex; align-items:center; color:#9ca3af; font-size:16px; margin-left:4px;">›</div>
        </div>
      `;
    });

    container.innerHTML = cardsHtml;
  }

  function onProductSearch(query) {
    state.catalogSearchQuery = (query || '').toLowerCase().trim();
    const line = state.orderConfig?.line || 'lubricantes';
    const brand = state.orderConfig?.brand || 'shell';
    renderCatalogProducts(line, brand);
  }

  function clearProductSearch() {
    const inp = document.getElementById('prod-search-input');
    if (inp) inp.value = '';
    state.catalogSearchQuery = '';
    const line = state.orderConfig?.line || 'lubricantes';
    const brand = state.orderConfig?.brand || 'shell';
    renderCatalogProducts(line, brand);
  }

  function selectProductCatTab(tabName, idx) {
    state.catalogSelectedTab = tabName;
    for (let i = 0; i < 4; i++) {
      const tab = document.getElementById(`cattab-${i}`);
      const dot = document.getElementById(`cat-dot-${i}`);
      if (tab) {
        if (i === idx) tab.classList.add('active');
        else tab.classList.remove('active');
      }
      if (dot) {
        if (i === idx) dot.classList.add('active');
        else dot.classList.remove('active');
      }
    }
  }

  // 12.1 Métodos Oficiales para Detalle del Producto (Flujo 3)
  function openProductDetail(prodId) {
    const allProducts = getMasterProducts();
    const prod = allProducts.find(p => p.id === prodId);
    if (!prod) return;

    state.selectedCatalogProduct = prod;

    const currentCase = getCaseData();
    const isTarget = currentCase && (
      (currentCase.product && prod.name.toLowerCase().includes(currentCase.product.toLowerCase().slice(0, 10))) ||
      (currentCase.brand === prod.brand && currentCase.line === prod.line)
    );

    const initialQty = (isTarget && currentCase.expectedQty) ? currentCase.expectedQty : (state.catalogQuantities[prod.id] || 1);
    state.detailQty = initialQty;
    state.detailDescuentoAprov = 0.0;
    state.detailPromoChecked = isTarget ? (currentCase.promoDiscount !== false) : (prod.hasPromo || false);

    const currSymbol = state.orderCurrency === 'PEN' ? 'S/' : '$';

    const elCodigo = document.getElementById('det-prod-codigo');
    const elNombre = document.getElementById('det-prod-nombre');
    const elPres = document.getElementById('det-prod-presentacion');
    const elPrecio = document.getElementById('det-prod-precio');
    const elQty = document.getElementById('det-prod-qty');
    const elStockDisp = document.getElementById('det-prod-stock-disp');
    const elStockFisico = document.getElementById('det-prod-stock-fisico');
    const elUltIngreso = document.getElementById('det-prod-ultimo-ingreso');
    const elDescAprov = document.getElementById('detail-input-desc');

    if (elCodigo) elCodigo.textContent = prod.sku;
    if (elNombre) elNombre.textContent = prod.name;
    if (elPres) elPres.textContent = (prod.format || 'COMBO').toUpperCase();
    if (elPrecio) elPrecio.textContent = `${currSymbol}${prod.unitPrice.toFixed(2)}`;
    if (elQty) elQty.textContent = String(state.detailQty);
    if (elStockDisp) elStockDisp.textContent = String(prod.stock || 15);
    if (elStockFisico) elStockFisico.textContent = String(prod.stock || 15);
    if (elUltIngreso) elUltIngreso.textContent = prod.lastEntry || 'Hace 12 días';
    if (elDescAprov) elDescAprov.value = '0.0';

    // Bonificación / Toggle de promoción si aplica
    const promoRow = document.getElementById('detail-promo-toggle-row');
    const promoLbl = document.getElementById('detail-promo-label');
    const promoChk = document.getElementById('detail-promo-chk');

    const hasAnyPromo = prod.hasPromo || (isTarget && currentCase.promoLabel);
    if (promoRow) {
      if (hasAnyPromo) {
        promoRow.style.display = 'flex';
        if (promoLbl) {
          promoLbl.textContent = (isTarget && currentCase.promoLabel) ? currentCase.promoLabel : (prod.promoLabel || '🎁 Bonificación en especie');
        }
        if (promoChk) {
          promoChk.checked = state.detailPromoChecked;
        }
      } else {
        promoRow.style.display = 'none';
      }
    }

    updateProductDetailCalculations();
    navigateTo('s-detalle-producto');
  }

  function stepDetailQty(delta) {
    state.detailQty = Math.max(1, state.detailQty + delta);
    const elQty = document.getElementById('det-prod-qty');
    if (elQty) elQty.textContent = String(state.detailQty);

    if (state.selectedCatalogProduct) {
      state.catalogQuantities[state.selectedCatalogProduct.id] = state.detailQty;
    }
    updateProductDetailCalculations();
  }

  function onDescuentoAprovisionadoInput(val) {
    state.detailDescuentoAprov = parseFloat(val) || 0.0;
    updateProductDetailCalculations();
  }

  function onDetailPromoToggle(checked) {
    state.detailPromoChecked = checked;
    if (state.selectedCatalogProduct) {
      state.catalogPromos[state.selectedCatalogProduct.id] = checked;
    }
    updateProductDetailCalculations();
  }

  function updateProductDetailCalculations() {
    if (!state.selectedCatalogProduct) return;
    const prod = state.selectedCatalogProduct;
    const currSymbol = state.orderCurrency === 'PEN' ? 'S/' : '$';

    const subtotal = state.detailQty * prod.unitPrice;

    const currentCase = getCaseData();
    const isTarget = currentCase && (
      (currentCase.product && prod.name.toLowerCase().includes(currentCase.product.toLowerCase().slice(0, 10))) ||
      (currentCase.brand === prod.brand && currentCase.line === prod.line)
    );

    let promoDiscountAmount = 0.0;
    if (state.detailPromoChecked) {
      if (isTarget && currentCase.promoDiscountAmount) {
        promoDiscountAmount = currentCase.promoDiscountAmount;
      } else if (prod.promoType === 'discount') {
        promoDiscountAmount = prod.promoDiscountAmount || 10.0;
      }
    }

    const descAprovAmount = (state.detailDescuentoAprov / 100) * subtotal;
    const totalDiscount = promoDiscountAmount + descAprovAmount;
    const total = Math.max(0, subtotal - totalDiscount);

    const elSubtotal = document.getElementById('det-prod-subtotal');
    const elDescuento = document.getElementById('det-prod-descuento');
    const elTotal = document.getElementById('det-prod-total');

    if (elSubtotal) elSubtotal.textContent = `${currSymbol}${subtotal.toFixed(2)}`;
    if (elDescuento) elDescuento.textContent = `-${currSymbol}${totalDiscount.toFixed(2)}`;
    if (elTotal) elTotal.textContent = `${currSymbol}${total.toFixed(2)}`;
  }

  function confirmAddProductFromDetail() {
    if (!state.selectedCatalogProduct) return;
    const prod = state.selectedCatalogProduct;
    const currentCase = getCaseData();

    const isTarget = currentCase && (
      (currentCase.product && prod.name.toLowerCase().includes(currentCase.product.toLowerCase().slice(0, 10))) ||
      (currentCase.brand === prod.brand && currentCase.line === prod.line)
    );

    let promoType = prod.promoType || 'none';
    let promoLabel = prod.promoLabel || '';
    let promoDiscountAmount = 0.0;

    if (isTarget) {
      promoType = currentCase.promoType || prod.promoType || 'none';
      promoDiscountAmount = currentCase.promoDiscountAmount || 0.0;
      promoLabel = currentCase.promoLabel || prod.promoLabel;
    } else if (prod.promoType === 'discount') {
      promoDiscountAmount = prod.promoDiscountAmount || 10.0;
    }

    state.cart = {
      productId: prod.id,
      product: prod.name,
      sku: prod.sku,
      line: prod.line,
      brand: prod.brand,
      unitPrice: prod.unitPrice,
      qty: state.detailQty,
      promoDiscount: state.detailPromoChecked,
      promoType: promoType,
      promoDiscountAmount: promoDiscountAmount,
      promoLabel: promoLabel,
      descuentoAprovisionado: state.detailDescuentoAprov
    };

    emitSimulatorEvent('ADD_PRODUCT', {
      product: state.cart.product,
      sku: state.cart.sku,
      line: state.cart.line,
      brand: state.cart.brand,
      quantity: state.cart.qty,
      unitPrice: state.cart.unitPrice,
      promoDiscount: state.cart.promoDiscount,
      promoType: state.cart.promoType,
      promoDiscountAmount: state.cart.promoDiscountAmount,
      promoLabel: state.cart.promoLabel,
      descuentoAprovisionado: state.cart.descuentoAprovisionado
    });

    updateCartBadge();
    updateReceiptCalculations();
    renderOrderCartInNuevoPedido();
    showHint('Producto agregado exitosamente al pedido.', false);
    navigateTo('s-nuevo-pedido');
  }

  // 13. Compatibilidad selectProduct directa
  function selectProduct(prodId) {
    openProductDetail(prodId);
    confirmAddProductFromDetail();
  }

  function updateCartBadge() {
    const badge = document.getElementById('cart-badge-counter');
    if (!badge) return;
    if (state.cart && state.cart.qty > 0) {
      badge.textContent = String(state.cart.qty);
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  // 14. Cálculos de Liquidación Dinámicos basados en la Condición Elegida
  function updateReceiptCalculations() {
    const currentCase = getCaseData();
    const cond = state.orderConfig.paymentCondition || 'contado';

    let rate = 0.05;
    let condLabel = 'Desc. Contado (5%):';
    if (cond === 'credito_15') { rate = 0.04; condLabel = 'Desc. Crédito 15 días (4%):'; }
    else if (cond === 'credito_30') { rate = 0.03; condLabel = 'Desc. Crédito 30 días (3%):'; }
    else if (cond === 'credito_45') { rate = 0.02; condLabel = 'Desc. Crédito 45 días (2%):'; }
    else if (cond === 'credito_60') { rate = 0.01; condLabel = 'Desc. Crédito 60 días (1%):'; }

    const rawTotal = (state.cart.qty || 1) * (state.cart.unitPrice || 0);

    let promoDiscountValue = 0.0;
    const rowPromo = document.getElementById('row-promo-desc');
    const promoDescLabel = document.getElementById('receipt-promo-desc-label');
    const promoValEl = document.getElementById('receipt-promo-val');

    if (state.cart.promoDiscount && state.cart.promoType === 'discount') {
      promoDiscountValue = state.cart.promoDiscountAmount || 10.0;
      if (rowPromo) rowPromo.style.display = 'flex';
      if (promoDescLabel) promoDescLabel.textContent = state.cart.promoLabel || 'Descuento Promo Volumen:';
      if (promoValEl) promoValEl.textContent = `- USD ${promoDiscountValue.toFixed(2)}`;
    } else if (state.cart.promoDiscount && state.cart.promoType === 'gift') {
      if (rowPromo) rowPromo.style.display = 'flex';
      if (promoDescLabel) promoDescLabel.textContent = state.cart.promoLabel || '🎁 Regalo por Volumen:';
      if (promoValEl) promoValEl.textContent = 'Bonificación USD 0.00';
    } else {
      if (rowPromo) rowPromo.style.display = 'none';
    }

    const subtotalAfterPromo = Math.max(0, rawTotal - promoDiscountValue);
    const finDiscount = subtotalAfterPromo * rate;
    const finalTotal = Number((subtotalAfterPromo - finDiscount).toFixed(2));
    const igvTotal = Number((finalTotal * 0.18 / 1.18).toFixed(2));

    const itemSummaryEl = document.getElementById('receipt-items-summary');
    if (itemSummaryEl) itemSummaryEl.textContent = `${state.cart.qty}x ${state.cart.product} (@ $${state.cart.unitPrice.toFixed(2)})`;

    const skuDetailEl = document.getElementById('receipt-prod-sku-detail');
    if (skuDetailEl) skuDetailEl.textContent = `SKU: ${state.cart.sku || 'B-734807'} | ${state.cart.line ? state.cart.line.toUpperCase() : 'B2C'}`;

    const subtotalItemsEl = document.getElementById('receipt-subtotal-items');
    if (subtotalItemsEl) subtotalItemsEl.textContent = `USD ${rawTotal.toFixed(2)}`;

    const rawSubtotalEl = document.getElementById('receipt-raw-subtotal');
    if (rawSubtotalEl) rawSubtotalEl.textContent = `USD ${rawTotal.toFixed(2)}`;

    const subtotalEl = document.getElementById('receipt-subtotal');
    if (subtotalEl) subtotalEl.textContent = `USD ${subtotalAfterPromo.toFixed(2)}`;

    const condLabelEl = document.getElementById('receipt-cond-label');
    if (condLabelEl) condLabelEl.textContent = condLabel;

    const creditoEl = document.getElementById('receipt-credito-desc');
    if (creditoEl) creditoEl.textContent = `- USD ${finDiscount.toFixed(2)}`;

    const igvEl = document.getElementById('receipt-igv-val');
    if (igvEl) igvEl.textContent = `USD ${igvTotal.toFixed(2)}`;

    const totalEl = document.getElementById('receipt-total-val');
    if (totalEl) totalEl.textContent = `USD ${finalTotal.toFixed(2)}`;

    const clientEl = document.getElementById('receipt-client-name');
    if (clientEl) clientEl.textContent = state.selectedClient || (currentCase ? currentCase.client : '-');

    const addressEl = document.getElementById('receipt-address-text');
    if (addressEl) addressEl.textContent = currentCase ? (currentCase.clientAddress || 'AV. RUTA PRINCIPAL 100') : '-';

    const termsEl = document.getElementById('receipt-terms-text');
    if (termsEl) {
      const condName = cond === 'contado' ? 'Contado' : cond.replace('_', ' ').toUpperCase();
      termsEl.textContent = `${condName} (Lista ${state.orderConfig.priceList || 'OF'})`;
    }

    // Pre-llenar fecha de entrega estimada con mañana si no se ha seleccionado
    const dateInput = document.getElementById('confirm-delivery-date');
    if (dateInput && !dateInput.value) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateInput.value = tomorrow.toISOString().split('T')[0];
    }

    // Pre-llenar selector de dirección
    const addrSelect = document.getElementById('confirm-address-select');
    if (addrSelect && currentCase) {
      const addr = currentCase.clientAddress || 'AV. TOMAS TUYRUTUPAC 412';
      addrSelect.innerHTML = `
        <option value="principal" selected>${addr} (Principal)</option>
        <option value="almacen">ALMACÉN AUXILIAR NRO. 2</option>
      `;
    }

    state.finalOrderTotal = finalTotal;
  }

  // 15. Confirmación y Envío Final (Orden vs Cotización Tipo 3)
  function submitFinalOrder(docType = 'orden') {
    const isCotizacion = docType === 'cotizacion';
    const deliveryDate = document.getElementById('confirm-delivery-date')?.value || '';
    const isSecureSale = Boolean(document.getElementById('confirm-secure-sale')?.checked);
    const isGuarantee = Boolean(document.getElementById('confirm-guarantee')?.checked);
    const purchaseRequest = document.getElementById('confirm-purchase-request')?.value || '';
    const observation = document.getElementById('confirm-observation')?.value || '';

    emitSimulatorEvent('SUBMIT_ORDER', {
      confirmed: true,
      total: state.finalOrderTotal || 0,
      product: state.cart.product,
      quantity: state.cart.qty,
      paymentCondition: state.orderConfig.paymentCondition,
      documentType: isCotizacion ? 'cotizacion' : 'orden',
      documentTypeId: isCotizacion ? 3 : 2,
      estimatedDeliveryDate: deliveryDate,
      isSecureSale: isSecureSale,
      isGuarantee: isGuarantee,
      purchaseRequest: purchaseRequest,
      observation: observation
    });

    const finishTitle = document.getElementById('finish-title');
    const finishDesc = document.getElementById('finish-desc');
    if (isCotizacion) {
      if (finishTitle) finishTitle.textContent = '¡Cotización Registrada con Éxito!';
      if (finishDesc) finishDesc.innerHTML = 'Se guardó la propuesta comercial como <b>Cotización (Tipo 3)</b> sin comprometer stock ni línea de crédito.';
    } else {
      if (finishTitle) finishTitle.textContent = '¡Orden Enviada con Éxito!';
      if (finishDesc) finishDesc.innerHTML = 'Se actualizó la orden de compra en el sistema central en estado <b>ENVIADO</b>. Has completado el flujo oficial del manual.';
    }

    navigateTo('s-dashboard');
  }

  function finishSimulation() {
    emitSimulatorEvent('SUBMIT_EVALUATION', {
      caseId: state.currentCaseId,
      clientName: state.selectedClient
    });
  }

  // Escuchar respuestas del Evaluador
  window.addEventListener('message', (event) => {
    if (!event.data || !event.data.type) return;

    if (event.data.type === 'EVALUATOR_FEEDBACK_ERROR') {
      showHint(event.data.message || 'Error en el paso.', true);
    }

    if (event.data.type === 'EVALUATOR_STEP_APPROVED') {
      if (event.data.message) {
        showHint(event.data.message, false);
      }
      if (event.data.nextScreen) {
        navigateTo(event.data.nextScreen);
      }
    }
  });

  // Exponer métodos globales al simulador
  window.UyapaySimulator = {
    login: handleAppLogin,
    go: navigateTo,
    selectNavTab: selectNavTab,
    selectAnalysisTab: selectAnalysisTab,
    selectVisitTab: selectVisitTab,
    selectFilter: selectFilter,
    openOptions: openClientOptions,
    closeOptions: closeClientOptions,
    checkOption: selectOption,
    openHistoryModal: openHistoryModal,
    closeHistoryModal: closeHistoryModal,
    submitHistoryDate: submitHistoryDate,
    openGpsModal: openGpsModal,
    closeGpsModal: closeGpsModal,
    confirmVisitType: confirmVisitType,
    openIncompleteTasksModal: openIncompleteTasksModal,
    closeIncompleteTasksModal: closeIncompleteTasksModal,
    submitIncompleteTask: submitIncompleteTask,
    openCobranzaModal: openCobranzaModal,
    closeCobranzaModal: closeCobranzaModal,
    submitCobranza: submitCobranza,
    openOutRouteModal: openOutRouteModal,
    closeOutRouteModal: closeOutRouteModal,
    onOutRouteClientChange: onOutRouteClientChange,
    onOutRouteAddressChange: onOutRouteAddressChange,
    selectPlanClientMode: selectPlanClientMode,
    submitOutRouteVisit: submitOutRouteVisit,
    openSettlementModal: openSettlementModal,
    closeSettlementModal: closeSettlementModal,
    submitSettlement: submitSettlement,
    takePhoto: takePhoto,
    submitPhotos: submitPhotos,
    openComparePricesModal: openComparePricesModal,
    closeComparePricesModal: closeComparePricesModal,
    submitPriceTracking: submitPriceTracking,
    openDocsModal: openDocsModal,
    closeDocsModal: closeDocsModal,
    openContactModal: openContactModal,
    closeContactModal: closeContactModal,
    submitContactUpdate: submitContactUpdate,
    setupVisitInProgressView: setupVisitInProgressView,
    goToVisitTask: goToVisitTask,
    prevVisitTask: prevVisitTask,
    nextVisitTask: nextVisitTask,
    toggleTaskDropdown: toggleTaskDropdown,
    closeTaskDropdown: closeTaskDropdown,
    openPhotoHistoryModal: openPhotoHistoryModal,
    closePhotoHistoryModal: closePhotoHistoryModal,
    onInicioContinue: onInicioContinue,
    onPreciosContinue: onPreciosContinue,
    onPedidosContinue: onPedidosContinue,
    switchPriceSubtab: switchPriceSubtab,
    toggleSkuAccordion: toggleSkuAccordion,
    onCompetitorPriceInput: onCompetitorPriceInput,
    uploadPurchaseDoc: uploadPurchaseDoc,
    submitOrderConfig: submitOrderConfig,
    onOrderClientChange: onOrderClientChange,
    onOrderConditionChange: onOrderConditionChange,
    onOrderPriceListChange: onOrderPriceListChange,
    onOrderLineChange: onOrderLineChange,
    onOrderBrandChange: onOrderBrandChange,
    toggleOrderCurrency: toggleOrderCurrency,
    onAddProductClick: onAddProductClick,
    onCompletarPedido: onCompletarPedido,
    renderOrderCartInNuevoPedido: renderOrderCartInNuevoPedido,
    renderCatalogProducts: renderCatalogProducts,
    openProductDetail: openProductDetail,
    stepDetailQty: stepDetailQty,
    onDescuentoAprovisionadoInput: onDescuentoAprovisionadoInput,
    onDetailPromoToggle: onDetailPromoToggle,
    confirmAddProductFromDetail: confirmAddProductFromDetail,
    onProductSearch: onProductSearch,
    clearProductSearch: clearProductSearch,
    selectProductCatTab: selectProductCatTab,
    changeCatalogQty: (id, delta) => stepDetailQty(delta),
    toggleCatalogPromo: (id, checked) => onDetailPromoToggle(checked),
    openSecondaryDrawer: openSecondaryDrawer,
    closeSecondaryDrawer: closeSecondaryDrawer,
    toggleProgressDetails: toggleProgressDetails,
    renderOrdersTrackingList: renderOrdersTrackingList,
    selectOrderSubtab: selectOrderSubtab,
    selectOrderFilter: selectOrderFilter,
    onOrderSearch: onOrderSearch,
    clearOrderSearch: clearOrderSearch,
    selectProduct: selectProduct,
    submitFinalOrder: submitFinalOrder,
    finish: finishSimulation,
    hint: (msg) => showHint(msg, false)
  };

  window.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('userIn');
    if (input && state.advisorUsername) {
      input.value = state.advisorUsername;
    }
    initializeCaseEnvironment();

    // Auto-login automático si se carga desde la arena de evaluación con usuario asignado
    const shouldAutoLogin = urlParams.get('autologin') === '1' || urlParams.get('case');
    if (shouldAutoLogin && state.advisorUsername) {
      handleAppLogin();
    }
  });
})();
