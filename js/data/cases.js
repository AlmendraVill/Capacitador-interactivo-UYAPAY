/**
 * Catálogo Oficial de Casos Prácticos de Evaluación B2C - UYAPAY
 * Basado en "Casos de Prueba — Simulador UYAPAY Asesor B2C" y "Flujos de Resolución".
 * Cada caso contiene escenario, instrucciones, reglas de negocio y validación desacoplada.
 */
window.UyapayData = window.UyapayData || {};

// ================= MAESTRO OFICIAL DE PRODUCTOS MULTI-MARCA =================
window.UyapayData.PRODUCTS = [
  // LUBRICANTES - SHELL
  {
    id: 'prod-shell-hx7',
    sku: 'B-734807',
    name: 'Shell Helix HX7 10W/40',
    line: 'lubricantes',
    brand: 'shell',
    format: 'Balde 5 Gal',
    unitPrice: 22.0,
    hasPromo: true,
    promoType: 'gift',
    promoLabel: '🎁 Regalo: 2 botellas Shell Helix Plus 10W-40 (108203)',
    promoDiscountAmount: 0.0
  },
  {
    id: 'prod-shell-plus',
    sku: '108203',
    name: 'Shell Helix Plus 10W-40',
    line: 'lubricantes',
    brand: 'shell',
    format: 'Botella 1L',
    unitPrice: 5.0,
    hasPromo: false,
    promoType: 'none',
    promoLabel: 'Sin promoción aplicable',
    promoDiscountAmount: 0.0
  },
  {
    id: 'prod-shell-hx5',
    sku: 'B-542100',
    name: 'Shell Helix HX5 15W/40',
    line: 'lubricantes',
    brand: 'shell',
    format: 'Balde 5 Gal',
    unitPrice: 20.0,
    hasPromo: false,
    promoType: 'none',
    promoLabel: 'Sin promoción aplicable',
    promoDiscountAmount: 0.0
  },
  {
    id: 'prod-shell-retinax',
    sku: '218272',
    name: 'Shell Retinax HD2',
    line: 'lubricantes',
    brand: 'shell',
    format: 'Cilindro 55 Gal',
    unitPrice: 320.0,
    hasPromo: true,
    promoType: 'discount',
    promoLabel: '🎁 Descuento por Volumen: -$40.00 USD',
    promoDiscountAmount: 40.0
  },
  {
    id: 'prod-shell-rimula',
    sku: 'B-918230',
    name: 'Shell Rimula R4 X 15W-40',
    line: 'lubricantes',
    brand: 'shell',
    format: 'Balde 5 Gal',
    unitPrice: 28.0,
    hasPromo: false,
    promoType: 'none',
    promoLabel: 'Sin promoción aplicable',
    promoDiscountAmount: 0.0
  },

  // NEUMÁTICOS - MICHELIN
  {
    id: 'prod-mich-xm2',
    sku: '003718',
    name: 'Michelin Energy XM2+ 195/60 R15',
    line: 'neumaticos',
    brand: 'michelin',
    format: 'Caja máster',
    unitPrice: 55.0,
    hasPromo: true,
    promoType: 'discount',
    promoLabel: '🎁 Descuento por Volumen (3+ cajas: -$10.00 USD)',
    promoDiscountAmount: 10.0
  },
  {
    id: 'prod-mich-latitude',
    sku: '024009',
    name: 'Michelin Latitude Tour HP',
    line: 'neumaticos',
    brand: 'michelin',
    format: 'Caja máster',
    unitPrice: 48.0,
    hasPromo: true,
    promoType: 'discount',
    promoLabel: '🎁 Descuento por Volumen B2B (5+ cajas: -$15.00 USD)',
    promoDiscountAmount: 15.0
  },
  {
    id: 'prod-mich-xze2',
    sku: '337580',
    name: 'Michelin XZE2 215/75R17.5',
    line: 'neumaticos',
    brand: 'michelin',
    format: 'Unidad',
    unitPrice: 240.0,
    hasPromo: false,
    promoType: 'none',
    promoLabel: 'Sin promoción aplicable',
    promoDiscountAmount: 0.0
  },
  {
    id: 'prod-mich-primacy',
    sku: '005488',
    name: 'Michelin Primacy 4 205/55 R16',
    line: 'neumaticos',
    brand: 'michelin',
    format: 'Unidad',
    unitPrice: 65.0,
    hasPromo: false,
    promoType: 'none',
    promoLabel: 'Sin promoción aplicable',
    promoDiscountAmount: 0.0
  },

  // NEUMÁTICOS - BFGOODRICH
  {
    id: 'prod-bfg-advantage',
    sku: '112036',
    name: 'BFGoodrich Advantage T/A SUV GO',
    line: 'neumaticos',
    brand: 'bfgoodrich',
    format: 'Unidad',
    unitPrice: 180.0,
    hasPromo: false,
    promoType: 'none',
    promoLabel: 'Sin promoción aplicable',
    promoDiscountAmount: 0.0
  },
  {
    id: 'prod-bfg-ggrip',
    sku: '050404',
    name: 'BFGoodrich G-Grip 205/60 R15',
    line: 'neumaticos',
    brand: 'bfgoodrich',
    format: 'Unidad',
    unitPrice: 190.0,
    hasPromo: false,
    promoType: 'none',
    promoLabel: 'Sin promoción aplicable',
    promoDiscountAmount: 0.0
  },
  {
    id: 'prod-bfg-ko2',
    sku: '084321',
    name: 'BFGoodrich All-Terrain T/A KO2',
    line: 'neumaticos',
    brand: 'bfgoodrich',
    format: 'Unidad',
    unitPrice: 210.0,
    hasPromo: false,
    promoType: 'none',
    promoLabel: 'Sin promoción aplicable',
    promoDiscountAmount: 0.0
  },

  // REPUESTOS - HYUNDAI
  {
    id: 'prod-hyundai-disco',
    sku: '0K40C33251',
    name: 'Disco de Freno HD35',
    line: 'repuestos',
    brand: 'hyundai',
    format: 'Unidad',
    unitPrice: 40.0,
    hasPromo: false,
    promoType: 'none',
    promoLabel: 'Repuestos no participan de promociones',
    promoDiscountAmount: 0.0
  },
  {
    id: 'prod-hyundai-bujias',
    sku: '1882709087',
    name: 'Juego de Bujías Grand i10',
    line: 'repuestos',
    brand: 'hyundai',
    format: 'Set 4 unidades',
    unitPrice: 25.0,
    hasPromo: false,
    promoType: 'none',
    promoLabel: 'Repuestos no participan de promociones',
    promoDiscountAmount: 0.0
  },
  {
    id: 'prod-hyundai-collarin',
    sku: '4142126100',
    name: 'Collarín Accent Genuine',
    line: 'repuestos',
    brand: 'hyundai',
    format: 'Unidad',
    unitPrice: 35.0,
    hasPromo: false,
    promoType: 'none',
    promoLabel: 'Repuestos no participan de promociones',
    promoDiscountAmount: 0.0
  }
];

// ================= CATÁLOGO DE LOS 15 CASOS PRÁCTICOS OFICIALES =================
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
    promoType: 'gift',
    promoLabel: '🎁 Regalo: 2 botellas Shell Helix Plus 10W-40 (108203)',
    instructions: '1. Visitas: Inicia visita en Ferretería Los Andes S.A.C. (Juan Perez).\n2. Fotos: Registra fotos obligatorias de visita.\n3. Pedidos: Crea pedido a Contado con Lista 1, línea Lubricantes, marca Shell.\n4. Catálogo: Agrega 8 baldes Shell Helix HX7 10W/40 con la promo de regalo activada.\n5. Resumen: Verifica el 5% de descuento al contado y confirma la orden.',
    active: true,
    scoring: { maxScore: 20, penaltyPerError: 4, maxErrorsAllowed: 2, scale: 'vigesimal' },
    rules: [
      {
        stepIndex: 0,
        eventName: 'SELECT_CLIENT',
        description: 'Seleccionar Ferretería Los Andes en la ruta',
        validate: (p) => (p.clientName || '').toLowerCase().includes('andes') || (p.clientName || '').toLowerCase().includes('perez'),
        errorMessage: 'Ese no es el cliente indicado. Busca a Ferretería Los Andes S.A.C.'
      },
      {
        stepIndex: 1,
        eventName: 'SELECT_ACTION',
        description: 'Iniciar visita al cliente',
        validate: (p) => p.action === 'iniciar',
        errorMessage: 'Debes presionar "Iniciar visita" para comenzar la atención.'
      },
      {
        stepIndex: 2,
        eventName: 'SAVE_PHOTOS',
        description: 'Registrar fotos obligatorias inicial y final',
        validate: (p) => p.initialPhoto && p.finalPhoto,
        errorMessage: 'Debes registrar ambas fotos obligatorias (inicial y final).'
      },
      {
        stepIndex: 3,
        eventName: 'CREATE_ORDER_CONFIG',
        description: 'Configurar pedido (Contado, Lista 1, Lubricantes Shell)',
        validate: (p) => p.paymentCondition === 'contado' && p.priceList === '1' && p.line === 'lubricantes' && p.brand === 'shell',
        errorMessage: 'Configuración incorrecta. Revisa: Contado, Lista 1, Línea Lubricantes y Marca Shell.'
      },
      {
        stepIndex: 4,
        eventName: 'ADD_PRODUCT',
        description: 'Agregar 8 baldes Shell Helix HX7 con regalo activado',
        validate: (p) => (p.product || '').toLowerCase().includes('hx7') && Number(p.quantity) === 8 && Boolean(p.promoDiscount),
        errorMessage: 'Debes seleccionar Shell Helix HX7 10W/40, cantidad 8 baldes y activar la promoción de regalo.'
      },
      {
        stepIndex: 5,
        eventName: 'SUBMIT_ORDER',
        description: 'Confirmar orden con 5% de descuento al contado',
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
    clientAddress: 'AV. INDUSTRIAL 104 - SOCABAYA',
    paymentCondition: 'credito_30',
    paymentConditionLabel: 'Crédito 30 días (3% desc.)',
    priceList: 'OF',
    line: 'neumaticos',
    brand: 'michelin',
    product: 'Michelin Energy XM2+ 195/60 R15',
    unitPrice: 55.0,
    expectedQty: 3,
    promoDiscount: true,
    promoType: 'discount',
    promoDiscountAmount: 10.0,
    promoLabel: '🎁 Descuento por Volumen (3+ cajas: -$10.00 USD)',
    instructions: '1. Visitas: Inicia visita en Distribuidora Kanchis EIRL.\n2. Fotos: Registra fotos inicial y final obligatorias.\n3. Pedidos: Crea pedido a Crédito 30 días con Lista OF, línea Neumáticos, marca Michelin.\n4. Catálogo: Agrega 3 cajas Energy XM2+ y activa el descuento de USD 10.\n5. Resumen: Verifica el 3% de crédito ($4.65) para un total de USD 150.35 y confirma.',
    active: true,
    scoring: { maxScore: 20, penaltyPerError: 4, maxErrorsAllowed: 2, scale: 'vigesimal' },
    rules: [
      {
        stepIndex: 0,
        eventName: 'SELECT_CLIENT',
        description: 'Seleccionar Distribuidora Kanchis EIRL',
        validate: (p) => (p.clientName || '').toLowerCase().includes('kanchis'),
        errorMessage: 'Busca a Distribuidora Kanchis EIRL en el plan de visitas.'
      },
      {
        stepIndex: 1,
        eventName: 'SELECT_ACTION',
        description: 'Iniciar visita',
        validate: (p) => p.action === 'iniciar',
        errorMessage: 'Debes seleccionar "Iniciar visita".'
      },
      {
        stepIndex: 2,
        eventName: 'SAVE_PHOTOS',
        description: 'Registrar fotos obligatorias',
        validate: (p) => p.initialPhoto && p.finalPhoto,
        errorMessage: 'Debes registrar ambas fotos (inicial y final).'
      },
      {
        stepIndex: 3,
        eventName: 'CREATE_ORDER_CONFIG',
        description: 'Configurar Crédito 30 días, Lista OF, Neumáticos Michelin',
        validate: (p) => p.paymentCondition === 'credito_30' && p.priceList === 'OF' && p.line === 'neumaticos' && p.brand === 'michelin',
        errorMessage: 'Configuración incorrecta: Crédito 30 días, Lista OF, Neumáticos Michelin.'
      },
      {
        stepIndex: 4,
        eventName: 'ADD_PRODUCT',
        description: 'Agregar 3 cajas Energy XM2+ con descuento de $10 USD',
        validate: (p) => (p.product || '').toLowerCase().includes('energy') && Number(p.quantity) === 3 && Boolean(p.promoDiscount),
        errorMessage: 'Debes seleccionar Michelin Energy XM2+, cantidad 3 cajas y activar el descuento de $10 USD.'
      },
      {
        stepIndex: 5,
        eventName: 'SUBMIT_ORDER',
        description: 'Confirmar orden con total neto de USD 150.35',
        validate: (p) => p.confirmed === true,
        errorMessage: 'Debes confirmar y enviar la orden de compra.'
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
    product: 'Shell Retinax HD2',
    unitPrice: 320.0,
    expectedQty: 1,
    promoDiscount: false,
    promoType: 'none',
    promoLabel: 'Sin promoción aplicable',
    instructions: '1. Inicia visita en Transportes del Sur SAC.\n2. Registra fotos obligatorias.\n3. Pedidos: Crea pedido a Crédito 60 días con Lista EC, línea Lubricantes, marca Shell.\n4. Catálogo: Agrega 1 cilindro Shell Retinax HD2 sin promoción.\n5. Resumen: Verifica el 1% de crédito ($3.20) para un total de USD 316.80 y confirma.',
    active: true,
    scoring: { maxScore: 20, penaltyPerError: 4, maxErrorsAllowed: 2, scale: 'vigesimal' },
    rules: [
      {
        stepIndex: 0,
        eventName: 'SELECT_CLIENT',
        description: 'Seleccionar Transportes del Sur SAC',
        validate: (p) => (p.clientName || '').toLowerCase().includes('transportes'),
        errorMessage: 'Selecciona Transportes del Sur SAC.'
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
        errorMessage: 'Registra las fotos de visita obligatorias.'
      },
      {
        stepIndex: 3,
        eventName: 'CREATE_ORDER_CONFIG',
        description: 'Configurar Crédito 60 días, Lista EC, Lubricantes Shell',
        validate: (p) => p.paymentCondition === 'credito_60' && p.priceList === 'EC' && p.line === 'lubricantes' && p.brand === 'shell',
        errorMessage: 'Configura: Crédito 60 días, Lista EC, Línea Lubricantes y Marca Shell.'
      },
      {
        stepIndex: 4,
        eventName: 'ADD_PRODUCT',
        description: 'Agregar 1 cilindro Retinax HD2 sin promo',
        validate: (p) => (p.product || '').toLowerCase().includes('retinax') && Number(p.quantity) === 1,
        errorMessage: 'Debes seleccionar Shell Retinax HD2, cantidad 1 y sin promo activada.'
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
    paymentConditionLabel: 'Contado (5% desc.)',
    priceList: '1',
    line: 'lubricantes',
    brand: 'shell',
    product: 'Shell Helix HX7 10W/40',
    unitPrice: 22.0,
    expectedQty: 2,
    promoDiscount: false,
    promoType: 'none',
    instructions: '1. Inicia visita en Ferretería Los Andes S.A.C.\n2. Registra las fotos de visita.\n3. Pedidos: Crea pedido a Contado con Lista 1, línea Lubricantes, marca Shell.\n4. Agrega 2 baldes Helix HX7 y confirma el pedido.',
    isTrap: true,
    active: true,
    scoring: { maxScore: 20, penaltyPerError: 5, maxErrorsAllowed: 1, scale: 'vigesimal' },
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
        description: 'Configurar Contado, Lista 1, Lubricantes Shell',
        validate: (p) => p.paymentCondition === 'contado' && p.line === 'lubricantes',
        errorMessage: 'Configura condición Contado y línea Lubricantes.'
      },
      {
        stepIndex: 4,
        eventName: 'ADD_PRODUCT',
        description: 'Agregar producto',
        validate: (p) => Number(p.quantity) >= 1,
        errorMessage: 'Agrega el producto requerido.'
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
    paymentConditionLabel: 'Contado (5% desc.)',
    priceList: '1',
    line: 'lubricantes',
    brand: 'shell',
    product: 'Shell Helix HX5 15W/40',
    unitPrice: 20.0,
    expectedQty: 2,
    promoDiscount: false,
    promoType: 'none',
    instructions: '1. Inicia visita en Comercial Vega Hnos.\n2. Registra las fotos de visita.\n3. Pedidos: Crea pedido a Contado con Lista 1, línea Lubricantes, marca Shell.\n4. Agrega 2 baldes Helix HX5 y confirma la orden.',
    isTrap: true,
    active: true,
    scoring: { maxScore: 20, penaltyPerError: 5, maxErrorsAllowed: 1, scale: 'vigesimal' },
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
    paymentConditionLabel: 'Contado (5% desc.)',
    priceList: '1',
    line: 'lubricantes',
    brand: 'shell',
    product: 'Shell Rimula R4 X 15W-40',
    unitPrice: 28.0,
    expectedQty: 1,
    promoDiscount: false,
    promoType: 'none',
    instructions: '1. Inicia visita en Comercial Vega Hnos.\n2. Registra las fotos de visita.\n3. Pedidos: Crea pedido a Contado con Lista 1, línea Lubricantes, marca Shell.\n4. Agrega 1 balde Rimula R4 X y confirma la orden.',
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
        description: 'Agregar producto',
        validate: (p) => Number(p.quantity) >= 1,
        errorMessage: 'Selecciona el producto.'
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
    id: 'case-7',
    code: 'B2C-07',
    title: 'Caso 7: Ver y compartir estado de cuenta',
    module: 'Mis Clientes',
    client: 'Grupo Ferretero Miraflores',
    clientAddress: 'AV. SAN JERONIMO 210',
    paymentCondition: 'credito_30',
    paymentConditionLabel: 'Crédito 30 días (3% desc.)',
    priceList: 'OF',
    line: 'neumaticos',
    brand: 'michelin',
    product: 'Michelin Energy XM2+ 195/60 R15',
    unitPrice: 55.0,
    expectedQty: 2,
    promoDiscount: false,
    promoType: 'none',
    instructions: '1. Inicia visita en Grupo Ferretero Miraflores.\n2. Registra las fotos de visita.\n3. Pedidos: Crea pedido a Crédito 30 días con Lista OF, línea Neumáticos, marca Michelin.\n4. Agrega 2 cajas Energy XM2+ y confirma la orden.',
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
    paymentConditionLabel: 'Contado (5% desc.)',
    priceList: '1',
    line: 'lubricantes',
    brand: 'shell',
    product: 'Shell Helix Plus 10W-40',
    unitPrice: 5.0,
    expectedQty: 4,
    promoDiscount: false,
    promoType: 'none',
    instructions: '1. Inicia visita en Autopartes El Rápido.\n2. Registra las fotos de visita.\n3. Pedidos: Crea pedido a Contado con Lista 1, línea Lubricantes, marca Shell.\n4. Agrega 4 botellas Helix Plus y confirma la orden.',
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
    product: 'Shell Helix HX7 10W/40',
    unitPrice: 25.0,
    expectedQty: 5,
    promoDiscount: true,
    promoType: 'gift',
    promoLabel: '🎁 Regalo: 1 caja de botellas Shell Helix Plus',
    instructions: '1. Inicia visita en Servicentro El Faro.\n2. Registra las fotos de visita.\n3. Pedidos: Crea pedido a Contado con Lista 2, línea Lubricantes, marca Shell.\n4. Catálogo: Agrega 5 baldes Helix HX7 y activa la promo de regalo.\n5. Resumen: Verifica el 5% de descuento al contado y confirma la orden.',
    active: true,
    scoring: { maxScore: 20, penaltyPerError: 4, maxErrorsAllowed: 2, scale: 'vigesimal' },
    rules: [
      {
        stepIndex: 0,
        eventName: 'SELECT_CLIENT',
        description: 'Seleccionar Servicentro El Faro',
        validate: (p) => (p.clientName || '').toLowerCase().includes('faro'),
        errorMessage: 'Selecciona a Servicentro El Faro.'
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
        errorMessage: 'Registra las fotos de visita.'
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
        description: 'Agregar 5 baldes Helix HX7 con promo regalo',
        validate: (p) => (p.product || '').toLowerCase().includes('hx7') && Number(p.quantity) === 5 && Boolean(p.promoDiscount),
        errorMessage: 'Agrega 5 baldes Shell Helix HX7 y activa la promoción de regalo.'
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
    id: 'case-10',
    code: 'B2C-10',
    title: 'Caso 10: Pedido corporativo grande a crédito 45 días',
    module: 'Ventas B2B',
    client: 'Minera Andina Contratistas SAC',
    clientAddress: 'PARQUE INDUSTRIAL MZ. C LOTE 4',
    paymentCondition: 'credito_45',
    paymentConditionLabel: 'Crédito 45 días (2% desc.)',
    priceList: 'EC',
    line: 'lubricantes',
    brand: 'shell',
    product: 'Shell Retinax HD2',
    unitPrice: 350.0,
    expectedQty: 2,
    promoDiscount: true,
    promoType: 'discount',
    promoDiscountAmount: 40.0,
    promoLabel: '🎁 Descuento por Volumen: -$40.00 USD',
    instructions: '1. Inicia visita en Minera Andina Contratistas SAC.\n2. Registra las fotos de visita.\n3. Pedidos: Crea pedido a Crédito 45 días con Lista EC, línea Lubricantes, marca Shell.\n4. Catálogo: Agrega 2 cilindros Retinax HD2 y activa el descuento de $40 USD.\n5. Resumen: Verifica el 2% de crédito ($13.20) para total USD 646.80 y confirma.',
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
        description: 'Configurar Crédito 45 días Lista EC Lubricantes Shell',
        validate: (p) => p.paymentCondition === 'credito_45' && p.priceList === 'EC' && p.line === 'lubricantes' && p.brand === 'shell',
        errorMessage: 'Configura: Crédito 45 días, Lista EC, Línea Lubricantes y Marca Shell.'
      },
      {
        stepIndex: 4,
        eventName: 'ADD_PRODUCT',
        description: 'Agregar 2 cilindros con descuento por volumen',
        validate: (p) => (p.product || '').toLowerCase().includes('retinax') && Number(p.quantity) === 2 && Boolean(p.promoDiscount),
        errorMessage: 'Agrega 2 cilindros Shell Retinax HD2 y activa el descuento de $40 USD.'
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
    module: 'Ventas B2C',
    client: 'Repuestos Central Chincha',
    clientAddress: 'CALLE LIMA 420',
    paymentCondition: 'contado',
    paymentConditionLabel: 'Contado (5% desc.)',
    priceList: 'OF',
    line: 'lubricantes',
    brand: 'shell',
    product: 'Shell Helix Plus 10W-40',
    unitPrice: 5.0,
    expectedQty: 3,
    promoDiscount: false,
    promoType: 'none',
    promoLabel: 'Sin promoción aplicable',
    instructions: '1. Inicia visita en Repuestos Central Chincha.\n2. Registra las fotos de visita obligatorias.\n3. Pedidos: Crea pedido a Contado con Lista OF (cliente nuevo), línea Lubricantes, marca Shell.\n4. Catálogo: Agrega 3 botellas Shell Helix Plus.\n5. Resumen: Verifica el 5% de descuento al contado (USD 14.25) y confirma la orden.',
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
        errorMessage: 'Registra las fotos de visita.'
      },
      {
        stepIndex: 3,
        eventName: 'CREATE_ORDER_CONFIG',
        description: 'Configurar Contado Lista OF Lubricantes Shell',
        validate: (p) => p.paymentCondition === 'contado' && p.priceList === 'OF' && p.line === 'lubricantes' && p.brand === 'shell',
        errorMessage: 'Configuración incorrecta: Contado, Lista OF, Lubricantes Shell.'
      },
      {
        stepIndex: 4,
        eventName: 'ADD_PRODUCT',
        description: 'Agregar 3 botellas Helix Plus',
        validate: (p) => (p.product || '').toLowerCase().includes('plus') && Number(p.quantity) === 3,
        errorMessage: 'Agrega 3 botellas Shell Helix Plus 10W-40.'
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
    clientAddress: 'AV. PARRA 314',
    paymentCondition: 'credito_15',
    paymentConditionLabel: 'Crédito 15 días (4% desc.)',
    priceList: '1',
    line: 'repuestos',
    brand: 'hyundai',
    product: 'Disco de Freno HD35',
    unitPrice: 40.0,
    expectedQty: 2,
    promoDiscount: false,
    promoType: 'none',
    promoLabel: 'Repuestos no participan de promociones',
    instructions: '1. Inicia visita en Taller Hyundai Express.\n2. Registra las fotos de visita.\n3. Pedidos: Crea pedido a Crédito 15 días con Lista 1, línea Repuestos, marca Hyundai.\n4. Catálogo: Agrega 2 unidades Disco de Freno HD35 sin promoción.\n5. Resumen: Verifica el 4% de crédito ($3.20) para total USD 76.80 y confirma.',
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
        description: 'Configurar Crédito 15 días Lista 1 Repuestos Hyundai',
        validate: (p) => p.paymentCondition === 'credito_15' && p.priceList === '1' && p.line === 'repuestos' && p.brand === 'hyundai',
        errorMessage: 'Configura: Crédito 15 días, Lista 1, Línea Repuestos y Marca Hyundai.'
      },
      {
        stepIndex: 4,
        eventName: 'ADD_PRODUCT',
        description: 'Agregar 2 discos de freno sin promo',
        validate: (p) => (p.product || '').toLowerCase().includes('freno') && Number(p.quantity) === 2,
        errorMessage: 'Agrega 2 unidades de Disco de Freno HD35 sin promoción.'
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
    module: 'Ventas B2C',
    client: 'Comercial San Martín',
    clientAddress: 'CALLE SAN MARTIN 112',
    paymentCondition: 'credito_30',
    paymentConditionLabel: 'Crédito 30 días (3% desc.)',
    priceList: 'OF',
    line: 'neumaticos',
    brand: 'michelin',
    product: 'Michelin Energy XM2+ 195/60 R15',
    unitPrice: 55.0,
    expectedQty: 2,
    promoDiscount: false,
    promoType: 'none',
    instructions: '1. Inicia visita en Comercial San Martín.\n2. Registra fotos obligatorias.\n3. Pedidos: Crea pedido a Crédito 30 días con Lista OF, línea Neumáticos, marca Michelin.\n4. Catálogo: Agrega 2 cajas Energy XM2+.\n5. Resumen: Verifica que el descuento financiero corresponda al 3% ($3.30) y confirma la orden.',
    isTrap: true,
    active: true,
    scoring: { maxScore: 20, penaltyPerError: 5, maxErrorsAllowed: 1, scale: 'vigesimal' },
    rules: [
      {
        stepIndex: 0,
        eventName: 'SELECT_CLIENT',
        description: 'Seleccionar Comercial San Martín',
        validate: (p) => (p.clientName || '').toLowerCase().includes('martin') || (p.clientName || '').toLowerCase().includes('martín'),
        errorMessage: 'Busca a Comercial San Martín en visitas.'
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
        description: 'Configurar Crédito 30 días Lista OF Neumáticos Michelin',
        validate: (p) => p.paymentCondition === 'credito_30' && p.priceList === 'OF' && p.line === 'neumaticos' && p.brand === 'michelin',
        errorMessage: 'Configura: Crédito 30 días, Lista OF, Neumáticos Michelin.'
      },
      {
        stepIndex: 4,
        eventName: 'ADD_PRODUCT',
        description: 'Agregar 2 cajas Energy XM2+',
        validate: (p) => (p.product || '').toLowerCase().includes('energy') && Number(p.quantity) === 2,
        errorMessage: 'Agrega 2 cajas Michelin Energy XM2+.'
      },
      {
        stepIndex: 5,
        eventName: 'SUBMIT_ORDER',
        description: 'Confirmar orden verificando 3% de crédito',
        validate: (p) => p.confirmed === true,
        errorMessage: 'Confirma la orden de compra.'
      }
    ]
  },
  {
    id: 'case-14',
    code: 'B2C-14',
    title: 'Caso 14: Venta B2B con descuento por volumen y crédito 60 días',
    module: 'Ventas B2B',
    client: 'Constructora Vial Perú SAC',
    clientAddress: 'AV. ALFONSO UGARTE 780',
    paymentCondition: 'credito_60',
    paymentConditionLabel: 'Crédito 60 días (1% desc.)',
    priceList: 'EC',
    line: 'neumaticos',
    brand: 'michelin',
    product: 'Michelin Latitude Tour HP',
    unitPrice: 48.0,
    expectedQty: 6,
    promoDiscount: true,
    promoType: 'discount',
    promoDiscountAmount: 15.0,
    promoLabel: '🎁 Descuento por Volumen B2B (5+ cajas: -$15.00 USD)',
    instructions: '1. Inicia visita en Constructora Vial Perú SAC.\n2. Registra las fotos de visita.\n3. Pedidos: Crea pedido a Crédito 60 días con Lista EC, línea Neumáticos, marca Michelin.\n4. Catálogo: Agrega 6 cajas Latitude Tour HP y activa el descuento de $15 USD.\n5. Resumen: Verifica el 1% de crédito ($2.73) para un total de USD 270.27 y confirma.',
    active: true,
    scoring: { maxScore: 20, penaltyPerError: 4, maxErrorsAllowed: 2, scale: 'vigesimal' },
    rules: [
      {
        stepIndex: 0,
        eventName: 'SELECT_CLIENT',
        description: 'Seleccionar Constructora Vial Perú SAC',
        validate: (p) => (p.clientName || '').toLowerCase().includes('constructora') || (p.clientName || '').toLowerCase().includes('vial'),
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
        errorMessage: 'Registra las fotos de visita.'
      },
      {
        stepIndex: 3,
        eventName: 'CREATE_ORDER_CONFIG',
        description: 'Configurar Crédito 60 días Lista EC Neumáticos Michelin',
        validate: (p) => p.paymentCondition === 'credito_60' && p.priceList === 'EC' && p.line === 'neumaticos' && p.brand === 'michelin',
        errorMessage: 'Configura: Crédito 60 días, Lista EC, Neumáticos Michelin.'
      },
      {
        stepIndex: 4,
        eventName: 'ADD_PRODUCT',
        description: 'Agregar 6 cajas con promo de $15 activada',
        validate: (p) => (p.product || '').toLowerCase().includes('latitude') && Number(p.quantity) === 6 && Boolean(p.promoDiscount),
        errorMessage: 'Agrega 6 cajas Michelin Latitude Tour HP y activa el descuento de $15 USD.'
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
    module: 'Ventas B2C',
    client: 'Bodega y Ferretería Dos Hermanos',
    clientAddress: 'CALLE DEAN VALDIVIA 509',
    paymentCondition: 'contado',
    paymentConditionLabel: 'Contado (5% desc.)',
    priceList: '1',
    line: 'lubricantes',
    brand: 'shell',
    product: 'Shell Helix HX5 15W/40',
    unitPrice: 20.0,
    expectedQty: 4,
    promoDiscount: false,
    promoType: 'none',
    promoLabel: 'Sin promoción (ya entregada en visita previa)',
    instructions: '1. Inicia visita en Bodega y Ferretería Dos Hermanos.\n2. Registra las fotos de visita.\n3. Pedidos: Crea pedido a Contado con Lista 1, línea Lubricantes, marca Shell.\n4. Catálogo: Agrega 4 baldes Shell Helix HX5 SIN activar regalo (ya fue entregado en el mes).\n5. Resumen: Verifica el 5% de descuento al contado (USD 76.00) y confirma la orden.',
    active: true,
    scoring: { maxScore: 20, penaltyPerError: 4, maxErrorsAllowed: 2, scale: 'vigesimal' },
    rules: [
      {
        stepIndex: 0,
        eventName: 'SELECT_CLIENT',
        description: 'Seleccionar Bodega y Ferretería Dos Hermanos',
        validate: (p) => (p.clientName || '').toLowerCase().includes('hermanos'),
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
        errorMessage: 'Registra las fotos de visita.'
      },
      {
        stepIndex: 3,
        eventName: 'CREATE_ORDER_CONFIG',
        description: 'Configurar Contado Lista 1 Lubricantes Shell',
        validate: (p) => p.paymentCondition === 'contado' && p.priceList === '1' && p.line === 'lubricantes' && p.brand === 'shell',
        errorMessage: 'Configuración incorrecta: Contado, Lista 1, Lubricantes Shell.'
      },
      {
        stepIndex: 4,
        eventName: 'ADD_PRODUCT',
        description: 'Agregar 4 baldes Helix HX5 sin regalo duplicado',
        validate: (p) => (p.product || '').toLowerCase().includes('hx5') && Number(p.quantity) === 4 && !p.promoDiscount,
        errorMessage: 'Agrega 4 baldes Shell Helix HX5 SIN activar promoción de regalo (ya fue entregada en visita previa).'
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
