/**
 * Catálogo Oficial de Casos Prácticos de Evaluación B2C - UYAPAY
 * Basado en "Casos de Prueba — Simulador UYAPAY Asesor B2C" y "Flujos de Resolución".
 * Cada caso contiene escenario, instrucciones, reglas de negocio y validación desacoplada.
 */
window.UyapayData = window.UyapayData || {};

window.UyapayData.CASES = [
  {
    id: 'case-1',
    code: 'B2C-01',
    title: 'Caso 1: Venta simple contado con regalo por volumen',
    module: 'Ventas B2C',
    client: 'Ferretería Los Andes S.A.C.',
    clientAddress: 'AV. TOMAS TUYRUTUPAC 412',
    paymentCondition: 'contado',
    paymentConditionLabel: 'Contado (5% desc.)',
    priceList: '1',
    line: 'lubricantes',
    brand: 'shell',
    product: 'Shell Helix HX7 10W/40',
    unitPrice: 22.0,
    expectedQty: 8,
    promoDiscount: true,
    promoLabel: '🎁 Regalo: 2 botellas Shell Helix Plus',
    instructions: '1. Visitas: Inicia visita en Ferretería Los Andes S.A.C. (Juan Perez).\n2. Fotos: Registra fotos obligatorias de visita.\n3. Pedidos: Crea pedido a Contado con Lista 1, línea Lubricantes, marca Shell.\n4. Producto: Agrega 8 baldes Helix HX7 y activa la promo de regalo.\n5. Resumen: Verifica el 5% de descuento al contado y confirma la orden.',
    active: true,
    scoring: { maxScore: 20, penaltyPerError: 4, maxErrorsAllowed: 2, scale: 'vigesimal' },
    rules: [
      {
        stepIndex: 0,
        eventName: 'SELECT_CLIENT',
        description: 'Seleccionar al cliente correcto en la ruta',
        validate: (p) => {
          const name = (p.clientName || '').toLowerCase();
          return name.includes('andes') || name.includes('perez');
        },
        errorMessage: 'Ese no es el cliente indicado. Busca a Ferretería Los Andes S.A.C.'
      },
      {
        stepIndex: 1,
        eventName: 'SELECT_ACTION',
        description: 'Iniciar la visita en el cliente',
        validate: (p) => p.action === 'iniciar',
        errorMessage: 'Debes presionar "Iniciar visita" para comenzar la atención.'
      },
      {
        stepIndex: 2,
        eventName: 'SAVE_PHOTOS',
        description: 'Registrar fotos obligatorias de presentación inicial y final',
        validate: (p) => p.initialPhoto && p.finalPhoto,
        errorMessage: 'Debes registrar ambas fotos (inicial y final) antes de continuar.'
      },
      {
        stepIndex: 3,
        eventName: 'CREATE_ORDER_CONFIG',
        description: 'Configurar pedido (Contado, Lista 1, Lubricantes Shell)',
        validate: (p) => p.paymentCondition === 'contado' && p.priceList === '1' && p.line === 'lubricantes' && p.brand === 'shell',
        errorMessage: 'Configuración incorrecta: Contado, Lista 1, Línea Lubricantes y Marca Shell.'
      },
      {
        stepIndex: 4,
        eventName: 'ADD_PRODUCT',
        description: 'Agregar 8 baldes Shell Helix HX7 con promo activada',
        validate: (p) => Number(p.quantity) === 8,
        errorMessage: 'Debes agregar exactamente 8 baldes de Shell Helix HX7.'
      },
      {
        stepIndex: 5,
        eventName: 'SUBMIT_ORDER',
        description: 'Confirmar y enviar orden al contado',
        validate: (p) => p.confirmed === true,
        errorMessage: 'Debes confirmar y enviar la orden de compra.'
      }
    ]
  },
  {
    id: 'case-2',
    code: 'B2C-02',
    title: 'Caso 2: Venta a crédito 30 días con descuento en dinero',
    module: 'Ventas B2C',
    client: 'Distribuidora Kanchis EIRL',
    clientAddress: 'AV. INDUSTRIAL 104 (B2C - Crédito 30d)',
    paymentCondition: 'credito_30',
    paymentConditionLabel: 'Crédito 30 días (3% desc.)',
    priceList: 'OF',
    line: 'neumaticos',
    brand: 'michelin',
    product: 'Michelin Energy XM2+ 195/60 R15',
    unitPrice: 55.0,
    expectedQty: 3,
    promoDiscount: true,
    promoLabel: '🎁 Descuento por Volumen (3+ cajas: -$10.00)',
    instructions: '1. Visitas: Inicia visita en Distribuidora Kanchis EIRL.\n2. Fotos: Registra fotos inicial y final obligatorias.\n3. Pedidos: Crea pedido a Crédito 30 días con Lista OF, línea Neumáticos, marca Michelin.\n4. Producto: Agrega 3 cajas Energy XM2+ y activa el toggle de descuento de USD 10 por volumen.\n5. Resumen: Verifica el 3% de crédito ($4.65) para un total de USD 150.35 y confirma la orden.',
    active: true,
    scoring: { maxScore: 20, penaltyPerError: 4, maxErrorsAllowed: 2, scale: 'vigesimal' },
    rules: [
      {
        stepIndex: 0,
        eventName: 'SELECT_CLIENT',
        description: 'Seleccionar al cliente correcto en la ruta',
        validate: (p) => (p.clientName || '').toLowerCase().includes('kanchis'),
        errorMessage: 'Ese no es el cliente indicado. Busca a Distribuidora Kanchis EIRL.'
      },
      {
        stepIndex: 1,
        eventName: 'SELECT_ACTION',
        description: 'Iniciar la visita al cliente',
        validate: (p) => p.action === 'iniciar',
        errorMessage: 'Debes seleccionar "Iniciar visita" para comenzar la atención.'
      },
      {
        stepIndex: 2,
        eventName: 'SAVE_PHOTOS',
        description: 'Registrar fotos obligatorias de presentación inicial y final',
        validate: (p) => p.initialPhoto && p.finalPhoto,
        errorMessage: 'Debes registrar ambas fotos (inicial y final) antes de continuar.'
      },
      {
        stepIndex: 3,
        eventName: 'CREATE_ORDER_CONFIG',
        description: 'Configurar pedido (Crédito 30 días, Lista OF, Neumáticos Michelin)',
        validate: (p) => p.paymentCondition === 'credito_30' && p.priceList === 'OF' && p.line === 'neumaticos' && p.brand === 'michelin',
        errorMessage: 'Configuración incorrecta. Revisa: Crédito 30 días, Lista OF, Línea Neumáticos y Marca Michelin.'
      },
      {
        stepIndex: 4,
        eventName: 'ADD_PRODUCT',
        description: 'Agregar 3 cajas Energy XM2+ activando el descuento de $10',
        validate: (p) => Number(p.quantity) === 3 && Boolean(p.promoDiscount),
        errorMessage: 'Debes agregar exactamente 3 cajas de Michelin Energy XM2+ y activar el toggle de descuento de $10 USD.'
      },
      {
        stepIndex: 5,
        eventName: 'SUBMIT_ORDER',
        description: 'Confirmar orden con liquidación neta de USD 150.35',
        validate: (p) => p.confirmed === true,
        errorMessage: 'Debes confirmar y actualizar la orden de compra.'
      }
    ]
  },
  {
    id: 'case-3',
    code: 'B2C-03',
    title: 'Caso 3: Cliente corporativo B2B, crédito 60 días',
    module: 'Ventas B2B',
    client: 'Transportes del Sur SAC',
    clientAddress: 'KM 12 VARIANTE DE UCHUMAYO',
    paymentCondition: 'credito_60',
    paymentConditionLabel: 'Crédito 60 días (1% desc.)',
    priceList: 'EC',
    line: 'lubricantes',
    brand: 'shell',
    product: 'Shell Retinax HD2 Cilindro',
    unitPrice: 320.0,
    expectedQty: 1,
    promoDiscount: false,
    promoLabel: 'Sin promoción aplicable en B2B',
    instructions: '1. Inicia visita en Transportes del Sur SAC.\n2. Registra las fotos obligatorias.\n3. Crea pedido a Crédito 60 días con Lista EC, línea Lubricantes, marca Shell.\n4. Agrega 1 cilindro Retinax HD2 sin promo.\n5. Verifica el 1% de crédito ($3.20) para total USD 316.80 y confirma.',
    active: true,
    scoring: { maxScore: 20, penaltyPerError: 4, maxErrorsAllowed: 2, scale: 'vigesimal' },
    rules: [
      {
        stepIndex: 0,
        eventName: 'SELECT_CLIENT',
        description: 'Seleccionar al cliente corporativo',
        validate: (p) => (p.clientName || '').toLowerCase().includes('transportes'),
        errorMessage: 'Busca a Transportes del Sur SAC en tu ruta.'
      },
      {
        stepIndex: 1,
        eventName: 'SELECT_ACTION',
        description: 'Iniciar visita',
        validate: (p) => p.action === 'iniciar',
        errorMessage: 'Presiona "Iniciar visita".'
      },
      {
        stepIndex: 2,
        eventName: 'SAVE_PHOTOS',
        description: 'Fotos obligatorias',
        validate: (p) => p.initialPhoto && p.finalPhoto,
        errorMessage: 'Completa ambas fotos de visita.'
      },
      {
        stepIndex: 3,
        eventName: 'CREATE_ORDER_CONFIG',
        description: 'Configuración B2B Crédito 60 días Lista EC',
        validate: (p) => p.paymentCondition === 'credito_60' && p.priceList === 'EC' && p.line === 'lubricantes',
        errorMessage: 'El caso exige Crédito 60 días, Lista EC y Línea Lubricantes.'
      },
      {
        stepIndex: 4,
        eventName: 'ADD_PRODUCT',
        description: 'Agregar 1 cilindro Retinax HD2 sin promo',
        validate: (p) => Number(p.quantity) === 1,
        errorMessage: 'Agrega 1 unidad de cilindro Retinax HD2.'
      },
      {
        stepIndex: 5,
        eventName: 'SUBMIT_ORDER',
        description: 'Confirmar orden',
        validate: (p) => p.confirmed === true,
        errorMessage: 'Confirma la orden de compra.'
      }
    ]
  },
  {
    id: 'case-4',
    code: 'B2C-04',
    title: 'Caso 4: [TRAMPA] Tracking de precio de competencia solo con foto',
    module: 'Precios y Competencia',
    client: 'Ferretería Los Andes S.A.C.',
    clientAddress: 'AV. TOMAS TUYRUTUPAC 412',
    paymentCondition: 'contado',
    priceList: '1',
    line: 'lubricantes',
    brand: 'shell',
    instructions: 'Al realizar el tracking de precios de la competencia, debes registrar obligatoriamente tanto el precio numérico como las fotos antes de guardar el pedido.',
    isTrap: true,
    active: true,
    scoring: { maxScore: 20, penaltyPerError: 10, maxErrorsAllowed: 1, scale: 'vigesimal' },
    rules: [
      {
        stepIndex: 0,
        eventName: 'SELECT_CLIENT',
        description: 'Seleccionar cliente Ferretería Los Andes',
        validate: (p) => (p.clientName || '').toLowerCase().includes('andes'),
        errorMessage: 'Selecciona Ferretería Los Andes.'
      },
      {
        stepIndex: 1,
        eventName: 'SELECT_ACTION',
        description: 'Iniciar visita',
        validate: (p) => p.action === 'iniciar',
        errorMessage: 'Inicia la visita al cliente.'
      },
      {
        stepIndex: 2,
        eventName: 'SAVE_PHOTOS',
        description: 'Registrar fotos obligatorias de visita',
        validate: (p) => p.initialPhoto && p.finalPhoto,
        errorMessage: 'Debes registrar ambas fotos obligatorias.'
      },
      {
        stepIndex: 3,
        eventName: 'CREATE_ORDER_CONFIG',
        description: 'Crear configuración de pedido',
        validate: (p) => Boolean(p.paymentCondition && p.priceList),
        errorMessage: 'Configura la condición y lista de precios.'
      },
      {
        stepIndex: 4,
        eventName: 'ADD_PRODUCT',
        description: 'Seleccionar producto',
        validate: (p) => Number(p.quantity) >= 1,
        errorMessage: 'Agrega el producto evaluado.'
      },
      {
        stepIndex: 5,
        eventName: 'SUBMIT_ORDER',
        description: 'Confirmar orden',
        validate: (p) => p.confirmed === true,
        errorMessage: 'Confirma la orden.'
      }
    ]
  },
  {
    id: 'case-5',
    code: 'B2C-05',
    title: 'Caso 5: [TRAMPA] Cobranza sin consolidado al cierre',
    module: 'Cobranzas',
    client: 'Comercial Vega Hnos.',
    clientAddress: 'CALLE MERCADERES 301',
    paymentCondition: 'contado',
    priceList: '1',
    line: 'lubricantes',
    brand: 'shell',
    instructions: 'Luego de gestionar cobros en ruta, es indispensable verificar el cierre de visita y registrar las evidencias completas antes de finalizar la jornada.',
    isTrap: true,
    active: true,
    scoring: { maxScore: 20, penaltyPerError: 10, maxErrorsAllowed: 1, scale: 'vigesimal' },
    rules: [
      {
        stepIndex: 0,
        eventName: 'SELECT_CLIENT',
        description: 'Seleccionar cliente Comercial Vega Hnos.',
        validate: (p) => (p.clientName || '').toLowerCase().includes('vega'),
        errorMessage: 'Busca a Comercial Vega Hnos.'
      },
      {
        stepIndex: 1,
        eventName: 'SELECT_ACTION',
        description: 'Iniciar visita',
        validate: (p) => p.action === 'iniciar',
        errorMessage: 'Inicia la visita.'
      },
      {
        stepIndex: 2,
        eventName: 'SAVE_PHOTOS',
        description: 'Registrar fotos de visita',
        validate: (p) => p.initialPhoto && p.finalPhoto,
        errorMessage: 'Registra ambas fotos requeridas.'
      },
      {
        stepIndex: 3,
        eventName: 'CREATE_ORDER_CONFIG',
        description: 'Configurar pedido',
        validate: (p) => Boolean(p.paymentCondition),
        errorMessage: 'Selecciona condición de pago.'
      },
      {
        stepIndex: 4,
        eventName: 'ADD_PRODUCT',
        description: 'Agregar producto',
        validate: (p) => Number(p.quantity) >= 1,
        errorMessage: 'Agrega al menos 1 producto.'
      },
      {
        stepIndex: 5,
        eventName: 'SUBMIT_ORDER',
        description: 'Confirmar orden',
        validate: (p) => p.confirmed === true,
        errorMessage: 'Confirma la orden.'
      }
    ]
  },
  {
    id: 'case-6',
    code: 'B2C-06',
    title: 'Caso 6: Consulta de nota de crédito histórica',
    module: 'Documentos Electrónicos',
    client: 'Comercial Vega Hnos.',
    clientAddress: 'CALLE MERCADERES 301',
    paymentCondition: 'contado',
    priceList: '1',
    line: 'lubricantes',
    brand: 'shell',
    instructions: 'Inicia la visita en Comercial Vega Hnos., verifica su perfil crediticio y consulta los documentos históricos en la app.',
    active: true,
    scoring: { maxScore: 20, penaltyPerError: 4, maxErrorsAllowed: 2, scale: 'vigesimal' },
    rules: [
      {
        stepIndex: 0,
        eventName: 'SELECT_CLIENT',
        description: 'Seleccionar a Comercial Vega Hnos.',
        validate: (p) => (p.clientName || '').toLowerCase().includes('vega'),
        errorMessage: 'Selecciona a Comercial Vega Hnos.'
      },
      {
        stepIndex: 1,
        eventName: 'SELECT_ACTION',
        description: 'Iniciar visita',
        validate: (p) => p.action === 'iniciar',
        errorMessage: 'Presiona "Iniciar visita".'
      },
      {
        stepIndex: 2,
        eventName: 'SAVE_PHOTOS',
        description: 'Fotos de visita',
        validate: (p) => p.initialPhoto && p.finalPhoto,
        errorMessage: 'Registra las fotos de visita.'
      },
      {
        stepIndex: 3,
        eventName: 'CREATE_ORDER_CONFIG',
        description: 'Configuración comercial',
        validate: (p) => Boolean(p.paymentCondition),
        errorMessage: 'Configura la condición comercial.'
      },
      {
        stepIndex: 4,
        eventName: 'ADD_PRODUCT',
        description: 'Agregar producto de consulta',
        validate: (p) => Number(p.quantity) >= 1,
        errorMessage: 'Selecciona el producto.'
      },
      {
        stepIndex: 5,
        eventName: 'SUBMIT_ORDER',
        description: 'Confirmar verificación',
        validate: (p) => p.confirmed === true,
        errorMessage: 'Confirma la orden.'
      }
    ]
  },
  {
    id: 'case-7',
    code: 'B2C-07',
    title: 'Caso 7: Ver y compartir estado de cuenta',
    module: 'Mis Clientes',
    client: 'Grupo Ferretero Miraflores',
    clientAddress: 'AV. SAN JERONIMO 210',
    paymentCondition: 'credito_30',
    priceList: 'OF',
    line: 'neumaticos',
    brand: 'michelin',
    instructions: 'Ubica a Grupo Ferretero Miraflores en tu ruta, revisa su perfil de deuda y procesa su orden de reposición.',
    active: true,
    scoring: { maxScore: 20, penaltyPerError: 4, maxErrorsAllowed: 2, scale: 'vigesimal' },
    rules: [
      {
        stepIndex: 0,
        eventName: 'SELECT_CLIENT',
        description: 'Seleccionar Grupo Ferretero Miraflores',
        validate: (p) => (p.clientName || '').toLowerCase().includes('miraflores'),
        errorMessage: 'Selecciona Grupo Ferretero Miraflores.'
      },
      {
        stepIndex: 1,
        eventName: 'SELECT_ACTION',
        description: 'Iniciar visita',
        validate: (p) => p.action === 'iniciar',
        errorMessage: 'Inicia la visita.'
      },
      {
        stepIndex: 2,
        eventName: 'SAVE_PHOTOS',
        description: 'Registrar fotos de visita',
        validate: (p) => p.initialPhoto && p.finalPhoto,
        errorMessage: 'Registra ambas fotos.'
      },
      {
        stepIndex: 3,
        eventName: 'CREATE_ORDER_CONFIG',
        description: 'Configurar pedido crédito 30 días',
        validate: (p) => p.paymentCondition === 'credito_30',
        errorMessage: 'Selecciona Crédito 30 días.'
      },
      {
        stepIndex: 4,
        eventName: 'ADD_PRODUCT',
        description: 'Agregar producto',
        validate: (p) => Number(p.quantity) >= 1,
        errorMessage: 'Agrega el producto.'
      },
      {
        stepIndex: 5,
        eventName: 'SUBMIT_ORDER',
        description: 'Confirmar orden',
        validate: (p) => p.confirmed === true,
        errorMessage: 'Confirma la orden.'
      }
    ]
  },
  {
    id: 'case-8',
    code: 'B2C-08',
    title: 'Caso 8: Seguimiento de pedido emitido',
    module: 'Pedidos',
    client: 'Autopartes El Rápido',
    clientAddress: 'JR. PIEROLA 540',
    paymentCondition: 'contado',
    priceList: '1',
    line: 'lubricantes',
    brand: 'shell',
    instructions: 'Selecciona a Autopartes El Rápido en tu ruta y emite la orden de confirmación con datos verificados.',
    active: true,
    scoring: { maxScore: 20, penaltyPerError: 4, maxErrorsAllowed: 2, scale: 'vigesimal' },
    rules: [
      {
        stepIndex: 0,
        eventName: 'SELECT_CLIENT',
        description: 'Seleccionar Autopartes El Rápido',
        validate: (p) => (p.clientName || '').toLowerCase().includes('rapido') || (p.clientName || '').toLowerCase().includes('rápido'),
        errorMessage: 'Selecciona Autopartes El Rápido.'
      },
      {
        stepIndex: 1,
        eventName: 'SELECT_ACTION',
        description: 'Iniciar visita',
        validate: (p) => p.action === 'iniciar',
        errorMessage: 'Inicia la visita.'
      },
      {
        stepIndex: 2,
        eventName: 'SAVE_PHOTOS',
        description: 'Tomar fotos',
        validate: (p) => p.initialPhoto && p.finalPhoto,
        errorMessage: 'Registra las fotos de visita.'
      },
      {
        stepIndex: 3,
        eventName: 'CREATE_ORDER_CONFIG',
        description: 'Configuración comercial',
        validate: (p) => Boolean(p.paymentCondition),
        errorMessage: 'Configura la condición.'
      },
      {
        stepIndex: 4,
        eventName: 'ADD_PRODUCT',
        description: 'Agregar producto',
        validate: (p) => Number(p.quantity) >= 1,
        errorMessage: 'Agrega el producto.'
      },
      {
        stepIndex: 5,
        eventName: 'SUBMIT_ORDER',
        description: 'Confirmar orden',
        validate: (p) => p.confirmed === true,
        errorMessage: 'Confirma la orden.'
      }
    ]
  },
  {
    id: 'case-9',
    code: 'B2C-09',
    title: 'Caso 9: Venta con regalo por volumen (Lubricantes Shell)',
    module: 'Ventas B2C',
    client: 'Servicentro El Faro',
    clientAddress: 'AV. DOLORES 880',
    paymentCondition: 'contado',
    paymentConditionLabel: 'Contado (5% desc.)',
    priceList: '2',
    line: 'lubricantes',
    brand: 'shell',
    product: 'Shell Helix HX7 Balde',
    unitPrice: 25.0,
    expectedQty: 5,
    promoDiscount: true,
    promoLabel: '🎁 Regalo: 1 caja de botellas Shell Helix Plus',
    instructions: '1. Inicia visita en Servicentro El Faro.\n2. Registra las fotos de visita.\n3. Crea pedido a Contado con Lista 2, línea Lubricantes, marca Shell.\n4. Agrega 5 baldes Helix HX7 y activa la promo de regalo.\n5. Confirma la orden.',
    active: true,
    scoring: { maxScore: 20, penaltyPerError: 4, maxErrorsAllowed: 2, scale: 'vigesimal' },
    rules: [
      {
        stepIndex: 0,
        eventName: 'SELECT_CLIENT',
        description: 'Seleccionar Servicentro El Faro',
        validate: (p) => (p.clientName || '').toLowerCase().includes('faro'),
        errorMessage: 'Selecciona Servicentro El Faro.'
      },
      {
        stepIndex: 1,
        eventName: 'SELECT_ACTION',
        description: 'Iniciar visita',
        validate: (p) => p.action === 'iniciar',
        errorMessage: 'Inicia la visita.'
      },
      {
        stepIndex: 2,
        eventName: 'SAVE_PHOTOS',
        description: 'Registrar fotos',
        validate: (p) => p.initialPhoto && p.finalPhoto,
        errorMessage: 'Registra ambas fotos.'
      },
      {
        stepIndex: 3,
        eventName: 'CREATE_ORDER_CONFIG',
        description: 'Configurar pedido (Contado, Lista 2, Lubricantes Shell)',
        validate: (p) => p.paymentCondition === 'contado' && p.priceList === '2' && p.line === 'lubricantes' && p.brand === 'shell',
        errorMessage: 'Configuración incorrecta: Contado, Lista 2, Lubricantes Shell.'
      },
      {
        stepIndex: 4,
        eventName: 'ADD_PRODUCT',
        description: 'Agregar 5 baldes Helix HX7',
        validate: (p) => Number(p.quantity) === 5,
        errorMessage: 'Agrega exactamente 5 baldes.'
      },
      {
        stepIndex: 5,
        eventName: 'SUBMIT_ORDER',
        description: 'Confirmar orden',
        validate: (p) => p.confirmed === true,
        errorMessage: 'Confirma la orden de compra.'
      }
    ]
  },
  {
    id: 'case-10',
    code: 'B2C-10',
    title: 'Caso 10: Pedido corporativo grande a crédito 45 días',
    module: 'Ventas B2B',
    client: 'Minera Andina Contratistas SAC',
    clientAddress: 'PARQUE INDUSTRIAL MZ G LOTE 3',
    paymentCondition: 'credito_45',
    paymentConditionLabel: 'Crédito 45 días (2% desc.)',
    priceList: 'EC',
    line: 'lubricantes',
    brand: 'shell',
    product: 'Shell Retinax HD2 Cilindro',
    unitPrice: 350.0,
    expectedQty: 2,
    promoDiscount: true,
    promoLabel: '🎁 Descuento por Volumen: -$40.00 USD',
    instructions: '1. Inicia visita en Minera Andina Contratistas SAC.\n2. Registra las fotos de visita.\n3. Crea pedido a Crédito 45 días con Lista EC, línea Lubricantes, marca Shell.\n4. Agrega 2 cilindros Retinax HD2 y activa el descuento aprovisionado de $40 USD.\n5. Confirma la orden.',
    active: true,
    scoring: { maxScore: 20, penaltyPerError: 4, maxErrorsAllowed: 2, scale: 'vigesimal' },
    rules: [
      {
        stepIndex: 0,
        eventName: 'SELECT_CLIENT',
        description: 'Seleccionar Minera Andina Contratistas SAC',
        validate: (p) => (p.clientName || '').toLowerCase().includes('minera') || (p.clientName || '').toLowerCase().includes('andina'),
        errorMessage: 'Selecciona Minera Andina Contratistas SAC.'
      },
      {
        stepIndex: 1,
        eventName: 'SELECT_ACTION',
        description: 'Iniciar visita',
        validate: (p) => p.action === 'iniciar',
        errorMessage: 'Inicia la visita.'
      },
      {
        stepIndex: 2,
        eventName: 'SAVE_PHOTOS',
        description: 'Fotos obligatorias',
        validate: (p) => p.initialPhoto && p.finalPhoto,
        errorMessage: 'Registra las fotos de visita.'
      },
      {
        stepIndex: 3,
        eventName: 'CREATE_ORDER_CONFIG',
        description: 'Configurar Crédito 45 días Lista EC Lubricantes',
        validate: (p) => p.paymentCondition === 'credito_45' && p.priceList === 'EC' && p.line === 'lubricantes',
        errorMessage: 'Configuración incorrecta: Crédito 45 días, Lista EC, Línea Lubricantes.'
      },
      {
        stepIndex: 4,
        eventName: 'ADD_PRODUCT',
        description: 'Agregar 2 cilindros con descuento por volumen',
        validate: (p) => Number(p.quantity) === 2 && Boolean(p.promoDiscount),
        errorMessage: 'Debes agregar 2 cilindros y activar el descuento de $40 USD.'
      },
      {
        stepIndex: 5,
        eventName: 'SUBMIT_ORDER',
        description: 'Confirmar orden',
        validate: (p) => p.confirmed === true,
        errorMessage: 'Confirma la orden.'
      }
    ]
  },
  {
    id: 'case-11',
    code: 'B2C-11',
    title: 'Caso 11: Cliente nuevo, primera compra con lista OF',
    module: 'Mis Clientes',
    client: 'Repuestos Central Chincha',
    clientAddress: 'AV. EJERCITO 1022',
    paymentCondition: 'contado',
    priceList: 'OF',
    line: 'lubricantes',
    brand: 'shell',
    product: 'Shell Helix Plus Botella',
    unitPrice: 5.0,
    expectedQty: 3,
    promoDiscount: false,
    instructions: '1. Inicia visita en Repuestos Central Chincha.\n2. Registra las fotos de visita obligatorias.\n3. Crea pedido a Contado con Lista OF (cliente sin historial previo), línea Lubricantes, marca Shell.\n4. Agrega 3 botellas Helix Plus.\n5. Confirma la orden.',
    active: true,
    scoring: { maxScore: 20, penaltyPerError: 4, maxErrorsAllowed: 2, scale: 'vigesimal' },
    rules: [
      {
        stepIndex: 0,
        eventName: 'SELECT_CLIENT',
        description: 'Seleccionar Repuestos Central Chincha',
        validate: (p) => (p.clientName || '').toLowerCase().includes('chincha') || (p.clientName || '').toLowerCase().includes('central'),
        errorMessage: 'Selecciona Repuestos Central Chincha.'
      },
      {
        stepIndex: 1,
        eventName: 'SELECT_ACTION',
        description: 'Iniciar visita',
        validate: (p) => p.action === 'iniciar',
        errorMessage: 'Inicia la visita.'
      },
      {
        stepIndex: 2,
        eventName: 'SAVE_PHOTOS',
        description: 'Fotos de visita',
        validate: (p) => p.initialPhoto && p.finalPhoto,
        errorMessage: 'Registra ambas fotos.'
      },
      {
        stepIndex: 3,
        eventName: 'CREATE_ORDER_CONFIG',
        description: 'Configuración Contado Lista OF Lubricantes',
        validate: (p) => p.paymentCondition === 'contado' && p.priceList === 'OF' && p.line === 'lubricantes',
        errorMessage: 'Cliente nuevo debe cotizarse a Contado con Lista OF.'
      },
      {
        stepIndex: 4,
        eventName: 'ADD_PRODUCT',
        description: 'Agregar 3 botellas',
        validate: (p) => Number(p.quantity) === 3,
        errorMessage: 'Agrega 3 botellas de Helix Plus.'
      },
      {
        stepIndex: 5,
        eventName: 'SUBMIT_ORDER',
        description: 'Confirmar orden',
        validate: (p) => p.confirmed === true,
        errorMessage: 'Confirma la orden.'
      }
    ]
  },
  {
    id: 'case-12',
    code: 'B2C-12',
    title: 'Caso 12: Repuestos sin promoción aplicable',
    module: 'Ventas B2C',
    client: 'Taller Hyundai Express',
    clientAddress: 'AV. MARISCAL CASTILLA 714',
    paymentCondition: 'credito_15',
    paymentConditionLabel: 'Crédito 15 días (4% desc.)',
    priceList: '1',
    line: 'repuestos',
    brand: 'michelin',
    product: 'Repuesto Disco de Freno',
    unitPrice: 40.0,
    expectedQty: 2,
    promoDiscount: false,
    instructions: '1. Inicia visita en Taller Hyundai Express.\n2. Registra las fotos de visita.\n3. Crea pedido a Crédito 15 días con Lista 1, línea Repuestos.\n4. Agrega 2 unidades sin activar promoción (la línea de repuestos no cuenta con promociones por volumen).\n5. Confirma la orden.',
    active: true,
    scoring: { maxScore: 20, penaltyPerError: 4, maxErrorsAllowed: 2, scale: 'vigesimal' },
    rules: [
      {
        stepIndex: 0,
        eventName: 'SELECT_CLIENT',
        description: 'Seleccionar Taller Hyundai Express',
        validate: (p) => (p.clientName || '').toLowerCase().includes('hyundai') || (p.clientName || '').toLowerCase().includes('express'),
        errorMessage: 'Selecciona Taller Hyundai Express.'
      },
      {
        stepIndex: 1,
        eventName: 'SELECT_ACTION',
        description: 'Iniciar visita',
        validate: (p) => p.action === 'iniciar',
        errorMessage: 'Inicia la visita.'
      },
      {
        stepIndex: 2,
        eventName: 'SAVE_PHOTOS',
        description: 'Fotos de visita',
        validate: (p) => p.initialPhoto && p.finalPhoto,
        errorMessage: 'Registra las fotos de visita.'
      },
      {
        stepIndex: 3,
        eventName: 'CREATE_ORDER_CONFIG',
        description: 'Configurar Crédito 15 días Lista 1 Repuestos',
        validate: (p) => p.paymentCondition === 'credito_15' && p.priceList === '1' && p.line === 'repuestos',
        errorMessage: 'Configuración: Crédito 15 días, Lista 1, Línea Repuestos.'
      },
      {
        stepIndex: 4,
        eventName: 'ADD_PRODUCT',
        description: 'Agregar 2 unidades sin promo',
        validate: (p) => Number(p.quantity) === 2 && !p.promoDiscount,
        errorMessage: 'Agrega 2 unidades y desactiva cualquier promoción (Repuestos no aplica promo).'
      },
      {
        stepIndex: 5,
        eventName: 'SUBMIT_ORDER',
        description: 'Confirmar orden',
        validate: (p) => p.confirmed === true,
        errorMessage: 'Confirma la orden.'
      }
    ]
  },
  {
    id: 'case-13',
    code: 'B2C-13',
    title: 'Caso 13: [TRAMPA] Condición de pago mal aplicada',
    module: 'Pedidos',
    client: 'Comercial San Martín',
    clientAddress: 'CALLE SAN MARTIN 115',
    paymentCondition: 'credito_30',
    priceList: 'OF',
    line: 'neumaticos',
    brand: 'michelin',
    product: 'Michelin Energy XM2+',
    unitPrice: 55.0,
    expectedQty: 2,
    promoDiscount: false,
    instructions: '1. Inicia visita en Comercial San Martín.\n2. Registra las fotos de visita.\n3. Crea pedido a Crédito 30 días con Lista OF, línea Neumáticos, marca Michelin.\n4. Verifica que el descuento financiero corresponda al 3% (y no a 5% de contado).\n5. Confirma la orden.',
    isTrap: true,
    active: true,
    scoring: { maxScore: 20, penaltyPerError: 10, maxErrorsAllowed: 1, scale: 'vigesimal' },
    rules: [
      {
        stepIndex: 0,
        eventName: 'SELECT_CLIENT',
        description: 'Seleccionar Comercial San Martín',
        validate: (p) => (p.clientName || '').toLowerCase().includes('martin') || (p.clientName || '').toLowerCase().includes('martín'),
        errorMessage: 'Selecciona Comercial San Martín.'
      },
      {
        stepIndex: 1,
        eventName: 'SELECT_ACTION',
        description: 'Iniciar visita',
        validate: (p) => p.action === 'iniciar',
        errorMessage: 'Inicia la visita.'
      },
      {
        stepIndex: 2,
        eventName: 'SAVE_PHOTOS',
        description: 'Fotos de visita',
        validate: (p) => p.initialPhoto && p.finalPhoto,
        errorMessage: 'Registra ambas fotos.'
      },
      {
        stepIndex: 3,
        eventName: 'CREATE_ORDER_CONFIG',
        description: 'Configurar Crédito 30 días Lista OF',
        validate: (p) => p.paymentCondition === 'credito_30' && p.priceList === 'OF',
        errorMessage: 'Debe configurarse Crédito 30 días y Lista OF.'
      },
      {
        stepIndex: 4,
        eventName: 'ADD_PRODUCT',
        description: 'Agregar producto',
        validate: (p) => Number(p.quantity) >= 1,
        errorMessage: 'Agrega el producto.'
      },
      {
        stepIndex: 5,
        eventName: 'SUBMIT_ORDER',
        description: 'Confirmar orden verificando 3% de crédito',
        validate: (p) => p.confirmed === true,
        errorMessage: 'Confirma la orden.'
      }
    ]
  },
  {
    id: 'case-14',
    code: 'B2C-14',
    title: 'Caso 14: Venta B2B con descuento por volumen y crédito 60 días',
    module: 'Ventas B2B',
    client: 'Constructora Vial Perú SAC',
    clientAddress: 'AV. PARQUE INDUSTRIAL 450',
    paymentCondition: 'credito_60',
    paymentConditionLabel: 'Crédito 60 días (1% desc.)',
    priceList: 'EC',
    line: 'neumaticos',
    brand: 'michelin',
    product: 'Michelin Latitude Tour HP',
    unitPrice: 60.0,
    expectedQty: 6,
    promoDiscount: true,
    promoLabel: '🎁 Descuento por Volumen B2B (6+ cajas: -$15.00)',
    instructions: '1. Inicia visita en Constructora Vial Perú SAC.\n2. Registra las fotos de visita.\n3. Crea pedido a Crédito 60 días con Lista EC, línea Neumáticos, marca Michelin.\n4. Agrega 6 cajas Latitude Tour y activa el descuento de volumen de $15 USD.\n5. Confirma la orden.',
    active: true,
    scoring: { maxScore: 20, penaltyPerError: 4, maxErrorsAllowed: 2, scale: 'vigesimal' },
    rules: [
      {
        stepIndex: 0,
        eventName: 'SELECT_CLIENT',
        description: 'Seleccionar Constructora Vial Perú SAC',
        validate: (p) => (p.clientName || '').toLowerCase().includes('vial') || (p.clientName || '').toLowerCase().includes('constructora'),
        errorMessage: 'Selecciona Constructora Vial Perú SAC.'
      },
      {
        stepIndex: 1,
        eventName: 'SELECT_ACTION',
        description: 'Iniciar visita',
        validate: (p) => p.action === 'iniciar',
        errorMessage: 'Inicia la visita.'
      },
      {
        stepIndex: 2,
        eventName: 'SAVE_PHOTOS',
        description: 'Fotos de visita',
        validate: (p) => p.initialPhoto && p.finalPhoto,
        errorMessage: 'Registra las fotos.'
      },
      {
        stepIndex: 3,
        eventName: 'CREATE_ORDER_CONFIG',
        description: 'Configurar Crédito 60 días Lista EC Neumáticos Michelin',
        validate: (p) => p.paymentCondition === 'credito_60' && p.priceList === 'EC' && p.line === 'neumaticos' && p.brand === 'michelin',
        errorMessage: 'Configuración: Crédito 60 días, Lista EC, Neumáticos Michelin.'
      },
      {
        stepIndex: 4,
        eventName: 'ADD_PRODUCT',
        description: 'Agregar 6 cajas con promo activada',
        validate: (p) => Number(p.quantity) === 6 && Boolean(p.promoDiscount),
        errorMessage: 'Agrega 6 cajas con el descuento de volumen activado.'
      },
      {
        stepIndex: 5,
        eventName: 'SUBMIT_ORDER',
        description: 'Confirmar orden',
        validate: (p) => p.confirmed === true,
        errorMessage: 'Confirma la orden.'
      }
    ]
  },
  {
    id: 'case-15',
    code: 'B2C-15',
    title: 'Caso 15: Revisión de historial de visitas antes de nueva venta',
    module: 'Historial de Visitas',
    client: 'Bodega y Ferretería Dos Hermanos',
    clientAddress: 'AV. GOYENECHE 1201',
    paymentCondition: 'contado',
    paymentConditionLabel: 'Contado (5% desc.)',
    priceList: '1',
    line: 'lubricantes',
    brand: 'shell',
    product: 'Shell Helix HX5 Balde',
    unitPrice: 20.0,
    expectedQty: 4,
    promoDiscount: false,
    promoLabel: 'Sin promoción (regalo de volumen ya fue entregado este mes)',
    instructions: '1. Inicia visita en Bodega y Ferretería Dos Hermanos.\n2. Registra las fotos de visita.\n3. Crea pedido a Contado con Lista 1, línea Lubricantes, marca Shell.\n4. Agrega 4 baldes Helix HX5 sin activar regalo (ya fue entregado en el mes según historial).\n5. Confirma la orden.',
    active: true,
    scoring: { maxScore: 20, penaltyPerError: 4, maxErrorsAllowed: 2, scale: 'vigesimal' },
    rules: [
      {
        stepIndex: 0,
        eventName: 'SELECT_CLIENT',
        description: 'Seleccionar Bodega y Ferretería Dos Hermanos',
        validate: (p) => (p.clientName || '').toLowerCase().includes('hermanos') || (p.clientName || '').toLowerCase().includes('dos'),
        errorMessage: 'Selecciona Bodega y Ferretería Dos Hermanos.'
      },
      {
        stepIndex: 1,
        eventName: 'SELECT_ACTION',
        description: 'Iniciar visita',
        validate: (p) => p.action === 'iniciar',
        errorMessage: 'Inicia la visita.'
      },
      {
        stepIndex: 2,
        eventName: 'SAVE_PHOTOS',
        description: 'Fotos de visita',
        validate: (p) => p.initialPhoto && p.finalPhoto,
        errorMessage: 'Registra las fotos.'
      },
      {
        stepIndex: 3,
        eventName: 'CREATE_ORDER_CONFIG',
        description: 'Configurar Contado Lista 1 Lubricantes Shell',
        validate: (p) => p.paymentCondition === 'contado' && p.priceList === '1' && p.line === 'lubricantes' && p.brand === 'shell',
        errorMessage: 'Configuración: Contado, Lista 1, Lubricantes Shell.'
      },
      {
        stepIndex: 4,
        eventName: 'ADD_PRODUCT',
        description: 'Agregar 4 baldes sin regalo duplicado',
        validate: (p) => Number(p.quantity) === 4 && !p.promoDiscount,
        errorMessage: 'Agrega 4 baldes y NO actives la promo de regalo (ya entregada según historial).'
      },
      {
        stepIndex: 5,
        eventName: 'SUBMIT_ORDER',
        description: 'Confirmar orden',
        validate: (p) => p.confirmed === true,
        errorMessage: 'Confirma la orden.'
      }
    ]
  }
];
