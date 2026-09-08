/**
 * Controlador del Simulador Móvil UYAPAY
 * Soporta Catálogo Dinámico Multi-Marca (Shell, Michelin, BFGoodrich, Hyundai)
 * Totalmente desacoplado: emite eventos hacia el Evaluador sin calcular notas internamente.
 */

(function() {
  const state = {
    advisorUsername: 'alvaro',
    currentCaseId: 'case-1',
    currentTabIndex: 0,
    selectedClient: '',
    photos: { 1: false, 2: false },
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

    // Inicializar estado del carrito por defecto con los valores del caso
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

    // Renderizar lista de clientes en la ruta (s-visitas)
    const listContainer = document.getElementById('client-list-cards');
    if (listContainer) {
      const targetClient = currentCase.client;
      const targetAddr = currentCase.clientAddress || 'AV. RUTA PRINCIPAL 100';

      const mockDistractors = [
        { name: 'Ferretería Los Andes S.A.C.', address: 'AV. TOMAS TUYRUTUPAC 412' },
        { name: 'Distribuidora Kanchis EIRL', address: 'AV. INDUSTRIAL 104' },
        { name: 'Comercial Vega Hnos.', address: 'CALLE MERCADERES 301' },
        { name: 'Transportes del Sur SAC', address: 'KM 12 VARIANTE UCHUMAYO' },
        { name: 'Grupo Ferretero Miraflores', address: 'AV. SAN JERONIMO 210' },
        { name: 'Autopartes El Rápido', address: 'JR. PIEROLA 540' },
        { name: 'Servicentro El Faro', address: 'AV. DOLORES 880' }
      ].filter(d => !d.name.toLowerCase().includes(targetClient.toLowerCase().slice(0, 7)));

      let html = `
        <div class="client-card" style="border-left: 4px solid #2980b9;" onclick="window.UyapaySimulator.openOptions('${targetClient}')">
          <div class="pin">◎</div>
          <div>
            <div class="client-name">${targetClient.toUpperCase()}</div>
            <div class="client-address">${targetAddr}</div>
          </div>
        </div>
      `;

      mockDistractors.slice(0, 3).forEach(d => {
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

  // 3. Visitas y Opciones
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

    // 1. Notificar selección del cliente
    emitSimulatorEvent('SELECT_CLIENT', { clientName: state.selectedClient });

    // 2. Notificar la acción solicitada
    emitSimulatorEvent('SELECT_ACTION', { action: actionKey, clientName: state.selectedClient });

    if (actionKey === 'iniciar') {
      const cliHeader = document.getElementById('cli-nombre-header');
      if (cliHeader) cliHeader.textContent = state.selectedClient;
      navigateTo('s-cliente-inicio');
    }
  }

  // 4. Fotos de Visita
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

  // 5. Configuración del Pedido
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

  // 6. Renderizado del Catálogo de Productos según Línea y Marca
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

    // Si por algún motivo la marca no coincide exactamente, mostrar todos los de la marca o los del catálogo
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

      // Pre-cargar cantidad esperada si es el producto target
      const initialQty = isTarget && currentCase.expectedQty ? currentCase.expectedQty : 1;
      state.catalogQuantities[prod.id] = state.catalogQuantities[prod.id] || initialQty;

      // Pre-cargar estado de promoción
      const initialPromo = isTarget ? (currentCase.promoDiscount !== false) : prod.hasPromo;
      if (state.catalogPromos[prod.id] === undefined) {
        state.catalogPromos[prod.id] = initialPromo;
      }

      const currentQty = state.catalogQuantities[prod.id];
      const promoChecked = state.catalogPromos[prod.id];

      // Texto de promoción
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

  // 7. Seleccionar Producto y pasar al Resumen de Liquidación
  function selectProduct(prodId) {
    const allProducts = getMasterProducts();
    const prod = allProducts.find(p => p.id === prodId);
    if (!prod) return;

    const currentCase = getCaseData();
    const qty = state.catalogQuantities[prodId] || 1;
    const promoChecked = state.catalogPromos[prodId] !== undefined ? state.catalogPromos[prodId] : false;

    // Detectar si la promoción otorga descuento en dinero o regalo
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

    // Emitir evento desacoplado hacia el evaluador
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

  // 8. Cálculos de Liquidación Dinámicos basados en la Condición Elegida
  function updateReceiptCalculations() {
    const currentCase = getCaseData();
    const cond = state.orderConfig.paymentCondition || 'contado';

    // Tasas financieras oficiales de UYAPAY
    let rate = 0.05;
    let condLabel = 'Desc. Contado (5%):';
    if (cond === 'credito_15') { rate = 0.04; condLabel = 'Desc. Crédito 15 días (4%):'; }
    else if (cond === 'credito_30') { rate = 0.03; condLabel = 'Desc. Crédito 30 días (3%):'; }
    else if (cond === 'credito_45') { rate = 0.02; condLabel = 'Desc. Crédito 45 días (2%):'; }
    else if (cond === 'credito_60') { rate = 0.01; condLabel = 'Desc. Crédito 60 días (1%):'; }

    const rawTotal = state.cart.qty * state.cart.unitPrice;

    // Descuento de promoción (solo si es tipo 'discount' y está activado)
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

    // Actualizar elementos del DOM en el recibo
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

  // 9. Confirmación y Envío Final de la Orden
  function submitFinalOrder() {
    emitSimulatorEvent('SUBMIT_ORDER', {
      confirmed: true,
      total: state.finalOrderTotal || 0,
      product: state.cart.product,
      quantity: state.cart.qty,
      paymentCondition: state.orderConfig.paymentCondition
    });

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
    }
  });

  // Exponer métodos globales al simulador
  window.UyapaySimulator = {
    login: handleAppLogin,
    go: navigateTo,
    openOptions: openClientOptions,
    closeOptions: closeClientOptions,
    checkOption: selectOption,
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
