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

## Caso 11 — Cliente nuevo, primera compra con lista Oficina

1. **Plan de Visitas:** En la parte inferior presionar **"➕ Agregar visita fuera de ruta"**.
2. Seleccionar el cliente nuevo **"Repuestos Central Chincha"** con dirección **"CALLE COMERCIO 120 - CHINCHA"** y confirmar el alta.
3. Localizar al cliente recién creado en la lista de visitas e **Iniciar visita**.
4. Registrar las fotos obligatorias de local.
5. **Pedidos:** Crear pedido en condición **Contado** con Lista **OF** (por defecto para clientes sin historial).
6. Línea: **Lubricantes**, Marca: **Shell** → Agregar 3 botellas Shell Helix Plus (108203) a USD 5 c/u.
7. Verificar total (USD 15.00 − 5% = USD 14.25) y confirmar la orden de compra.

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

1. **Plan de Visitas:** Seleccionar a **Bodega y Ferretería Dos Hermanos**.
2. En las opciones del cliente, seleccionar **"Historial de visitas previas"**.
3. Auditar el historial de compras y registrar la fecha de la última visita (**14/08/2026**) en el recuadro de auditoría del simulador.
4. **Iniciar visita** y registrar fotos obligatorias de visita.
5. **Pedidos:** Crear pedido a condición **Contado** con Lista **1**.
6. Línea: **Lubricantes**, Marca: **Shell** → Agregar 4 baldes Shell Helix HX5 15W/40 a USD 18 c/u **SIN activar promoción de regalo** (ya fue entregada en la visita anterior).
7. Verificar total neto USD 68.40 (4×$18 = $72 − 5% = $68.40) y confirmar la orden.


---

## Caso 16 — [GPS] Intento de inicio presencial a >50m y bypass por visita telefónica

**Objetivo:** Comprender la restricción de geocerca GPS de 50 metros (`visit_validations.dart`) y el bypass operativo formal mediante visita telefónica (`isPhoneVisit`).

1. **Visitas** → seleccionar cliente (ej. Distribuidora Kanchis EIRL) → **Iniciar visita**.
2. **Validación Geocerca GPS:** El sistema detecta que el smartphone se encuentra a 250m (>50m de geocerca) y despliega la advertencia restrictiva.
3. El asesor no debe falsear la georreferenciación presencial; selecciona formalmente **"Iniciar Visita Telefónica (isPhoneVisit)"** (`visitTypeId = 2`).
4. Se habilita el acceso a la ficha del cliente con la modalidad telefónica registrada en auditoría.
5. **Pedidos** → + Crear pedido o cotización → Crédito 30 días → Lista **OF**.
6. Línea de negocio: **Neumáticos** → Marca: **Michelin** → Agregar 2 cajas Energy XM2+.
7. Confirmar y emitir la orden de compra telefónica.
**Regla técnica:** `visit_validations.dart:8 (maxDistanceInMeters = 50)`. Las visitas presenciales quedan bloqueadas fuera de radio; la atención remota debe tipificarse como visita telefónica oficial.

---

## Caso 17 — [Tareas] Cierre de visita con justificación formal de no emisión de pedido (T5)

**Objetivo:** Manejar la justificación estructurada de tareas obligatorias incompletas (`IncompleteVisitTaskPanel`) para cerrar visitas sin penalización comercial cuando el cliente no realiza compras.

1. **Visitas** → seleccionar Comercial Vega Hnos. → **Iniciar visita**.
2. **Fotos:** Registrar fotos obligatorias de fachada y góndola (Inicial / Final) → Guardar.
3. El cliente no puede realizar pedidos por descarga operativa de mercadería.
4. En el menú de tareas de la visita, pulsar sobre **"⚠️ ¿Por qué no completó la tarea?"** correspondiente a la tarea T5 ("Asesorar en el proceso de pedido").
5. Seleccionar el motivo oficial: **"Cliente muy ocupado"** (o "Decisor ausente" / "Stock completo" según corresponda).
6. Presionar **"💾 Guardar Justificación y Finalizar Visita"**.
**Regla técnica:** La tarea T5 tiene una ponderación del 15% y es obligatoria en ruta. Si el asesor abandona la app sin justificar formalmente en la tabla `visit_task`, su cumplimiento cae. Justificar formalmente permite cerrar la visita al 100% de cumplimiento.

---

## Caso 18 — [Cotización] Registro de propuesta comercial formal como Cotización (Tipo 3)

**Objetivo:** Distinguir entre Orden de Compra (Tipo 2) y Cotización (Tipo 3) en el cierre de ventas según el nivel de compromiso del cliente, protegiendo stock y saldo crediticio.

1. **Visitas** → Grupo Ferretero Miraflores → **Iniciar visita** → Registrar fotos obligatorias.
2. **Pedidos** → + Crear pedido o cotización → Crédito 30 días → Lista **OF**.
3. Línea de negocio: **Neumáticos** → Marca: **Michelin** → Agregar 2 cajas Energy XM2+.
4. En la pantalla **Resumen de Orden**, ante la ausencia del decisor final para firmar la compra, presionar: **"📄 Guardar como Cotización (Tipo 3)"** en lugar de actualizar la orden de compra.
5. El sistema registra el documento bajo `documentTypeId = 3` en estado borrador/vigente.
**Regla técnica:** Una Orden de Compra (`documentTypeId = 2`) reserva inventario en el ERP y compromete la línea de crédito. La Cotización (`documentTypeId = 3`) formaliza precios y plazos sin bloquear cupo comercial hasta su confirmación.

---

## Caso 19 — [Cobranzas] Cobranza mixta de facturas (Efectivo + Depósito con voucher)

**Objetivo:** Procesar una recaudación mixta aplicando pagos fraccionados en efectivo y depósito bancario con sustento fotográfico de voucher conforme a la política de créditos y cobranzas.

1. **Visitas** → Taller Hyundai Express → **Iniciar visita** → Registrar fotos de local.
2. Menú de tareas → **"💰 3. Cobranza de facturas / Letras"**.
3. Seleccionar factura vencida por USD 350.00.
4. En el formulario de cobranza registrar:
   - **Monto Efectivo:** USD 200.00
   - **Monto Depósito / Transferencia:** USD 150.00
   - **Adjunto:** Cargar fotografía obligatoria del comprobante/voucher de transferencia bancaria (`voucher.jpg`).
5. Presionar **"💰 Emitir Recibos Provisionales Consolidados"**.
6. Validar que ambos recibos queden emitidos en estado formal para su posterior rendición a tesorería.
**Regla técnica:** Todo cobro que involucre transferencia bancaria o depósito exige foto de voucher en la app móvil para que tesorería concilie el abono en cuenta.

---

## Caso 20 — [Promociones] Exclusión mutua de promociones del mismo combo (Condición 4000)

**Objetivo:** Aplicar la regla de exclusión mutua de promociones (condición 4000 del backend) donde no se pueden acumular dos beneficios de un mismo paquete promocional.

1. **Visitas** → Servicentro El Faro → **Iniciar visita** → Fotos obligatorias.
2. **Pedidos** → Contado (5% desc.) → Lista **2** → Línea: **Lubricantes** → Marca: **Shell**.
3. **Catálogo:** Agregar 5 baldes Shell Helix HX7 10W/40.
4. Activar el toggle de la **promoción oficial de regalo** (ej. botellas Shell Helix Plus).
5. **Decisión clave:** NO intentar forzar simultáneamente descuentos directos en dinero incompatibles del mismo paquete promocional para evitar que el backend rechace la transacción por incompatibilidad (Condición 4000).
6. Revisar el total a facturar y presionar **"Actualizar Orden de Compra y Enviar"**.
**Regla técnica:** `OrderCustomerController.cs:4543` valida que para paquetes con `condition_id == 4000`, la cantidad de promociones seleccionadas sea `<= 1`. Infringir esto genera un error HTTP 400 de negocio.

---

## Caso 21 — [Ruta] Consulta y priorización de clientes con deuda vencida en el plan del día

**Objetivo:** Utilizar las herramientas de inteligencia de ruta para filtrar clientes con morosidad vencida (`over_due_date` en `SellerController`) y auditar su perfil de cuenta corriente.

1. **Plan de Visitas (s-visitas):** En la barra horizontal de filtros superiores, presionar la pastilla **"Deuda vencida"** (`over_due_date = true`).
2. El sistema filtra dinámicamente la cartera del día, aislando a los clientes con mora crítica: **Distribuidora Kanchis EIRL** con saldo moroso de USD 840.00.
3. Presionar sobre el cliente y seleccionar **"Consultar perfil / deuda vencida"** para auditar el importe vencido y estado de mora.
4. Con la auditoría completada, la cartera morosa queda priorizada formalmente.
**Regla técnica:** `SellerController.cs:1387` ejecuta un CTE sobre `v_app_movement_debts` filtrando exclusivamente cuentas con saldo vencido cuando `over_due_date = true`.

---

## Caso 22 — [Fuera de Ruta] Alta de visita fuera de ruta para despacho urgente en zona

**Objetivo:** Incorporar una atención comercial no programada en el día (`NewOutRoutVisitFormPage`) vinculando cliente de cartera, dirección fiscal y tareas asignadas sin alterar el plan maestro.

1. **Plan de Visitas:** En la parte inferior de la lista presionar el botón **"➕ Agregar visita fuera de ruta"**.
2. En el modal de alta:
   - **Cliente:** Seleccionar "Autopartes El Rápido".
   - **Dirección:** Verificar dirección fiscal "JR. PIEROLA 540".
   - **Tareas:** Asignar fotos, pedidos y cobranza.
3. Presionar **"➕ Registrar Visita Fuera de Ruta"**. El cliente queda agregado con etiqueta dorada "FUERA DE RUTA".
4. Seleccionar al cliente e **Iniciar visita** → Registrar fotos obligatorias.
5. **Pedidos:** Configurar Contado, Lista 1, Lubricantes Shell → Agregar 4 botellas Shell Helix Plus 10W-40.
6. Confirmar y enviar la orden de compra fuera de ruta.
**Regla técnica:** Las visitas fuera de ruta permiten atender contingencias sin romper la programación de ruta periódica de SOLAR, quedando registradas con el flag `out_route = true`.

---

## Caso 23 — [Liquidación] Arqueo y cierre de liquidación de cobranza al término de la jornada

**Objetivo:** Ejecutar el proceso formal de consolidación y liquidación de cobranza (`SalesSettlement`) al cierre de la jornada operativa para validar cobranzas.

1. **Plan de Visitas:** Al término de la ruta presionar el botón **"📊 Liquidación de cobranza diaria"**.
2. En el arqueo consolidado auditar:
   - Cobranzas en Efectivo Soles: S/ 1,480.00
   - Cobranzas en Efectivo Dólares: USD 200.00
   - Cobranzas por Depósito / Transferencia: USD 150.00
   - Recibos pendientes de envío: 0 (todos transmitidos a SOLAR)
3. Presionar **"Generar Consolidado de Cobranzas y Finalizar"**.
4. El sistema transmite el consolidado a SOLAR para validar cobranzas y finaliza la jornada.
**Regla técnica:** El módulo `sales_settlement.dart` consolida todos los recibos emitidos durante la jornada para validar las cobranzas físicas y electrónicas recaudadas.

---

## Nota para el evaluador

En los casos con **dos pedidos** (3, 9, 10), el criterio de evaluación debe verificar que el asesor haya identificado la necesidad de dividir por línea de negocio — un asesor que intente forzar ambas líneas en un solo pedido debe marcarse como error de proceso, ya que el sistema real no lo permite.