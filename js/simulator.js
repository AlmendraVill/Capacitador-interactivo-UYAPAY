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

  function navigateTo(screenId) {
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

    // Pre-poblar los selectores en s-nuevo-pedido con los datos que coinciden con el caso
    const selCond = document.getElementById('sel-condicion');
    const selList = document.getElementById('sel-lista');
    const selLine = document.getElementById('sel-linea');
    const selBrand = document.getElementById('sel-marca');

    if (selCond && currentCase.paymentCondition) selCond.value = currentCase.paymentCondition;
    if (selList && currentCase.priceList) selList.value = currentCase.priceList;
    if (selLine && currentCase.line) selLine.value = currentCase.line;
    if (selBrand && currentCase.brand) selBrand.value = currentCase.brand;

    const cliLista = document.getElementById('cli-lista-header');
    if (cliLista && currentCase.priceList) cliLista.textContent = `Lista ${currentCase.priceList}`;

    // Renderizar lista de clientes en la ruta (s-visitas)
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
          <div class="client-card" style="border-left: 4px solid #2980b9;" onclick="window.UyapaySimulator.openOptions('${targetClient}')">
            <div class="pin">◎</div>
            <div>
              <div class="client-name">${targetClient.toUpperCase()}</div>
              <div class="client-address">${targetAddr}</div>
            </div>
          </div>
        `;
      }

      mockDistractors.slice(0, isOutRouteCase ? 4 : 3).forEach(d => {
        html += `
          <div class="client-card" onclick="window.UyapaySimulator.openOptions('${d.name}')">
            <div class="pin">◎</div>
            <div>
              <div class="client-name">${d.name.toUpperCase()}</div>
              <div class="client-address">${d.address}</div>
            </div>
          </div>
        `;
      });

      listContainer.innerHTML = html;
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
      const cliHeader = document.getElementById('cli-nombre-header');
      if (cliHeader) cliHeader.textContent = state.selectedClient;
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

  // 8. Visitas Fuera de Ruta (Casos 11 y 22)
  function onOutRouteClientChange(clientVal) {
    const addrInput = document.getElementById('outroute-address');
    if (!addrInput) return;
    if (clientVal === 'Repuestos Central Chincha') {
      addrInput.value = 'CALLE COMERCIO 120 - CHINCHA';
    } else if (clientVal === 'Autopartes El Rápido') {
      addrInput.value = 'JR. PIEROLA 540';
    } else {
      addrInput.value = 'CALLE COMERCIO 100';
    }
  }

  function openOutRouteModal() {
    const modal = document.getElementById('outRouteModal');
    if (modal) modal.classList.add('active');
    const selClient = document.getElementById('sel-outroute-client');
    if (selClient) {
      if (state.currentCaseId === 'case-11') {
        selClient.value = 'Repuestos Central Chincha';
      } else if (state.currentCaseId === 'case-22') {
        selClient.value = 'Autopartes El Rápido';
      }
      onOutRouteClientChange(selClient.value);
    }
  }

  function closeOutRouteModal() {
    const modal = document.getElementById('outRouteModal');
    if (modal) modal.classList.remove('active');
  }

  function submitOutRouteVisit() {
    const selClient = document.getElementById('sel-outroute-client');
    const clientName = selClient ? selClient.value : (state.currentCaseId === 'case-11' ? 'Repuestos Central Chincha' : 'Autopartes El Rápido');
    const address = document.getElementById('outroute-address')?.value || (state.currentCaseId === 'case-11' ? 'CALLE COMERCIO 120 - CHINCHA' : 'JR. PIEROLA 540');

    state.selectedClient = clientName;

    emitSimulatorEvent('CREATE_OUT_ROUTE_VISIT', {
      clientName: clientName,
      address: address,
      outRoute: true
    });

    closeOutRouteModal();
    showHint(`Visita fuera de ruta agregada: ${clientName}`, false);

    const listContainer = document.getElementById('client-list-cards');
    if (listContainer) {
      const newCard = `
        <div class="client-card" style="border-left: 4px solid #f39c12;" onclick="window.UyapaySimulator.openOptions('${clientName}')">
          <div class="pin" style="color:#f39c12;">➕</div>
          <div>
            <div class="client-name">${clientName.toUpperCase()} <span style="background:#f39c12; color:#fff; font-size:10px; padding:2px 6px; border-radius:4px; margin-left:4px;">FUERA DE RUTA</span></div>
            <div class="client-address">${address}</div>
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

  // 10. Fotos de Visita
  function takePhoto(photoId) {
    state.photos[photoId] = true;
    const btn = document.getElementById(`btn-foto-${photoId}`);
    const card = document.getElementById(`card-foto-${photoId}`);

    if (btn) {
      btn.textContent = '✅ Capturada';
      btn.className = 'photo-badge ready';
    }
    if (card) {
      card.classList.add('taken');
    }
    showHint(`Foto ${photoId} registrada correctamente.`, false);
  }

  function submitPhotos() {
    if (!state.photos[1] || !state.photos[2]) {
      showHint('El manual exige registrar ambas fotos (inicial y final).', true);
      emitSimulatorEvent('SAVE_PHOTOS', {
        initialPhoto: state.photos[1],
        finalPhoto: state.photos[2]
      });
      return;
    }

    emitSimulatorEvent('SAVE_PHOTOS', {
      initialPhoto: true,
      finalPhoto: true
    });

    navigateTo('s-pedidos-menu');
  }

  // 11. Configuración del Pedido
  function submitOrderConfig() {
    const condicion = document.getElementById('sel-condicion').value;
    const lista = document.getElementById('sel-lista').value;
    const linea = document.getElementById('sel-linea').value;
    const marca = document.getElementById('sel-marca').value;

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

  // 12. Renderizado del Catálogo de Productos según Línea y Marca
  function renderCatalogProducts(linea, marca) {
    const container = document.getElementById('catalog-products-container');
    const brandBadge = document.getElementById('catalog-brand-badge');
    const lineBadge = document.getElementById('catalog-line-badge');
    const countBadge = document.getElementById('catalog-count-badge');

    if (brandBadge) brandBadge.textContent = marca.toUpperCase();
    if (lineBadge) lineBadge.textContent = `Línea: ${linea.charAt(0).toUpperCase() + linea.slice(1)}`;

    const allProducts = getMasterProducts();
    const currentCase = getCaseData();

    // Filtrar productos por línea y marca
    let matchingProducts = allProducts.filter(p => p.line === linea && p.brand === marca);

    if (matchingProducts.length === 0) {
      matchingProducts = allProducts.filter(p => p.brand === marca);
    }
    if (matchingProducts.length === 0) {
      matchingProducts = allProducts.filter(p => p.line === linea);
    }

    if (countBadge) countBadge.textContent = `${matchingProducts.length} productos disponibles`;

    if (!container) return;

    if (matchingProducts.length === 0) {
      container.innerHTML = `
        <div class="card-task" style="text-align:center; padding:24px;">
          <p style="color:var(--text-light); font-size:13px;">No se encontraron productos para esta línea y marca.</p>
        </div>
      `;
      return;
    }

    let cardsHtml = '';
    matchingProducts.forEach(prod => {
      const isTarget = currentCase && (
        (currentCase.product && prod.name.toLowerCase().includes(currentCase.product.toLowerCase().slice(0, 10))) ||
        (currentCase.brand === prod.brand && currentCase.line === prod.line)
      );

      const initialQty = isTarget && currentCase.expectedQty ? currentCase.expectedQty : 1;
      state.catalogQuantities[prod.id] = state.catalogQuantities[prod.id] || initialQty;

      const initialPromo = isTarget ? (currentCase.promoDiscount !== false) : prod.hasPromo;
      if (state.catalogPromos[prod.id] === undefined) {
        state.catalogPromos[prod.id] = initialPromo;
      }

      const currentQty = state.catalogQuantities[prod.id];
      const promoChecked = state.catalogPromos[prod.id];
      const promoText = (isTarget && currentCase.promoLabel) ? currentCase.promoLabel : prod.promoLabel;

      cardsHtml += `
        <div class="catalog-item-card ${isTarget ? 'is-target' : ''}" id="card-prod-${prod.id}">
          <div class="catalog-item-header">
            <span class="brand-badge">${prod.brand.toUpperCase()}</span>
            <span style="font-size:11px; color:var(--text-light); font-weight:600;">${prod.format || ''}</span>
          </div>
          <div class="catalog-item-title">${prod.name}</div>
          <div class="catalog-item-sku">Cód: ${prod.sku}</div>

          <div class="catalog-item-price-row">
            <div class="catalog-item-price">
              USD ${prod.unitPrice.toFixed(2)} <small>/ unidad</small>
            </div>
            <div style="font-size:12px; font-weight:700; color:#2980b9;" id="subtotal-item-${prod.id}">
              = USD ${(currentQty * prod.unitPrice).toFixed(2)}
            </div>
          </div>

          <!-- Selector de Cantidad -->
          <div style="display:flex; align-items:center; justify-content:space-between; margin-top:8px;">
            <span style="font-size:12px; font-weight:600; color:var(--text-medium);">Cantidad:</span>
            <div class="qty-control">
              <button class="qty-btn" onclick="window.UyapaySimulator.changeCatalogQty('${prod.id}', -1)">-</button>
              <div class="qty-display" id="qty-disp-${prod.id}">${currentQty}</div>
              <button class="qty-btn" onclick="window.UyapaySimulator.changeCatalogQty('${prod.id}', 1)">+</button>
            </div>
          </div>

          <!-- Toggle de Promoción si aplica -->
          ${prod.hasPromo || (isTarget && currentCase.promoLabel) ? `
            <div class="promo-toggle-card" style="margin-top:10px;">
              <div style="max-width:200px;">
                <div style="font-size:11px; font-weight:700; color:#795548;">${promoText}</div>
              </div>
              <label class="switch">
                <input type="checkbox" id="promo-chk-${prod.id}" ${promoChecked ? 'checked' : ''} onchange="window.UyapaySimulator.toggleCatalogPromo('${prod.id}', this.checked)">
                <span class="slider"></span>
              </label>
            </div>
          ` : `
            <div style="font-size:11px; color:var(--text-light); font-style:italic; margin-top:8px;">
              ${prod.promoLabel || 'Sin promociones para este artículo'}
            </div>
          `}

          <div class="catalog-item-actions">
            <span style="font-size:11px; color:var(--text-light);">Confirmar selección:</span>
            <button class="btn-select-product" onclick="window.UyapaySimulator.selectProduct('${prod.id}')">
              🛒 Agregar al Pedido ›
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = cardsHtml;
  }

  function changeCatalogQty(prodId, delta) {
    const current = state.catalogQuantities[prodId] || 1;
    const next = Math.max(1, current + delta);
    state.catalogQuantities[prodId] = next;

    const disp = document.getElementById(`qty-disp-${prodId}`);
    if (disp) disp.textContent = next;

    const allProducts = getMasterProducts();
    const prod = allProducts.find(p => p.id === prodId);
    if (prod) {
      const subtotalEl = document.getElementById(`subtotal-item-${prodId}`);
      if (subtotalEl) subtotalEl.textContent = `= USD ${(next * prod.unitPrice).toFixed(2)}`;
    }
  }

  function toggleCatalogPromo(prodId, checked) {
    state.catalogPromos[prodId] = checked;
  }

  // 13. Seleccionar Producto y pasar al Resumen de Liquidación
  function selectProduct(prodId) {
    const allProducts = getMasterProducts();
    const prod = allProducts.find(p => p.id === prodId);
    if (!prod) return;

    const currentCase = getCaseData();
    const qty = state.catalogQuantities[prodId] || 1;
    const promoChecked = state.catalogPromos[prodId] !== undefined ? state.catalogPromos[prodId] : false;

    let promoDiscountAmount = 0.0;
    let promoType = prod.promoType || 'none';
    let promoLabel = prod.promoLabel || '';

    if (currentCase && currentCase.product && prod.name.toLowerCase().includes(currentCase.product.toLowerCase().slice(0, 10))) {
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
      qty: qty,
      promoDiscount: promoChecked,
      promoType: promoType,
      promoDiscountAmount: promoDiscountAmount,
      promoLabel: promoLabel
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
      promoLabel: state.cart.promoLabel
    });

    updateReceiptCalculations();
    navigateTo('s-resumen-pedido');
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

    const rawTotal = state.cart.qty * state.cart.unitPrice;

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

    const itemSummaryEl = document.getElementById('receipt-items-summary');
    if (itemSummaryEl) itemSummaryEl.textContent = `${state.cart.qty}x ${state.cart.product} (@ $${state.cart.unitPrice.toFixed(2)})`;

    const rawSubtotalEl = document.getElementById('receipt-raw-subtotal');
    if (rawSubtotalEl) rawSubtotalEl.textContent = `USD ${rawTotal.toFixed(2)}`;

    const subtotalEl = document.getElementById('receipt-subtotal');
    if (subtotalEl) subtotalEl.textContent = `USD ${subtotalAfterPromo.toFixed(2)}`;

    const condLabelEl = document.getElementById('receipt-cond-label');
    if (condLabelEl) condLabelEl.textContent = condLabel;

    const creditoEl = document.getElementById('receipt-credito-desc');
    if (creditoEl) creditoEl.textContent = `- USD ${finDiscount.toFixed(2)}`;

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

    state.finalOrderTotal = finalTotal;
  }

  // 15. Confirmación y Envío Final (Orden vs Cotización Tipo 3)
  function submitFinalOrder(docType = 'orden') {
    const isCotizacion = docType === 'cotizacion';
    emitSimulatorEvent('SUBMIT_ORDER', {
      confirmed: true,
      total: state.finalOrderTotal || 0,
      product: state.cart.product,
      quantity: state.cart.qty,
      paymentCondition: state.orderConfig.paymentCondition,
      documentType: isCotizacion ? 'cotizacion' : 'orden',
      documentTypeId: isCotizacion ? 3 : 2
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
    submitOutRouteVisit: submitOutRouteVisit,
    openSettlementModal: openSettlementModal,
    closeSettlementModal: closeSettlementModal,
    submitSettlement: submitSettlement,
    takePhoto: takePhoto,
    submitPhotos: submitPhotos,
    submitOrderConfig: submitOrderConfig,
    changeCatalogQty: changeCatalogQty,
    toggleCatalogPromo: toggleCatalogPromo,
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
  });
})();
