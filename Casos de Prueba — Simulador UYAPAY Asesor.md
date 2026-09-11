# Casos de Prueba — Simulador UYAPAY Asesor B2C

### Módulo de Evaluación — Capacitación 12 asesores

**Notas generales de reglas de negocio usadas en todos los casos:**

- Contado: 5% descuento | Crédito 15 días: 4% | Crédito 30 días: 3% | Crédito 45 días: 2% | Crédito 60 días: 1%
- Precios: Botella USD 5 | Balde USD 10–30 | Caja USD 40–60 | Cilindro USD 200–400
- Listas de precio B2C (minorista): Oficina (más cara) → 1 → 2 → 3 → 4 (más barata)
- Listas de precio B2B (corporativo): 5 → 6 → 7 → 8 — el asesor decide cuál aplica
- Promociones: solo regalo (botella/balde/caja por volumen) o descuento en dinero por volumen, sin umbral fijo — deben ser coherentes con el monto del pedido

---

### Caso 2 — Venta a crédito 30 días con descuento en dinero

- *Cliente:* Distribuidora Kanchis EIRL.
  - *Situación / Enunciado:* Genera una cotización de 9 neumáticos Michelin Energy XM2
  195/60 R15 (003718), aplicando la promoción de USD 10 de descuento por cada 5
  productos vendidos. El cliente solicita crédito a 30 días y entrega el 20 de
  septiembre.
  - *Tipo de Atención:* Presencial normal
  - *Parámetros Comerciales:*
      - Condición de pago: Crédito 30 días
      - Lista de precios: Oficina
      - Línea y Marca: Neumáticos | Michelin
      - Producto(s) y Cantidad: 9 neumáticos Michelin Energy XM2+ 195/60 R15 (003718)
      - Precio unitario: **USD 55.00**
      - Promoción / Beneficio: Descuento en dinero por volumen — **USD 10 por cada 5
  productos vendidos**
      - Fecha de entrega: 20 de septiembre
  - *Flujo de Solución Paso a Paso:*
  1. En **Plan de visitas**, sin visitas iniciadas, seleccionar **Distribuidora Kanchi
  EIRL** → pulsar **Iniciar visita**.
  2. En la tarea **INICIO**, pulsar **Continuar**.
  3. En la tarea **FOTOS**, registrar las fotos inicial y final → pulsar **Guardar**.
  4. En la tarea **PRECIOS**, seleccionar el motivo correspondiente de **no registro d
  precios**.
  5. En la tarea **PEDIDOS**, pulsar **Crear pedido**.
  6. Cambiar la condición de pago seleccionada por defecto **Contado** a **Crédito 30
  días**. Mantener/seleccionar **Lista Oficina** y configurar la línea y marca
  correspondientes a **Neumáticos Michelin**.
  7. En el catálogo, seleccionar **Michelin Energy XM2+ 195/60 R15 (003718)** e
  ingresar **9 unidades**, verificando el precio unitario de **USD 55.00**.
  8. Activar el **toggle de descuento promocional** correspondiente a la promoción de
  **USD 10 por cada 5 productos vendidos**.
  9. En la vista de pedidos, pulsar **Continuar**.
  10. En la pantalla de **Confirmación / Resumen**, verificar la condición de pago, lo
  productos, cantidades y descuentos aplicados.
  11. Seleccionar/configurar la **fecha de entrega del 20 de septiembre** y confirmar
  la dirección de entrega correspondiente.
  12. Verificar que el descuento promocional se haya aplicado correctamente antes de
  confirmar la venta.
  13. Pulsar **Guardar como cotización**. y esperar que el voucher diga Cotización
  - *Puntos Críticos / Errores a Evaluar (Trampas o Validaciones):*
      - Mantener **Contado** en lugar de seleccionar **Crédito 30 días**.
      - Seleccionar una lista de precios diferente de **Oficina**.
      - Seleccionar un producto Michelin diferente al código **003718**.
      - Registrar una cantidad diferente de **9 unidades**.
      - No verificar el precio unitario de **USD 55.00**.
      - No activar el toggle de la promoción.
      - Aplicar incorrectamente la promoción de **USD 10 por cada 5 productos**.
      - No registrar correctamente la fecha de entrega del **20 de septiembre**.
      - Confirmar como pedido y no como cotización.
  - *Resultado Final Esperado:*
      - Pedido generado correctamente por **9 neumáticos Michelin Energy XM2+ 195/60
  R15 (003718)**.
      - Precio unitario: **USD 55.00**
      - Monto bruto: **USD 495.00**
      - Condición: **Crédito 30 días**
      - Promoción aplicada: **USD 10 por cada 5 productos vendidos**.
      - Para 9 unidades, se aplica **1 descuento promocional de USD 10**, al cumplirse
  un bloque de 5 unidades.
      - Fecha de entrega: **20 de septiembre**
      - Estado: **Orden confirmada correctamente**.

### CP-05 Consulta de documentos electrónicos y estado de cuenta

* *Cliente:* Constructora Vial Perú SAC.

* *Situación / Enunciado:* El área de créditos indica que existe riesgo de incumplimiento de una deuda de USD 1,500. Consulta el estado de cuenta del cliente, identifica una deuda adicional de USD 586.90 que vence en un mes y verifica la información de su factura y si cuenta con un recibo de cobranza emitido. Registra en el simulador el número de factura y, si corresponde, el número del recibo de cobranza.

* *Tipo de Atención:* No aplica.

* *Parámetros Comerciales:*

  * Condición de pago: No aplica.
  * Lista de precios: No aplica.
  * Línea y Marca: No aplica.
  * Producto(s) y Cantidad: No aplica.
  * Promoción / Beneficio: No aplica.

* *Flujo de Solución Paso a Paso:*

1. Ingresar al menú secundario **Mis clientes**.
2. Buscar **Constructora Vial Perú SAC** e ingresar a la tarjeta del cliente.
3. Seleccionar la pestaña **Deudas pendientes**.
4. Pulsar **Estado de cuenta** y localizar la deuda de **USD 586.90**.
5. Registrar el número de factura correspondiente en el recuadro indicado.
6. Regresar al menú secundario e ingresar a **Documentos Electrónicos**.
7. En la pestaña **Facturas**, buscar la factura identificada y seleccionarla.
8. Pulsar **Ver documento**.
9. Deslizar hacia abajo para consultar la información del documento.
10. Identificar el número del recibo de cobranza (RC) y registrarlo en el recuadro correspondiente.
11. Finalizar el caso.

* *Puntos Críticos / Errores a Evaluar (Trampas o Validaciones):*

  * No identificar correctamente la deuda de **USD 586.90**.
  * Registrar un número de factura incorrecto.
  * No consultar el documento electrónico correspondiente.
  * No identificar el RC dentro del documento.
  * Registrar incorrectamente el número del recibo de cobranza.

* *Resultado Final Esperado:*

  * Factura identificada: **F001-55048**.
  * Recibo de cobranza identificado: **RE020-021740**.
  * Estado: **Información consultada y registrada correctamente**.

---

### CP-06 Consulta de historial de visitas antes de venta

* *Cliente:* Bodega y Ferretería Dos Hermanos.

* *Situación / Enunciado:* Antes de continuar con la gestión comercial, consulta el historial del cliente e identifica la fecha de su visita más reciente. Registra dicha fecha en el simulador.

* *Tipo de Atención:* Presencial normal.

* *Parámetros Comerciales:*

  * Condición de pago: No aplica.
  * Lista de precios: No aplica.
  * Línea y Marca: No aplica.
  * Producto(s) y Cantidad: No aplica.
  * Promoción / Beneficio: No aplica.

* *Flujo de Solución Paso a Paso:*

1. Ingresar al caso con la visita ya iniciada y ubicado en la tarea **PEDIDOS**.
2. Ingresar al menú **Mis clientes**.
3. Buscar **Bodega y Ferretería Dos Hermanos**.
4. En la vista del cliente, consultar la información disponible e identificar la **visita más reciente**.
5. Registrar la fecha identificada en el recuadro correspondiente del simulador.
6. Finalizar el caso.

* *Puntos Críticos / Errores a Evaluar (Trampas o Validaciones):*

  * No ingresar al historial/información de visitas del cliente.
  * Seleccionar una visita anterior en lugar de la más reciente.
  * Registrar una fecha incorrecta.
  * No registrar la respuesta solicitada en el simulador.

* *Resultado Final Esperado:*

  * Fecha de la visita más reciente identificada correctamente.
  * Fecha registrada correctamente en el simulador.
  * Estado: **Caso completado correctamente**.

---

### CP-07 Gestión de visita fuera de geocerca mediante visita telefónica

* *Cliente:* Distribuidora Lubrimotor EIRL — Av. Industrial 104, Socabaya.

* *Situación / Enunciado:* El cliente se encuentra a 250 metros del punto actual. Intentas iniciar una visita presencial, pero la geocerca permite un máximo de 50 metros. Debes gestionar la atención al cliente, ya que el cliente quiere 2 cajas de Michelin Energy XM2+. 

* *Parámetros Comerciales:*
  * Condición de pago: Crédito 30 días.
  * Lista de precios: Lista 3.
  * Línea y Marca: Neumáticos | Michelin.
  * Producto(s) y Cantidad: 2 cajas de Michelin Energy XM2+.

* *Flujo de Solución Paso a Paso:*

1. Intentar iniciar la visita presencial para **Distribuidora Lubrimotor EIRL**.
2. Identificar que la ubicación actual se encuentra fuera de la geocerca permitida: **250 m frente a un máximo de 50 m**.
3. No intentar forzar ni falsear la ubicación.
4. Seleccionar la modalidad **Visita Telefónica**.
5. Continuar con la atención comercial mediante la modalidad telefónica.
6. Ingresar a la tarea **PEDIDOS** y pulsar **Crear pedido**.
7. Seleccionar **Crédito 30 días**.
8. Seleccionar **Lista 3**.
9. Configurar la línea **Neumáticos** y la marca **Michelin**.
10. En el catálogo, seleccionar **Michelin Energy XM2+** e ingresar **2 cajas**.
11. Verificar la información del pedido.
12. Confirmar el pedido.
13. Finalizar el caso.

* *Puntos Críticos / Errores a Evaluar (Trampas o Validaciones):*

  * Intentar iniciar o completar la visita presencial estando fuera de la geocerca.
  * Intentar falsear o forzar la ubicación.
  * No utilizar la modalidad **Visita Telefónica**.
  * No mantener la trazabilidad de la atención telefónica.
  * Seleccionar una condición de pago diferente de **Crédito 30 días**.
  * Seleccionar una lista diferente de **Lista 3**.
  * Seleccionar una línea o marca incorrecta.
  * Registrar una cantidad diferente de **2 cajas**.

* *Resultado Final Esperado:*

  * Visita registrada como **Visita Telefónica**.
  * Pedido de **2 cajas de Michelin Energy XM2+** registrado correctamente.
  * Condición: **Crédito 30 días**.
  * Lista: **Lista 3**.
  * Línea: **Neumáticos**.
  * Marca: **Michelin**.
  * Estado: **Pedido confirmado con trazabilidad de visita telefónica**.

---

### CP-08 Registro de precio de competencia

* *Cliente:* Transportes Pepito SRL.

* *Situación / Enunciado:* Durante la visita, el cliente comenta que el producto de la competencia Castrol Mineral 20W50 tiene un mejor precio y muestra una cotización. Registra correctamente el precio de la competencia y completa la tarea.

* *Tipo de Atención:* Presencial normal.

* *Parámetros Comerciales:*

  * Condición de pago: No aplica.
  * Lista de precios: No aplica.
  * Línea y Marca: No aplica.
  * Producto(s) y Cantidad: Castrol Mineral 20W50 — cantidad no especificada.
  * Promoción / Beneficio: No aplica.

* *Flujo de Solución Paso a Paso:*

1. Ingresar al caso con la visita iniciada y las tareas de **INICIO** y **FOTOS** completadas.
2. Ingresar a la tarea **Tracking de precios**.
3. Registrar numéricamente el precio observado de **Castrol Mineral 20W50** en la casilla correspondiente.
4. Adjuntar la fotografía de la cotización proporcionada por el cliente.
5. Completar la tarea.
6. Intentar finalizar la visita sin ingresar un pedido.
7. Cuando el sistema solicite el motivo de no emisión de pedido, seleccionar uno de los motivos disponibles.
8. Pulsar **Completar**.
9. Finalizar la visita.

* *Puntos Críticos / Errores a Evaluar (Trampas o Validaciones):*

  * Adjuntar únicamente la fotografía sin registrar el precio numéricamente.
  * Registrar el precio en un campo incorrecto.
  * No adjuntar la fotografía de respaldo.
  * Intentar completar el tracking sin ingresar el precio.
  * No seleccionar un motivo de no emisión de pedido cuando sea solicitado.

* *Resultado Final Esperado:*

  * Precio de competencia registrado numéricamente.
  * Fotografía de respaldo adjunta.
  * Tarea de tracking completada.
  * Motivo de no emisión de pedido registrado.
  * Visita finalizada correctamente.

---

### CP-09 Visita fuera de ruta con pedido y cobranza

* *Cliente:* Comercial Vega Hnos.

  * Dirección de visita: Calle Mercaderes 301.
  * Dirección de entrega: Calle Santa Marta 205.

* *Situación / Enunciado:* Un cliente que no se encuentra en tu plan de visitas solicita una visita para realizar un pedido al contado de 15 baldes Shell Helix HX7 a USD 25 cada uno, con una promoción de 1 gorro por cada 5 baldes, para entrega el 14 de septiembre. Adicionalmente, el cliente desea pagar una deuda vencida de USD 380: USD 80 en efectivo y el saldo mediante depósito bancario al BCP. Registra la visita, pedido y cobranza.

* *Tipo de Atención:* Visita fuera de ruta.

* *Parámetros Comerciales:*

  * Condición de pago: Contado.
  * Lista de precios: Lista 3.
  * Línea y Marca: Lubricantes | Shell.
  * Producto(s) y Cantidad: 15 baldes Shell Helix HX7 — USD 25.00 c/u.
  * Promoción / Beneficio: Regalo en especie — 1 gorro por cada 5 baldes vendidos.
  * Fecha de entrega: 14 de septiembre.
  * Dirección de entrega: Calle Santa Marta 205.
  * Deuda a cobrar: USD 380.00.
  * Primer pago: USD 80.00 en efectivo y soles, utilizando TC 3.45 → **PEN 276.00**.
  * Segundo pago: saldo mediante depósito bancario al BCP.

* *Flujo de Solución Paso a Paso:*

1. En **Plan de visitas**, seleccionar **Agregar cliente fuera de ruta**.
2. Seleccionar **Comercial Vega Hnos.** y marcar las tareas de **PEDIDO** y **COBRANZA**.
3. Seleccionar al cliente agregado y pulsar **Iniciar visita**.
4. En la tarea **PEDIDOS**, pulsar **Crear pedido**.
5. Mantener la condición de pago **Contado**.
6. Seleccionar **Lista 3** y configurar la línea **Lubricantes** y la marca **Shell**.
7. En el catálogo, seleccionar **Shell Helix HX7** e ingresar **15 unidades**, verificando el precio unitario de **USD 25.00**.
8. Activar el toggle del **producto promocional**, correspondiente a **1 gorro por cada 5 baldes vendidos**, y pulsar **Agregar**.
9. En la vista de pedidos, pulsar **Continuar**.
10. En la pantalla de **Confirmación / Resumen**, verificar condición de pago, productos, cantidades y descuentos.
11. Seleccionar la fecha de entrega **14 de septiembre**.
12. Seleccionar/configurar la dirección de entrega **Calle Santa Marta 205**.
13. Pulsar **Confirmar pedido**.
14. Verificar que el comprobante indique **Pedido** y pulsar **Continuar**.
15. En la tarea de **COBRANZAS**, consultar la deuda vencida de **USD 380.00** y pulsar **Pagar**.
16. Registrar el primer pago mediante **Efectivo**, seleccionando **Soles** e ingresando **PEN 276.00**, equivalente a USD 80.00 con TC 3.45.
17. Adjuntar la fotografía del recibo de cobranza y pulsar **Continuar** y posteriormente **Confirmar**.
18. Registrar el segundo pago correspondiente al saldo mediante **Depósito bancario**.
19. Para el depósito, ingresar obligatoriamente **banco BCP, fecha de pago, número de voucher, monto y moneda**.
20. Confirmar el segundo pago.
21. Una vez ingresadas ambas cobranzas, pulsar **Continuar**.
22. Verificar el **voucher consolidado de cobranza**, comprobando que muestre los dos pagos y su información correspondiente.
23. Pulsar **Continuar** y **Finalizar visita**.

* *Puntos Críticos / Errores a Evaluar (Trampas o Validaciones):*

  * No registrar al cliente como **fuera de ruta**.
  * No seleccionar correctamente las tareas de pedido y cobranza.
  * Seleccionar una condición diferente de **Contado**.
  * Seleccionar una lista diferente de **Lista 3**.
  * Seleccionar una línea o marca incorrecta.
  * Registrar una cantidad diferente de **15 baldes**.
  * Registrar un precio unitario diferente de **USD 25.00**.
  * No activar la promoción de **1 gorro por cada 5 baldes**.
  * No establecer la fecha de entrega del **14 de septiembre**.
  * No seleccionar correctamente la dirección de entrega.
  * Registrar incorrectamente el primer pago de **USD 80 / PEN 276**.
  * No adjuntar el recibo de cobranza del pago en efectivo.
  * Registrar incorrectamente el saldo mediante depósito.
  * Omitir banco, fecha, voucher, monto o moneda en el depósito.
  * No verificar el voucher consolidado.
  * Finalizar la visita sin completar correctamente el pedido y las cobranzas.

* *Resultado Final Esperado:*

  * Visita registrada correctamente como **fuera de ruta**.
  * Pedido: **15 baldes Shell Helix HX7**.
  * Precio unitario: **USD 25.00**.
  * Monto bruto del pedido: **USD 375.00**.
  * Condición: **Contado**.
  * Lista: **Lista 3**.
  * Promoción: **1 gorro por cada 5 baldes vendidos**.
  * Fecha de entrega: **14 de septiembre**.
  * Dirección de entrega: **Calle Santa Marta 205**.
  * Cobranza total: **USD 380.00**.
  * Pago 1: **USD 80.00 = PEN 276.00**, en efectivo.
  * Pago 2: **USD 300.00**, mediante depósito bancario al BCP.
  * Voucher consolidado generado con ambos pagos.
  * Estado: **Visita completada al 100%, con pedido emitido y cobranza registrada correctamente**.
