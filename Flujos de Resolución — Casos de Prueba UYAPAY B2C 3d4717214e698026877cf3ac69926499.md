# Flujos de Resolución — Casos de Prueba UYAPAY B2C

### Basado en la navegación real del Manual de Usuario UYAPAY (jul-2025)

**Ajustes aplicados según el manual:**

- Un pedido = una sola línea de negocio. Los Casos 3, 9 y 10 (que mezclaban líneas) quedan divididos en dos pedidos dentro del mismo caso, dentro de la misma visita.
- Listas de precio confirmadas en el manual: **Lista OF, Lista 1, Lista 2, Lista EC, Lista 3**. Se reasignaron los casos que usaban "Lista Oficina/4/5-8" a estas 5 opciones reales.
- Las promociones (regalo o descuento) se activan como **toggle dentro del detalle del producto**, al momento de "Agregar producto" — no en un paso aparte al final del pedido.

---

## Caso 1 — Venta simple contado con regalo por volumen

1. **Visitas** → seleccionar cliente → **Iniciar visita**
2. Pantalla **Inicio**: revisar perfil/scoring del cliente → Continuar
3. Pantalla **Fotos**: completar Presentación inicial/final (obligatoria) → Guardar
4. Pantalla **Precios**: sin tracking relevante para este caso → Continuar
5. Pantalla **Pedidos** → **+ Crear pedido o cotización**
6. Seleccionar cliente (padre) → **Contado** → Lista de precios **1**
7. Línea de negocio: **Lubricantes** → Marca: **Shell**
8. **Agregar producto**: buscar Helix HX7 10W/40 → cantidad 8 → activar toggle de promoción "2 botellas Helix Plus de regalo" → confirmar (check) → Agregar producto
9. Revisar resumen: subtotal USD 176, descuento 5% → Completar
10. Confirmación: dirección de entrega, fecha estimada → **Actualizar orden de compra**
11. Pedido pasa a estado "Enviado" → Guardar
12. Finalizar visita

---

## Caso 2 — Crédito 30 días con descuento en dinero

1. Visitas → cliente → Iniciar visita → Inicio → Continuar → Fotos → Guardar
2. Pedidos → + Crear pedido o cotización
3. Cliente padre → **Crédito** → plazo **30** días → Lista de precios **OF**
4. Línea de negocio: **Neumáticos** → Marca: **Michelin**
5. Agregar producto: 3 cajas Energy XM2+ 195/60 R15 → activar descuento aprovisionado USD 10 → confirmar → Agregar producto
6. Completar → revisar total con descuento de crédito 3% aplicado automáticamente
7. Confirmación → dirección → Actualizar orden de compra
8. Finalizar visita

---

## Caso 3 — Cliente corporativo, dos pedidos por línea de negocio

**División obligatoria por línea (regla del manual):**

**Pedido A — Lubricantes**

1. Pedidos → + Crear pedido o cotización → Crédito 60 días → Lista **EC**
2. Línea: **Lubricantes** → Marca: Shell → Agregar Retinax HD2 (USD 320) → Completar → Actualizar orden de compra

**Pedido B — Neumáticos**
3. Pedidos → + Crear pedido o cotización (mismo cliente) → Crédito 60 días → Lista **EC**
4. Línea: **Neumáticos** → Marca: BFGoodrich → Agregar 2× Advantage T/A SUV GO (USD 180 c/u) → Completar → Actualizar orden de compra
5. Verificar que ambos pedidos queden "Enviado" por separado antes de Finalizar visita

---

## Caso 4 — [TRAMPA] Tracking de precios solo con foto

1. Visitas → cliente → Iniciar visita → Inicio → Continuar → Fotos → Guardar
2. Pantalla **Precios**: seleccionar producto a comparar
3. El asesor **solo adjunta una foto en "Documentos de compra"** y NO ingresa el monto en el campo del producto
4. Presiona Continuar sin completar el registro de precio
**Resultado esperado:** el sistema no guarda el precio porque el campo obligatorio de monto quedó vacío — al revisar "Registro de precios" después, el producto sigue en "0 de 1 registrados". El evaluador marca la tarea como incompleta pese a la foto adjunta.

---

## Caso 5 — [TRAMPA] Cobranza sin consolidado

1. Visitas → cliente → Iniciar visita → avanzar hasta **Cobranza**
2. Deuda vencida → Pagar → Efectivo → ingresar monto y foto de recibo → Continuar → Finalizar pago (repetir para 3 facturas)
3. Los 3 pagos aparecen en "Recibos electrónicos" pestaña Recientes
4. El asesor presiona **Finalizar visita directamente**, sin volver a Cobranza a presionar "Guardar" ni confirmar "¿Desea generar el consolidado de pagos?"
**Resultado esperado:** los recibos quedan en estado "Recientes" y nunca pasan a "Enviados" ni se genera el documento de consolidado — el supervisor no verá los cobros reflejados. El evaluador marca error crítico de cierre.

---

## Caso 6 — Consulta de nota de crédito histórica

1. Menú secundario (ícono perfil) → **Documentos electrónicos**
2. Pestaña **Notas de crédito**
3. Buscar por "Nro. documento o cliente" → escribir el nombre del cliente
4. Filtrar por fecha si es necesario, ubicar la nota emitida hace 2 semanas
5. Leer el monto mostrado directamente en la lista (ej. formato "$XXX.XX")
**Resultado esperado:** el asesor reporta el monto correcto sin necesidad de aplicar la nota a ningún pedido.

---

## Caso 7 — Ver y compartir estado de cuenta

1. Menú secundario → **Mis clientes** → buscar cliente
2. Seleccionar cliente → pestaña **Deudas pendientes**
3. Presionar botón **Estado de cuenta**
4. Se abre pantalla "Estado de cuenta": revisar Total deuda vencida y Total deuda por vencer
5. Presionar **Compartir estado de cuenta**
6. Seleccionar formato (PDF o Imagen) → elegir app de destino (ej. WhatsApp) para completar el envío
**Resultado esperado:** el asesor identifica correctamente ambos montos y llega hasta la selección de app, sin quedarse en un paso intermedio.

---

## Caso 8 — Seguimiento de pedido emitido

1. Menú principal → **Pedidos**
2. Pestaña **Pedidos** (no cotizaciones) → buscar por cliente o número de pedido
3. Seleccionar el pedido ya emitido
4. Dentro del detalle, ir a la pestaña **Seguimiento** para ver el estado (enviado/entregado)
5. Cambiar a la pestaña **Productos** para revisar el detalle de lo enviado
**Resultado esperado:** el asesor reporta correctamente el estado del pedido y lista los productos del detalle.

---

## Caso 9 — Venta con regalo por volumen, dos pedidos por línea

**Pedido A — Lubricantes**

1. Pedidos → + Crear pedido o cotización → Contado → Lista **2**
2. Línea: Lubricantes → Marca: Shell → Agregar 5 baldes Helix HX7 → activar toggle "1 caja de botellas de regalo" → Completar → Actualizar orden de compra

**Pedido B — Neumáticos**
3. Pedidos → + Crear pedido o cotización (mismo cliente) → Contado → Lista **2**
4. Línea: Neumáticos → Marca: BFGoodrich → Agregar 1× G-Grip 205/60 R15 (sin promo aplicable) → Completar → Actualizar orden de compra
5. Finalizar visita

---

## Caso 10 — Pedido corporativo grande, dos pedidos por línea

**Pedido A — Lubricantes**

1. Pedidos → + Crear pedido o cotización → Crédito 45 días → Lista **EC**
2. Línea: Lubricantes → Marca: Shell → Agregar 2 cilindros Retinax HD2 → activar descuento aprovisionado USD 40 → Completar → Actualizar orden de compra

**Pedido B — Neumáticos**
3. Pedidos → + Crear pedido o cotización (mismo cliente) → Crédito 45 días → Lista **EC**
4. Línea: Neumáticos → Marca: Michelin → Agregar 4× XZE2 215/75R17.5 → Completar → Actualizar orden de compra
5. Finalizar visita

---

## Caso 11 — Cliente nuevo, primera compra

1. Menú secundario → **Mis clientes** → verificar que el cliente no existe en la búsqueda
2. Registrar cliente nuevo (datos obligatorios de perfil comercial)
3. Visitas → localizar al cliente recién creado → Iniciar visita (por dirección o llamada si aplica)
4. Inicio → Continuar → Fotos → Guardar
5. Pedidos → + Crear pedido o cotización → Contado → Lista **OF** (por defecto, cliente sin historial)
6. Línea: Lubricantes → Marca: Shell → Agregar 3 botellas Helix Plus → Completar → Actualizar orden de compra
7. Finalizar visita

---

## Caso 12 — Repuestos sin promoción

1. Visitas → cliente → Iniciar visita → Inicio → Continuar → Fotos → Guardar
2. Pedidos → + Crear pedido o cotización → Crédito 15 días → Lista **1**
3. Línea de negocio: **Repuestos** (marca según vehículo: Hyundai)
4. Agregar producto: disco de freno HD35, bujías Grand i10, collarín Accent — **sin activar ninguna promoción** (el asesor reconoce que Repuestos no tiene promos de volumen)
5. Completar → verificar que el sistema aplique solo el descuento de crédito 4%
6. Confirmación → Actualizar orden de compra → Finalizar visita

---

## Caso 13 — [TRAMPA] Condición de pago mal aplicada

1. Pedidos → + Crear pedido o cotización → seleccionar **Crédito**, plazo **30 días**
2. Al revisar el resumen antes de Completar, el asesor nota (o el evaluador debe notar) que el descuento mostrado es de 5% en vez del 3% que corresponde a crédito 30 días
**Resultado esperado:** esta inconsistencia no debería ocurrir en el sistema real (el descuento se calcula automático según la condición elegida) — si aparece, es un caso trampa para que el evaluador detecte que el asesor no verificó el resumen antes de confirmar el pedido. La acción correcta del asesor es revisar el resumen y corregir la condición de pago antes de presionar Completar.

---

## Caso 14 — B2B con descuento por volumen, crédito 60 días

1. Visitas → cliente → Iniciar visita → Inicio → Continuar → Fotos → Guardar
2. Pedidos → + Crear pedido o cotización → Crédito 60 días → Lista **EC**
3. Línea: Neumáticos → Marca: Michelin
4. Agregar producto: 6 cajas combinando Latitude Tour HP (024009, 005488, 077337) → activar descuento aprovisionado USD 15 → confirmar → Agregar producto
5. Completar → verificar descuento de crédito 1% aplicado sobre el neto
6. Confirmación → Actualizar orden de compra → Finalizar visita

---

## Caso 15 — Revisión de historial antes de nueva venta

1. Menú secundario → **Historial de visitas**
2. Filtrar por cliente / mes anterior → localizar la última visita y verificar si ya se entregó un regalo por volumen
3. Volver a Visitas → cliente → Iniciar visita → Inicio → Continuar → Fotos → Guardar
4. Pedidos → + Crear pedido o cotización → Contado → Lista **1**
5. Línea: Lubricantes → Marca: Shell → Agregar 4 baldes Helix HX5 → **NO activar** ninguna promoción de regalo (ya fue entregada antes)
6. Completar → verificar que el total solo incluya el 5% de descuento por contado
7. Confirmación → Actualizar orden de compra → Finalizar visita

---

## Nota para el evaluador

En los casos con **dos pedidos** (3, 9, 10), el criterio de evaluación debe verificar que el asesor haya identificado la necesidad de dividir por línea de negocio — un asesor que intente forzar ambas líneas en un solo pedido debe marcarse como error de proceso, ya que el sistema real no lo permite.