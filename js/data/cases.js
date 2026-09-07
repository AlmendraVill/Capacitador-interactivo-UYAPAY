/**
 * Catálogo de Casos Prácticos de Evaluación B2C - UYAPAY
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
    paymentCondition: 'Contado (5% desc.)',
    priceList: 'Lista 1',
    instructions: 'Inicia la visita al cliente en tu plan de ruta (Ferretería Los Andes S.A.C. / Juan Perez), revisa las opciones y presiona "Iniciar Visita". Evita equivocarte de cliente o presionar opciones no solicitadas.',
    active: true,
    scoring: {
      maxScore: 20,
      penaltyPerError: 4,
      maxErrorsAllowed: 2,
      scale: 'vigesimal'
    },
    // Reglas procesadas por el Evaluador desacoplado
    rules: [
      {
        stepIndex: 0,
        eventName: 'SELECT_CLIENT',
        description: 'Seleccionar al cliente correcto en la ruta',
        expectedValue: 'Juan Perez',
        validate: (payload) => {
          const name = (payload.clientName || '').toLowerCase();
          return name.includes('juan perez') || name.includes('los andes');
        },
        errorMessage: 'Ese no es el cliente indicado en el caso. Busca a Juan Perez / Ferretería Los Andes.'
      },
      {
        stepIndex: 1,
        eventName: 'SELECT_ACTION',
        description: 'Iniciar la visita en el cliente',
        expectedValue: 'iniciar',
        validate: (payload) => payload.action === 'iniciar',
        errorMessage: 'Esa no es la acción solicitada. Debes presionar "Iniciar visita".'
      }
    ]
  },
  {
    id: 'case-2',
    code: 'B2C-02',
    title: 'Caso 2: Venta a crédito 30 días con descuento en dinero',
    module: 'Ventas B2C',
    client: 'Distribuidora Kanchis EIRL',
    paymentCondition: 'Crédito 30 días (3% desc.)',
    priceList: 'Lista OF',
    instructions: 'Inicia la visita a Distribuidora Kanchis EIRL, registra 3 cajas de neumáticos Michelin Energy XM2+ a crédito 30 días con Lista OF, aplica el descuento de USD 10 por volumen y confirma el pedido.',
    active: false,
    scoring: { maxScore: 20, penaltyPerError: 4, maxErrorsAllowed: 2, scale: 'vigesimal' },
    rules: [
      {
        stepIndex: 0,
        eventName: 'SELECT_CLIENT',
        expectedValue: 'Distribuidora Kanchis EIRL',
        validate: (p) => (p.clientName || '').toLowerCase().includes('kanchis'),
        errorMessage: 'Selecciona al cliente Distribuidora Kanchis EIRL.'
      }
    ]
  },
  {
    id: 'case-3',
    code: 'B2C-03',
    title: 'Caso 3: Cliente corporativo, dos pedidos por línea',
    module: 'Ventas B2B',
    client: 'Transportes del Sur SAC',
    paymentCondition: 'Crédito 60 días (1% desc.)',
    priceList: 'Lista EC',
    instructions: 'Divide la venta en dos pedidos independientes: Pedido A (Lubricantes Shell Retinax HD2) y Pedido B (Neumáticos BFGoodrich Advantage) a crédito 60 días con Lista EC.',
    active: false,
    scoring: { maxScore: 20, penaltyPerError: 4, maxErrorsAllowed: 2, scale: 'vigesimal' },
    rules: []
  },
  {
    id: 'case-4',
    code: 'B2C-04',
    title: 'Caso 4: [TRAMPA] Tracking de precio de competencia solo con foto',
    module: 'Precios y Competencia',
    client: 'Ferretería Los Andes S.A.C.',
    instructions: 'Al realizar el tracking de precios, debes ingresar obligatoriamente el monto numérico antes de guardar. Adjuntar solo la foto descarta el registro.',
    isTrap: true,
    active: false,
    scoring: { maxScore: 20, penaltyPerError: 10, maxErrorsAllowed: 1, scale: 'vigesimal' },
    rules: []
  },
  {
    id: 'case-5',
    code: 'B2C-05',
    title: 'Caso 5: [TRAMPA] Cobranza sin consolidado',
    module: 'Cobranzas',
    client: 'Varios clientes en ruta',
    instructions: 'Luego de registrar los cobros individuales en efectivo, debes generar y enviar el consolidado de cobranza al cierre de ruta.',
    isTrap: true,
    active: false,
    scoring: { maxScore: 20, penaltyPerError: 10, maxErrorsAllowed: 1, scale: 'vigesimal' },
    rules: []
  },
  {
    id: 'case-6',
    code: 'B2C-06',
    title: 'Caso 6: Consulta de nota de crédito histórica',
    module: 'Documentos Electrónicos',
    client: 'Comercial Vega Hnos.',
    instructions: 'Ubica la nota de crédito emitida hace 2 semanas en el módulo de Documentos Electrónicos y reporta el monto exacto sin aplicarla a ningún pedido.',
    active: false,
    scoring: { maxScore: 20, penaltyPerError: 4, maxErrorsAllowed: 2, scale: 'vigesimal' },
    rules: []
  },
  {
    id: 'case-7',
    code: 'B2C-07',
    title: 'Caso 7: Ver y compartir estado de cuenta',
    module: 'Mis Clientes',
    client: 'Grupo Ferretero Miraflores',
    instructions: 'Revisa el total de deuda vencida y por vencer en el estado de cuenta y completa el flujo de compartir por WhatsApp en formato PDF.',
    active: false,
    scoring: { maxScore: 20, penaltyPerError: 4, maxErrorsAllowed: 2, scale: 'vigesimal' },
    rules: []
  },
  {
    id: 'case-8',
    code: 'B2C-08',
    title: 'Caso 8: Seguimiento de pedido emitido',
    module: 'Pedidos',
    client: 'Autopartes El Rápido',
    instructions: 'Ubica el pedido emitido en la pestaña Pedidos, revisa el estado de seguimiento y verifica los productos específicos enviados.',
    active: false,
    scoring: { maxScore: 20, penaltyPerError: 4, maxErrorsAllowed: 2, scale: 'vigesimal' },
    rules: []
  },
  {
    id: 'case-9',
    code: 'B2C-09',
    title: 'Caso 9: Venta mixta con regalo por volumen (lubricante + llanta)',
    module: 'Ventas B2C',
    client: 'Servicentro El Faro',
    instructions: 'Genera dos pedidos por línea separada: Pedido A (5 baldes Helix HX7 con promo de regalo) y Pedido B (1 neumático BFGoodrich G-Grip sin promo).',
    active: false,
    scoring: { maxScore: 20, penaltyPerError: 4, maxErrorsAllowed: 2, scale: 'vigesimal' },
    rules: []
  },
  {
    id: 'case-10',
    code: 'B2C-10',
    title: 'Caso 10: Pedido corporativo grande a crédito 45 días',
    module: 'Ventas B2B',
    client: 'Minera Andina Contratistas SAC',
    instructions: 'Divide en dos pedidos con Lista EC y crédito 45 días: Lubricantes con descuento en dinero de USD 40 y Neumáticos Michelin XZE2.',
    active: false,
    scoring: { maxScore: 20, penaltyPerError: 4, maxErrorsAllowed: 2, scale: 'vigesimal' },
    rules: []
  },
  {
    id: 'case-11',
    code: 'B2C-11',
    title: 'Caso 11: Cliente nuevo, primera compra con lista OF',
    module: 'Mis Clientes',
    client: 'Repuestos Central Chincha',
    instructions: 'Registra el alta del cliente nuevo con todos los datos comerciales obligatorios y emite su primera compra con Lista OF a Contado.',
    active: false,
    scoring: { maxScore: 20, penaltyPerError: 4, maxErrorsAllowed: 2, scale: 'vigesimal' },
    rules: []
  },
  {
    id: 'case-12',
    code: 'B2C-12',
    title: 'Caso 12: Repuestos sin promoción aplicable',
    module: 'Ventas B2C',
    client: 'Taller Hyundai Express',
    instructions: 'Registra los repuestos a crédito 15 días con Lista 1 verificando que solo aplique el descuento financiero del 4% (sin promociones de volumen).',
    active: false,
    scoring: { maxScore: 20, penaltyPerError: 4, maxErrorsAllowed: 2, scale: 'vigesimal' },
    rules: []
  },
  {
    id: 'case-13',
    code: 'B2C-13',
    title: 'Caso 13: [TRAMPA] Condición de pago mal aplicada',
    module: 'Pedidos',
    client: 'Comercial San Martín',
    instructions: 'Verifica la coherencia del resumen antes de confirmar: a crédito 30 días corresponde 3% de descuento; rechaza o corrige si el sistema muestra 5%.',
    isTrap: true,
    active: false,
    scoring: { maxScore: 20, penaltyPerError: 10, maxErrorsAllowed: 1, scale: 'vigesimal' },
    rules: []
  },
  {
    id: 'case-14',
    code: 'B2C-14',
    title: 'Caso 14: Venta B2B con descuento por volumen y crédito 60 días',
    module: 'Ventas B2B',
    client: 'Constructora Vial Perú SAC',
    instructions: 'Registra 6 cajas de neumáticos combinados en Lista EC, activa el descuento de USD 15 por volumen y aplica el 1% de crédito 60 días.',
    active: false,
    scoring: { maxScore: 20, penaltyPerError: 4, maxErrorsAllowed: 2, scale: 'vigesimal' },
    rules: []
  },
  {
    id: 'case-15',
    code: 'B2C-15',
    title: 'Caso 15: Revisión de historial de visitas antes de nueva venta',
    module: 'Historial de Visitas',
    client: 'Bodega y Ferretería Dos Hermanos',
    instructions: 'Revisa el historial de visitas previas para no duplicar el regalo por volumen ya otorgado en el mes y emite la venta con precio neto contado.',
    active: false,
    scoring: { maxScore: 20, penaltyPerError: 4, maxErrorsAllowed: 2, scale: 'vigesimal' },
    rules: []
  }
];
