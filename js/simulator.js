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
    visitInProgress: false,
    activeVisitClient: null,
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
      product: '',
      sku: '',
      line: '',
      brand: '',
      format: '',
      unitPrice: 0,
      qty: 0,
      promoDiscount: false,
      promoType: 'none',
      promoDiscountAmount: 0.0,
      promoLabel: ''
    },
    cobranza: {
      deudaVencida: 490.98,
      invoiceCode: 'F001-00053870',
      invoiceDueDate: '29 jun',
      invoiceOriginalAmount: 725.76,
      client: 'MULTISERVICIOS CUELLAR E.I.R.L.',
      paymentMethod: 'efectivo',
      currency: 'USD',
      tc: 3.38,
      cashAmount: 0.0,
      depositAmount: 0.0,
      bank: 'BCP (EN SOLES)',
      depositOp: '002-94820194',
      depositDate: '',
      hasVoucherPhoto: false,
      recibosRecientes: [],
      recibosEnviados: [],
      currentSubtab: 'reciente',
      consolidated: false
    },
    currentDocType: 'orden'
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
  const visitTaskTitles = ['INICIO', 'FOTOS', 'PRECIOS', 'PEDIDOS', 'COBRANZA'];

  function goToVisitTask(index) {
    if (index < 0) index = 0;
    if (index > 4) index = 4;
    currentVisitTaskIndex = index;

    // Actualizar título en barra
    const titleEl = document.getElementById('task-nav-current-title');
    if (titleEl) titleEl.textContent = visitTaskTitles[index];

    // Actualizar dots indicadores (5 dots)
    for (let i = 0; i < 5; i++) {
      const dot = document.getElementById(`dot-task-${i}`);
      if (dot) {
        if (i === index) dot.classList.add('active');
        else dot.classList.remove('active');
      }
    }

    // Actualizar slides visibles
    const slideIds = ['task-slide-inicio', 'task-slide-fotos', 'task-slide-precios', 'task-slide-pedidos', 'task-slide-cobranza'];
    slideIds.forEach((sId, idx) => {
      const el = document.getElementById(sId);
      if (el) {
        if (idx === index) el.classList.add('active');
        else el.classList.remove('active');
      }
    });

    if (index === 4) {
      renderCobranzaTaskView();
    }

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

  function onPreciosMotivoChange(val) {
    const sel = document.getElementById('sel-precios-motivo');
    const label = sel && sel.selectedIndex >= 0 ? sel.options[sel.selectedIndex].text : val;
    state.preciosMotivo = val;
    state.preciosMotivoLabel = label;
  }

  function onPreciosContinue() {
    const sel = document.getElementById('sel-precios-motivo');
    const motivo = sel ? (sel.value || '') : (state.preciosMotivo || '');
    const motivoLabel = (sel && sel.selectedIndex >= 0 && sel.value) ? sel.options[sel.selectedIndex].text : (state.preciosMotivoLabel || '');

    const pCompra = parseFloat(document.getElementById('comp-castrol-compra')?.value) || 0;
    const pVenta = parseFloat(document.getElementById('comp-castrol-venta')?.value) || 0;
    const pModal = parseFloat(document.getElementById('input-price-competitor-1')?.value) || 0;
    const castrolPrice = pCompra || pVenta || pModal || (state.castrolPrice || 0);
    const hasPhoto = Boolean(state.hasCompetitorPhoto);

    if (castrolPrice > 0 || hasPhoto) {
      emitSimulatorEvent('SUBMIT_PRICE_TRACKING', {
        product: 'Castrol Mineral 20W50',
        price: castrolPrice > 0 ? castrolPrice : 38.0,
        hasPhoto: hasPhoto || true
      });
    }

    emitSimulatorEvent('SAVE_PRICE_TRACKING_MOTIVO', {
      motivo: motivo,
      motivoLabel: motivoLabel,
      skippedRegistration: Boolean(motivo)
    });

    if (!motivo && castrolPrice === 0) {
      showHint('Atención: Registra el precio de Castrol Mineral 20W50 o selecciona un motivo.', true);
    } else {
      showHint('Tracking de precios registrado correctamente. Avanzando a Pedidos...', false);
    }

    goToVisitTask(3); // Avanza a PEDIDOS
  }

  function onPedidosContinue() {
    const currentCase = getCaseData();
    const isCp08 = (currentCase && currentCase.code === 'CP-08') || (state.currentCaseId === 'case-cp08');
    const hasNoOrders = !state.cart || !state.cart.product || state.cart.qty === 0;

    if (isCp08 || hasNoOrders) {
      openNoOrderModal();
      return;
    }
    goToVisitTask(4); // Avanza a COBRANZA
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
      showHint('Modo: Resumen de relevamiento de precios.', false);
    }
  }

  function toggleSkuAccordion(skuId) {
    const body = document.getElementById(`sku-body-${skuId}`);
    const arrow = document.getElementById(`sku-arrow-${skuId}`);
    if (body) {
      const isHidden = body.style.display === 'none' || !body.style.display;
      body.style.display = isHidden ? 'block' : 'none';
      if (arrow) arrow.textContent = isHidden ? '∧' : '∨';
    }
  }

  function onCompetitorPriceInput(skuId) {
    const status = document.getElementById(`sku-status-${skuId}`);
    if (status) status.textContent = '1 de 3 registrados';
    const fill = document.getElementById('price-progress-fill');
    const avance = document.getElementById('price-avance-val');
    if (fill) fill.style.width = '25%';
    if (avance) avance.textContent = '1 (10.0%)';
  }

  function uploadPurchaseDoc() {
    state.hasCompetitorPhoto = true;
    showHint('Fotografía de cotización de competencia adjunta correctamente 📷', false);
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
    if (screenId === 's-visitas') {
      renderClientListCards();
    }
    if (screenId === 's-nuevo-pedido') {
      renderOrderCartInNuevoPedido();
    }
    if (screenId === 's-documentos-electronicos') {
      emitSimulatorEvent('OPEN_ELECTRONIC_DOCS', { opened: true });
    }

    if (screenId === 's-dashboard' && !document.getElementById('s-dashboard')) {
      screenId = 's-inicio';
    }

    const target = document.getElementById(screenId);
    if (!target) {
      console.warn(`[Simulator] Pantalla '${screenId}' no encontrada. Activando respaldo.`);
      const fallback = document.getElementById('s-visitas') || document.getElementById('s-inicio');
      if (fallback) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        fallback.classList.add('active');
      }
      return;
    }

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    target.classList.add('active');
  }

  // 1. Inicialización de Visitas y Clientes según el Caso Activo
  function initializeCaseEnvironment() {
    const currentCase = getCaseData();
    if (!currentCase) return;

    state.selectedClient = currentCase.client;
    state.visitInProgress = false;
    state.activeVisitClient = null;
    state.cart = {
      productId: '',
      product: '',
      sku: '',
      line: '',
      brand: '',
      format: '',
      unitPrice: 0,
      qty: 0,
      promoDiscount: false,
      promoType: 'none',
      promoDiscountAmount: 0.0,
      promoLabel: ''
    };

    const isCp09 = state.currentCaseId === 'case-cp09' || state.currentCaseId === 'case-9';
    const isCp08 = state.currentCaseId === 'case-cp08' || state.currentCaseId === 'case-8';
    const isCp06 = state.currentCaseId === 'case-cp06' || state.currentCaseId === 'case-6';

    if (isCp08) {
      state.visitInProgress = true;
      state.activeVisitClient = currentCase.client;
    } else if (isCp06) {
      state.visitInProgress = true;
      state.activeVisitClient = currentCase.client;
    }

    state.cobranza = {
      deudaVencida: isCp09 ? 380.00 : (state.currentCaseId === 'case-19' ? 350.00 : 490.98),
      invoiceCode: isCp09 ? 'F001-00054210' : (state.currentCaseId === 'case-19' ? 'F002-00084120' : 'F001-00053870'),
      invoiceDueDate: isCp09 ? '31 jul' : '29 jun',
      invoiceOriginalAmount: isCp09 ? 380.00 : (state.currentCaseId === 'case-19' ? 350.00 : 725.76),
      client: currentCase.client || 'MULTISERVICIOS CUELLAR E.I.R.L.',
      paymentMethod: 'efectivo',
      currency: 'USD',
      tc: isCp09 ? 3.45 : 3.38,
      cashAmount: 0.0,
      depositAmount: 0.0,
      bank: 'BCP (EN SOLES)',
      depositOp: '002-94820194',
      depositDate: new Date().toISOString().split('T')[0],
      hasVoucherPhoto: false,
      recibosRecientes: [],
      recibosEnviados: [],
      currentSubtab: 'reciente',
      consolidated: false
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

    // Resetear motivo de precios
    const selPreciosMotivo = document.getElementById('sel-precios-motivo');
    if (selPreciosMotivo) {
      selPreciosMotivo.value = '';
    }
    state.preciosMotivo = '';
    state.preciosMotivoLabel = '';

    state.catalogPromos = {};
    state.catalogQuantities = {};

    const dateInput = document.getElementById('confirm-delivery-date');
    if (dateInput) {
      dateInput.value = '';
    }

    const addrSelect = document.getElementById('confirm-address-select');
    if (addrSelect) {
      const addr = currentCase.clientAddress || 'AV. TOMAS TUYRUTUPAC 412';
      addrSelect.innerHTML = `
        <option value="principal" selected>${addr} (Punto de venta / Visita)</option>
        <option value="almacen">ALMACÉN (a 600m de punto de venta)</option>
      `;
    }

    if (state.currentCaseId === 'case-2' || currentCase.code === 'CP-02') {
      // Trampas de inicio para CP-02: Condición inicia en Contado, Línea en Lubricantes Shell
      if (selCond) {
        selCond.value = 'contado';
        if (lblCond && selCond.selectedIndex >= 0) lblCond.textContent = selCond.options[selCond.selectedIndex].text;
      }
      if (selList) {
        selList.value = 'OF';
        if (lblList && selList.selectedIndex >= 0) lblList.textContent = selList.options[selList.selectedIndex].text;
      }
      if (selLine) {
        selLine.value = 'lubricantes';
        if (lblLine && selLine.selectedIndex >= 0) lblLine.textContent = selLine.options[selLine.selectedIndex].text;
      }
      if (selBrand) {
        selBrand.innerHTML = `<option value="shell" selected>SHELL</option>`;
        selBrand.value = 'shell';
        if (lblBrand && selBrand.selectedIndex >= 0) lblBrand.textContent = selBrand.options[selBrand.selectedIndex].text;
      }
    } else {
      if (selCond && currentCase.paymentCondition) {
        selCond.value = currentCase.paymentCondition;
        if (lblCond && selCond.selectedIndex >= 0) {
          lblCond.textContent = selCond.options[selCond.selectedIndex].text;
        }
      }
      if (selList) {
        if (state.currentCaseId === 'case-1' || currentCase.code === 'CP-01') {
          selList.value = '1';
          if (lblList) lblList.textContent = 'LISTA 1';
        } else if (currentCase.priceList) {
          selList.value = currentCase.priceList;
          if (lblList && selList.selectedIndex >= 0) {
            lblList.textContent = selList.options[selList.selectedIndex].text;
          }
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
    }

    const cliLista = document.getElementById('cli-lista-header');
    if (cliLista && currentCase.priceList) cliLista.textContent = `Lista ${currentCase.priceList}`;

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

    renderClientListCards();
    renderOrderCartInNuevoPedido();
    renderCobranzaTaskView();
  }

  const mockDistractorsList = [
    { name: 'Ferretería Los Andes S.A.C.', address: 'AV. TOMAS TUYRUTUPAC 412' },
    { name: 'Distribuidora Kanchis EIRL', address: 'AV. INDUSTRIAL 104' },
    { name: 'Comercial Vega Hnos.', address: 'CALLE MERCADERES 301' },
    { name: 'Transportes del Sur SAC', address: 'KM 12 VARIANTE UCHUMAYO' },
    { name: 'Grupo Ferretero Miraflores', address: 'AV. SAN JERONIMO 210' },
    { name: 'Autopartes El Rápido', address: 'JR. PIEROLA 540' },
    { name: 'Servicentro El Faro', address: 'AV. DOLORES 880' },
    { name: 'Taller Hyundai Express', address: 'AV. PARRA 314' }
  ];

  function renderClientListCards() {
    const listContainer = document.getElementById('client-list-cards');
    if (!listContainer) return;

    const currentCase = getCaseData();
    if (!currentCase) return;

    const isOutRouteCase = (state.currentCaseId === 'case-11' || state.currentCaseId === 'case-22');
    const targetClient = currentCase.client;
    const targetAddr = currentCase.clientAddress || 'AV. RUTA PRINCIPAL 100';

    const mockDistractors = mockDistractorsList.filter(d => !d.name.toLowerCase().includes(targetClient.toLowerCase().slice(0, 7)));

    let html = '';
    if (!isOutRouteCase) {
      const isTargetInProgress = Boolean(state.visitInProgress && state.activeVisitClient === targetClient);
      html += `
        <div class="client-card-official ${isTargetInProgress ? 'is-in-progress' : ''}" onclick="window.UyapaySimulator.onClientCardClick('${targetClient}')">
          <div class="client-card-left-col">
            <div class="client-card-pin-circle">
              <span>📍</span>
            </div>
            <span class="client-drag-handle">⋮⋮</span>
          </div>
          <div class="client-card-content">
            <div class="client-card-title-row">
              <span class="client-card-name">${targetClient.toUpperCase()}</span>
              <span class="client-card-chevron">∨</span>
            </div>
            <div class="client-card-address">${targetAddr}</div>
            ${isTargetInProgress ? `
              <div class="client-card-status-row" style="margin-top:4px;">
                <span class="status-badge-in-course">EN CURSO</span>
                <span class="client-card-time">🕒 11:31</span>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    mockDistractors.slice(0, isOutRouteCase ? 4 : 3).forEach(d => {
      const isDistractorInProgress = Boolean(state.visitInProgress && state.activeVisitClient === d.name);
      html += `
        <div class="client-card-official ${isDistractorInProgress ? 'is-in-progress' : ''}" onclick="window.UyapaySimulator.onClientCardClick('${d.name}')">
          <div class="client-card-left-col">
            <div class="client-card-pin-circle">
              <span>📍</span>
            </div>
            <span class="client-drag-handle">⋮⋮</span>
          </div>
          <div class="client-card-content">
            <div class="client-card-title-row">
              <span class="client-card-name">${d.name.toUpperCase()}</span>
              <span class="client-card-chevron">∨</span>
            </div>
            <div class="client-card-address">${d.address}</div>
            ${isDistractorInProgress ? `
              <div class="client-card-status-row" style="margin-top:4px;">
                <span class="status-badge-in-course">EN CURSO</span>
                <span class="client-card-time">🕒 11:31</span>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    });

    listContainer.innerHTML = html;
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

  // 2.3.1 Funciones de Vistas del Menú Secundario (menu secundario-clientes.png, documentos.png, historial.png)
  function toggleDrawerClientAccordion(clientId) {
    const body = document.getElementById(`acc-body-${clientId}`);
    const arrow = document.getElementById(`acc-arrow-${clientId}`);
    if (body) {
      const isHidden = (body.style.display === 'none');
      body.style.display = isHidden ? 'flex' : 'none';
      if (arrow) arrow.textContent = isHidden ? '∧' : '∨';
    }
  }

  function onDrawerClientSearch(query) {
    const q = (query || '').toLowerCase().trim();
    const cards = document.querySelectorAll('.client-drawer-card');
    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(q) ? 'block' : 'none';
    });
  }

  function clearDrawerClientSearch() {
    const input = document.getElementById('search-mis-clientes-input');
    if (input) input.value = '';
    onDrawerClientSearch('');
  }

  function selectDocTypeFilter(docType) {
    document.querySelectorAll('.doc-type-pill').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(`doc-type-${docType}`);
    if (target) target.classList.add('active');
    showHint(`Filtro por tipo: ${docType.toUpperCase()}`, false);
  }

  function selectDocStatusFilter(status) {
    document.querySelectorAll('.doc-status-pill').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(`doc-st-${status}`);
    if (target) target.classList.add('active');
    showHint(`Estado de comprobantes: ${status.toUpperCase()}`, false);
  }

  function onDocsSearch(query) {
    const q = (query || '').toLowerCase().trim();
    const docs = document.querySelectorAll('.doc-item-card');
    docs.forEach(doc => {
      const text = doc.textContent.toLowerCase();
      doc.style.display = text.includes(q) ? 'flex' : 'none';
    });
  }

  function clearDocsSearch() {
    const input = document.getElementById('search-docs-input');
    if (input) input.value = '';
    onDocsSearch('');
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
        <div class="order-tracking-card is-recent" onclick="window.UyapaySimulator.openOrderDetail('P004-022323')">
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
        <div class="order-tracking-card" onclick="window.UyapaySimulator.openOrderDetail('${ord.code}')">
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

  // 2.6 Detalle y Seguimiento de Pedidos (seguimiento de pedidos - productos.png y seguimiento.png)
  function selectOrderDetailTab(tabKey) {
    const tabSeg = document.getElementById('od-tab-seguimiento');
    const tabProd = document.getElementById('od-tab-productos');
    const dotSeg = document.getElementById('od-dot-seguimiento');
    const dotProd = document.getElementById('od-dot-productos');
    const viewProd = document.getElementById('od-view-productos');
    const viewSeg = document.getElementById('od-view-seguimiento');

    if (tabKey === 'seguimiento') {
      if (tabSeg) tabSeg.classList.add('active');
      if (tabProd) tabProd.classList.remove('active');
      if (dotSeg) dotSeg.style.display = 'block';
      if (dotProd) dotProd.style.display = 'none';
      if (viewSeg) viewSeg.style.display = 'block';
      if (viewProd) viewProd.style.display = 'none';
    } else {
      if (tabProd) tabProd.classList.add('active');
      if (tabSeg) tabSeg.classList.remove('active');
      if (dotProd) dotProd.style.display = 'block';
      if (dotSeg) dotSeg.style.display = 'none';
      if (viewProd) viewProd.style.display = 'block';
      if (viewSeg) viewSeg.style.display = 'none';
    }
  }

  function openOrderDetail(orderCode) {
    const clientHeader = document.getElementById('order-detail-header-client');
    const codeStatus = document.getElementById('od-code-status');
    const dateEmit = document.getElementById('od-date-emit');
    const payment = document.getElementById('od-payment');
    const dateDelivery = document.getElementById('od-date-delivery');
    const gallons = document.getElementById('od-gallons');
    const total = document.getElementById('od-total');
    const undeliveredList = document.getElementById('od-undelivered-products-list');
    const deliveredList = document.getElementById('od-delivered-products-list');
    const emitter = document.getElementById('od-timeline-emitter');
    const emitterTime = document.getElementById('od-timeline-emitter-time');

    const advisorName = state.advisorUsername ? (state.advisorUsername.charAt(0).toUpperCase() + state.advisorUsername.slice(1)) : 'Betsy Ramos';

    if (orderCode === 'P004-022323' && state.finalOrderTotal) {
      const cliName = (state.selectedClient || 'FERRETERÍA LOS ANDES S.A.C.').toUpperCase();
      if (clientHeader) clientHeader.textContent = cliName;
      if (codeStatus) codeStatus.textContent = 'P004-022323 - EMITIDO';
      if (dateEmit) dateEmit.textContent = '09-sept-2026 - Ahora';
      if (payment) payment.textContent = (state.orderConfig.paymentConditionLabel || 'CONTADO / LISTA 1').toUpperCase();
      if (dateDelivery) dateDelivery.textContent = '12 sept 2026';
      if (gallons) gallons.textContent = '5.0';
      if (total) total.textContent = `USD ${state.finalOrderTotal.toFixed(2)}`;

      if (undeliveredList) {
        const prodName = state.cart.productName || 'Shell Helix HX7 10W/40';
        const prodFmt = state.cart.format || 'Balde 5 Gal';
        const prodQty = state.cart.qty || 1;
        undeliveredList.innerHTML = `
          <div class="order-prod-card">
            <div>
              <div class="order-prod-title">${prodQty} ${prodName.toUpperCase()}</div>
              <div class="order-prod-subtitle">${prodFmt.toUpperCase()}</div>
            </div>
            <div class="order-prod-price">USD ${state.finalOrderTotal.toFixed(2)}</div>
          </div>
        `;
      }
      if (deliveredList) {
        deliveredList.innerHTML = `
          <div style="font-size:12px; color:#6b7280; text-align:center; padding:12px 0;">
            Sin entregas registradas aún (en tránsito).
          </div>
        `;
      }
      if (emitter) emitter.textContent = advisorName;
      if (emitterTime) emitterTime.textContent = '09-sept-2026 - Ahora';
    } else if (orderCode === 'P004-022321') {
      if (clientHeader) clientHeader.textContent = 'MAQUERA CALIZAYA YOVIER';
      if (codeStatus) codeStatus.textContent = 'P004-022321 - EMITIDO';
      if (dateEmit) dateEmit.textContent = '09-sept-2026 - 08:08 a.m.';
      if (payment) payment.textContent = 'CRÉDITO 30 DÍAS / LISTA 1';
      if (dateDelivery) dateDelivery.textContent = '16 sept 2026';
      if (gallons) gallons.textContent = '10.0';
      if (total) total.textContent = 'USD 161.00';
      if (undeliveredList) {
        undeliveredList.innerHTML = `
          <div class="order-prod-card">
            <div>
              <div class="order-prod-title">2 SHELL RIMULA R4 X 15W-40</div>
              <div class="order-prod-subtitle">BALDE 5 GAL</div>
            </div>
            <div class="order-prod-price">USD 161.00</div>
          </div>
        `;
      }
      if (deliveredList) {
        deliveredList.innerHTML = `<div style="font-size:12px; color:#6b7280; text-align:center; padding:12px 0;">Sin entregas registradas aún.</div>`;
      }
      if (emitter) emitter.textContent = advisorName;
      if (emitterTime) emitterTime.textContent = '09-sept-2026 - 08:08 a.m.';
    } else if (orderCode === 'P004-022319') {
      if (clientHeader) clientHeader.textContent = 'VIEYRA JARA RODRIGO LUIS';
      if (codeStatus) codeStatus.textContent = 'P004-022319 - ENTREGADO';
      if (dateEmit) dateEmit.textContent = '08-sept-2026 - 04:47 p.m.';
      if (payment) payment.textContent = 'CONTADO / LISTA 1';
      if (dateDelivery) dateDelivery.textContent = '09 sept 2026';
      if (gallons) gallons.textContent = '15.0';
      if (total) total.textContent = 'PEN 496.00';
      if (undeliveredList) {
        undeliveredList.innerHTML = `<div style="font-size:12px; color:#6b7280; text-align:center; padding:12px 0;">Todos los productos han sido entregados.</div>`;
      }
      if (deliveredList) {
        deliveredList.innerHTML = `
          <div class="order-prod-card">
            <div>
              <div class="order-prod-title">3 SHELL HELIX ULTRA 5W-40</div>
              <div class="order-prod-subtitle">CAJA 4 X 4 LTS</div>
            </div>
            <div class="order-prod-price">PEN 496.00</div>
          </div>
        `;
      }
      if (emitter) emitter.textContent = 'Rodrigo Vieyra';
      if (emitterTime) emitterTime.textContent = '08-sept-2026 - 04:47 p.m.';
    } else {
      // Caso estándar: P004-022322 (captura oficial de producción)
      if (clientHeader) clientHeader.textContent = 'SERVICIOS GARCIA GLOBAL S.A.C.';
      if (codeStatus) codeStatus.textContent = 'P004-022322 - APROBADO';
      if (dateEmit) dateEmit.textContent = '09-sept-2026 - 08:21 a.m.';
      if (payment) payment.textContent = 'CONTADO / LISTA 3';
      if (dateDelivery) dateDelivery.textContent = '15 sept 2026';
      if (gallons) gallons.textContent = '0.0';
      if (total) total.textContent = 'USD 86.00';

      if (undeliveredList) {
        undeliveredList.innerHTML = `
          <div class="order-prod-card">
            <div>
              <div class="order-prod-title">1 HELIX HX5G 20W50</div>
              <div class="order-prod-subtitle">CAJ 6 X 1 LTS</div>
            </div>
            <div class="order-prod-price">USD 40.36</div>
          </div>
          <div class="order-prod-card">
            <div>
              <div class="order-prod-title">1 HELIX HX5G 20W50</div>
              <div class="order-prod-subtitle">BOT 1 LTS</div>
            </div>
            <div class="order-prod-price">USD 0.00</div>
          </div>
        `;
      }
      if (deliveredList) {
        deliveredList.innerHTML = `
          <div class="order-prod-card">
            <div>
              <div class="order-prod-title">1 HELIX HX5G 20W50</div>
              <div class="order-prod-subtitle">CAJ 6 X 1 LTS</div>
            </div>
            <div class="order-prod-price">USD 40.36</div>
          </div>
        `;
      }
      if (emitter) emitter.textContent = advisorName;
      if (emitterTime) emitterTime.textContent = '09-sept-2026 - 08:21 a.m.';
    }

    selectOrderDetailTab('productos');
    navigateTo('s-detalle-pedido-seguimiento');
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
        <div class="client-card" style="border-left: 4px solid #e74c3c;" onclick="window.UyapaySimulator.onClientCardClick('Distribuidora Kanchis EIRL')">
          <div class="pin" style="color:#e74c3c;">⚠️</div>
          <div>
            <div class="client-name">DISTRIBUIDORA KANCHIS EIRL <span style="background:#e74c3c; color:#fff; font-size:10px; padding:2px 6px; border-radius:4px; margin-left:4px;">DEUDA VENCIDA</span></div>
            <div class="client-address">AV. INDUSTRIAL 104 - Saldo Moroso: USD 840.00</div>
          </div>
        </div>
      `;
      showHint('Filtro aplicado: Clientes con deuda vencida.', false);
    } else if (filterKey === 'todos') {
      renderClientListCards();
    }
  }

  // 4. Visitas y Opciones del Cliente (DIRECCIONES - visitas-iniciar visita lejos del punto.png)
  function renderClientOptionsSheet(clientName) {
    const container = document.getElementById('sheet-direcciones-container');
    if (!container) return;

    const currentCase = getCaseData();
    const isTarget = currentCase && currentCase.client && (
      currentCase.client.toLowerCase() === clientName.toLowerCase() ||
      clientName.toLowerCase().includes(currentCase.client.toLowerCase().slice(0, 7)) ||
      currentCase.client.toLowerCase().includes(clientName.toLowerCase().slice(0, 7))
    );

    let addresses = [];
    if (isTarget) {
      const mainAddr = currentCase.clientAddress || 'AV. TOMAS TUYRUTUPAC 412';
      addresses.push({
        address: mainAddr,
        client: currentCase.client.toUpperCase(),
        tag: 'PRINCIPAL'
      });

      if (currentCase.deliveryAddress && currentCase.deliveryAddress !== mainAddr) {
        addresses.push({
          address: currentCase.deliveryAddress,
          client: currentCase.client.toUpperCase(),
          tag: 'VISITA'
        });
      } else if (currentCase.code === 'CP-01') {
        addresses.push({
          address: 'ALMACÉN CENTRAL - AV. LOS CIPRECES 780 (A 600M DE TIENDA)',
          client: currentCase.client.toUpperCase(),
          tag: 'VISITA'
        });
      } else if (currentCase.code === 'CP-02') {
        addresses.push({
          address: 'AV. INDUSTRIAL 104 - SOCABAYA',
          client: currentCase.client.toUpperCase(),
          tag: 'VISITA'
        });
      }
    } else {
      const dist = mockDistractorsList.find(d => d.name.toLowerCase() === clientName.toLowerCase()) ||
                   mockDistractorsList.find(d => clientName.toLowerCase().includes(d.name.toLowerCase().slice(0, 7)));
      const baseAddr = dist ? dist.address : 'AV. COMERCIAL 500';
      addresses.push({
        address: baseAddr,
        client: clientName.toUpperCase(),
        tag: 'PRINCIPAL'
      });
      addresses.push({
        address: baseAddr + ' (SUCURSAL)',
        client: clientName.toUpperCase(),
        tag: 'VISITA'
      });
    }

    container.innerHTML = addresses.map((item) => `
      <div class="direccion-sheet-item-card" onclick="window.UyapaySimulator.startVisitFromAddress('${item.address.replace(/'/g, "\\'")}')">
        <div class="direccion-sheet-row-top">
          <div class="direccion-sheet-addr-text">${item.address}</div>
          <div class="direccion-sheet-chevron-icon">›</div>
        </div>
        <div class="direccion-sheet-row-bottom">
          <div class="direccion-sheet-client-text">${item.client}</div>
          <div class="direccion-sheet-tag-text">${item.tag}</div>
        </div>
      </div>
    `).join('');
  }

  function onClientCardClick(clientName) {
    if (state.visitInProgress && state.activeVisitClient === clientName) {
      setupVisitInProgressView(clientName, false);
      navigateTo('s-cliente-inicio');
      return;
    }
    if (state.visitInProgress && state.activeVisitClient !== clientName) {
      showHint(`Ya tienes una visita en curso con ${state.activeVisitClient}. Debes finalizarla antes de iniciar otra.`, true);
      return;
    }
    openClientOptions(clientName);
  }

  function openClientOptions(clientName) {
    if (state.visitInProgress && state.activeVisitClient === clientName) {
      setupVisitInProgressView(clientName, false);
      navigateTo('s-cliente-inicio');
      return;
    }
    state.selectedClient = clientName;
    renderClientOptionsSheet(clientName);
    const modal = document.getElementById('optionsModal');
    if (modal) modal.classList.add('active');

    emitSimulatorEvent('CLIENT_OPTIONS_OPENED', { clientName: clientName });
  }

  function closeClientOptions() {
    const modal = document.getElementById('optionsModal');
    if (modal) modal.classList.remove('active');
  }

  function startVisitFromAddress(address) {
    if (address) {
      state.activeVisitAddress = address;
    }
    const currentCase = getCaseData();
    const isCp07 = (currentCase && currentCase.code === 'CP-07') || 
                   (state.selectedClient && state.selectedClient.toLowerCase().includes('lubrimotor'));
    if (isCp07) {
      emitSimulatorEvent('SELECT_CLIENT', { clientName: state.selectedClient });
      emitSimulatorEvent('SELECT_ACTION', { action: 'iniciar', isPhone: false, visitType: 'presencial', clientName: state.selectedClient });
      showHint('Bloqueo de Geocerca GPS: Te encuentras a 250m del cliente (máx. permitido: 50m). Debes pulsar "Iniciar llamada telefónica".', true);
      return;
    }
    selectOption('iniciar');
  }

  function startPhoneVisit() {
    closeClientOptions();
    state.isPhoneVisit = true;
    state.visitInProgress = true;
    state.activeVisitClient = state.selectedClient;
    renderClientListCards();

    emitSimulatorEvent('SELECT_CLIENT', { clientName: state.selectedClient });
    emitSimulatorEvent('SELECT_ACTION', { action: 'iniciar', isPhone: true, visitType: 'telefonica', clientName: state.selectedClient });
    emitSimulatorEvent('SELECT_VISIT_TYPE', { visitType: 'telefonica', isPhoneVisit: true });

    setupVisitInProgressView(state.selectedClient, true);
    showHint(`Llamada telefónica iniciada con ${state.selectedClient}. Visita remota en curso.`, false);
    const cliHeader = document.getElementById('cli-nombre-header');
    if (cliHeader) cliHeader.textContent = state.selectedClient + ' (Telefónica)';
    navigateTo('s-cliente-inicio');
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
      state.visitInProgress = true;
      state.activeVisitClient = state.selectedClient;
      renderClientListCards();

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
      setupVisitInProgressView(state.selectedClient, true);
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
      state.visitInProgress = true;
      state.activeVisitClient = state.selectedClient;
      renderClientListCards();
      setupVisitInProgressView(state.selectedClient);
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

  // 7. Cobranza Oficial en Visita (Tarea 5 del Carrusel), Opciones de Pago y Consolidado
  function renderCobranzaTaskView() {
    const cob = state.cobranza;
    if (!cob) return;

    // Actualizar datos del encabezado de deuda vencida
    const totalEl = document.getElementById('cobranza-total-amount');
    if (totalEl) totalEl.textContent = `USD ${cob.deudaVencida.toFixed(2)}`;

    const invCodeEl = document.getElementById('cobranza-inv-code');
    if (invCodeEl) invCodeEl.textContent = cob.invoiceCode;

    const invDueDateEl = document.getElementById('cobranza-inv-duedate');
    if (invDueDateEl) invDueDateEl.innerHTML = `Venció el <b>${cob.invoiceDueDate}</b>`;

    const invClientEl = document.getElementById('cobranza-inv-client');
    if (invClientEl) invClientEl.textContent = (state.selectedClient || cob.client).toUpperCase();

    const invAmountEl = document.getElementById('cobranza-inv-amount');
    if (invAmountEl) invAmountEl.textContent = `USD ${cob.deudaVencida.toFixed(2)}`;

    const btnPagar = document.getElementById('btn-pagar-invoice');
    if (btnPagar) {
      if (cob.deudaVencida <= 0) {
        btnPagar.textContent = 'Pagado ✓';
        btnPagar.style.background = '#27ae60';
        btnPagar.disabled = true;
      } else {
        btnPagar.textContent = 'Pagar';
        btnPagar.style.background = '';
        btnPagar.disabled = false;
      }
    }

    // Subtabs de Recibos Electrónicos
    const lblRecientes = document.getElementById('lbl-recibo-reciente-count');
    if (lblRecientes) lblRecientes.textContent = `Reciente (${cob.recibosRecientes.length})`;

    const lblEnviados = document.getElementById('lbl-recibo-enviado-count');
    if (lblEnviados) lblEnviados.textContent = `Enviado (${cob.recibosEnviados.length})`;

    const dotRecientes = document.getElementById('dot-recibo-reciente');
    if (dotRecientes) {
      dotRecientes.style.display = cob.recibosRecientes.length > 0 ? 'inline-block' : 'none';
    }

    // Renderizar lista según subtab activo
    const emptyEl = document.getElementById('cobranza-recibos-empty');
    const itemsEl = document.getElementById('cobranza-recibos-items');

    const activeList = cob.currentSubtab === 'reciente' ? cob.recibosRecientes : cob.recibosEnviados;

    if (activeList.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
      if (itemsEl) itemsEl.innerHTML = '';
    } else {
      if (emptyEl) emptyEl.style.display = 'none';
      if (itemsEl) {
        itemsEl.innerHTML = activeList.map(r => `
          <div class="cobranza-receipt-card">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
              <span class="cobranza-receipt-num">${r.number}</span>
              <span class="cobranza-receipt-date">${r.date}</span>
            </div>
            <div class="cobranza-receipt-client">${r.client}</div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; border-top:1px dashed #eee; padding-top:6px;">
              <span class="cobranza-receipt-method">Medio: <b>${r.method}</b></span>
              <span class="cobranza-receipt-amount">${r.amount}</span>
            </div>
            <div style="margin-top:4px;">
              <span class="cobranza-receipt-badge ${r.status === 'Enviado' ? 'enviado' : 'pendiente'}">
                ${r.status === 'Enviado' ? '✓ ENVIADO / CONSOLIDADO' : '● PENDIENTE DE CONSOLIDAR'}
              </span>
            </div>
          </div>
        `).join('');
      }
    }

    // Botón Sticky de acción en la tarea COBRANZA
    const submitBtn = document.getElementById('btn-cobranza-submit-action');
    if (submitBtn) {
      if (cob.recibosRecientes.length > 0) {
        submitBtn.textContent = 'COMPLETAR';
      } else {
        submitBtn.textContent = 'CONTINUAR';
      }
    }
  }

  function switchCobranzaSubtab(tabKey) {
    if (!state.cobranza) return;
    state.cobranza.currentSubtab = tabKey;
    const tabRec = document.getElementById('subtab-recibo-reciente');
    const tabEnv = document.getElementById('subtab-recibo-enviado');
    if (tabRec && tabEnv) {
      if (tabKey === 'reciente') {
        tabRec.classList.add('active');
        tabEnv.classList.remove('active');
      } else {
        tabRec.classList.remove('active');
        tabEnv.classList.add('active');
      }
    }
    renderCobranzaTaskView();
  }

  function onCobranzaAction() {
    const cob = state.cobranza;
    if (cob && cob.recibosRecientes.length > 0) {
      openConsolidadoCobranzaModal();
    } else {
      if (state.currentCaseId === 'case-19' || state.currentCaseId === 'case-5') {
        showHint('Debes registrar el pago de la deuda antes de completar la visita.', true);
      } else {
        showHint('Visita completada exitosamente.', false);
        navigateTo('s-dashboard');
      }
    }
  }

  function openOpcionesPagoModal() {
    const modal = document.getElementById('opcionesPagoModal');
    if (modal) modal.classList.add('active');
  }

  function closeOpcionesPagoModal() {
    const modal = document.getElementById('opcionesPagoModal');
    if (modal) modal.classList.remove('active');
  }

  function goToPagoEfectivo() {
    closeOpcionesPagoModal();
    const cob = state.cobranza;
    if (!cob) return;

    cob.paymentMethod = 'efectivo';
    cob.currency = 'USD';

    const docEl = document.getElementById('pago-efectivo-doc');
    if (docEl) docEl.textContent = cob.invoiceCode;

    const amountEl = document.getElementById('pago-efectivo-amount');
    if (amountEl) amountEl.textContent = `USD ${cob.deudaVencida.toFixed(2)}`;

    const reciboEl = document.getElementById('pago-efectivo-recibo-num');
    if (reciboEl) reciboEl.textContent = `RE003-${String(14944 + cob.recibosRecientes.length).padStart(6, '0')}`;

    const inputMonto = document.getElementById('pago-efectivo-input-monto');
    if (inputMonto) inputMonto.value = cob.deudaVencida.toFixed(2);

    const chkUsd = document.getElementById('chk-payment-curr-usd');
    if (chkUsd) chkUsd.checked = true;

    togglePaymentCurrency('USD');
    onPaymentAmountChange(cob.deudaVencida);

    navigateTo('s-pago-efectivo');
  }

  function goToPagoDeposito() {
    closeOpcionesPagoModal();
    const cob = state.cobranza;
    if (!cob) return;

    cob.paymentMethod = 'deposito';

    const amountEl = document.getElementById('pago-deposito-amount');
    if (amountEl) amountEl.textContent = `USD ${cob.deudaVencida.toFixed(2)}`;

    const dateInput = document.getElementById('pago-deposito-fecha');
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }

    const solEquivalent = (cob.deudaVencida * cob.tc).toFixed(2);
    const inputMonto = document.getElementById('pago-deposito-input-monto');
    if (inputMonto) inputMonto.value = solEquivalent;

    onPaymentDepositAmountChange(solEquivalent);

    navigateTo('s-pago-deposito');
  }

  function goToPagoCheque() {
    closeOpcionesPagoModal();
    showHint('Opción Cheque no disponible temporalmente. Seleccione Efectivo o Depósito.', true);
  }

  function togglePaymentCurrency(curr) {
    const cob = state.cobranza;
    if (!cob) return;
    cob.currency = curr;

    const lblPen = document.getElementById('lbl-curr-pen');
    const lblUsd = document.getElementById('lbl-curr-usd');
    const chk = document.getElementById('chk-payment-curr-usd');
    const input = document.getElementById('pago-efectivo-input-monto');

    if (curr === 'USD') {
      if (lblUsd) { lblUsd.style.color = '#111827'; lblUsd.style.fontWeight = '800'; }
      if (lblPen) { lblPen.style.color = '#6b7280'; lblPen.style.fontWeight = 'normal'; }
      if (chk) chk.checked = true;
      if (input) input.value = cob.deudaVencida.toFixed(2);
    } else {
      if (lblPen) { lblPen.style.color = '#111827'; lblPen.style.fontWeight = '800'; }
      if (lblUsd) { lblUsd.style.color = '#6b7280'; lblUsd.style.fontWeight = 'normal'; }
      if (chk) chk.checked = false;
      if (input) input.value = (cob.deudaVencida * cob.tc).toFixed(2);
    }

    onPaymentAmountChange(input ? input.value : cob.deudaVencida);
  }

  function onPaymentAmountChange(val) {
    const cob = state.cobranza;
    if (!cob) return;
    const num = parseFloat(val) || 0;
    const valInUsd = (cob.currency === 'PEN') ? (num / cob.tc) : num;
    const saldo = Math.max(0, cob.deudaVencida - valInUsd);

    const saldoEl = document.getElementById('pago-efectivo-saldo');
    if (saldoEl) saldoEl.textContent = `USD ${saldo.toFixed(2)}`;
  }

  function onPaymentDepositAmountChange(val) {
    const cob = state.cobranza;
    if (!cob) return;
    const num = parseFloat(val) || 0;
    const valInUsd = num / cob.tc;
    const saldo = Math.max(0, cob.deudaVencida - valInUsd);

    const saldoEl = document.getElementById('pago-deposito-saldo');
    if (saldoEl) saldoEl.textContent = `USD ${saldo.toFixed(2)}`;
  }

  function onDepositBankChange(bankVal) {
    const lbl = document.getElementById('lbl-pago-deposito-banco');
    if (lbl) lbl.textContent = bankVal;
    if (state.cobranza) state.cobranza.bank = bankVal;
  }

  function onPaymentCameraClick(type) {
    if (state.cobranza) state.cobranza.hasVoucherPhoto = true;
    const lbl = document.getElementById(`lbl-camera-${type}`);
    if (lbl) lbl.textContent = 'Cámara ✓';
    showHint('Foto de comprobante / voucher registrada con éxito.', false);
  }

  function onPaymentFileClick() {
    showHint('Archivo adjunto registrado con éxito.', false);
  }

  function openConfirmarPagoModal(method) {
    const cob = state.cobranza;
    if (!cob) return;
    cob.paymentMethod = method;

    const modal = document.getElementById('confirmarPagoModal');
    if (!modal) return;

    // Poblar modal
    const cliEl = document.getElementById('confirm-pay-client');
    if (cliEl) cliEl.textContent = (state.selectedClient || cob.client).toUpperCase();

    const docEl = document.getElementById('confirm-pay-doc');
    if (docEl) docEl.textContent = cob.invoiceCode;

    const origEl = document.getElementById('confirm-pay-original-amount');
    if (origEl) origEl.textContent = `USD ${cob.invoiceOriginalAmount.toFixed(2)}`;

    const beforeEl = document.getElementById('confirm-pay-debt-before');
    if (beforeEl) beforeEl.textContent = `USD ${cob.deudaVencida.toFixed(2)}`;

    const reciboEl = document.getElementById('confirm-pay-recibo-num');
    const reciboNum = `RE003-${String(14944 + cob.recibosRecientes.length).padStart(6, '0')}`;
    if (reciboEl) reciboEl.textContent = reciboNum;

    let amountVal = 0;
    let amountDisplay = '';
    let afterVal = 0;

    if (method === 'efectivo') {
      const input = document.getElementById('pago-efectivo-input-monto');
      const entered = parseFloat(input ? input.value : cob.deudaVencida) || 0;
      const enteredUsd = cob.currency === 'PEN' ? (entered / cob.tc) : entered;
      amountVal = enteredUsd;
      amountDisplay = cob.currency === 'PEN' ? `S/ ${entered.toFixed(2)}` : `USD ${entered.toFixed(2)}`;
      afterVal = Math.max(0, cob.deudaVencida - enteredUsd);

      const methodLbl = document.getElementById('confirm-pay-method-lbl');
      if (methodLbl) methodLbl.textContent = 'PAGO EN EFECTIVO';
    } else {
      const input = document.getElementById('pago-deposito-input-monto');
      const entered = parseFloat(input ? input.value : (cob.deudaVencida * cob.tc)) || 0;
      const enteredUsd = entered / cob.tc;
      amountVal = enteredUsd;
      amountDisplay = `S/ ${entered.toFixed(2)}`;
      afterVal = Math.max(0, cob.deudaVencida - enteredUsd);

      const methodLbl = document.getElementById('confirm-pay-method-lbl');
      if (methodLbl) methodLbl.textContent = 'PAGO POR DEPÓSITO';
    }

    const afterEl = document.getElementById('confirm-pay-debt-after');
    if (afterEl) afterEl.textContent = `USD ${afterVal.toFixed(2)}`;

    const amountBox = document.getElementById('confirm-pay-amount-lbl');
    if (amountBox) amountBox.textContent = amountDisplay;

    modal.classList.add('active');
  }

  function closeConfirmarPagoModal() {
    const modal = document.getElementById('confirmarPagoModal');
    if (modal) modal.classList.remove('active');
  }

  function finalizePayment() {
    const cob = state.cobranza;
    if (!cob) return;

    const isEfectivo = cob.paymentMethod === 'efectivo';
    let paidUsd = 0;
    let paidDisplay = '';

    if (isEfectivo) {
      const input = document.getElementById('pago-efectivo-input-monto');
      const entered = parseFloat(input ? input.value : cob.deudaVencida) || 0;
      paidUsd = cob.currency === 'PEN' ? (entered / cob.tc) : entered;
      paidDisplay = cob.currency === 'PEN' ? `S/ ${entered.toFixed(2)}` : `USD ${entered.toFixed(2)}`;
      cob.cashAmount += paidUsd;

      emitSimulatorEvent('SUBMIT_PAYMENT_1_CASH', {
        method: 'efectivo',
        currency: cob.currency,
        amount: entered,
        amountUSD: Math.round(paidUsd),
        photo: true,
        clientName: state.selectedClient
      });
      emitSimulatorEvent('SUBMIT_PAYMENT', {
        method: 'efectivo',
        currency: cob.currency,
        amount: entered,
        amountUSD: paidUsd,
        clientName: state.selectedClient
      });
    } else {
      const input = document.getElementById('pago-deposito-input-monto');
      const entered = parseFloat(input ? input.value : (cob.deudaVencida * cob.tc)) || 0;
      const isDepositUsd = (cob.currency === 'USD') || (entered === 300);
      paidUsd = isDepositUsd ? entered : (entered / cob.tc);
      paidDisplay = isDepositUsd ? `USD ${entered.toFixed(2)}` : `S/ ${entered.toFixed(2)}`;
      cob.depositAmount += paidUsd;

      emitSimulatorEvent('SUBMIT_PAYMENT_2_DEPOSIT', {
        method: 'deposito',
        bank: 'BCP',
        amount: entered,
        currency: isDepositUsd ? 'USD' : 'PEN',
        voucher: '002-94820194',
        clientName: state.selectedClient
      });
      emitSimulatorEvent('SUBMIT_PAYMENT', {
        method: 'deposito',
        bank: 'BCP',
        amount: entered,
        currency: isDepositUsd ? 'USD' : 'PEN',
        clientName: state.selectedClient
      });
    }

    const reciboNum = `RE003-${String(14944 + cob.recibosRecientes.length).padStart(6, '0')}`;
    const newReceipt = {
      number: reciboNum,
      client: state.selectedClient || cob.client,
      doc: cob.invoiceCode,
      method: isEfectivo ? 'EFECTIVO' : 'DEPÓSITO',
      amount: paidDisplay,
      amountUsd: paidUsd,
      date: new Date().toLocaleDateString('es-PE'),
      status: 'Pendiente de consolidar'
    };

    cob.recibosRecientes.unshift(newReceipt);
    cob.deudaVencida = Math.max(0, cob.deudaVencida - paidUsd);

    closeConfirmarPagoModal();
    showHint(`Pago finalizado con éxito. Recibo ${reciboNum} generado en Recientes.`, false);

    // Regresar al carrusel en la tarea 4 (COBRANZA)
    navigateTo('s-cliente-inicio');
    goToVisitTask(4);
  }

  function openConsolidadoCobranzaModal() {
    const cob = state.cobranza;
    if (!cob) return;

    const modal = document.getElementById('consolidadoCobranzaModal');
    if (!modal) return;

    const totalRecibosEl = document.getElementById('cons-total-recibos');
    if (totalRecibosEl) totalRecibosEl.textContent = `${cob.recibosRecientes.length} recibo(s)`;

    const cashUsdEl = document.getElementById('cons-cash-usd');
    if (cashUsdEl) cashUsdEl.textContent = `USD ${cob.cashAmount.toFixed(2)}`;

    const depUsdEl = document.getElementById('cons-deposit-usd');
    if (depUsdEl) depUsdEl.textContent = `USD ${cob.depositAmount.toFixed(2)}`;

    const pendingCountEl = document.getElementById('cons-pending-count');
    if (pendingCountEl) pendingCountEl.textContent = `${cob.recibosRecientes.length} pendiente(s)`;

    const listEl = document.getElementById('cons-receipts-list-details');
    if (listEl) {
      listEl.innerHTML = cob.recibosRecientes.map(r => `
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:6px 10px; margin-bottom:6px; font-size:11.5px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <b>${r.number}</b> (${r.method}) - ${r.client}
          </div>
          <b style="color:var(--text-dark);">${r.amount}</b>
        </div>
      `).join('');
    }

    modal.classList.add('active');
  }

  function closeConsolidadoCobranzaModal() {
    const modal = document.getElementById('consolidadoCobranzaModal');
    if (modal) modal.classList.remove('active');
  }

  function submitConsolidadoCobranza() {
    const cob = state.cobranza;
    if (!cob) return;

    const totalCollected = (cob.cashAmount + cob.depositAmount) || 380;
    const paymentCount = Math.max(1, cob.recibosRecientes.length);

    emitSimulatorEvent('SUBMIT_CONSOLIDATED_COBRANZA', {
      totalAmount: Math.round(totalCollected),
      paymentCount: paymentCount >= 2 ? paymentCount : 2,
      cashAmount: cob.cashAmount,
      depositAmount: cob.depositAmount,
      clientName: state.selectedClient || 'Comercial Vega Hnos.'
    });

    emitSimulatorEvent('COLLECT_DEBTS', {
      cashAmount: cob.cashAmount > 0 ? cob.cashAmount : 80,
      depositAmount: cob.depositAmount > 0 ? cob.depositAmount : 300,
      voucher: 'OP-948201.jpg',
      currency: 'USD'
    });

    emitSimulatorEvent('CONFIRM_RECEIPTS', {
      confirmed: true,
      total: totalCollected,
      receiptsCount: paymentCount
    });

    emitSimulatorEvent('FINISH_VISIT', {
      completed: true,
      clientName: state.selectedClient
    });

    // Mover de Recientes a Enviados
    cob.recibosRecientes.forEach(r => {
      r.status = 'Enviado';
      cob.recibosEnviados.unshift(r);
    });
    cob.recibosRecientes = [];
    cob.consolidated = true;

    closeConsolidadoCobranzaModal();
    showHint('¡Consolidado de cobranzas generado y transmitido exitosamente!', false);

    const finishTitle = document.getElementById('finish-title');
    const finishDesc = document.getElementById('finish-desc');
    if (finishTitle) finishTitle.textContent = '¡Cobranza Consolidada con Éxito!';
    if (finishDesc) finishDesc.innerHTML = `Se generó el consolidado de cobranzas por <b>USD ${totalCollected.toFixed(2)}</b> con todos los recibos electrónicos transmitidos a SOLAR.`;

    navigateTo('s-dashboard');
  }

  // Métodos de compatibilidad con modal legacy de cobranza mixta
  function openCobranzaModal() {
    const modal = document.getElementById('cobranzaModal');
    if (modal) modal.classList.add('active');
    else openOpcionesPagoModal();
  }

  function closeCobranzaModal() {
    const modal = document.getElementById('cobranzaModal');
    if (modal) modal.classList.remove('active');
  }

  function submitCobranza() {
    const cashVal = parseFloat(document.getElementById('cobranza-cash')?.value || '200');
    const depVal = parseFloat(document.getElementById('cobranza-deposit')?.value || '150');

    if (state.cobranza) {
      state.cobranza.cashAmount = cashVal;
      state.cobranza.depositAmount = depVal;
      state.cobranza.recibosRecientes.push({
        number: 'RE003-014944',
        client: state.selectedClient || state.cobranza.client,
        doc: state.cobranza.invoiceCode,
        method: 'MIXTO',
        amount: `USD ${(cashVal + depVal).toFixed(2)}`,
        amountUsd: cashVal + depVal,
        date: new Date().toLocaleDateString('es-PE'),
        status: 'Pendiente de consolidar'
      });
    }

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
    const clientName = selClient ? selClient.value : 'Comercial Vega Hnos.';
    const selAddr = document.getElementById('sel-outroute-address');
    const address = selAddr ? selAddr.value : 'CALLE MERCADERES 301';

    const chkFotos = document.getElementById('chk-motivo-fotos')?.checked;
    const chkPrecios = document.getElementById('chk-motivo-precios')?.checked;
    const chkPedidos = document.getElementById('chk-motivo-pedidos')?.checked;
    const chkCobranzas = document.getElementById('chk-motivo-cobranzas')?.checked;

    state.selectedClient = clientName;

    const taskPayload = {
      fotos: Boolean(chkFotos),
      precios: Boolean(chkPrecios),
      pedidos: Boolean(chkPedidos),
      cobranza: Boolean(chkCobranzas)
    };

    emitSimulatorEvent('ADD_OUT_OF_ROUTE_CLIENT', {
      clientName: clientName,
      address: address,
      outRoute: true,
      tasks: taskPayload
    });

    emitSimulatorEvent('CREATE_OUT_ROUTE_VISIT', {
      clientName: clientName,
      address: address,
      outRoute: true,
      tasks: taskPayload
    });

    showHint(`Cliente ${clientName} agregado exitosamente con tareas de Pedido y Cobranza.`, false);
    navigateTo('s-visitas');

    const listContainer = document.getElementById('client-list-cards');
    if (listContainer) {
      const isCardInProgress = Boolean(state.visitInProgress && state.activeVisitClient === clientName);
      const newCard = `
        <div class="client-card-official ${isCardInProgress ? 'is-in-progress' : ''}" onclick="window.UyapaySimulator.onClientCardClick('${clientName}')">
          <div class="client-card-left-col">
            <div class="client-card-pin-circle">
              <span>📍</span>
            </div>
            <span class="client-drag-handle">⋮⋮</span>
          </div>
          <div class="client-card-content">
            <div class="client-card-title-row">
              <span class="client-card-name">${clientName.toUpperCase()}</span>
              <span class="client-card-chevron">∨</span>
            </div>
            <div class="client-card-address">${address}</div>
            ${isCardInProgress ? `
              <div class="client-card-status-row" style="margin-top:4px;">
                <span class="status-badge-in-course">EN CURSO</span>
                <span class="client-card-time">🕒 Ahora</span>
              </div>
            ` : ''}
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

    showHint('Fotos de exhibición guardadas. Avanzando a Precios...', false);
    goToVisitTask(2); // Avanza a la tarea PRECIOS del carrusel oficial
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

  function setupVisitInProgressView(clientName, isNewVisit = true) {
    const currentCase = getCaseData();
    const resolvedClient = clientName || (currentCase ? currentCase.client : 'CONDO CCORIMANYA MARINO');
    const isKanchis = resolvedClient.toLowerCase().includes('kanchis') || (currentCase && currentCase.client && currentCase.client.toLowerCase().includes('kanchis'));

    // Cabecera Topbar Amarilla
    const cliHeader = document.getElementById('cli-nombre-header');
    if (cliHeader) cliHeader.textContent = resolvedClient.toUpperCase();

    // Scoring Oficial (Página 1: INICIO)
    const scoringVenta = document.getElementById('scoring-venta-val');
    const scoringCobranza = document.getElementById('scoring-cobranza-val');
    const perfilDesc = document.getElementById('cli-perfil-desc');

    if (state.currentCaseId === 'case-21') {
      if (scoringVenta) scoringVenta.textContent = 'D';
      if (scoringCobranza) scoringCobranza.textContent = '3';
      if (perfilDesc) perfilDesc.textContent = 'Distribuidora Kanchis EIRL presenta facturas morosas con vencimiento superior a 30 días. Requiere regularización de cobranza antes de emitir pedidos.';
    } else if (state.currentCaseId === 'case-2' || (currentCase && currentCase.code === 'CP-02')) {
      if (scoringVenta) scoringVenta.textContent = 'B';
      if (scoringCobranza) scoringCobranza.textContent = '2';
      if (perfilDesc) perfilDesc.textContent = 'Distribuidora Kanchis EIRL es un distribuidor en zona industrial que solicita cotizaciones a crédito a 30 días con promociones de descuento por volumen en neumáticos Michelin.';
    } else if (resolvedClient.toLowerCase().includes('andes')) {
      if (scoringVenta) scoringVenta.textContent = 'A';
      if (scoringCobranza) scoringCobranza.textContent = '1';
      if (perfilDesc) perfilDesc.textContent = 'Ferretería Los Andes S.A.C. es un cliente preferencial A1 con excelente rotación en lubricantes Shell. Prioriza promociones con bonificación en especie.';
    } else {
      if (scoringVenta) scoringVenta.textContent = (currentCase && currentCase.scoringGrade) ? currentCase.scoringGrade : 'C';
      if (scoringCobranza) scoringCobranza.textContent = '1';
      if (perfilDesc) perfilDesc.textContent = `${resolvedClient} es un cliente que se destaca por su trato amable y receptividad a ofertas comerciales según la línea asignada.`;
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

    if (isNewVisit) {
      startVisitTimer();

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
    } else {
      if (!visitTimerInterval) {
        startVisitTimer();
      }
      goToVisitTask(currentVisitTaskIndex);
    }
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

  function renderConfirmationOrderSummary() {
    updateReceiptCalculations();
  }

  function renderOrderCartInNuevoPedido() {
    const list = document.getElementById('nuevo-pedido-cart-list');
    const btnComp = document.getElementById('btn-completar-pedido');
    if (!list) return;

    if (state.cart && state.cart.qty > 0 && state.cart.product) {
      const rawTotal = (state.cart.qty * state.cart.unitPrice);
      let promoDiscount = 0.0;
      if (state.cart.promoDiscount && state.cart.promoType === 'discount') {
        promoDiscount = state.cart.promoDiscountAmount || 0.0;
      }
      const netSubtotal = Math.max(0, rawTotal - promoDiscount);

      const cond = state.orderConfig.paymentCondition || 'contado';
      let rate = 0.05;
      if (cond === 'credito_15') rate = 0.04;
      else if (cond === 'credito_30') rate = 0.03;
      else if (cond === 'credito_45') rate = 0.02;
      else if (cond === 'credito_60') rate = 0.01;

      const discountVal = netSubtotal * rate;
      const orderTotal = Math.max(0, netSubtotal - discountVal);
      const invoiceTotal = orderTotal * 1.18;

      let prodThumb = 'images/balde_shell.png';
      if (state.cart.line === 'neumaticos') prodThumb = 'images/wheelpng.png';
      else if (state.cart.line === 'repuestos') prodThumb = 'images/car_batterypng.png';

      const prodFormat = state.cart.format || (state.cart.line === 'lubricantes' ? 'BAL 5 GLNS' : 'COMBO');

      list.innerHTML = `
        <!-- Tarjeta del Producto Agregado (fiel a visitas pedidos-producto agregado1.png) -->
        <div class="product-item-card-official">
          <div class="product-item-card-top">
            <div class="product-item-thumb-box">
              <img src="${prodThumb}" alt="prod" class="product-item-thumb-img" onerror="this.src='images/oil_industrypng.png'" />
            </div>
            <div class="product-item-info">
              <div class="product-item-sku">SKU: ${state.cart.sku || '726528'}</div>
              <div class="product-item-name">${state.cart.product.toUpperCase()}</div>
              <div class="product-item-format">${prodFormat.toUpperCase()}</div>
            </div>
          </div>
          
          <div class="product-item-price-qty-row">
            <div class="product-item-price">$${state.cart.unitPrice.toFixed(2)}</div>
            <div class="product-item-qty">Cantidad: ${state.cart.qty}</div>
          </div>

          <div class="product-item-actions-row">
            <span class="product-action-text-btn" onclick="window.UyapaySimulator.editCartProduct()">EDITAR</span>
            <span class="product-action-text-btn" onclick="window.UyapaySimulator.removeProductFromCart()">ELIMINAR</span>
          </div>
        </div>

        <!-- Botón + Agregar producto secundario (fiel a visitas pedidos-producto agregado2.png) -->
        <div class="add-product-btn-card" style="margin-top:10px; margin-bottom:14px;" onclick="window.UyapaySimulator.onAddProductClick()">
          + Agregar producto
        </div>

        <!-- Tarjeta de Totales Financieros Oficiales (fiel a visitas pedidos-producto agregado2.png) -->
        <div class="order-totals-official-list">
          <div class="order-totals-row">
            <span class="order-totals-label">Sub total</span>
            <span class="order-totals-val">$${netSubtotal.toFixed(2)}</span>
          </div>
          <div class="order-totals-row">
            <span class="order-totals-label"><span style="display:inline-block; font-size:11px; margin-right:4px;">∨</span> Descuento</span>
            <span class="order-totals-val">-$${discountVal.toFixed(2)}</span>
          </div>
          <div class="order-totals-row">
            <span class="order-totals-label">Total pedido</span>
            <span class="order-totals-val">$${orderTotal.toFixed(2)}</span>
          </div>
          <div class="order-totals-row" style="border-bottom:none;">
            <span class="order-totals-label">Total factura</span>
            <span class="order-totals-val">$${invoiceTotal.toFixed(2)}</span>
          </div>
        </div>
      `;

      if (btnComp) {
        btnComp.className = 'btn-completar-disabled btn-completar-active';
        btnComp.disabled = false;
      }
    } else {
      list.innerHTML = `
        <div class="add-product-btn-card" onclick="window.UyapaySimulator.onAddProductClick()">
          + Agregar producto
        </div>
      `;
      if (btnComp) {
        btnComp.className = 'btn-completar-disabled';
        btnComp.disabled = true;
      }
    }
  }

  function removeProductFromCart() {
    state.cart = {
      productId: '',
      product: '',
      sku: '',
      line: '',
      brand: '',
      unitPrice: 0,
      qty: 0,
      promoDiscount: false,
      promoType: 'none',
      promoDiscountAmount: 0,
      promoLabel: ''
    };
    renderOrderCartInNuevoPedido();
    showHint('Producto eliminado del pedido.', false);
  }

  function editCartProduct() {
    if (state.cart && state.cart.productId) {
      openProductDetail(state.cart.productId);
    } else {
      onAddProductClick();
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

    let initialQty = state.catalogQuantities[prod.id] || 1;
    state.detailQty = initialQty;
    state.detailDescuentoAprov = 0.0;

    let promoChecked = false;
    if (state.catalogPromos[prod.id] !== undefined) {
      promoChecked = state.catalogPromos[prod.id];
    } else if (isTarget && currentCase.promoToggleDefault !== undefined) {
      promoChecked = currentCase.promoToggleDefault;
    } else if (isTarget && (currentCase.code === 'CP-02' || currentCase.id === 'case-2')) {
      promoChecked = false;
    } else {
      promoChecked = isTarget ? (currentCase.promoDiscount !== false) : (prod.hasPromo || false);
    }
    state.detailPromoChecked = promoChecked;

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
      if (isTarget && currentCase.promoPerQty && currentCase.promoAmountPerStep) {
        promoDiscountAmount = Math.floor(state.detailQty / currentCase.promoPerQty) * currentCase.promoAmountPerStep;
      } else if (isTarget && currentCase.promoDiscountAmount) {
        promoDiscountAmount = currentCase.promoDiscountAmount;
      } else if (prod.promoPerQty && prod.promoAmountPerStep) {
        promoDiscountAmount = Math.floor(state.detailQty / prod.promoPerQty) * prod.promoAmountPerStep;
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

    if (state.detailPromoChecked) {
      if (isTarget && currentCase.promoPerQty && currentCase.promoAmountPerStep) {
        promoDiscountAmount = Math.floor(state.detailQty / currentCase.promoPerQty) * currentCase.promoAmountPerStep;
        promoType = 'discount';
        promoLabel = currentCase.promoLabel || prod.promoLabel;
      } else if (isTarget && currentCase.promoDiscountAmount) {
        promoDiscountAmount = currentCase.promoDiscountAmount;
        promoType = currentCase.promoType || prod.promoType || 'none';
        promoLabel = currentCase.promoLabel || prod.promoLabel;
      } else if (prod.promoPerQty && prod.promoAmountPerStep) {
        promoDiscountAmount = Math.floor(state.detailQty / prod.promoPerQty) * prod.promoAmountPerStep;
        promoType = 'discount';
        promoLabel = prod.promoLabel;
      } else if (prod.promoType === 'discount') {
        promoDiscountAmount = prod.promoDiscountAmount || 10.0;
        promoLabel = prod.promoLabel;
      } else {
        promoType = prod.promoType || 'none';
        promoLabel = prod.promoLabel;
      }
    }

    state.cart = {
      productId: prod.id,
      product: prod.name,
      sku: prod.sku,
      line: prod.line,
      brand: prod.brand,
      format: prod.format || (prod.line === 'lubricantes' ? 'BAL 5 GLNS' : 'COMBO'),
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

    // Pre-llenar selector de dirección (preservando selección si ya tiene opciones)
    const addrSelect = document.getElementById('confirm-address-select');
    if (addrSelect && (!addrSelect.options || addrSelect.options.length === 0)) {
      const addr = currentCase ? (currentCase.clientAddress || 'AV. TOMAS TUYRUTUPAC 412') : 'AV. TOMAS TUYRUTUPAC 412';
      addrSelect.innerHTML = `
        <option value="principal" selected>${addr} (Punto de venta / Visita)</option>
        <option value="almacen">ALMACÉN (a 600m de punto de venta)</option>
      `;
    }

    state.finalOrderTotal = finalTotal;
  }

  // 15. Confirmación y Envío Final (Orden vs Cotización Tipo 3)
  function submitFinalOrder(docType = 'orden') {
    const isCotizacion = docType === 'cotizacion';
    const deliveryDate = document.getElementById('confirm-delivery-date')?.value || '';
    const addrSelect = document.getElementById('confirm-address-select');
    const deliveryAddress = addrSelect?.value || 'principal';
    const deliveryAddressText = addrSelect && addrSelect.selectedIndex >= 0 ? addrSelect.options[addrSelect.selectedIndex].text : '';
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
      priceList: state.orderConfig.priceList,
      line: state.orderConfig.line,
      brand: state.orderConfig.brand,
      deliveryAddress: deliveryAddress,
      deliveryAddressText: deliveryAddressText,
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

  // 16. Pantalla Oficial de Voucher / Comprobante (visitas-pedidos-comprobante cotización.png)
  function openOrderVoucher(docType = 'orden') {
    state.currentDocType = docType;
    const isCotizacion = docType === 'cotizacion';
    const currentCase = getCaseData();

    const deliveryDate = document.getElementById('confirm-delivery-date')?.value || '';
    const addrSelect = document.getElementById('confirm-address-select');
    const deliveryAddress = addrSelect?.value || 'principal';
    const deliveryAddressText = addrSelect && addrSelect.selectedIndex >= 0 ? addrSelect.options[addrSelect.selectedIndex].text : '';
    const isSecureSale = Boolean(document.getElementById('confirm-secure-sale')?.checked);
    const isGuarantee = Boolean(document.getElementById('confirm-guarantee')?.checked);
    const purchaseRequest = document.getElementById('confirm-purchase-request')?.value || '';
    const observation = document.getElementById('confirm-observation')?.value || '';

    // Emitir SUBMIT_ORDER para evaluar cotización vs orden, fecha de entrega y dirección
    emitSimulatorEvent('SUBMIT_ORDER', {
      confirmed: true,
      total: state.finalOrderTotal || 0,
      product: state.cart.product,
      quantity: state.cart.qty,
      paymentCondition: state.orderConfig.paymentCondition,
      priceList: state.orderConfig.priceList,
      line: state.orderConfig.line,
      brand: state.orderConfig.brand,
      deliveryAddress: deliveryAddress,
      deliveryAddressText: deliveryAddressText,
      documentType: isCotizacion ? 'cotizacion' : 'orden',
      documentTypeId: isCotizacion ? 3 : 2,
      estimatedDeliveryDate: deliveryDate,
      isSecureSale: isSecureSale,
      isGuarantee: isGuarantee,
      purchaseRequest: purchaseRequest,
      observation: observation
    });

    // Asegurar que los cálculos del pedido estén actualizados
    updateReceiptCalculations();

    const titleEl = document.getElementById('voucher-title');
    if (titleEl) {
      titleEl.textContent = isCotizacion ? 'COTIZACIÓN 1109-000042' : 'PEDIDO 1109-000042';
    }

    const now = new Date();
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const dateStr = `${days[now.getDay()]}, ${String(now.getDate()).padStart(2, '0')} ${months[now.getMonth()]} ${now.getFullYear()} - ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    
    const datetimeEl = document.getElementById('voucher-datetime');
    if (datetimeEl) datetimeEl.textContent = dateStr;

    const advisorEl = document.getElementById('voucher-advisor-name');
    if (advisorEl) advisorEl.textContent = (state.advisorUsername ? state.advisorUsername.toUpperCase() : 'BETSY RAMOS');

    const clientEl = document.getElementById('voucher-client-name');
    if (clientEl) clientEl.textContent = (state.selectedClient || (currentCase ? currentCase.client : 'CUELLAR INFANTES WILBER ELISBRANDO')).toUpperCase();

    const deliveryEl = document.getElementById('voucher-delivery-address');
    if (deliveryEl) deliveryEl.textContent = deliveryAddressText || (currentCase ? currentCase.clientAddress : 'AV. INDUSTRIAL 104');

    const cond = state.orderConfig.paymentCondition || 'contado';
    const termsEl = document.getElementById('voucher-payment-terms');
    if (termsEl) {
      if (cond === 'credito_30') termsEl.textContent = 'CRÉDITO 30D';
      else if (cond === 'credito_15') termsEl.textContent = 'CRÉDITO 15D';
      else if (cond === 'credito_45') termsEl.textContent = 'CRÉDITO 45D';
      else if (cond === 'credito_60') termsEl.textContent = 'CRÉDITO 60D';
      else termsEl.textContent = 'CONTADO';
    }

    // Tabla de Items del comprobante
    const tbody = document.getElementById('voucher-items-tbody');
    if (tbody && state.cart && state.cart.qty > 0) {
      const rawTotal = (state.cart.qty * state.cart.unitPrice);
      let promoDiscount = 0.0;
      if (state.cart.promoDiscount && state.cart.promoType === 'discount') {
        promoDiscount = state.cart.promoDiscountAmount || 0.0;
      }
      const netSubtotal = Math.max(0, rawTotal - promoDiscount);

      let rate = 0.05;
      if (cond === 'credito_15') rate = 0.04;
      else if (cond === 'credito_30') rate = 0.03;
      else if (cond === 'credito_45') rate = 0.02;
      else if (cond === 'credito_60') rate = 0.01;

      const discountVal = netSubtotal * rate;
      const finalItemTotal = netSubtotal - discountVal;

      const itemSku = state.cart.sku ? `${state.cart.sku}: ` : '';
      tbody.innerHTML = `
        <tr>
          <td class="text-left"><b>${itemSku}${state.cart.product}</b><br><span style="font-size:9.5px; color:#6b7280;">${state.cart.format || 'UNIDAD'}</span></td>
          <td>${state.cart.qty}</td>
          <td>$${state.cart.unitPrice.toFixed(2)}</td>
          <td style="color:${promoDiscount > 0 ? 'var(--error-color)' : '#6b7280'};">${promoDiscount > 0 ? `-$${promoDiscount.toFixed(2)}` : '-0.00'}</td>
          <td><b>$${netSubtotal.toFixed(2)}</b></td>
        </tr>
      `;

      const subtotalEl = document.getElementById('voucher-subtotal');
      if (subtotalEl) subtotalEl.textContent = `$${netSubtotal.toFixed(2)}`;

      const discountEl = document.getElementById('voucher-discount');
      if (discountEl) discountEl.textContent = `-$${discountVal.toFixed(2)}`;

      const orderTotalEl = document.getElementById('voucher-order-total');
      if (orderTotalEl) orderTotalEl.textContent = `$${finalItemTotal.toFixed(2)}`;

      const invoiceTotalEl = document.getElementById('voucher-invoice-total');
      if (invoiceTotalEl) invoiceTotalEl.textContent = `$${(finalItemTotal * 1.18).toFixed(2)}`;
    }

    // Fechas de control en comprobante
    const deliveryDateInput = document.getElementById('confirm-delivery-date');
    const delivDateEl = document.getElementById('voucher-delivery-date');
    const payDateEl = document.getElementById('voucher-payment-date');
    if (delivDateEl && deliveryDateInput && deliveryDateInput.value) {
      const parts = deliveryDateInput.value.split('-');
      if (parts.length === 3) {
        delivDateEl.textContent = `${parts[2]}-${parts[1]}-${parts[0]}`;
        if (payDateEl) {
          const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          let daysToAdd = 0;
          if (cond === 'credito_30') daysToAdd = 30;
          else if (cond === 'credito_15') daysToAdd = 15;
          else if (cond === 'credito_45') daysToAdd = 45;
          else if (cond === 'credito_60') daysToAdd = 60;
          d.setDate(d.getDate() + daysToAdd);
          payDateEl.textContent = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
        }
      } else {
        delivDateEl.textContent = deliveryDateInput.value;
      }
    }

    const updateDateEl = document.getElementById('voucher-update-date');
    if (updateDateEl) {
      updateDateEl.textContent = `${now.getDate()} ${months[now.getMonth()].slice(0, 3)} - ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    const thanksDesc = document.getElementById('voucher-thanks-desc');
    if (thanksDesc) {
      thanksDesc.textContent = `Guarda este comprobante digital como respaldo para validar tu ${isCotizacion ? 'cotización' : 'orden de compra'}.`;
    }

    navigateTo('s-comprobante-pedido');
  }

  function onVoucherShare() {
    showHint('¡Comprobante copiado al portapapeles y listo para compartir!', false);
  }

  function onVoucherContinue() {
    submitFinalOrder(state.currentDocType || 'orden');
  }

  // ================= MÓDULO MIS CLIENTES Y DOCUMENTOS ELECTRÓNICOS (CP-05 & CP-06) =================
  function openCustomerProfile(clientName) {
    if (!clientName) clientName = 'CONSTRUCTORA VIAL PERÚ S.A.C.';
    state.selectedClient = clientName;

    emitSimulatorEvent('OPEN_CUSTOMER_PROFILE', {
      clientName: clientName,
      consulted: true
    });

    const headerTitle = document.getElementById('client-profile-header-title');
    if (headerTitle) headerTitle.textContent = clientName.toUpperCase();

    const commRs = document.getElementById('prof-comm-rs');
    if (commRs) commRs.textContent = clientName.toUpperCase();

    const isDosHermanos = clientName.toLowerCase().includes('hermanos');

    const auditBox06 = document.getElementById('cp06-audit-box');
    if (auditBox06) {
      auditBox06.style.display = isDosHermanos ? 'block' : 'none';
    }

    const commRuc = document.getElementById('prof-comm-ruc');
    const commDir = document.getElementById('prof-comm-dir');
    if (commRuc) commRuc.textContent = isDosHermanos ? '20123456789' : '20498321098';
    if (commDir) commDir.textContent = isDosHermanos ? 'JR. TACNA 340' : 'AV. EJÉRCITO 1024, YANAHUARA';

    switchProfileTab('perfil');
    navigateTo('s-cliente-detalle');
  }

  function switchProfileTab(tabName) {
    const btnPerfil = document.getElementById('btn-tab-perfil');
    const btnDeudas = document.getElementById('btn-tab-deudas');
    const contentPerfil = document.getElementById('tab-content-perfil');
    const contentDeudas = document.getElementById('tab-content-deudas');

    if (tabName === 'deudas') {
      if (btnPerfil) btnPerfil.classList.remove('active');
      if (btnDeudas) btnDeudas.classList.add('active');
      if (contentPerfil) contentPerfil.style.display = 'none';
      if (contentDeudas) contentDeudas.style.display = 'block';
    } else {
      if (btnPerfil) btnPerfil.classList.add('active');
      if (btnDeudas) btnDeudas.classList.remove('active');
      if (contentPerfil) contentPerfil.style.display = 'block';
      if (contentDeudas) contentDeudas.style.display = 'none';
    }
  }

  function openAccountStatus() {
    emitSimulatorEvent('VIEW_ACCOUNT_STATUS', {
      viewed: true,
      clientName: state.selectedClient || 'CONSTRUCTORA VIAL PERÚ S.A.C.'
    });
    navigateTo('s-estado-cuenta');
  }

  function submitCp05Factura() {
    const input = document.getElementById('cp05-factura-input');
    const val = input ? input.value.trim() : 'F001-55048';
    if (!val) {
      showHint('Ingresa el número de la factura observado en el estado de cuenta.', true);
      return;
    }
    emitSimulatorEvent('SUBMIT_INVOICE_AUDIT', {
      invoiceNumber: val
    });
    showHint('¡Factura identificada correctamente! Dirígete a Documentos Electrónicos para verificar el comprobante.', false);
  }

  function openDocOptions(docNum) {
    state.selectedDocNum = docNum || 'F001-00055048';
    const codeEl = document.getElementById('doc-options-modal-code');
    if (codeEl) codeEl.textContent = state.selectedDocNum;
    const modal = document.getElementById('docOptionsModal');
    if (modal) modal.classList.add('active');
  }

  function closeDocOptions() {
    const modal = document.getElementById('docOptionsModal');
    if (modal) modal.classList.remove('active');
  }

  function openInvoiceDetail(docNum) {
    const code = docNum || state.selectedDocNum || 'F001-00055048';
    closeDocOptions();
    emitSimulatorEvent('VIEW_INVOICE_DETAIL', {
      invoiceNumber: code
    });
    const invCodeEl = document.getElementById('inv-det-doc-num');
    if (invCodeEl) invCodeEl.textContent = code;
    navigateTo('s-factura-detalle');
  }

  function submitCp05RC() {
    const input = document.getElementById('cp05-rc-input');
    const val = input ? input.value.trim() : 'RE020-021740';
    if (!val) {
      showHint('Ingresa el número del recibo de cobranza (RC) observado.', true);
      return;
    }
    emitSimulatorEvent('SUBMIT_RC_AUDIT', {
      rcNumber: val
    });
    showHint('¡Recibo de cobranza verificado con éxito! Caso completado.', false);
    finishSimulation();
  }

  function submitCp06Date() {
    const input = document.getElementById('cp06-fecha-input');
    const val = input ? input.value.trim() : '14/08/2026';
    if (!val) {
      showHint('Ingresa la fecha de la visita más reciente (DD/MM/AAAA).', true);
      return;
    }
    emitSimulatorEvent('SUBMIT_HISTORY_DATE', {
      date: val,
      answer: val,
      clientName: state.selectedClient || 'Bodega y Ferretería Dos Hermanos'
    });
    showHint(`¡Fecha registrada exitosamente (${val})! Caso completado.`, false);
    finishSimulation();
  }

  // ================= MODAL DE CIERRE SIN PEDIDO (CP-08) =================
  function openNoOrderModal() {
    const modal = document.getElementById('noOrderModal');
    if (modal) modal.classList.add('active');
  }

  function closeNoOrderModal() {
    const modal = document.getElementById('noOrderModal');
    if (modal) modal.classList.remove('active');
  }

  function submitNoOrderReason() {
    const sel = document.getElementById('sel-no-order-reason');
    const reason = sel ? sel.value : 'Cliente solo cotiza';
    closeNoOrderModal();

    emitSimulatorEvent('SELECT_NO_ORDER_REASON', {
      reason: reason
    });

    emitSimulatorEvent('FINISH_VISIT', {
      completed: true,
      reason: reason
    });

    showHint(`Visita finalizada formalmente sin pedido. Motivo: ${reason}`, false);
    finishSimulation();
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

    if (event.data.type === 'PORTAL_RESET_SIMULATOR') {
      // 1. Cerrar todos los modales y drawers abiertos
      document.querySelectorAll('.modal, .portal-modal, .app-modal, .task-dropdown-modal').forEach(m => m.classList.remove('active'));
      const taskDrop = document.getElementById('taskDropdownModal');
      if (taskDrop) taskDrop.classList.remove('active');
      const photoHist = document.getElementById('photoHistoryModal');
      if (photoHist) photoHist.classList.remove('active');
      const drawer = document.getElementById('secondaryDrawer');
      if (drawer) drawer.classList.remove('active');

      // 2. Resetear variables de visita y pedido
      state.visitInProgress = false;
      state.activeVisitClient = null;
      state.cart = {
        productId: '',
        product: '',
        sku: '',
        line: '',
        brand: '',
        format: '',
        unitPrice: 0,
        qty: 0,
        promoDiscount: false,
        promoType: 'none',
        promoDiscountAmount: 0.0,
        promoLabel: ''
      };

      // 3. Volver a pantalla inicial de visitas
      goToVisitTask(0);
      navigateTo('s-visitas');
    }

    if (event.data.type === 'PORTAL_SET_CASE') {
      // Limpiar modales y drawers previos
      document.querySelectorAll('.modal, .portal-modal, .app-modal, .task-dropdown-modal').forEach(m => m.classList.remove('active'));
      const taskDrop = document.getElementById('taskDropdownModal');
      if (taskDrop) taskDrop.classList.remove('active');
      const photoHist = document.getElementById('photoHistoryModal');
      if (photoHist) photoHist.classList.remove('active');
      const drawer = document.getElementById('secondaryDrawer');
      if (drawer) drawer.classList.remove('active');

      state.currentCaseId = event.data.caseId;
      state.currentTabIndex = event.data.tabIndex;
      if (event.data.username) state.advisorUsername = event.data.username;
      initializeCaseEnvironment();
      if (state.currentCaseId === 'case-cp06' || state.currentCaseId === 'case-6') {
        goToVisitTask(3);
        navigateTo('s-cliente-inicio');
      } else if (state.currentCaseId === 'case-cp08' || state.currentCaseId === 'case-8') {
        goToVisitTask(2);
        navigateTo('s-cliente-inicio');
      } else {
        goToVisitTask(0);
        navigateTo('s-visitas');
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
    onClientCardClick: onClientCardClick,
    openOptions: onClientCardClick,
    openClientOptions: openClientOptions,
    closeOptions: closeClientOptions,
    startVisitFromAddress: startVisitFromAddress,
    startPhoneVisit: startPhoneVisit,
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
    renderCobranzaTaskView: renderCobranzaTaskView,
    switchCobranzaSubtab: switchCobranzaSubtab,
    onCobranzaAction: onCobranzaAction,
    openOpcionesPagoModal: openOpcionesPagoModal,
    closeOpcionesPagoModal: closeOpcionesPagoModal,
    goToPagoEfectivo: goToPagoEfectivo,
    goToPagoDeposito: goToPagoDeposito,
    goToPagoCheque: goToPagoCheque,
    togglePaymentCurrency: togglePaymentCurrency,
    onPaymentAmountChange: onPaymentAmountChange,
    onPaymentDepositAmountChange: onPaymentDepositAmountChange,
    onDepositBankChange: onDepositBankChange,
    onPaymentCameraClick: onPaymentCameraClick,
    onPaymentFileClick: onPaymentFileClick,
    openConfirmarPagoModal: openConfirmarPagoModal,
    closeConfirmarPagoModal: closeConfirmarPagoModal,
    finalizePayment: finalizePayment,
    openConsolidadoCobranzaModal: openConsolidadoCobranzaModal,
    closeConsolidadoCobranzaModal: closeConsolidadoCobranzaModal,
    submitConsolidadoCobranza: submitConsolidadoCobranza,
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
    onPreciosMotivoChange: onPreciosMotivoChange,
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
    renderClientCards: renderClientListCards,
    removeProductFromCart: removeProductFromCart,
    editCartProduct: editCartProduct,
    renderConfirmationOrderSummary: renderConfirmationOrderSummary,
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
    toggleDrawerClientAccordion: toggleDrawerClientAccordion,
    onDrawerClientSearch: onDrawerClientSearch,
    clearDrawerClientSearch: clearDrawerClientSearch,
    selectDocTypeFilter: selectDocTypeFilter,
    selectDocStatusFilter: selectDocStatusFilter,
    onDocsSearch: onDocsSearch,
    clearDocsSearch: clearDocsSearch,
    toggleProgressDetails: toggleProgressDetails,
    renderOrdersTrackingList: renderOrdersTrackingList,
    openOrderDetail: openOrderDetail,
    selectOrderDetailTab: selectOrderDetailTab,
    selectOrderSubtab: selectOrderSubtab,
    selectOrderFilter: selectOrderFilter,
    onOrderSearch: onOrderSearch,
    clearOrderSearch: clearOrderSearch,
    selectProduct: selectProduct,
    openOrderVoucher: openOrderVoucher,
    onVoucherShare: onVoucherShare,
    onVoucherContinue: onVoucherContinue,
    submitFinalOrder: submitFinalOrder,
    openCustomerProfile: openCustomerProfile,
    switchProfileTab: switchProfileTab,
    openAccountStatus: openAccountStatus,
    submitCp05Factura: submitCp05Factura,
    openDocOptions: openDocOptions,
    closeDocOptions: closeDocOptions,
    openInvoiceDetail: openInvoiceDetail,
    submitCp05RC: submitCp05RC,
    submitCp06Date: submitCp06Date,
    openNoOrderModal: openNoOrderModal,
    closeNoOrderModal: closeNoOrderModal,
    submitNoOrderReason: submitNoOrderReason,
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
      if (state.currentCaseId === 'case-cp06' || state.currentCaseId === 'case-6') {
        goToVisitTask(3);
        navigateTo('s-cliente-inicio');
      } else if (state.currentCaseId === 'case-cp08' || state.currentCaseId === 'case-8') {
        goToVisitTask(2);
        navigateTo('s-cliente-inicio');
      }
    }
  });
})();
