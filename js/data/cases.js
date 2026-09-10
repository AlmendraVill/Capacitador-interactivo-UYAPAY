/**
 * Catálogo Oficial de Casos Prácticos de Evaluación B2C - UYAPAY
 * Batería de 21 Casos Oficiales (Casos 1 al 11 y 14 al 23).
 * Incluye Casos Base, Casos Borde, Flujos Ocultos de Producción y Flujos de Resolución Oficiales.
 * Basado estrictamente en la arquitectura Flutter (appSellerV1) y Backend C# (solar-web-app-backend).
 */
if (typeof window === 'undefined') {
  global.window = {};
}
window.UyapayData = window.UyapayData || {};

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
    format: 'Unidad',
    unitPrice: 55.0,
    hasPromo: true,
    promoType: 'discount',
    promoLabel: '🎁 Descuento por Volumen: USD 10 por cada 5 productos',
    promoDiscountAmount: 10.0,
    promoPerQty: 5,
    promoAmountPerStep: 10.0
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

// ================= BATERÍA DE 21 CASOS PRÁCTICOS OFICIALES =================
window.UyapayData.CASES = [
{
  "id": "case-1",
  "code": "CP-01",
  "aliases": ["B2C-01"],
  "title": "CP-01: Venta al contado con regalo y entrega programada",
  "module": "Ventas B2C",
  "client": "Ferretería Los Andes S.A.C.",
  "clientAddress": "AV. TOMAS TUYRUTUPAC 412",
  "deliveryAddress": "almacen",
  "deliveryAddressText": "ALMACÉN (a 600m de punto de venta)",
  "deliveryDate": "16 de septiembre",
  "paymentCondition": "contado",
  "paymentConditionLabel": "Contado [5%]",
  "priceList": "3",
  "line": "lubricantes",
  "brand": "shell",
  "product": "Shell Helix HX7 10W/40",
  "unitPrice": 22,
  "expectedQty": 8,
  "promoDiscount": true,
  "promoType": "gift",
  "promoLabel": "🎁 Regalo: 2 botellas Shell Helix Plus 10W-40 (108203)",
  "publicTitle": "Venta al Contado con Regalo y Entrega Programada",
  "instructions": "Cliente: Ferretería Los Andes S.A.C.\n\nSituación: Genera una venta al contado de 8 baldes de Shell Helix HX7 10W/40, aplicando el beneficio promocional de 2 botellas de Shell Helix Plus de regalo. El cliente solicita que el pedido sea entregado el 16 de septiembre en su almacén (dirección de entrega) a 600 metros de su punto de venta (dirección de visita).\n\nTipo de Atención: Presencial normal.",
  "active": true,
  "scoring": {
    "maxScore": 20,
    "penaltyPerError": 4,
    "maxErrorsAllowed": 2,
    "scale": "vigesimal"
  },
  "solutionFlow": {
    "objetivo": "Generar una venta al contado en Lista 3 con bonificación de regalo en especie y entrega programada en almacén.",
    "pasoAPaso": [
      "1. En Plan de visitas, sin visitas iniciadas, seleccionar Ferretería Los Andes S.A.C.",
      "2. En la hoja de opciones seleccionar 'Iniciar visita'.",
      "3. En la tarea INICIO del carrusel, verificar el perfil comercial y presionar el botón 'CONTINUAR'.",
      "4. En la tarea FOTOS pulsar '+' en Presentación inicial y '+' en Presentación final. Presionar el botón 'GUARDAR' (avanza a la tarea PRECIOS).",
      "5. En la tarea PRECIOS seleccionar un motivo válido para no registrar precios de la competencia y presionar el botón 'CONTINUAR' (avanza a la tarea PEDIDOS).",
      "6. En la tarea PEDIDOS pulsar '➕ CREAR PEDIDO O COTIZACIÓN'. Configurar: Condición = Contado [5%], Lista de Precios = Lista 3 (cambiar de la Lista 1 por defecto a Lista 3), Línea = Lubricantes Shell, Marca = Shell.",
      "7. Pulsar '＋ Agregar producto'. En Selección de producto tocar 'Shell Helix HX7 10W/40'. En Detalle del producto ajustar cantidad a 8 baldes con el stepper [＋], verificar que el beneficio promocional (2 botellas Shell Helix Plus de regalo) esté activado y pulsar 'Agregar producto'.",
      "8. En la pantalla Nuevo pedido verificar el item cargado y presionar 'Completar'.",
      "9. En Confirmación de pedido: seleccionar la dirección de entrega correspondiente al almacén del cliente (diferente a la de visita), seleccionar la fecha de entrega del 16 de septiembre, verificar los cálculos financieros y presionar 'Actualizar Orden de Compra y Enviar'."
    ],
    "reglaNegocio": "En condición Contado aplica 5% de descuento financiero sobre Lista 3. La bonificación de regalo (2 botellas Shell Helix Plus) no descuenta dinero pero debe registrarse ligada a la compra de los 8 baldes. La entrega se debe programar para el 16 de septiembre en la dirección del almacén.",
    "decisionClave": "Cambiar la lista de precios a Lista 3, registrar motivo de precios antes de continuar, verificar el toggle de regalo y cambiar la dirección de entrega al almacén y fecha al 16 de septiembre.",
    "resultadoEsperado": "Orden emitida y confirmada en estado ENVIADO con entrega el 16 de septiembre en almacén."
  },
  "rules": [
    {
      "stepIndex": 0,
      "eventName": "SELECT_CLIENT",
      "description": "Seleccionar Ferretería Los Andes",
      "validate": (p) => (p.clientName || '').toLowerCase().includes('andes'),
      "errorMessage": "Debes seleccionar a Ferretería Los Andes S.A.C."
    },
    {
      "stepIndex": 1,
      "eventName": "SELECT_ACTION",
      "description": "Iniciar visita presencial",
      "validate": (p) => p.action === 'iniciar',
      "errorMessage": "Debes presionar \"Iniciar visita\"."
    },
    {
      "stepIndex": 2,
      "eventName": "SAVE_PHOTOS",
      "description": "Fotos obligatorias inicial y final",
      "validate": (p) => Boolean(p.initialPhoto) && Boolean(p.finalPhoto),
      "errorMessage": "Error crítico (-20 pts): Debes registrar ambas fotos obligatorias (Presentación inicial y final)."
    },
    {
      "stepIndex": 3,
      "eventName": "SAVE_PRICE_TRACKING_MOTIVO",
      "description": "Motivo de no registro de precios",
      "validate": (p) => Boolean(p.motivo && p.motivo !== '' && p.motivo !== 'ninguno'),
      "errorMessage": "Error crítico (-15 pts): Debes seleccionar un motivo válido para no registrar precios de la competencia antes de continuar a Pedidos."
    },
    {
      "stepIndex": 4,
      "eventName": "CREATE_ORDER_CONFIG",
      "description": "Configurar pedido Contado Lista 3",
      "validate": (p) => p.paymentCondition === 'contado' && String(p.priceList) === '3' && p.line === 'lubricantes' && p.brand === 'shell',
      "errorMessage": "Error crítico (-25 pts): Configuración incorrecta. Debes configurar: Condición Contado [5%], cambiar de Lista 1 a Lista 3, Línea Lubricantes Shell y Marca Shell."
    },
    {
      "stepIndex": 5,
      "eventName": "ADD_PRODUCT",
      "description": "Agregar 8 baldes HX7 con regalo",
      "validate": (p) => (p.product || '').toLowerCase().includes('hx7') && Number(p.quantity) === 8 && Boolean(p.promoDiscount),
      "errorMessage": "Error crítico (-20 pts): Debes agregar 8 baldes Shell Helix HX7 con la promoción de regalo activada (2 botellas Shell Helix Plus)."
    },
    {
      "stepIndex": 6,
      "eventName": "SUBMIT_ORDER",
      "description": "Confirmar orden con entrega en almacén el 16 de septiembre",
      "validate": (p) => {
        const isConfirmed = Boolean(p.confirmed);
        const isAlmacen = (p.deliveryAddress && p.deliveryAddress !== 'principal') ||
                          (p.deliveryAddressText && p.deliveryAddressText.toLowerCase().includes('almacén'));
        const isSept16 = (p.estimatedDeliveryDate || '').includes('-09-16') ||
                         (p.estimatedDeliveryDate || '').includes('16');
        return isConfirmed && isAlmacen && isSept16;
      },
      "errorMessage": "Error crítico (-10 a -20 pts): Debes confirmar la orden seleccionando el almacén como dirección de entrega y programando la fecha para el 16 de septiembre."
    }
  ]
},
{
  "id": "case-2",
  "code": "CP-02",
  "aliases": ["B2C-02"],
  "title": "Caso 2: CP-02 Cotización a crédito con promoción por volumen",
  "module": "Ventas B2C",
  "client": "Distribuidora Kanchis EIRL",
  "clientAddress": "AV. INDUSTRIAL 104",
  "paymentCondition": "credito_30",
  "paymentConditionLabel": "Crédito 30 días (3% desc.)",
  "priceList": "OF",
  "line": "neumaticos",
  "brand": "michelin",
  "product": "Michelin Energy XM2+ 195/60 R15",
  "sku": "003718",
  "unitPrice": 55,
  "expectedQty": 9,
  "promoDiscount": true,
  "promoType": "discount",
  "promoPerQty": 5,
  "promoAmountPerStep": 10,
  "promoDiscountAmount": 10,
  "promoLabel": "🎁 Descuento por Volumen: USD 10 por cada 5 productos",
  "promoToggleDefault": false,
  "expectedDeliveryDate": "2026-09-20",
  "documentType": "cotizacion",
  "documentTypeId": 3,
  "publicTitle": "Cotización a crédito con promoción por volumen",
  "instructions": "Genera una cotización de 9 neumáticos Michelin Energy XM2+ 195/60 R15 (003718), aplicando la promoción de USD 10 de descuento por cada 5 productos vendidos. El cliente solicita crédito a 30 días y entrega el 20 de septiembre.",
  "active": true,
  "scoring": {
    "maxScore": 20,
    "penaltyPerError": 4,
    "maxErrorsAllowed": 2,
    "scale": "vigesimal"
  },
  "solutionFlow": {
    "objetivo": "Generar una cotización a crédito de 9 neumáticos Michelin Energy XM2+ con descuento por escala de volumen ($10 por cada 5 unidades) y entrega programada al 20 de septiembre.",
    "pasoAPaso": [
      "1. En Plan de visitas, sin visitas iniciadas, seleccionar Distribuidora Kanchis EIRL y presionar Iniciar visita.",
      "2. En la tarea INICIO, pulsar Continuar.",
      "3. En la tarea FOTOS, registrar fotos inicial y final y pulsar Guardar.",
      "4. En la tarea PRECIOS, seleccionar motivo correspondiente de no registro de precios y pulsar Continuar.",
      "5. En la tarea PEDIDOS, pulsar Crear pedido.",
      "6. Cambiar la condición de pago seleccionada por defecto Contado a Crédito 30 días. Mantener/seleccionar Lista Oficina y configurar línea y marca correspondientes a Neumáticos Michelin.",
      "7. En el catálogo, seleccionar Michelin Energy XM2+ 195/60 R15 (003718) e ingresar 9 unidades, verificando precio unitario de USD 55.00.",
      "8. Activar toggle de descuento promocional correspondiente a la promoción de USD 10 por cada 5 productos vendidos.",
      "9. En la vista de pedidos, pulsar Continuar.",
      "10. En Confirmación / Resumen, verificar condición de pago, productos, cantidades y descuentos.",
      "11. Seleccionar/configurar fecha de entrega del 20 de septiembre y confirmar dirección de entrega.",
      "12. Verificar que el descuento promocional se haya aplicado correctamente antes de confirmar la venta.",
      "13. Pulsar Guardar como cotización y esperar que el voucher diga Cotización."
    ],
    "reglaNegocio": "Para 9 unidades a $55.00: Subtotal bruto $495.00. Aplica 1 bloque de 5 unidades con $10.00 de descuento por volumen, resultando subtotal neto de $485.00. El descuento de condición Crédito 30 días (3%) se calcula sobre el subtotal neto ($14.55), totalizando pedido de $470.45 y total factura con 18% IGV de $555.13. Debe registrarse como Cotización (Tipo 3) y entrega el 20 de septiembre.",
    "decisionClave": "Cambiar la condición por defecto Contado a Crédito 30 días, seleccionar Neumáticos Michelin en Lista OF, ingresar 9 unidades con toggle de descuento por volumen activado, fecha de entrega al 20 de septiembre y guardar como Cotización.",
    "resultadoEsperado": "Cotización emitida por USD 470.45 (Total Factura USD 555.13) en condición Crédito 30 días y entrega 20 de septiembre."
  },
  "rules": [
    {
      "stepIndex": 0,
      "eventName": "SELECT_CLIENT",
      "description": "Seleccionar Distribuidora Kanchis EIRL",
      "validate": (p) => (p.clientName || '').toLowerCase().includes('kanchis'),
      "errorMessage": "Debes seleccionar a Distribuidora Kanchis EIRL."
    },
    {
      "stepIndex": 1,
      "eventName": "SELECT_ACTION",
      "description": "Iniciar visita presencial",
      "validate": (p) => p.action === 'iniciar',
      "errorMessage": "Debes presionar \"Iniciar visita\"."
    },
    {
      "stepIndex": 2,
      "eventName": "SAVE_PHOTOS",
      "description": "Fotos obligatorias inicial y final",
      "validate": (p) => Boolean(p.initialPhoto) && Boolean(p.finalPhoto),
      "errorMessage": "Error crítico (-20 pts): Debes registrar ambas fotos obligatorias (Presentación inicial y final)."
    },
    {
      "stepIndex": 3,
      "eventName": "SAVE_PRICE_TRACKING_MOTIVO",
      "description": "Motivo de no registro de precios",
      "validate": (p) => Boolean(p.motivo && p.motivo !== '' && p.motivo !== 'ninguno'),
      "errorMessage": "Error crítico (-15 pts): Debes seleccionar un motivo válido para no registrar precios de la competencia antes de continuar a Pedidos."
    },
    {
      "stepIndex": 4,
      "eventName": "CREATE_ORDER_CONFIG",
      "description": "Configurar Crédito 30 días, Lista OF y Neumáticos Michelin",
      "validate": (p) => p.paymentCondition === 'credito_30' && String(p.priceList).toUpperCase() === 'OF' && p.line === 'neumaticos' && p.brand === 'michelin',
      "errorMessage": "Error crítico (-25 pts): Configuración incorrecta. Debes cambiar de Contado a Crédito 30 días, mantener Lista OF, y seleccionar Línea Neumáticos y Marca Michelin."
    },
    {
      "stepIndex": 5,
      "eventName": "ADD_PRODUCT",
      "description": "Agregar 9 neumáticos Michelin Energy XM2+ (003718) con descuento por volumen activado",
      "validate": (p) => {
        const isProd = (p.sku === '003718') || (p.product || '').toLowerCase().includes('energy') || (p.product || '').toLowerCase().includes('xm2');
        const isQty9 = Number(p.quantity) === 9;
        const isPrice55 = Math.abs(Number(p.unitPrice) - 55.0) < 0.01;
        const isPromoOn = Boolean(p.promoDiscount);
        const isPromo10 = Math.abs(Number(p.promoDiscountAmount) - 10.0) < 0.01;
        return isProd && isQty9 && isPrice55 && isPromoOn && isPromo10;
      },
      "errorMessage": "Error crítico (-20 pts): Debes agregar exactamente 9 unidades de Michelin Energy XM2+ (003718) a USD 55.00 c/u con el toggle de descuento promocional activado (USD 10 por cada 5 unidades)."
    },
    {
      "stepIndex": 6,
      "eventName": "SUBMIT_ORDER",
      "description": "Guardar como Cotización con entrega el 20 de septiembre",
      "validate": (p) => {
        const isConfirmed = Boolean(p.confirmed);
        const isCotizacion = p.documentType === 'cotizacion' || p.documentTypeId === 3;
        const dStr = p.estimatedDeliveryDate || '';
        const isSept20 = dStr.includes('-09-20') || dStr.includes('20-09') ||
                         (dStr.includes('09') && dStr.endsWith('-20')) ||
                         dStr.toLowerCase().includes('20 sept');
        return isConfirmed && isCotizacion && isSept20;
      },
      "errorMessage": "Error crítico (-20 pts): Debes guardar como Cotización (no como orden de compra) y programar la fecha de entrega para el 20 de septiembre."
    }
  ]
},
{
  "id": "case-3",
  "code": "B2C-03",
  "title": "Caso 3: Cliente corporativo B2B, crédito 60 días",
  "module": "Ventas B2B",
  "client": "Transportes del Sur SAC",
  "clientAddress": "KM 12 VARIANTE DE UCHUMAYO",
  "paymentCondition": "credito_60",
  "paymentConditionLabel": "Crédito 60 días (1% desc.)",
  "priceList": "EC",
  "line": "lubricantes",
  "brand": "shell",
  "product": "Shell Retinax HD2",
  "unitPrice": 320,
  "expectedQty": 1,
  "promoDiscount": false,
  "promoType": "none",
  "promoLabel": "Sin promoción aplicable",
  "publicTitle": "Atención a Cliente Corporativo B2B",
  "instructions": "Visitas la sede de Transportes del Sur SAC en la Variante de Uchumayo. El jefe de operaciones solicita 1 cilindro de Shell Retinax HD2 (55 Gal) bajo su condición corporativa de Crédito a 60 días en Lista Especial Corporativa (EC). Registra la atención y tramita su orden corporativa.",
  "active": true,
  "scoring": {
    "maxScore": 20,
    "penaltyPerError": 4,
    "maxErrorsAllowed": 2,
    "scale": "vigesimal"
  },
  "solutionFlow": {
    "objetivo": "Atender una cuenta corporativa en zona industrial utilizando Lista Especial Corporativa (EC) a 60 días.",
    "pasoAPaso": [
      "1. Seleccionar a Transportes del Sur SAC en la ruta de Uchumayo e iniciar visita.",
      "2. Capturar y guardar fotos de local.",
      "3. Crear pedido configurando Crédito 60 días, Lista EC, Línea Lubricantes, Marca Shell.",
      "4. Agregar 1 cilindro de Shell Retinax HD2 (55 Gal) sin promoción.",
      "5. Verificar el total de USD 316.80 y confirmar orden."
    ],
    "reglaNegocio": "Cuentas corporativas asignadas a Lista EC tienen plazos autorizados de hasta 60 días. El pedido debe ser mono-línea.",
    "decisionClave": "Seleccionar Lista EC y no Lista 1 o 2, respetando la categoría contractual del cliente.",
    "resultadoEsperado": "Orden emitida a 60 días por USD 316.80."
  },
  "rules": [
    {
      "stepIndex": 0,
      "eventName": "SELECT_CLIENT",
      "description": "Seleccionar Transportes del Sur SAC",
      "validate": (p) => (p.clientName || '').toLowerCase().includes('transportes'),
      "errorMessage": "Selecciona Transportes del Sur SAC."
    },
    {
      "stepIndex": 1,
      "eventName": "SELECT_ACTION",
      "description": "Iniciar visita",
      "validate": (p) => p.action === 'iniciar',
      "errorMessage": "Inicia la visita."
    },
    {
      "stepIndex": 2,
      "eventName": "SAVE_PHOTOS",
      "description": "Fotos obligatorias",
      "validate": (p) => p.initialPhoto && p.finalPhoto,
      "errorMessage": "Registra las fotos de visita."
    },
    {
      "stepIndex": 3,
      "eventName": "CREATE_ORDER_CONFIG",
      "description": "Configurar Crédito 60d Lista EC",
      "validate": (p) => p.paymentCondition === 'credito_60' && p.priceList === 'EC' && p.line === 'lubricantes' && p.brand === 'shell',
      "errorMessage": "Configura: Crédito 60 días, Lista EC, Lubricantes Shell."
    },
    {
      "stepIndex": 4,
      "eventName": "ADD_PRODUCT",
      "description": "Agregar 1 cilindro Retinax",
      "validate": (p) => (p.product || '').toLowerCase().includes('retinax') && Number(p.quantity) === 1,
      "errorMessage": "Agrega 1 cilindro Shell Retinax HD2."
    },
    {
      "stepIndex": 5,
      "eventName": "SUBMIT_ORDER",
      "description": "Confirmar orden",
      "validate": (p) => p.confirmed === true,
      "errorMessage": "Confirma la orden."
    }
  ]
},
{
  "id": "case-4",
  "code": "B2C-04",
  "title": "Caso 4: [TRAMPA] Tracking de precio de competencia solo con foto",
  "module": "Precios y Competencia",
  "client": "Ferretería Los Andes S.A.C.",
  "clientAddress": "AV. TOMAS TUYRUTUPAC 412",
  "paymentCondition": "contado",
  "paymentConditionLabel": "Contado (5% desc.)",
  "priceList": "1",
  "line": "lubricantes",
  "brand": "shell",
  "product": "Shell Helix HX7 10W/40",
  "unitPrice": 22,
  "expectedQty": 2,
  "promoDiscount": false,
  "promoType": "none",
  "publicTitle": "Venta Habitual y Registro Comercial en Local",
  "instructions": "Te encuentras en Ferretería Los Andes S.A.C. para realizar tu visita habitual de ruta. El cliente solicita adquirir 2 baldes de Shell Helix HX7 10W/40 al contado en Lista 1. Procesa la atención completa en el establecimiento asegurando el correcto registro de todos los datos comerciales mandatorios.",
  "isTrap": true,
  "active": true,
  "scoring": {
    "maxScore": 20,
    "penaltyPerError": 5,
    "maxErrorsAllowed": 1,
    "scale": "vigesimal"
  },
  "solutionFlow": {
    "objetivo": "Identificar que en el registro de inteligencia de precios no basta con subir fotos; el valor numérico del competidor es un campo mandatorio en base de datos.",
    "pasoAPaso": [
      "1. Iniciar visita en Ferretería Los Andes S.A.C.",
      "2. Registrar fotos de local obligatorias.",
      "3. Configurar pedido a Contado, Lista 1, Lubricantes Shell.",
      "4. Agregar 2 baldes Helix HX7 y verificar que todos los datos comerciales estén completos.",
      "5. Confirmar y enviar la orden de compra."
    ],
    "reglaNegocio": "En el módulo de competencia (T4), adjuntar comprobante sin precio numérico no consolida la tarea en la base de datos de SOLAR.",
    "decisionClave": "Completar el pedido regular sin omitir validaciones mandatorias.",
    "resultadoEsperado": "Orden transmitida correctamente sin campos nulos."
  },
  "rules": [
    {
      "stepIndex": 0,
      "eventName": "SELECT_CLIENT",
      "description": "Seleccionar Ferretería Los Andes",
      "validate": (p) => (p.clientName || '').toLowerCase().includes('andes'),
      "errorMessage": "Selecciona Ferretería Los Andes."
    },
    {
      "stepIndex": 1,
      "eventName": "SELECT_ACTION",
      "description": "Iniciar visita",
      "validate": (p) => p.action === 'iniciar',
      "errorMessage": "Inicia la visita."
    },
    {
      "stepIndex": 2,
      "eventName": "SAVE_PHOTOS",
      "description": "Fotos obligatorias",
      "validate": (p) => p.initialPhoto && p.finalPhoto,
      "errorMessage": "Registra las fotos de visita."
    },
    {
      "stepIndex": 3,
      "eventName": "CREATE_ORDER_CONFIG",
      "description": "Configurar pedido",
      "validate": (p) => p.paymentCondition === 'contado' && p.line === 'lubricantes',
      "errorMessage": "Configura condición Contado y línea Lubricantes."
    },
    {
      "stepIndex": 4,
      "eventName": "ADD_PRODUCT",
      "description": "Agregar producto",
      "validate": (p) => Number(p.quantity) >= 1,
      "errorMessage": "Agrega el producto requerido."
    },
    {
      "stepIndex": 5,
      "eventName": "SUBMIT_ORDER",
      "description": "Confirmar orden",
      "validate": (p) => p.confirmed === true,
      "errorMessage": "Confirma la orden."
    }
  ]
},
{
  "id": "case-5",
  "code": "B2C-05",
  "title": "Caso 5: [TRAMPA] Cobranza sin consolidado al cierre",
  "module": "Cobranzas",
  "client": "Comercial Vega Hnos.",
  "clientAddress": "CALLE MERCADERES 301",
  "paymentCondition": "contado",
  "paymentConditionLabel": "Contado (5% desc.)",
  "priceList": "1",
  "line": "lubricantes",
  "brand": "shell",
  "product": "Shell Helix HX5 15W/40",
  "unitPrice": 20,
  "expectedQty": 2,
  "promoDiscount": false,
  "promoType": "none",
  "publicTitle": "Venta al Contado en Distribuidor",
  "instructions": "Acudes al punto de venta de Comercial Vega Hnos. El propietario solicita abastecerse con 2 baldes de Shell Helix HX5 15W/40 con pago al contado en Lista 1. Procesa la visita y emite la orden de compra completando todas las etapas obligatorias del proceso comercial.",
  "isTrap": true,
  "active": true,
  "scoring": {
    "maxScore": 20,
    "penaltyPerError": 5,
    "maxErrorsAllowed": 1,
    "scale": "vigesimal"
  },
  "solutionFlow": {
    "objetivo": "Evitar el error común de cerrar una visita con cobros en estado \"Reciente\" sin generar el documento de consolidado formal.",
    "pasoAPaso": [
      "1. Iniciar visita en Comercial Vega Hnos.",
      "2. Tomar y registrar fotos inicial y final.",
      "3. Configurar pedido a Contado, Lista 1, Lubricantes Shell.",
      "4. Agregar 2 baldes Shell Helix HX5 15W/40.",
      "5. Confirmar y enviar la orden consolidada."
    ],
    "reglaNegocio": "Los recibos electrónicos que no son consolidados en el cierre de visita quedan como borradores y no impactan la cuenta corriente en SOLAR.",
    "decisionClave": "Completar y confirmar la transacción hasta obtener el estado \"Enviado\".",
    "resultadoEsperado": "Transacción consolidada y enviada a servidor."
  },
  "rules": [
    {
      "stepIndex": 0,
      "eventName": "SELECT_CLIENT",
      "description": "Seleccionar Comercial Vega Hnos.",
      "validate": (p) => (p.clientName || '').toLowerCase().includes('vega'),
      "errorMessage": "Busca a Comercial Vega Hnos."
    },
    {
      "stepIndex": 1,
      "eventName": "SELECT_ACTION",
      "description": "Iniciar visita",
      "validate": (p) => p.action === 'iniciar',
      "errorMessage": "Inicia la visita."
    },
    {
      "stepIndex": 2,
      "eventName": "SAVE_PHOTOS",
      "description": "Fotos de visita",
      "validate": (p) => p.initialPhoto && p.finalPhoto,
      "errorMessage": "Registra ambas fotos requeridas."
    },
    {
      "stepIndex": 3,
      "eventName": "CREATE_ORDER_CONFIG",
      "description": "Configurar pedido",
      "validate": (p) => Boolean(p.paymentCondition),
      "errorMessage": "Selecciona condición de pago."
    },
    {
      "stepIndex": 4,
      "eventName": "ADD_PRODUCT",
      "description": "Agregar producto",
      "validate": (p) => Number(p.quantity) >= 1,
      "errorMessage": "Agrega al menos 1 producto."
    },
    {
      "stepIndex": 5,
      "eventName": "SUBMIT_ORDER",
      "description": "Confirmar orden",
      "validate": (p) => p.confirmed === true,
      "errorMessage": "Confirma la orden."
    }
  ]
},
{
  "id": "case-6",
  "code": "B2C-06",
  "title": "Caso 6: Consulta de nota de crédito histórica",
  "module": "Documentos Electrónicos",
  "client": "Comercial Vega Hnos.",
  "clientAddress": "CALLE MERCADERES 301",
  "paymentCondition": "contado",
  "paymentConditionLabel": "Contado (5% desc.)",
  "priceList": "1",
  "line": "lubricantes",
  "brand": "shell",
  "product": "Shell Rimula R4 X 15W-40",
  "unitPrice": 28,
  "expectedQty": 1,
  "promoDiscount": false,
  "promoType": "none",
  "publicTitle": "Atención de Pedido Habitual de Lubricantes",
  "instructions": "En Comercial Vega Hnos., el encargado requiere reponer stock urgente de 1 balde de Rimula R4 X 15W/40 con pago al contado en Lista 1. Realiza la visita y formaliza el pedido en el sistema.",
  "active": true,
  "scoring": {
    "maxScore": 20,
    "penaltyPerError": 4,
    "maxErrorsAllowed": 2,
    "scale": "vigesimal"
  },
  "solutionFlow": {
    "objetivo": "Auditar la existencia de saldos a favor por Notas de Crédito previas antes de cerrar una nueva venta.",
    "pasoAPaso": [
      "1. Seleccionar Comercial Vega Hnos. e iniciar visita.",
      "2. Registrar fotos de exhibición.",
      "3. Configurar pedido a Contado con Lista 1, Lubricantes Shell.",
      "4. Agregar 1 balde Rimula R4 X 15W-40.",
      "5. Confirmar y enviar la orden de compra."
    ],
    "reglaNegocio": "Las notas de crédito emitidas figuran en el módulo de documentos electrónicos y reducen la deuda exigible.",
    "decisionClave": "Configurar adecuadamente la lista de precios 1 autorizada para el cliente.",
    "resultadoEsperado": "Orden emitida por USD 26.60 neto."
  },
  "rules": [
    {
      "stepIndex": 0,
      "eventName": "SELECT_CLIENT",
      "description": "Seleccionar Comercial Vega Hnos.",
      "validate": (p) => (p.clientName || '').toLowerCase().includes('vega'),
      "errorMessage": "Selecciona a Comercial Vega Hnos."
    },
    {
      "stepIndex": 1,
      "eventName": "SELECT_ACTION",
      "description": "Iniciar visita",
      "validate": (p) => p.action === 'iniciar',
      "errorMessage": "Presiona \"Iniciar visita\"."
    },
    {
      "stepIndex": 2,
      "eventName": "SAVE_PHOTOS",
      "description": "Fotos de visita",
      "validate": (p) => p.initialPhoto && p.finalPhoto,
      "errorMessage": "Registra las fotos de visita."
    },
    {
      "stepIndex": 3,
      "eventName": "CREATE_ORDER_CONFIG",
      "description": "Configuración comercial",
      "validate": (p) => Boolean(p.paymentCondition),
      "errorMessage": "Configura la condición comercial."
    },
    {
      "stepIndex": 4,
      "eventName": "ADD_PRODUCT",
      "description": "Agregar producto",
      "validate": (p) => Number(p.quantity) >= 1,
      "errorMessage": "Selecciona el producto."
    },
    {
      "stepIndex": 5,
      "eventName": "SUBMIT_ORDER",
      "description": "Confirmar orden",
      "validate": (p) => p.confirmed === true,
      "errorMessage": "Confirma la orden."
    }
  ]
},
{
  "id": "case-7",
  "code": "B2C-07",
  "title": "Caso 7: Ver y compartir estado de cuenta",
  "module": "Mis Clientes",
  "client": "Grupo Ferretero Miraflores",
  "clientAddress": "AV. SAN JERONIMO 210",
  "paymentCondition": "credito_30",
  "paymentConditionLabel": "Crédito 30 días (3% desc.)",
  "priceList": "OF",
  "line": "neumaticos",
  "brand": "michelin",
  "product": "Michelin Energy XM2+ 195/60 R15",
  "unitPrice": 55,
  "expectedQty": 2,
  "promoDiscount": false,
  "promoType": "none",
  "publicTitle": "Reposición de Neumáticos a Crédito",
  "instructions": "Visitas a Grupo Ferretero Miraflores. El cliente solicita un pedido de 2 cajas de neumáticos Michelin Energy XM2+ 195/60 R15 bajo condición de Crédito a 30 días con Lista OF. Gestiona la visita y registra el pedido requerido.",
  "active": true,
  "scoring": {
    "maxScore": 20,
    "penaltyPerError": 4,
    "maxErrorsAllowed": 2,
    "scale": "vigesimal"
  },
  "solutionFlow": {
    "objetivo": "Revisar la posición financiera del cliente en Mis Clientes y registrar un pedido al crédito autorizado.",
    "pasoAPaso": [
      "1. Localizar Grupo Ferretero Miraflores en visitas e iniciar atención.",
      "2. Tomar y guardar fotos de visita.",
      "3. Configurar pedido: Crédito 30 días, Lista OF, Neumáticos Michelin.",
      "4. Agregar 2 cajas Energy XM2+.",
      "5. Verificar el 3% de crédito ($3.30) para total USD 106.70 y confirmar."
    ],
    "reglaNegocio": "Compartir el estado de cuenta por WhatsApp formaliza la comunicación de deuda vencida y por vencer.",
    "decisionClave": "Comprobar que el cliente cuenta con línea disponible antes de emitir a crédito.",
    "resultadoEsperado": "Orden transmitida por USD 106.70."
  },
  "rules": [
    {
      "stepIndex": 0,
      "eventName": "SELECT_CLIENT",
      "description": "Seleccionar Grupo Ferretero Miraflores",
      "validate": (p) => (p.clientName || '').toLowerCase().includes('miraflores'),
      "errorMessage": "Selecciona Grupo Ferretero Miraflores."
    },
    {
      "stepIndex": 1,
      "eventName": "SELECT_ACTION",
      "description": "Iniciar visita",
      "validate": (p) => p.action === 'iniciar',
      "errorMessage": "Inicia la visita."
    },
    {
      "stepIndex": 2,
      "eventName": "SAVE_PHOTOS",
      "description": "Fotos de visita",
      "validate": (p) => p.initialPhoto && p.finalPhoto,
      "errorMessage": "Registra ambas fotos."
    },
    {
      "stepIndex": 3,
      "eventName": "CREATE_ORDER_CONFIG",
      "description": "Configurar pedido crédito 30 días",
      "validate": (p) => p.paymentCondition === 'credito_30',
      "errorMessage": "Selecciona Crédito 30 días."
    },
    {
      "stepIndex": 4,
      "eventName": "ADD_PRODUCT",
      "description": "Agregar producto",
      "validate": (p) => Number(p.quantity) >= 1,
      "errorMessage": "Agrega el producto."
    },
    {
      "stepIndex": 5,
      "eventName": "SUBMIT_ORDER",
      "description": "Confirmar orden",
      "validate": (p) => p.confirmed === true,
      "errorMessage": "Confirma la orden."
    }
  ]
},
{
  "id": "case-8",
  "code": "B2C-08",
  "title": "Caso 8: Seguimiento de pedido emitido",
  "module": "Pedidos",
  "client": "Autopartes El Rápido",
  "clientAddress": "JR. PIEROLA 540",
  "paymentCondition": "contado",
  "paymentConditionLabel": "Contado (5% desc.)",
  "priceList": "1",
  "line": "lubricantes",
  "brand": "shell",
  "product": "Shell Helix Plus 10W-40",
  "unitPrice": 5,
  "expectedQty": 4,
  "promoDiscount": false,
  "promoType": "none",
  "publicTitle": "Compra de Lubricantes en Botella",
  "instructions": "En tu visita a Autopartes El Rápido, el encargado solicita 4 botellas de Shell Helix Plus 10W-40 (1L) al contado con Lista 1. Atiende el requerimiento y emite la orden comercial correspondiente.",
  "active": true,
  "scoring": {
    "maxScore": 20,
    "penaltyPerError": 4,
    "maxErrorsAllowed": 2,
    "scale": "vigesimal"
  },
  "solutionFlow": {
    "objetivo": "Emitir pedido y realizar la verificación de trazabilidad logística en el módulo Pedidos.",
    "pasoAPaso": [
      "1. Seleccionar Autopartes El Rápido e iniciar visita.",
      "2. Completar fotos obligatorias.",
      "3. Configurar Contado, Lista 1, Lubricantes Shell.",
      "4. Agregar 4 botellas de Shell Helix Plus 10W-40 a USD 5.00 c/u.",
      "5. Confirmar pedido con total neto de USD 19.00."
    ],
    "reglaNegocio": "El estado del pedido pasa secuencialmente por BORRADOR -> ENVIADO -> EN RUTA -> ENTREGADO.",
    "decisionClave": "Configurar el pedido al contado con descuento del 5% sin agregar promociones no aplicables.",
    "resultadoEsperado": "Orden registrada por USD 19.00."
  },
  "rules": [
    {
      "stepIndex": 0,
      "eventName": "SELECT_CLIENT",
      "description": "Seleccionar Autopartes El Rápido",
      "validate": (p) => (p.clientName || '').toLowerCase().includes('rapido') || (p.clientName || '').toLowerCase().includes('rápido'),
      "errorMessage": "Selecciona Autopartes El Rápido."
    },
    {
      "stepIndex": 1,
      "eventName": "SELECT_ACTION",
      "description": "Iniciar visita",
      "validate": (p) => p.action === 'iniciar',
      "errorMessage": "Inicia la visita."
    },
    {
      "stepIndex": 2,
      "eventName": "SAVE_PHOTOS",
      "description": "Fotos de visita",
      "validate": (p) => p.initialPhoto && p.finalPhoto,
      "errorMessage": "Registra las fotos de visita."
    },
    {
      "stepIndex": 3,
      "eventName": "CREATE_ORDER_CONFIG",
      "description": "Configurar Contado Lista 1",
      "validate": (p) => p.paymentCondition === 'contado' && p.priceList === '1' && p.line === 'lubricantes' && p.brand === 'shell',
      "errorMessage": "Configura: Contado, Lista 1, Lubricantes Shell."
    },
    {
      "stepIndex": 4,
      "eventName": "ADD_PRODUCT",
      "description": "Agregar 4 botellas Helix Plus",
      "validate": (p) => (p.product || '').toLowerCase().includes('plus') && Number(p.quantity) === 4,
      "errorMessage": "Agrega 4 botellas Shell Helix Plus."
    },
    {
      "stepIndex": 5,
      "eventName": "SUBMIT_ORDER",
      "description": "Confirmar orden",
      "validate": (p) => p.confirmed === true,
      "errorMessage": "Confirma la orden."
    }
  ]
},
{
  "id": "case-9",
  "code": "B2C-09",
  "title": "Caso 9: Venta con regalo por volumen (Lubricantes Shell)",
  "module": "Ventas B2C",
  "client": "Servicentro El Faro",
  "clientAddress": "AV. DOLORES 880",
  "paymentCondition": "contado",
  "paymentConditionLabel": "Contado (5% desc.)",
  "priceList": "2",
  "line": "lubricantes",
  "brand": "shell",
  "product": "Shell Helix HX7 10W/40",
  "unitPrice": 25,
  "expectedQty": 5,
  "promoDiscount": true,
  "promoType": "gift",
  "promoLabel": "🎁 Regalo: 1 caja botellas Shell Helix Plus (108203)",
  "publicTitle": "Venta por Escala con Promoción de Volumen",
  "instructions": "Atiendes a Servicentro El Faro. El comprador solicita 5 baldes de Shell Helix HX7 10W/40 con pago al contado en Lista 2, solicitando expresamente la bonificación de regalo en producto aplicable por volumen de compra. Gestiona la visita y emite la orden con las condiciones comerciales pactadas.",
  "active": true,
  "scoring": {
    "maxScore": 20,
    "penaltyPerError": 4,
    "maxErrorsAllowed": 2,
    "scale": "vigesimal"
  },
  "solutionFlow": {
    "objetivo": "Aplicar promoción oficial de regalo por volumen en línea Lubricantes respetando la regla mono-línea.",
    "pasoAPaso": [
      "1. Seleccionar Servicentro El Faro en la ruta e iniciar visita.",
      "2. Capturar y guardar fotos de fachada y exhibidor.",
      "3. Configurar Contado, Lista 2, Línea Lubricantes, Marca Shell.",
      "4. Agregar 5 baldes Shell Helix HX7 a $25 c/u activando la promoción de regalo.",
      "5. Verificar total neto USD 118.75 (5×$25 = $125 - 5% = $118.75) y confirmar orden."
    ],
    "reglaNegocio": "Cada pedido en UYAPAY corresponde a una sola línea de negocio.",
    "decisionClave": "Mantener el pedido exclusivamente en la línea Lubricantes y activar el regalo correspondiente.",
    "resultadoEsperado": "Orden emitida por USD 118.75 con regalo de botellas registrado."
  },
  "rules": [
    {
      "stepIndex": 0,
      "eventName": "SELECT_CLIENT",
      "description": "Seleccionar Servicentro El Faro",
      "validate": (p) => (p.clientName || '').toLowerCase().includes('faro'),
      "errorMessage": "Selecciona a Servicentro El Faro."
    },
    {
      "stepIndex": 1,
      "eventName": "SELECT_ACTION",
      "description": "Iniciar visita",
      "validate": (p) => p.action === 'iniciar',
      "errorMessage": "Inicia la visita."
    },
    {
      "stepIndex": 2,
      "eventName": "SAVE_PHOTOS",
      "description": "Fotos de visita",
      "validate": (p) => p.initialPhoto && p.finalPhoto,
      "errorMessage": "Registra las fotos de visita."
    },
    {
      "stepIndex": 3,
      "eventName": "CREATE_ORDER_CONFIG",
      "description": "Configurar Contado Lista 2 Shell",
      "validate": (p) => p.paymentCondition === 'contado' && p.priceList === '2' && p.line === 'lubricantes' && p.brand === 'shell',
      "errorMessage": "Configura: Contado, Lista 2, Lubricantes Shell."
    },
    {
      "stepIndex": 4,
      "eventName": "ADD_PRODUCT",
      "description": "Agregar 5 baldes con regalo",
      "validate": (p) => (p.product || '').toLowerCase().includes('hx7') && Number(p.quantity) === 5 && Boolean(p.promoDiscount),
      "errorMessage": "Agrega 5 baldes Helix HX7 con la promoción de regalo activada."
    },
    {
      "stepIndex": 5,
      "eventName": "SUBMIT_ORDER",
      "description": "Confirmar orden",
      "validate": (p) => p.confirmed === true,
      "errorMessage": "Confirma la orden."
    }
  ]
},
{
  "id": "case-10",
  "code": "B2C-10",
  "title": "Caso 10: Pedido corporativo grande a crédito 45 días",
  "module": "Ventas B2B",
  "client": "Minera Andina Contratistas SAC",
  "clientAddress": "PARQUE INDUSTRIAL MZ. C LOTE 4",
  "paymentCondition": "credito_45",
  "paymentConditionLabel": "Crédito 45 días (2% desc.)",
  "priceList": "EC",
  "line": "lubricantes",
  "brand": "shell",
  "product": "Shell Retinax HD2",
  "unitPrice": 350,
  "expectedQty": 2,
  "promoDiscount": true,
  "promoType": "discount",
  "promoDiscountAmount": 40,
  "promoLabel": "🎁 Descuento por Volumen: -$40.00 USD",
  "publicTitle": "Despacho Minero a Crédito Extendido",
  "instructions": "En Minera Andina Contratistas SAC, la gerencia de compras requiere 2 cilindros de Shell Retinax HD2 (55 Gal) con condición de Crédito a 45 días en su Lista Especial Corporativa (EC), solicitando la aplicación del descuento acordado por volumen de $40.00 USD. Registra la visita y tramita la orden corporativa.",
  "active": true,
  "scoring": {
    "maxScore": 20,
    "penaltyPerError": 4,
    "maxErrorsAllowed": 2,
    "scale": "vigesimal"
  },
  "solutionFlow": {
    "objetivo": "Tramitar compra a crédito de gran volumen para cliente minero aplicando descuento comercial aprovisionado.",
    "pasoAPaso": [
      "1. Seleccionar Minera Andina Contratistas SAC en Parque Industrial e iniciar visita.",
      "2. Registrar fotos de control de visita.",
      "3. Configurar Crédito 45 días, Lista EC, Lubricantes Shell.",
      "4. Agregar 2 cilindros Retinax HD2 a $350 c/u con descuento de $40 USD activado.",
      "5. Verificar cálculo: 2×$350 = $700 - $40 = $660 neto, menos 2% crédito ($13.20) = USD 646.80. Confirmar orden."
    ],
    "reglaNegocio": "Descuentos aprovisionados en compras industriales requieren validación previa del supervisor comercial.",
    "decisionClave": "Configurar Crédito 45 días con Lista EC y aplicar el descuento de $40.",
    "resultadoEsperado": "Orden emitida por USD 646.80 a 45 días."
  },
  "rules": [
    {
      "stepIndex": 0,
      "eventName": "SELECT_CLIENT",
      "description": "Seleccionar Minera Andina",
      "validate": (p) => (p.clientName || '').toLowerCase().includes('minera') || (p.clientName || '').toLowerCase().includes('andina'),
      "errorMessage": "Selecciona Minera Andina Contratistas SAC."
    },
    {
      "stepIndex": 1,
      "eventName": "SELECT_ACTION",
      "description": "Iniciar visita",
      "validate": (p) => p.action === 'iniciar',
      "errorMessage": "Inicia la visita."
    },
    {
      "stepIndex": 2,
      "eventName": "SAVE_PHOTOS",
      "description": "Fotos obligatorias",
      "validate": (p) => p.initialPhoto && p.finalPhoto,
      "errorMessage": "Registra las fotos de visita."
    },
    {
      "stepIndex": 3,
      "eventName": "CREATE_ORDER_CONFIG",
      "description": "Configurar Crédito 45d Lista EC",
      "validate": (p) => p.paymentCondition === 'credito_45' && p.priceList === 'EC' && p.line === 'lubricantes' && p.brand === 'shell',
      "errorMessage": "Configura: Crédito 45 días, Lista EC, Lubricantes Shell."
    },
    {
      "stepIndex": 4,
      "eventName": "ADD_PRODUCT",
      "description": "Agregar 2 cilindros con -$40",
      "validate": (p) => (p.product || '').toLowerCase().includes('retinax') && Number(p.quantity) === 2 && Boolean(p.promoDiscount),
      "errorMessage": "Agrega 2 cilindros Retinax con descuento de $40 USD."
    },
    {
      "stepIndex": 5,
      "eventName": "SUBMIT_ORDER",
      "description": "Confirmar orden",
      "validate": (p) => p.confirmed === true,
      "errorMessage": "Confirma la orden."
    }
  ]
},
{
  "id": "case-11",
  "code": "B2C-11",
  "title": "Caso 11: Cliente nuevo, primera compra con lista Oficina",
  "module": "Ventas B2C",
  "client": "Repuestos Central Chincha",
  "clientAddress": "CALLE COMERCIO 120 - CHINCHA",
  "paymentCondition": "contado",
  "paymentConditionLabel": "Contado (5% desc.)",
  "priceList": "OF",
  "line": "lubricantes",
  "brand": "shell",
  "product": "Shell Helix Plus 10W-40",
  "unitPrice": 5,
  "expectedQty": 3,
  "promoDiscount": false,
  "promoType": "none",
  "promoLabel": "Sin promoción aplicable",
  "publicTitle": "Atención y Alta de Cliente Fuera de Ruta",
  "instructions": "El cliente Repuestos Central Chincha (Cliente Nuevo) te contacta con urgencia para adquirir 3 botellas de Shell Helix Plus 10W-40 al contado bajo lista Oficina (OF), pero no se encuentra en tu ruta planificada de hoy. Incorpora al cliente a tu jornada y procesa su primera compra.",
  "active": true,
  "scoring": {
    "maxScore": 20,
    "penaltyPerError": 4,
    "maxErrorsAllowed": 2,
    "scale": "vigesimal"
  },
  "solutionFlow": {
    "objetivo": "Dar de alta fuera de ruta a un cliente nuevo antes de poder emitir el pedido y asignarle Lista Oficina (OF) al Contado por defecto.",
    "pasoAPaso": [
      "1. En el Plan de Visitas presionar el botón \"➕ Agregar visita fuera de ruta\".",
      "2. En el modal seleccionar \"Repuestos Central Chincha (Cliente Nuevo)\" y presionar \"Registrar Visita Fuera de Ruta\".",
      "3. Seleccionar al cliente incorporado e \"Iniciar visita\".",
      "4. Tomar y guardar fotos de fachada y exhibición.",
      "5. Configurar pedido a Contado con Lista OF (Oficina/estándar), Lubricantes Shell.",
      "6. Agregar 3 botellas Shell Helix Plus 10W-40 a $5.00 c/u.",
      "7. Verificar total neto USD 14.25 (3×$5 = $15 - 5% = $14.25) y confirmar orden."
    ],
    "reglaNegocio": "Los clientes nuevos sin historial crediticio se incorporan fuera de ruta y operan obligatoriamente bajo Lista OF al Contado.",
    "decisionClave": "Agregar la visita fuera de ruta antes de emitir el pedido y asignar Lista OF.",
    "resultadoEsperado": "Visita creada fuera de ruta y orden emitida por USD 14.25."
  },
  "rules": [
    {
      "stepIndex": 0,
      "eventName": "CREATE_OUT_ROUTE_VISIT",
      "description": "Alta fuera de ruta cliente nuevo",
      "validate": (p) => (p.clientName || '').toLowerCase().includes('chincha') || (p.clientName || '').toLowerCase().includes('repuestos central'),
      "errorMessage": "Agrega la visita fuera de ruta para Repuestos Central Chincha."
    },
    {
      "stepIndex": 1,
      "eventName": "SELECT_ACTION",
      "description": "Iniciar visita",
      "validate": (p) => p.action === 'iniciar',
      "errorMessage": "Inicia la visita al cliente nuevo."
    },
    {
      "stepIndex": 2,
      "eventName": "SAVE_PHOTOS",
      "description": "Fotos obligatorias",
      "validate": (p) => p.initialPhoto && p.finalPhoto,
      "errorMessage": "Registra las fotos de visita obligatorias."
    },
    {
      "stepIndex": 3,
      "eventName": "CREATE_ORDER_CONFIG",
      "description": "Configurar Contado Lista OF",
      "validate": (p) => p.paymentCondition === 'contado' && p.priceList === 'OF' && p.line === 'lubricantes' && p.brand === 'shell',
      "errorMessage": "Configura: Contado, Lista OF, Lubricantes Shell."
    },
    {
      "stepIndex": 4,
      "eventName": "ADD_PRODUCT",
      "description": "Agregar 3 botellas Helix Plus",
      "validate": (p) => (p.product || '').toLowerCase().includes('plus') && Number(p.quantity) === 3,
      "errorMessage": "Agrega 3 botellas Shell Helix Plus 10W-40."
    },
    {
      "stepIndex": 5,
      "eventName": "SUBMIT_ORDER",
      "description": "Confirmar orden",
      "validate": (p) => p.confirmed === true,
      "errorMessage": "Confirma la orden de compra."
    }
  ]
},
{
  "id": "case-14",
  "code": "B2C-14",
  "title": "Caso 14: Venta B2B con descuento por volumen y crédito 60 días",
  "module": "Ventas B2B",
  "client": "Constructora Vial Perú SAC",
  "clientAddress": "AV. ALFONSO UGARTE 780",
  "paymentCondition": "credito_60",
  "paymentConditionLabel": "Crédito 60 días (1% desc.)",
  "priceList": "EC",
  "line": "neumaticos",
  "brand": "michelin",
  "product": "Michelin Latitude Tour HP",
  "unitPrice": 48,
  "expectedQty": 6,
  "promoDiscount": true,
  "promoType": "discount",
  "promoDiscountAmount": 15,
  "promoLabel": "🎁 Descuento por Volumen B2B (5+ cajas: -$15.00 USD)",
  "publicTitle": "Venta Mayorista de Neumáticos de Carga",
  "instructions": "En Constructora Vial Perú SAC, el área de logística solicita 6 cajas de neumáticos Michelin Latitude Tour HP a Crédito 60 días bajo Lista Especial Corporativa (EC), aplicando el descuento por escala mayorista de $15.00 USD. Registra la visita y emite la orden de compra.",
  "active": true,
  "scoring": {
    "maxScore": 20,
    "penaltyPerError": 4,
    "maxErrorsAllowed": 2,
    "scale": "vigesimal"
  },
  "solutionFlow": {
    "objetivo": "Atender gran cuenta de infraestructura combinando escala de volumen y plazo contractual a 60 días.",
    "pasoAPaso": [
      "1. Seleccionar Constructora Vial Perú SAC en el plan de visitas.",
      "2. Capturar fotos de control.",
      "3. Configurar Crédito 60 días (1% desc.), Lista EC, Línea Neumáticos, Marca Michelin.",
      "4. Agregar 6 cajas Michelin Latitude Tour HP a $48 c/u. Activar toggle de Descuento por Volumen ($15 USD).",
      "5. Verificar cálculo: 6×$48 = $288.00 - $15.00 = $273.00 neto; menos 1% crédito ($2.73) = USD 270.27. Confirmar orden."
    ],
    "reglaNegocio": "En Lista EC a 60 días, el descuento financiero del 1% se aplica posterior a las deducciones de volumen.",
    "decisionClave": "Activar el descuento de $15 en el catálogo y verificar la tasa del 1%.",
    "resultadoEsperado": "Orden emitida por USD 270.27."
  },
  "rules": [
    {
      "stepIndex": 0,
      "eventName": "SELECT_CLIENT",
      "description": "Seleccionar Constructora Vial Perú",
      "validate": (p) => (p.clientName || '').toLowerCase().includes('vial') || (p.clientName || '').toLowerCase().includes('constructora'),
      "errorMessage": "Selecciona Constructora Vial Perú SAC."
    },
    {
      "stepIndex": 1,
      "eventName": "SELECT_ACTION",
      "description": "Iniciar visita",
      "validate": (p) => p.action === 'iniciar',
      "errorMessage": "Inicia la visita."
    },
    {
      "stepIndex": 2,
      "eventName": "SAVE_PHOTOS",
      "description": "Fotos obligatorias",
      "validate": (p) => p.initialPhoto && p.finalPhoto,
      "errorMessage": "Registra las fotos obligatorias."
    },
    {
      "stepIndex": 3,
      "eventName": "CREATE_ORDER_CONFIG",
      "description": "Configurar Crédito 60d Lista EC",
      "validate": (p) => p.paymentCondition === 'credito_60' && p.priceList === 'EC' && p.line === 'neumaticos' && p.brand === 'michelin',
      "errorMessage": "Configura: Crédito 60 días, Lista EC, Neumáticos Michelin."
    },
    {
      "stepIndex": 4,
      "eventName": "ADD_PRODUCT",
      "description": "Agregar 6 cajas con -$15",
      "validate": (p) => (p.product || '').toLowerCase().includes('latitude') && Number(p.quantity) === 6 && Boolean(p.promoDiscount),
      "errorMessage": "Agrega 6 cajas Michelin Latitude Tour HP con descuento de $15 USD."
    },
    {
      "stepIndex": 5,
      "eventName": "SUBMIT_ORDER",
      "description": "Confirmar orden",
      "validate": (p) => p.confirmed === true,
      "errorMessage": "Confirma la orden de compra."
    }
  ]
},
{
  "id": "case-15",
  "code": "B2C-15",
  "title": "Caso 15: Revisión de historial de visitas antes de nueva venta",
  "module": "Historial y Visitas",
  "client": "Bodega y Ferretería Dos Hermanos",
  "clientAddress": "AV. TOMAS TUYRUTUPAC 820",
  "paymentCondition": "contado",
  "paymentConditionLabel": "Contado (5% desc.)",
  "priceList": "1",
  "line": "lubricantes",
  "brand": "shell",
  "product": "Shell Helix HX5 15W/40",
  "unitPrice": 18,
  "expectedQty": 4,
  "promoDiscount": false,
  "promoType": "none",
  "promoLabel": "Sin promoción (ya entregada en visita previa)",
  "publicTitle": "Visita con Auditoría de Antecedentes",
  "instructions": "Te diriges a atender a Bodega y Ferretería Dos Hermanos. Antes de registrar el pedido solicitado por el cliente (4 baldes de Shell Helix HX5 15W/40 al contado en Lista 1), debes auditar en el sistema la fecha de la última visita realizada para validar si aplican o no promociones de entrega anterior. Gestiona la atención en el aplicativo.",
  "active": true,
  "scoring": {
    "maxScore": 20,
    "penaltyPerError": 4,
    "maxErrorsAllowed": 2,
    "scale": "vigesimal"
  },
  "solutionFlow": {
    "objetivo": "Revisar el historial de visitas anteriores para verificar la última compra, registrar la fecha de auditoría en el recuadro del simulador y emitir el pedido sin duplicar promociones.",
    "pasoAPaso": [
      "1. Seleccionar Bodega y Ferretería Dos Hermanos en el plan de visitas.",
      "2. Abrir el historial de visitas previas e ingresar la fecha de la última visita (14/08/2026) en el recuadro de auditoría.",
      "3. Iniciar visita y registrar fotos de local.",
      "4. Configurar pedido a Contado con Lista 1, Lubricantes Shell.",
      "5. Agregar 4 baldes Shell Helix HX5 15W/40 a $18.00 c/u sin activar regalo.",
      "6. Verificar total neto USD 68.40 (4×$18 = $72 - 5% = $68.40) y confirmar orden."
    ],
    "reglaNegocio": "Las promociones de regalo por volumen tienen un tope de 1 entrega mensual por cliente.",
    "decisionClave": "Auditar el historial previo, registrar la última fecha de visita y no duplicar el bono.",
    "resultadoEsperado": "Fecha de auditoría registrada y orden emitida por USD 68.40."
  },
  "rules": [
    {
      "stepIndex": 0,
      "eventName": "SELECT_CLIENT",
      "description": "Seleccionar Bodega Dos Hermanos",
      "validate": (p) => (p.clientName || '').toLowerCase().includes('hermanos'),
      "errorMessage": "Selecciona Bodega y Ferretería Dos Hermanos."
    },
    {
      "stepIndex": 1,
      "eventName": "SUBMIT_INQUIRY_ANSWER",
      "description": "Registrar fecha de última visita",
      "validate": (p) => (p.date || '').includes('14/08') || (p.date || '').includes('14-08') || (p.answer || '').includes('14/08'),
      "errorMessage": "Ingresa la fecha de la última visita (14/08/2026) en el recuadro de auditoría."
    },
    {
      "stepIndex": 2,
      "eventName": "SELECT_ACTION",
      "description": "Iniciar visita",
      "validate": (p) => p.action === 'iniciar',
      "errorMessage": "Inicia la visita."
    },
    {
      "stepIndex": 3,
      "eventName": "SAVE_PHOTOS",
      "description": "Fotos de visita",
      "validate": (p) => p.initialPhoto && p.finalPhoto,
      "errorMessage": "Registra las fotos de visita."
    },
    {
      "stepIndex": 4,
      "eventName": "CREATE_ORDER_CONFIG",
      "description": "Configurar Contado Lista 1",
      "validate": (p) => p.paymentCondition === 'contado' && p.priceList === '1' && p.line === 'lubricantes' && p.brand === 'shell',
      "errorMessage": "Configura: Contado, Lista 1, Lubricantes Shell."
    },
    {
      "stepIndex": 5,
      "eventName": "ADD_PRODUCT",
      "description": "Agregar 4 baldes HX5 sin regalo",
      "validate": (p) => (p.product || '').toLowerCase().includes('hx5') && Number(p.quantity) === 4 && !p.promoDiscount,
      "errorMessage": "Agrega 4 baldes Shell Helix HX5 SIN activar promoción de regalo."
    },
    {
      "stepIndex": 6,
      "eventName": "SUBMIT_ORDER",
      "description": "Confirmar orden",
      "validate": (p) => p.confirmed === true,
      "errorMessage": "Confirma la orden."
    }
  ]
},
{
  "id": "case-16",
  "code": "B2C-16",
  "title": "Caso 16: [GPS] Intento de inicio presencial a >50m y bypass por visita telefónica",
  "module": "Visitas y Georreferenciación",
  "client": "Distribuidora Kanchis EIRL",
  "clientAddress": "AV. INDUSTRIAL 104 - SOCABAYA",
  "paymentCondition": "credito_30",
  "paymentConditionLabel": "Crédito 30 días (3% desc.)",
  "priceList": "OF",
  "line": "neumaticos",
  "brand": "michelin",
  "product": "Michelin Energy XM2+ 195/60 R15",
  "unitPrice": 55,
  "expectedQty": 2,
  "isPhoneVisit": true,
  "publicTitle": "Atención a Cliente Fuera del Rango de Ubicación",
  "instructions": "El cliente Distribuidora Kanchis EIRL solicita un pedido urgente de 2 cajas de Michelin Energy XM2+ a Crédito 30 días con Lista OF. Sin embargo, tu ubicación actual se encuentra distante del local comercial (fuera de la geocerca permitida). Resuelve la atención en el aplicativo respetando los protocolos operativos de registro de visitas.",
  "active": true,
  "scoring": {
    "maxScore": 20,
    "penaltyPerError": 4,
    "maxErrorsAllowed": 2,
    "scale": "vigesimal"
  },
  "solutionFlow": {
    "objetivo": "Comprender la restricción de geocerca GPS de 50 metros (visit_validations.dart) y el bypass operativo formal mediante visita telefónica.",
    "pasoAPaso": [
      "1. En el Plan de Visitas pulsar sobre \"Distribuidora Kanchis EIRL\" y seleccionar \"Iniciar visita\".",
      "2. Ante la advertencia de geocerca (ubicación a más de 50m), seleccionar la opción \"Iniciar Visita Telefónica (Llamada)\".",
      "3. El sistema activa el flag isPhoneVisit=true y permite el acceso directo al cliente.",
      "4. Configurar pedido: Crédito 30 días, Lista OF, Neumáticos Michelin.",
      "5. Agregar 2 cajas Energy XM2+ y confirmar la orden de compra telefónica."
    ],
    "reglaNegocio": "Según visit_validations.dart (maxDistanceInMeters = 50), las visitas presenciales requieren proximidad estricta. La atención remota debe registrarse como Visita Telefónica (visitTypeId = 2).",
    "decisionClave": "Activar la modalidad de Visita Telefónica en lugar de forzar el inicio presencial fuera de rango.",
    "resultadoEsperado": "Visita iniciada y orden registrada formalmente como atención telefónica."
  },
  "rules": [
    {
      "stepIndex": 0,
      "eventName": "SELECT_CLIENT",
      "description": "Seleccionar Distribuidora Kanchis",
      "validate": (p) => (p.clientName || '').toLowerCase().includes('kanchis'),
      "errorMessage": "Selecciona Distribuidora Kanchis EIRL."
    },
    {
      "stepIndex": 1,
      "eventName": "SELECT_ACTION",
      "description": "Iniciar visita",
      "validate": (p) => p.action === 'iniciar',
      "errorMessage": "Presiona \"Iniciar visita\"."
    },
    {
      "stepIndex": 2,
      "eventName": "SELECT_VISIT_TYPE",
      "description": "Activar Visita Telefónica",
      "validate": (p) => p.visitType === 'telefonica' || p.isPhoneVisit === true,
      "errorMessage": "Debes seleccionar \"Visita Telefónica\" para operar a distancia de forma autorizada."
    },
    {
      "stepIndex": 3,
      "eventName": "CREATE_ORDER_CONFIG",
      "description": "Configurar pedido Crédito 30d",
      "validate": (p) => p.paymentCondition === 'credito_30' && p.line === 'neumaticos',
      "errorMessage": "Configura: Crédito 30 días, Línea Neumáticos."
    },
    {
      "stepIndex": 4,
      "eventName": "ADD_PRODUCT",
      "description": "Agregar 2 cajas Energy XM2+",
      "validate": (p) => Number(p.quantity) >= 1,
      "errorMessage": "Agrega las cajas de Energy XM2+ requeridas."
    },
    {
      "stepIndex": 5,
      "eventName": "SUBMIT_ORDER",
      "description": "Confirmar orden telefónica",
      "validate": (p) => p.confirmed === true,
      "errorMessage": "Confirma la orden de compra."
    }
  ]
},
{
  "id": "case-17",
  "code": "B2C-17",
  "title": "Caso 17: [Tareas] Cierre de visita con justificación formal de no emisión de pedido (T5)",
  "module": "Visitas y Tareas",
  "client": "Comercial Vega Hnos.",
  "clientAddress": "CALLE MERCADERES 301",
  "publicTitle": "Visita sin Venta por Ocupación del Cliente",
  "instructions": "Llegas al establecimiento de Comercial Vega Hnos. para cumplir con la visita de ruta. El propietario te explica que se encuentra ocupado en la descarga de mercadería pesada y no podrá realizar pedidos en esta ocasión. Concluye la visita en el sistema registrando formalmente el motivo según el protocolo de la empresa.",
  "active": true,
  "scoring": {
    "maxScore": 20,
    "penaltyPerError": 4,
    "maxErrorsAllowed": 2,
    "scale": "vigesimal"
  },
  "solutionFlow": {
    "objetivo": "Manejar la justificación estructurada de tareas obligatorias incompletas (IncompleteVisitTaskPanel) para cerrar visitas sin penalización comercial.",
    "pasoAPaso": [
      "1. Seleccionar Comercial Vega Hnos. e iniciar visita presencial.",
      "2. Capturar y guardar las fotos de visita obligatorias.",
      "3. En el menú de tareas de visita pulsar sobre \"¿Por qué no completó la tarea?\".",
      "4. Seleccionar el motivo oficial: \"Cliente muy ocupado\" y presionar \"Guardar Justificación y Finalizar\".",
      "5. El sistema registra el cierre formal de la visita cumpliendo el 100% de la pauta de ruta."
    ],
    "reglaNegocio": "La tarea T5 (\"Asesorar en el proceso de pedido\") es obligatoria (15%). Si el cliente no compra, el asesor debe seleccionar un motivo de la tabla visit_task para no afectar su porcentaje de cumplimiento.",
    "decisionClave": "Seleccionar \"Cliente muy ocupado\" en el panel de justificación de tareas incompletas.",
    "resultadoEsperado": "Visita finalizada en verde con justificación formal transmitida al supervisor."
  },
  "rules": [
    {
      "stepIndex": 0,
      "eventName": "SELECT_CLIENT",
      "description": "Seleccionar Comercial Vega Hnos.",
      "validate": (p) => (p.clientName || '').toLowerCase().includes('vega'),
      "errorMessage": "Selecciona Comercial Vega Hnos."
    },
    {
      "stepIndex": 1,
      "eventName": "SELECT_ACTION",
      "description": "Iniciar visita",
      "validate": (p) => p.action === 'iniciar',
      "errorMessage": "Presiona \"Iniciar visita\"."
    },
    {
      "stepIndex": 2,
      "eventName": "SAVE_PHOTOS",
      "description": "Fotos obligatorias",
      "validate": (p) => p.initialPhoto && p.finalPhoto,
      "errorMessage": "Registra las fotos obligatorias."
    },
    {
      "stepIndex": 3,
      "eventName": "JUSTIFY_INCOMPLETE_TASK",
      "description": "Justificar tarea incompleta",
      "validate": (p) => p.taskId === 'T5' || (p.reason || '').toLowerCase().includes('ocupado'),
      "errorMessage": "Debes seleccionar el motivo \"Cliente muy ocupado\" para justificar la no emisión de pedido."
    },
    {
      "stepIndex": 4,
      "eventName": "FINISH_VISIT",
      "description": "Finalizar visita",
      "validate": (p) => p.confirmed === true,
      "errorMessage": "Confirma la finalización de la visita."
    }
  ]
},
{
  "id": "case-18",
  "code": "B2C-18",
  "title": "Caso 18: [Cotización] Registro de propuesta comercial formal como Cotización (Tipo 3)",
  "module": "Pedidos y Cotizaciones",
  "client": "Grupo Ferretero Miraflores",
  "clientAddress": "AV. SAN JERONIMO 210",
  "paymentCondition": "credito_30",
  "paymentConditionLabel": "Crédito 30 días (3% desc.)",
  "priceList": "OF",
  "line": "neumaticos",
  "brand": "michelin",
  "product": "Michelin Energy XM2+ 195/60 R15",
  "unitPrice": 55,
  "expectedQty": 2,
  "publicTitle": "Presentación de Propuesta Comercial",
  "instructions": "En Grupo Ferretero Miraflores, el administrador muestra interés en 2 cajas de Michelin Energy XM2+ a Crédito 30 días (Lista OF), pero el representante legal no se encuentra para autorizar la compra en firme. Registra formalmente la propuesta comercial en el sistema sin comprometer stock ni línea de crédito de forma definitiva.",
  "active": true,
  "scoring": {
    "maxScore": 20,
    "penaltyPerError": 4,
    "maxErrorsAllowed": 2,
    "scale": "vigesimal"
  },
  "solutionFlow": {
    "objetivo": "Distinguir entre Orden de Compra (Tipo 2) y Cotización (Tipo 3) en el cierre de ventas según el nivel de compromiso del cliente.",
    "pasoAPaso": [
      "1. Iniciar visita en Grupo Ferretero Miraflores y capturar fotos.",
      "2. Configurar pedido: Crédito 30 días, Lista OF, Neumáticos Michelin.",
      "3. Agregar 2 cajas Michelin Energy XM2+.",
      "4. En el Resumen de Orden, pulsar el botón secundario: \"📄 Guardar como Cotización (Tipo 3)\".",
      "5. Verificar que el documento quede registrado como Cotización sin consumir línea de crédito disponible."
    ],
    "reglaNegocio": "Emitir una Orden de Compra reserva inventario físico en almacén y reduce el saldo de crédito. Cuando la propuesta está en evaluación, la política UYAPAY exige emitir una Cotización (documentTypeId = 3).",
    "decisionClave": "Presionar \"Guardar como Cotización (Tipo 3)\" en lugar de \"Actualizar Orden de Compra\".",
    "resultadoEsperado": "Cotización guardada exitosamente en el módulo de pedidos."
  },
  "rules": [
    {
      "stepIndex": 0,
      "eventName": "SELECT_CLIENT",
      "description": "Seleccionar Grupo Ferretero Miraflores",
      "validate": (p) => (p.clientName || '').toLowerCase().includes('miraflores'),
      "errorMessage": "Selecciona Grupo Ferretero Miraflores."
    },
    {
      "stepIndex": 1,
      "eventName": "SELECT_ACTION",
      "description": "Iniciar visita",
      "validate": (p) => p.action === 'iniciar',
      "errorMessage": "Inicia la visita."
    },
    {
      "stepIndex": 2,
      "eventName": "SAVE_PHOTOS",
      "description": "Fotos obligatorias",
      "validate": (p) => p.initialPhoto && p.finalPhoto,
      "errorMessage": "Registra las fotos de visita."
    },
    {
      "stepIndex": 3,
      "eventName": "CREATE_ORDER_CONFIG",
      "description": "Configuración comercial",
      "validate": (p) => p.paymentCondition === 'credito_30' && p.line === 'neumaticos',
      "errorMessage": "Configura Crédito 30 días y Neumáticos."
    },
    {
      "stepIndex": 4,
      "eventName": "ADD_PRODUCT",
      "description": "Agregar producto",
      "validate": (p) => Number(p.quantity) >= 1,
      "errorMessage": "Agrega las 2 cajas de neumáticos."
    },
    {
      "stepIndex": 5,
      "eventName": "SUBMIT_ORDER",
      "description": "Guardar como Cotización",
      "validate": (p) => p.confirmed === true && (p.documentType === 'cotizacion' || p.documentTypeId === 3),
      "errorMessage": "Debes presionar \"Guardar como Cotización (Tipo 3)\"."
    }
  ]
},
{
  "id": "case-19",
  "code": "B2C-19",
  "title": "Caso 19: [Cobranzas] Cobranza mixta de facturas (Efectivo + Depósito con voucher)",
  "module": "Cobranzas",
  "client": "Taller Hyundai Express",
  "clientAddress": "AV. PARRA 314",
  "publicTitle": "Cobranza de Facturas con Pago Dividido",
  "instructions": "Visitas a Taller Hyundai Express para gestionar la cobranza de facturas vencidas. El cliente efectúa un pago parcial mixto: entrega USD 200.00 en Efectivo y adjunta una constancia de Depósito Bancario por USD 150.00. Registra ambos abonos en el sistema, valida los comprobantes y asegura que la cobranza quede debidamente consolidada.",
  "active": true,
  "scoring": {
    "maxScore": 20,
    "penaltyPerError": 4,
    "maxErrorsAllowed": 2,
    "scale": "vigesimal"
  },
  "solutionFlow": {
    "objetivo": "Procesar un cobro mixto aplicando pagos fraccionados en efectivo y depósito bancario con sustento fotográfico de voucher listo para conciliación en créditos.",
    "pasoAPaso": [
      "1. Iniciar visita en Taller Hyundai Express y tomar fotos.",
      "2. En el menú de tareas pulsar sobre \"💰 3. Cobranza de facturas / Letras\".",
      "3. En el formulario de cobranza registrar: Pago en Efectivo USD 200.00 y Pago en Depósito USD 150.00 (adjuntando foto del comprobante de transferencia).",
      "4. Presionar \"Emitir Recibos Provisionales Consolidados\".",
      "5. Validar la emisión de ambos recibos electrónicos en la pestaña \"Recientes\"."
    ],
    "reglaNegocio": "UYAPAY permite amortizaciones multi-medio. Todo abono bancario requiere obligatoriamente foto del voucher de depósito para su posterior validación en créditos/tesorería.",
    "decisionClave": "Registrar ambos medios de pago y confirmar la emisión consolidada de recibos provisionales.",
    "resultadoEsperado": "Recaudación registrada por USD 350.00 con comprobante bancario validado."
  },
  "rules": [
    {
      "stepIndex": 0,
      "eventName": "SELECT_CLIENT",
      "description": "Seleccionar Taller Hyundai Express",
      "validate": (p) => (p.clientName || '').toLowerCase().includes('hyundai') || (p.clientName || '').toLowerCase().includes('express'),
      "errorMessage": "Selecciona Taller Hyundai Express."
    },
    {
      "stepIndex": 1,
      "eventName": "SELECT_ACTION",
      "description": "Iniciar visita",
      "validate": (p) => p.action === 'iniciar',
      "errorMessage": "Inicia la visita."
    },
    {
      "stepIndex": 2,
      "eventName": "SAVE_PHOTOS",
      "description": "Fotos de visita",
      "validate": (p) => p.initialPhoto && p.finalPhoto,
      "errorMessage": "Registra las fotos obligatorias."
    },
    {
      "stepIndex": 3,
      "eventName": "COLLECT_DEBTS",
      "description": "Registrar cobro mixto",
      "validate": (p) => Number(p.cashAmount) > 0 && Number(p.depositAmount) > 0,
      "errorMessage": "Registra tanto el cobro en efectivo como el depósito bancario."
    },
    {
      "stepIndex": 4,
      "eventName": "CONFIRM_RECEIPTS",
      "description": "Confirmar recibos provisionales",
      "validate": (p) => p.confirmed === true,
      "errorMessage": "Confirma la emisión consolidada de recibos."
    }
  ]
},
{
  "id": "case-20",
  "code": "B2C-20",
  "title": "Caso 20: [Promociones] Exclusión mutua de promociones del mismo combo (Condición 4000)",
  "module": "Ventas B2C",
  "client": "Servicentro El Faro",
  "clientAddress": "AV. DOLORES 880",
  "paymentCondition": "contado",
  "paymentConditionLabel": "Contado (5% desc.)",
  "priceList": "2",
  "line": "lubricantes",
  "brand": "shell",
  "product": "Shell Helix HX7 10W/40",
  "unitPrice": 25,
  "expectedQty": 5,
  "promoDiscount": true,
  "promoType": "gift",
  "publicTitle": "Aplicación de Políticas y Reglas Promocionales",
  "instructions": "En Servicentro El Faro, el cliente solicita 5 baldes de Shell Helix HX7 al contado en Lista 2 con bonificación promocional. Procesa el pedido aplicando la política comercial correcta, evitando combinaciones de promociones incompatibles o no acumulables.",
  "active": true,
  "scoring": {
    "maxScore": 20,
    "penaltyPerError": 4,
    "maxErrorsAllowed": 2,
    "scale": "vigesimal"
  },
  "solutionFlow": {
    "objetivo": "Aplicar la regla de exclusión mutua de promociones (condición 4000 del motor de pedidos) donde no se pueden acumular dos beneficios del mismo paquete promocional.",
    "pasoAPaso": [
      "1. Seleccionar Servicentro El Faro e iniciar visita.",
      "2. Tomar fotos de exhibición.",
      "3. Configurar pedido: Contado, Lista 2, Lubricantes Shell.",
      "4. En el catálogo agregar 5 baldes Shell Helix HX7 y activar la promoción de regalo oficial.",
      "5. No intentar marcar descuentos directos en dinero incompatibles del mismo paquete (evitando error 400). Confirmar orden."
    ],
    "reglaNegocio": "Según OrderCustomerController.cs:4543 (condition_4000), las promociones agrupadas en un mismo promotion_package son mutuamente excluyentes (Count <= 1).",
    "decisionClave": "Activar únicamente la promoción autorizada sin solapar incentivos incompatibles.",
    "resultadoEsperado": "Orden confirmada válidamente con el beneficio oficial aplicado."
  },
  "rules": [
    {
      "stepIndex": 0,
      "eventName": "SELECT_CLIENT",
      "description": "Seleccionar Servicentro El Faro",
      "validate": (p) => (p.clientName || '').toLowerCase().includes('faro'),
      "errorMessage": "Selecciona Servicentro El Faro."
    },
    {
      "stepIndex": 1,
      "eventName": "SELECT_ACTION",
      "description": "Iniciar visita",
      "validate": (p) => p.action === 'iniciar',
      "errorMessage": "Inicia la visita."
    },
    {
      "stepIndex": 2,
      "eventName": "SAVE_PHOTOS",
      "description": "Fotos de visita",
      "validate": (p) => p.initialPhoto && p.finalPhoto,
      "errorMessage": "Registra las fotos obligatorias."
    },
    {
      "stepIndex": 3,
      "eventName": "CREATE_ORDER_CONFIG",
      "description": "Configurar Contado Lista 2",
      "validate": (p) => p.paymentCondition === 'contado' && p.priceList === '2',
      "errorMessage": "Configura Contado con Lista 2."
    },
    {
      "stepIndex": 4,
      "eventName": "ADD_PRODUCT",
      "description": "Agregar 5 baldes con promo oficial",
      "validate": (p) => (p.product || '').toLowerCase().includes('hx7') && Number(p.quantity) === 5 && Boolean(p.promoDiscount),
      "errorMessage": "Agrega 5 baldes Shell Helix HX7 con la promoción oficial activada."
    },
    {
      "stepIndex": 5,
      "eventName": "SUBMIT_ORDER",
      "description": "Confirmar orden",
      "validate": (p) => p.confirmed === true,
      "errorMessage": "Confirma la orden de compra."
    }
  ]
},
{
  "id": "case-21",
  "code": "B2C-21",
  "title": "Caso 21: [Ruta] Consulta y priorización de clientes con deuda vencida en el plan del día",
  "module": "Plan de Visitas",
  "client": "Distribuidora Kanchis EIRL",
  "clientAddress": "AV. INDUSTRIAL 104 - SOCABAYA",
  "publicTitle": "Gestión de Cartera Morosa en Ruta",
  "instructions": "Al iniciar tu jornada, debes revisar tu cartera del día para identificar a los clientes que presentan deuda vencida crítica antes de proceder con despachos de mercadería. Localiza al cliente con mayor riesgo de mora y audita su estado de cuenta corriente en el sistema.",
  "active": true,
  "scoring": {
    "maxScore": 20,
    "penaltyPerError": 4,
    "maxErrorsAllowed": 2,
    "scale": "vigesimal"
  },
  "solutionFlow": {
    "objetivo": "Utilizar las herramientas de inteligencia de ruta para filtrar clientes con morosidad vencida (over_due_date en SellerController) y auditar su perfil crediticio.",
    "pasoAPaso": [
      "1. En la pantalla principal de Visitas (s-visitas), pulsar la pastilla \"Deuda vencida\".",
      "2. El sistema filtra la lista aislando a Distribuidora Kanchis EIRL con badge de alerta morosa (USD 840.00).",
      "3. Pulsar sobre el cliente y seleccionar \"Consultar perfil / deuda vencida\" para auditar el importe vencido.",
      "4. Con la consulta de deuda completada, la cartera morosa queda priorizada formalmente."
    ],
    "reglaNegocio": "El endpoint /Seller/visit_plans/seller/{id}/v2?over_due_date=true ejecuta un CTE sobre v_app_movement_debts aislando los clientes con mora vencida para la priorización en ruta.",
    "decisionClave": "Filtrar por \"Deuda vencida\" al inicio de ruta y auditar la cuenta corriente del cliente.",
    "resultadoEsperado": "Cartera morosa priorizada y auditada."
  },
  "rules": [
    {
      "stepIndex": 0,
      "eventName": "SELECT_FILTER",
      "description": "Filtrar por Deuda Vencida",
      "validate": (p) => p.filter === 'deuda_vencida',
      "errorMessage": "En la barra superior debes presionar la pastilla \"Deuda vencida\"."
    },
    {
      "stepIndex": 1,
      "eventName": "SELECT_CLIENT",
      "description": "Seleccionar cliente con deuda",
      "validate": (p) => (p.clientName || '').toLowerCase().includes('kanchis'),
      "errorMessage": "Selecciona a Distribuidora Kanchis EIRL."
    },
    {
      "stepIndex": 2,
      "eventName": "VIEW_DEBTS",
      "description": "Consultar perfil de deuda",
      "validate": (p) => p.verified === true || p.viewed === true,
      "errorMessage": "Consulta el perfil crediticio y el saldo moroso del cliente."
    }
  ]
},
{
  "id": "case-22",
  "code": "B2C-22",
  "title": "Caso 22: [Fuera de Ruta] Alta de visita fuera de ruta para despacho urgente en zona",
  "module": "Plan de Visitas",
  "client": "Autopartes El Rápido",
  "clientAddress": "JR. PIEROLA 540",
  "paymentCondition": "contado",
  "paymentConditionLabel": "Contado (5% desc.)",
  "priceList": "1",
  "line": "lubricantes",
  "brand": "shell",
  "product": "Shell Helix Plus 10W-40",
  "unitPrice": 5,
  "expectedQty": 4,
  "publicTitle": "Atención Fuera de Ruta por Emergencia de Taller",
  "instructions": "El taller Autopartes El Rápido te contacta requiriendo con urgencia 4 botellas de Shell Helix Plus 10W-40 al contado (Lista 1), pero el cliente no figuraba en tu plan programado del día. Incorpora la visita en tu aplicativo y gestiona el pedido requerido.",
  "active": true,
  "scoring": {
    "maxScore": 20,
    "penaltyPerError": 4,
    "maxErrorsAllowed": 2,
    "scale": "vigesimal"
  },
  "solutionFlow": {
    "objetivo": "Incorporar una atención no programada en el día (NewOutRoutVisitFormPage) vinculando cliente de cartera, dirección fiscal y tareas asignadas.",
    "pasoAPaso": [
      "1. En el Plan de Visitas presionar el botón \"➕ Agregar visita fuera de ruta\".",
      "2. En el formulario seleccionar: Cliente = Autopartes El Rápido, Dirección = JR. PIEROLA 540, Marcar Tareas de Pedidos y Fotos. Presionar \"Registrar Visita Fuera de Ruta\".",
      "3. El cliente se inserta en el plan del día. Seleccionar \"Iniciar visita\".",
      "4. Tomar fotos de exhibición.",
      "5. Configurar pedido al Contado (Lista 1, Shell Helix Plus 4 botellas) y confirmar orden."
    ],
    "reglaNegocio": "Las visitas fuera de ruta permiten atender contingencias de clientes de cartera sin alterar la programación semanal de SOLAR, quedando registradas con el flag out_route = true.",
    "decisionClave": "Crear la visita fuera de ruta con la dirección correspondiente antes de intentar emitir el pedido.",
    "resultadoEsperado": "Visita fuera de ruta incorporada y pedido emitido con éxito."
  },
  "rules": [
    {
      "stepIndex": 0,
      "eventName": "CREATE_OUT_ROUTE_VISIT",
      "description": "Crear visita fuera de ruta",
      "validate": (p) => (p.clientName || '').toLowerCase().includes('rapido') || (p.clientName || '').toLowerCase().includes('rápido'),
      "errorMessage": "Crea la visita fuera de ruta para Autopartes El Rápido."
    },
    {
      "stepIndex": 1,
      "eventName": "SELECT_ACTION",
      "description": "Iniciar visita fuera de ruta",
      "validate": (p) => p.action === 'iniciar',
      "errorMessage": "Inicia la visita."
    },
    {
      "stepIndex": 2,
      "eventName": "SAVE_PHOTOS",
      "description": "Fotos obligatorias",
      "validate": (p) => p.initialPhoto && p.finalPhoto,
      "errorMessage": "Registra las fotos de visita."
    },
    {
      "stepIndex": 3,
      "eventName": "CREATE_ORDER_CONFIG",
      "description": "Configurar pedido Contado",
      "validate": (p) => p.paymentCondition === 'contado' && p.line === 'lubricantes',
      "errorMessage": "Configura Contado y Lubricantes."
    },
    {
      "stepIndex": 4,
      "eventName": "ADD_PRODUCT",
      "description": "Agregar 4 botellas",
      "validate": (p) => Number(p.quantity) >= 1,
      "errorMessage": "Agrega las botellas de lubricante."
    },
    {
      "stepIndex": 5,
      "eventName": "SUBMIT_ORDER",
      "description": "Confirmar orden",
      "validate": (p) => p.confirmed === true,
      "errorMessage": "Confirma la orden fuera de ruta."
    }
  ]
},
{
  "id": "case-23",
  "code": "B2C-23",
  "title": "Caso 23: [Liquidación] Arqueo y cierre de liquidación de cobranza al término de la jornada",
  "module": "Liquidación de Ventas",
  "client": "Liquidación General de Ruta",
  "publicTitle": "Cierre y Liquidación de Jornada",
  "instructions": "Has finalizado tus visitas en campo. Debes realizar el arqueo y balance de todas las cobranzas recaudadas durante el día (efectivo y depósitos bancarios), verificando que no existan recibos pendientes de envío y generando el consolidado oficial de liquidación de cobranza de la jornada.",
  "active": true,
  "scoring": {
    "maxScore": 20,
    "penaltyPerError": 5,
    "maxErrorsAllowed": 1,
    "scale": "vigesimal"
  },
  "solutionFlow": {
    "objetivo": "Ejecutar el proceso formal de liquidación de cobranza (SalesSettlement) al cierre de la jornada operativa generando el consolidado para validar cobranzas.",
    "pasoAPaso": [
      "1. En el Plan de Visitas presionar el botón \"📊 Liquidación de cobranza diaria\".",
      "2. En el panel de liquidación auditar los subtotales: Efectivo Soles/Dólares, Depósitos bancarios validados y verificación de cero recibos pendientes.",
      "3. Presionar \"Generar Consolidado de Cobranzas y Finalizar\" para transmitir el arqueo diario a SOLAR."
    ],
    "reglaNegocio": "El cierre de liquidación (sales_settlement) consolida todos los recibos electrónicos emitidos en el día, generando el balance de cuadre de caja para tesorería/créditos.",
    "decisionClave": "Auditar los totales y generar el consolidado de cobranzas para cerrar la jornada.",
    "resultadoEsperado": "Consolidado generado para validar cobranzas."
  },
  "rules": [
    {
      "stepIndex": 0,
      "eventName": "VIEW_SETTLEMENT",
      "description": "Abrir liquidación diaria",
      "validate": (p) => p.viewed === true,
      "errorMessage": "Abre el panel de \"Liquidación de cobranza diaria\"."
    },
    {
      "stepIndex": 1,
      "eventName": "SUBMIT_SETTLEMENT",
      "description": "Generar consolidado y finalizar",
      "validate": (p) => p.confirmed === true,
      "errorMessage": "Genera el consolidado y finaliza la liquidación."
    }
  ]
}
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.UyapayData;
}
