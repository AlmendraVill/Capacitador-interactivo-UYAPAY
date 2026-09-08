# Casos de Prueba — Simulador UYAPAY Asesor B2C

### Módulo de Evaluación — Capacitación 12 asesores

**Notas generales de reglas de negocio usadas en todos los casos:**

- Contado: 5% descuento | Crédito 15 días: 4% | Crédito 30 días: 3% | Crédito 45 días: 2% | Crédito 60 días: 1%
- Precios: Botella USD 5 | Balde USD 10–30 | Caja USD 40–60 | Cilindro USD 200–400
- Listas de precio B2C (minorista): Oficina (más cara) → 1 → 2 → 3 → 4 (más barata)
- Listas de precio B2B (corporativo): 5 → 6 → 7 → 8 — el asesor decide cuál aplica
- Promociones: solo regalo (botella/balde/caja por volumen) o descuento en dinero por volumen, sin umbral fijo — deben ser coherentes con el monto del pedido
- Los casos marcados **[TRAMPA]** están diseñados para detectar errores reales de proceso, no solo conocimiento de producto

---

### Caso 1 — Venta simple contado con regalo por volumen

**Cliente:** Ferretería Los Andes S.A.C. (B2C, lista de precios 2)
**Pedido:** 8 baldes Shell Helix HX7 10W/40 (B-734807) a USD 22 c/u = USD 176
**Condición de pago:** Contado
**Promoción aplicable:** Por compra de 8 baldes, regalo de 2 botellas Shell Helix Plus 10W-40 (108203)
**Resultado esperado:** Total USD 176, descuento 5% (USD 8.80) → USD 167.20 + 2 botellas de regalo registradas sin costo.

---

### Caso 2 — Venta a crédito 30 días con descuento en dinero

**Cliente:** Distribuidora Kanchis EIRL (B2C, lista de precios Oficina)
**Pedido:** 3 cajas de neumáticos Michelin Energy XM2+ 195/60 R15 (003718) a USD 55 c/u = USD 165
**Condición de pago:** Crédito 30 días
**Promoción aplicable:** Descuento en dinero de USD 10 por volumen (3+ cajas)
**Resultado esperado:** USD 165 − USD 10 (promo) = USD 155; luego descuento de crédito 3% (USD 4.65) → USD 150.35.

---

### Caso 3 — Cliente corporativo, lista B2B, sin promoción

**Cliente:** Transportes del Sur SAC (B2B, lista de precios 6)
**Pedido:** 1 cilindro Shell Retinax HD2 (218272) USD 320 + 2 unidades de neumático BFGoodrich Advantage T/A SUV GO (112036) a USD 180 c/u = USD 680
**Condición de pago:** Crédito 60 días
**Resultado esperado:** Total USD 1,000; sin promo (no aplica a repuestos ni mezcla configurada); descuento crédito 1% (USD 10) → USD 990.

---

### Caso 4 — [TRAMPA] Tracking de precio de competencia solo con foto

**Contexto:** El asesor visita a un cliente y encuentra un producto de la competencia con mejor precio.
**Acción del asesor:** Toma una foto del precio y la adjunta al tracking, pero no completa el campo de precio ni marca el producto competidor.
**Resultado esperado del sistema:** Al no completarse los campos obligatorios, el registro se descarta automáticamente al guardar — equivale a no haber ingresado nada. El evaluador debe marcar este intento como incompleto.

---

### Caso 5 — [TRAMPA] Cobros sin consolidar

**Contexto:** El asesor cobra en efectivo a 3 clientes distintos durante el día.
**Acción del asesor:** Registra los 3 cobros individualmente pero no genera el consolidado de cobranza al final de la jornada.
**Resultado esperado del sistema:** Los cobros quedan registrados localmente pero nunca se envían al sistema central — el supervisor no verá ningún cobro reflejado. El evaluador debe identificar esta omisión como error crítico de cierre de ruta.

---

### Caso 6 — Consulta de nota de crédito histórica

**Cliente:** Comercial Vega Hnos.
**Acción del asesor:** Debe ubicar la nota de crédito emitida a este cliente hace 2 semanas y reportar el monto exacto por el que fue emitida (solo consulta, sin aplicarla).
**Resultado esperado:** El asesor navega al historial del cliente, localiza la nota de crédito correcta (entre varias) y reporta el monto correcto.

---

### Caso 7 — Ver y compartir estado de cuenta

**Cliente:** Grupo Ferretero Miraflores (con deuda vencida y por vencer)
**Acción del asesor:** Debe abrir el estado de cuenta del cliente, verificar los montos vencidos y por vencer, y compartirlo seleccionando la app de destino (ej. WhatsApp).
**Resultado esperado:** El asesor visualiza correctamente ambos montos (vencido y por vencer) y completa el flujo de compartir hasta la selección de la app, sin quedarse a medio camino.

---

### Caso 8 — Seguimiento de pedido emitido

**Cliente:** Autopartes El Rápido
**Acción del asesor:** Debe ubicar un pedido ya emitido, revisar su estado de seguimiento (en tránsito / entregado) y abrir el detalle para verificar qué productos específicos fueron enviados.
**Resultado esperado:** El asesor identifica correctamente el estado del pedido y lista los productos enviados según el detalle del sistema.

---

### Caso 9 — Venta mixta con regalo por volumen (lubricante + llanta)

**Cliente:** Servicentro El Faro (B2C, lista de precios 1)
**Pedido:** 5 baldes Shell Helix HX7 (B-734807) a USD 25 c/u = USD 125 + 1 neumático BFGoodrich G-Grip 205/60 R15 (050404) USD 190
**Condición de pago:** Contado
**Promoción aplicable:** Regalo de 1 caja de botellas Shell Helix Plus por compra de 5+ baldes
**Resultado esperado:** Total USD 315, descuento 5% (USD 15.75) → USD 299.25 + regalo de caja de botellas registrado.

---

### Caso 10 — Pedido corporativo grande a crédito 45 días

**Cliente:** Minera Andina Contratistas SAC (B2B, lista de precios 7)
**Pedido:** 2 cilindros Shell Retinax HD2 (218272) a USD 350 c/u = USD 700 + 4 unidades neumático Michelin XZE2 215/75R17.5 (337580) a USD 240 c/u = USD 960
**Condición de pago:** Crédito 45 días
**Promoción aplicable:** Descuento en dinero de USD 40 por volumen de pedido superior a USD 1,500
**Resultado esperado:** USD 1,660 − USD 40 = USD 1,620; descuento crédito 2% (USD 32.40) → USD 1,587.60.

---

### Caso 11 — Cliente nuevo, primera compra con lista Oficina

**Cliente:** Repuestos Central Chincha (cliente nuevo, primer registro en el sistema)
**Acción del asesor:** Debe agregar al cliente nuevo fuera de ruta antes de poder emitir el pedido, luego aplicar la lista de precios Oficina (por defecto para clientes sin historial) y registrar el pedido: 3 botellas Shell Helix Plus (108203) a USD 5 c/u = USD 15.
**Condición de pago:** Contado
**Resultado esperado:** Cliente creado correctamente con todos los datos obligatorios; venta registrada con lista Oficina; total USD 15 con 5% descuento (USD 0.75) → USD 14.25.

---


---

### Caso 14 — Venta B2B con descuento por volumen y crédito 60 días

**Cliente:** Constructora Vial Perú SAC (B2B, lista de precios 8)
**Pedido:** 6 cajas de neumáticos Michelin Latitude Tour HP (024009, 005488, 077337 combinados) a USD 48 c/u = USD 288
**Condición de pago:** Crédito 60 días
**Promoción aplicable:** Descuento en dinero de USD 15 por compra de 5+ cajas
**Resultado esperado:** USD 288 − USD 15 = USD 273; descuento crédito 1% (USD 2.73) → USD 270.27.

---

### Caso 15 — Revisión de historial de visitas antes de nueva venta

**Cliente:** Bodega y Ferretería Dos Hermanos
**Acción del asesor:** Antes de registrar el pedido del día, debe revisar el historial de visitas anteriores al cliente para verificar la última compra 
**Pedido nuevo:** 4 baldes Shell Helix HX5 a USD 18 c/u = USD 72, contado
**Resultado esperado:** El asesor identifica y registra la última fecha de visita al cliente en un recuadro aparte del simulador como respuesta a la pregunta

---


---

### Caso 16 — [GPS] Intento de inicio presencial a >50m y bypass por visita telefónica

**Cliente:** Distribuidora Kanchis EIRL (AV. INDUSTRIAL 104 - SOCABAYA)
**Contexto:** El asesor intenta registrar el inicio de visita de manera presencial pero se encuentra a 250 metros de distancia del local del cliente.
**Validación técnica:** El motor móvil valida la geocerca GPS con un radio máximo de 50 metros (`visit_validations.dart:8`).
**Acción requerida:** El asesor no debe falsear la georreferenciación presencial ni forzar el inicio en sitio; debe activar formalmente la modalidad **"Visita Telefónica"** (`isPhoneVisit = true`, `visitTypeId = 2`), permitiendo continuar con la atención comercial de manera justificada y auditada.
**Pedido:** 2 cajas Michelin Energy XM2+ a Crédito 30 días (Lista OF).
**Resultado esperado:** Visita iniciada sin penalización por geolocalización y orden de compra registrada con trazabilidad telefónica.

---

### Caso 17 — [Tareas] Cierre de visita con justificación formal de no emisión de pedido (T5)

**Cliente:** Comercial Vega Hnos. (CALLE MERCADERES 301)
**Contexto:** Visita presencial completada con fotos de exhibición inicial y final. Al momento de la asesoría comercial (tarea obligatoria T5, 15% de ponderación de ruta), el cliente comunica que no realizará pedidos hoy debido a descarga de contenedores y almacén saturado.
**Acción requerida:** El asesor no debe retirarse sin cerrar la tarea ni forzar pedidos ficticios. Debe ingresar a **"¿Por qué no completó la tarea?"** (`IncompleteVisitTaskPanel.dart`), seleccionar la causa oficial **"Cliente muy ocupado"** y confirmar el cierre formal.
**Resultado esperado:** Visita cerrada al 100% de cumplimiento en la ruta diaria con sustento formal en la tabla `visit_task`.

---

### Caso 18 — [Cotización] Registro de propuesta comercial formal como Cotización (Tipo 3)

**Cliente:** Grupo Ferretero Miraflores (AV. SAN JERONIMO 210)
**Contexto:** Se presenta una propuesta comercial por 2 cajas de Michelin Energy XM2+ a Crédito 30 días. El encargado de tienda revisa la propuesta pero el titular decisor de compras no se encuentra presente para autorizar la orden de compra inmediata.
**Acción requerida:** El asesor debe seleccionar **"Guardar como Cotización (Tipo 3)"** (`documentTypeId = 3`) en lugar de emitir una Orden de Compra definitiva (`documentTypeId = 2`).
**Resultado esperado:** Cotización formalmente registrada y transmitida sin comprometer stock de almacén ni consumir de forma prematura la línea de crédito disponible del cliente.

---

### Caso 19 — [Cobranzas] Cobranza mixta de facturas (Efectivo + Depósito con voucher)

**Cliente:** Taller Hyundai Express (AV. PARRA 314)
**Contexto:** El cliente mantiene una factura pendiente por USD 350.00 y desea cancelarla fraccionando el pago en dos modalidades: USD 200.00 en efectivo y USD 150.00 mediante depósito bancario en cuenta corriente.
**Acción requerida:** En el módulo de cobranza (`collect_debts_page.dart`), ingresar la amortización mixta registrando el efectivo y adjuntando de manera mandatoria la fotografía del voucher de la transferencia bancaria para el abono en cuenta.
**Resultado esperado:** Emisión consolidada de los recibos provisionales de cobranza con comprobante bancario listo para validación y conciliación en créditos.

---

### Caso 20 — [Promociones] Exclusión mutua de promociones del mismo combo (Condición 4000)

**Cliente:** Servicentro El Faro (AV. DOLORES 880)
**Contexto:** Venta de 5 baldes Shell Helix HX7 10W/40 a condición Contado con Lista 2.
**Validación técnica:** El paquete de incentivos promocionales está configurado bajo la Condición 4000 (`OrderCustomerController.cs:4543`), la cual establece que los beneficios de un mismo grupo promocional son mutuamente excluyentes (máximo 1 promoción activa por combo).
**Acción requerida:** Activar el toggle de regalo oficial por volumen (ej. botellas de lubricante Plus) sin pretender combinar simultáneamente un descuento monetario directo del mismo paquete.
**Resultado esperado:** Orden confirmada y validada en servidor sin recibir rechazo HTTP 400 de negocio.

---

### Caso 21 — [Ruta] Consulta y priorización de clientes con deuda vencida en el plan del día

**Cliente:** Distribuidora Kanchis EIRL (AV. INDUSTRIAL 104 - SOCABAYA)
**Contexto:** Al inicio de la jornada comercial, el asesor recibe su planificación y el orden de atención de su cartera por defecto.
**Acción requerida:**
1. Deslizar la barra de filtros del plan de visitas y presionar la pastilla **"Deuda vencida"** (`over_due_date = true` en `SellerController.cs`).
2. Identificar a Distribuidora Kanchis EIRL como cliente crítico con saldo vencido de USD 840.00.
3. Consultar su perfil de cuenta corriente.
**Resultado esperado:** Cartera morosa priorizada.

---

### Caso 22 — [Fuera de Ruta] Alta de visita fuera de ruta para despacho urgente en zona

**Cliente:** Autopartes El Rápido (JR. PIEROLA 540)
**Contexto:** Mientras el asesor transita por su zona asignada, un cliente de cartera solicita un despacho urgente no programado en el plan de ruta semanal de SOLAR.
**Acción requerida:** Presionar **"➕ Agregar visita fuera de ruta"** (`NewOutRoutVisitFormPage.dart`), seleccionar a "Autopartes El Rápido", validar su dirección fiscal y registrar la visita no programada. Luego iniciar la visita y emitir el pedido al Contado por 4 botellas Shell Helix Plus 10W-40.
**Resultado esperado:** Visita fuera de ruta incorporada en el dispositivo móvil (`out_route = true`) y pedido formalmente generado y transmitido.

---

### Caso 23 — [Liquidación] Arqueo y cierre de liquidación de cobranza al término de la jornada

**Módulo:** Liquidación General de Ventas y Cobranza (`SalesSettlement`)
**Contexto:** Al término de la jornada de visitas, antes de acudir a la agencia o caja central, el asesor debe cuadrar los valores recaudados en ruta.
**Acción requerida:** En el menú principal de visitas, presionar **"📊 Liquidación de cobranza diaria"**, auditar el arqueo consolidado (Efectivo Soles, Efectivo Dólares, Depósitos bancarios y cero recibos pendientes de envío) y finalizar visita
**Resultado esperado:** consolidado generado para validar cobranzas.

---

## Resumen de cobertura evaluada (21 Casos Oficiales)

| Caso | Tipo de flujo evaluado |
| --- | --- |
| 1, 2, 9, 10, 14 | Ventas con promociones (regalo / descuento en dinero) |
| 3 | Ventas sin promoción, crédito corporativo y mono-línea |
| 4, 5 | Errores de proceso y trampas (tracking incompleto, cobranza sin consolidado) |
| 6 | Consulta histórica (nota de crédito) |
| 7 | Estado de cuenta + flujo de compartir |
| 8 | Seguimiento y detalle de pedido |
| 11 | Alta de visita fuera de ruta / compra con lista Oficina |
| 15 | Historial de visitas / prevención de duplicidad de promociones |
| 16 | Geocerca GPS (50m) y bypass regulado por visita telefónica (`isPhoneVisit`) |
| 17 | Justificación formal de tareas incompletas (`IncompleteVisitTaskPanel`) |
| 18 | Registro formal de Cotización (Tipo 3) vs Orden de Compra (Tipo 2) |
| 19 | Cobranza mixta (Efectivo + Depósito bancario con voucher obligatorio) |
| 20 | Exclusión mutua de promociones del mismo combo (Condición 4000) |
| 21 | Consulta y priorización de clientes con deuda vencida en ruta (`over_due_date`) |
| 22 | Alta de visita fuera de ruta (`NewOutRoutVisitFormPage`) |
| 23 | Arqueo y cierre de liquidación de cobranza diaria (`SalesSettlement`) |