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
**Acción del asesor:** Debe registrar al cliente nuevo antes de poder facturar, luego aplicar la lista de precios Oficina (por defecto para clientes sin historial) y registrar el pedido: 3 botellas Shell Helix Plus (108203) a USD 5 c/u = USD 15.
**Condición de pago:** Contado
**Resultado esperado:** Cliente creado correctamente con todos los datos obligatorios; venta registrada con lista Oficina; total USD 15 con 5% descuento (USD 0.75) → USD 14.25.

---

### Caso 12 — Repuestos sin promoción aplicable

**Cliente:** Taller Hyundai Express (B2C, lista de precios 3)
**Pedido:** 1 disco de freno HD35 (0K40C33251) + 1 juego de bujías Grand i10 (1882709087) + 1 collarín Accent (4142126100)
**Condición de pago:** Crédito 15 días
**Resultado esperado:** El asesor debe reconocer que los repuestos no participan de promociones de volumen (solo lubricantes/llantas) y aplicar únicamente el descuento de crédito de 4% sobre el total.

---

### Caso 13 — [TRAMPA] Condición de pago mal aplicada

**Cliente:** Comercial San Martín
**Contexto:** El asesor arma un pedido a crédito 30 días pero, al momento de aplicar el descuento, selecciona por error el descuento de "contado" (5%) en lugar del 3% correspondiente a crédito 30 días.
**Resultado esperado del sistema:** El descuento aplicado no corresponde a la condición de pago seleccionada. El evaluador debe detectar la inconsistencia entre condición de pago y porcentaje aplicado, ya que el sistema real no debería permitir esta combinación.

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
**Acción del asesor:** Antes de registrar el pedido del día, debe revisar el historial de visitas anteriores al cliente para verificar la última compra y evitar duplicar una promoción de regalo ya entregada en la visita previa.
**Pedido nuevo:** 4 baldes Shell Helix HX5 a USD 18 c/u = USD 72, contado
**Resultado esperado:** El asesor identifica que el regalo por volumen ya fue entregado en la visita anterior y no lo aplica nuevamente; registra la venta solo con el 5% de descuento por contado → USD 68.40.

---

## Resumen de cobertura evaluada

| Caso | Tipo de flujo evaluado |
| --- | --- |
| 1, 2, 9, 10, 14 | Ventas con promociones (regalo / descuento en dinero) |
| 3, 12 | Ventas sin promoción, distintas listas de precio |
| 4, 5, 13 | Errores de proceso (tracking, cobranza, condición de pago) |
| 6 | Consulta histórica (nota de crédito) |
| 7 | Estado de cuenta + flujo de compartir |
| 8 | Seguimiento y detalle de pedido |
| 11 | Alta de cliente nuevo |
| 15 | Historial de visitas / prevención de duplicidad |