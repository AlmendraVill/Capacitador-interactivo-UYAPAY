/**
 * Controlador del Simulador Móvil UYAPAY
 * Soporta dinámicamente cualquiera de los 15 casos del catálogo y evaluación en pestañas.
 * Totalmente desacoplado: emite eventos hacia el Evaluador sin calcular notas internamente.
 */

(function() {
  const state = {
    advisorUsername: 'alvaro',
    currentCaseId: 'case-2',
    currentTabIndex: 0,
    selectedClient: '',
    photos: { 1: false, 2: false },
    orderConfig: {
      paymentCondition: '',
      priceList: '',
      line: '',
      brand: ''
    },
    cart: {
      product: 'Michelin Energy XM2+ 195/60 R15',
      unitPrice: 55.0,
      qty: 3,
      promoDiscount: true
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

  // 1. Inicialización y carga dinámica de clientes y productos según el caso
  function initializeCaseEnvironment() {
    const currentCase = getCaseData();
    if (!currentCase) return;

    // Actualizar configuración del carrito según el caso
    state.cart.product = currentCase.product || 'Michelin Energy XM2+ 195/60 R15';
    state.cart.unitPrice = currentCase.unitPrice || 55.0;
    state.cart.qty = currentCase.expectedQty || 3;
    state.cart.promoDiscount = currentCase.promoDiscount !== false;

    // Renderizar clientes en la pantalla de visitas (s-visitas)
    const listContainer = document.getElementById('client-list-cards');
    if (listContainer) {
      const targetClient = currentCase.client;
      const targetAddr = currentCase.clientAddress || 'AV. RUTA PRINCIPAL 100';

      // Clientes distractores fijos para evaluar precisión
      const distractors = [
        { name: 'Ferretería Los Andes S.A.C.', address: 'AV. TOMAS TUYRUTUPAC 412' },
        { name: 'Distribuidora Kanchis EIRL', address: 'AV. INDUSTRIAL 104' },
        { name: 'Chahua Puma Franclin', address: 'AV. PAISAJISTA NRO. 503' },
        { name: 'Ramirez Alarcon Hernan', address: 'CALLE HUACHO 109' }
      ].filter(d => !d.name.toLowerCase().includes(targetClient.toLowerCase().slice(0, 8)));

      let html = `
        <div class="client-card" style="border-left: 4px solid #2980b9;" onclick="window.UyapaySimulator.openOptions('${targetClient}')">
          <div class="pin">◎</div>
          <div>
            <div class="client-name">${targetClient.toUpperCase()}</div>
            <div class="client-address">${targetAddr}</div>
          </div>
        </div>
      `;

      distractors.slice(0, 3).forEach(d => {
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

    // Actualizar producto en el catálogo (s-catalogo-producto)
    const catProdCard = document.querySelector('#s-catalogo-producto .card');
    if (catProdCard) {
      const brandTag = catProdCard.querySelector('span');
      const titleEl = catProdCard.querySelector('h3');
      const priceEl = catProdCard.querySelector('div[style*="font-size:18px"]');
      const promoLabel = document.querySelector('.promo-toggle-card div div:first-child');

      if (brandTag) brandTag.textContent = (currentCase.brand || 'PRODUCTO').toUpperCase();
      if (titleEl) titleEl.textContent = state.cart.product;
      if (priceEl) priceEl.innerHTML = `USD ${state.cart.unitPrice.toFixed(2)} <span style="font-size:12px; font-weight:400; color:var(--muted);">/ unidad</span>`;
      if (promoLabel && currentCase.promoLabel) promoLabel.textContent = currentCase.promoLabel;

      const qtyEl = document.getElementById('product-qty');
      if (qtyEl) qtyEl.textContent = state.cart.qty;
      const subtotalEl = document.getElementById('product-subtotal-text');
      if (subtotalEl) subtotalEl.textContent = `= USD ${(state.cart.qty * state.cart.unitPrice).toFixed(2)}`;

      const togglePromoEl = document.getElementById('toggle-promo-discount');
      if (togglePromoEl) togglePromoEl.checked = state.cart.promoDiscount;
    }

    updateReceiptCalculations();
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

    // Si la acción es iniciar visita, avanzar a datos del cliente
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
    navigateTo('s-catalogo-producto');
  }

  // 6. Catálogo y Detalle del Producto
  function changeQty(delta) {
    state.cart.qty = Math.max(1, state.cart.qty + delta);
    const qtyEl = document.getElementById('product-qty');
    if (qtyEl) qtyEl.textContent = state.cart.qty;
    
    const baseSubtotal = state.cart.qty * state.cart.unitPrice;
    const subtotalTextEl = document.getElementById('product-subtotal-text');
    if (subtotalTextEl) subtotalTextEl.textContent = `= USD ${baseSubtotal.toFixed(2)}`;
    updateReceiptCalculations();
  }

  function togglePromo(checked) {
    state.cart.promoDiscount = checked;
    updateReceiptCalculations();
  }

  function updateReceiptCalculations() {
    const baseAmount = state.cart.qty * state.cart.unitPrice;
    const promoDesc = state.cart.promoDiscount ? 10.00 : 0.00;
    const subtotal = Math.max(0, baseAmount - promoDesc);
    const creditoDesc = subtotal * 0.03; // 3% por crédito 30 días
    const total = subtotal - creditoDesc;

    const rowPromo = document.getElementById('row-promo-desc');
    if (rowPromo) rowPromo.style.display = state.cart.promoDiscount ? 'flex' : 'none';

    const subtotalEl = document.getElementById('receipt-subtotal');
    if (subtotalEl) subtotalEl.textContent = `USD ${subtotal.toFixed(2)}`;

    const creditoEl = document.getElementById('receipt-credito-desc');
    if (creditoEl) creditoEl.textContent = `- USD ${creditoDesc.toFixed(2)}`;

    const totalEl = document.getElementById('receipt-total-val');
    if (totalEl) totalEl.textContent = `USD ${total.toFixed(2)}`;
  }

  function addProductToCart() {
    emitSimulatorEvent('ADD_PRODUCT', {
      product: state.cart.product,
      quantity: state.cart.qty,
      promoDiscount: state.cart.promoDiscount
    });

    updateReceiptCalculations();
    navigateTo('s-resumen-pedido');
  }

  // 7. Resumen y Envío Final
  function submitFinalOrder() {
    const baseAmount = state.cart.qty * state.cart.unitPrice;
    const promoDesc = state.cart.promoDiscount ? 10.00 : 0.00;
    const subtotal = Math.max(0, baseAmount - promoDesc);
    const creditoDesc = subtotal * 0.03;
    const total = Number((subtotal - creditoDesc).toFixed(2));

    emitSimulatorEvent('SUBMIT_ORDER', {
      confirmed: true,
      total: total
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

  // Exponer métodos globales
  window.UyapaySimulator = {
    login: handleAppLogin,
    go: navigateTo,
    openOptions: openClientOptions,
    closeOptions: closeClientOptions,
    checkOption: selectOption,
    takePhoto: takePhoto,
    submitPhotos: submitPhotos,
    submitOrderConfig: submitOrderConfig,
    changeQty: changeQty,
    togglePromo: togglePromo,
    addProductToCart: addProductToCart,
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
