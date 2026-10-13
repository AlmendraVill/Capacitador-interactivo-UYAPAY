# Guión de Video 08: Tareas en Ruta – Gestión de Cobranzas en Campo

---

### 1. Ficha Técnica del Módulo
* **Código de Video:** VID-08
* **Título:** Tareas en Ruta: Gestión Integral de Cobranzas, Medios de Pago y Retenciones SUNAT
* **Módulos Involucrados:** `visit_in_progress`, `collect_debt`, `payment_methods` (`cash`, `deposit`, `check`, `payment_with_retention`), `receipts_confirmation_page`
* **Duración Estimada:** 04:30 minutos
* **Perfil:** Asesor Comercial en Ruta (B2C / B2B)
* **Objetivo de Aprendizaje:** Enseñar al asesor el procedimiento estricto para liquidar deudas de clientes en campo: selección de comprobantes pendientes, cobro en efectivo con recibo, cobro bancario con validación de operación y fotos de voucher/recibo, registro de cheques, aplicación rigurosa de Comprobantes de Retención SUNAT al 3%, revisión de recibos electrónicos temporales y el paso inmutable de "Generar documento".

---

### 2. Checklist Previo a la Grabación (Antes de presionar REC)

- [ ] **Pantalla Inicial:** En la visita en progreso, posicionado en la tarea **"Cobranzas"** (`collect_debt.dart`).
- [ ] **Cliente de Prueba:** Cliente con al menos 2 facturas pendientes de cobro (una en soles y una donde se pueda simular retención).
- [ ] **Datos Bancarios de Prueba Preparados:**
  - Banco SOLAR: ej. *BCP* o *BBVA*.
  - Número de Operación bancaria ficticio pero verosímil (ej. *10928374*).
  - Fecha de abono.
- [ ] **Imágenes de Prueba en Galería o Mesa:**
  - Imagen simulada de recibo físico de cobranza.
  - Imagen simulada de voucher bancario (depósito/transferencia).
- [ ] **Grabador:** Grabando en 1080p, audio calibrado.

---

### 3. Pauta de Grabación Paso a Paso

| Momento / Tiempo | Acción en Pantalla (Tus dedos) | Locución / Discurso Sugerido (Tu voz) | Nota de Grabación / Ritmo |
| :--- | :--- | :--- | :--- |
| **00:00 - 00:25** | En el carrusel de la visita, tocar **"Cobranzas"**. Carga la lista de facturas y letras con saldo pendiente de pago. | "¡Bienvenidos al Video 08! Tan importante como vender es recuperar la cartera de créditos para mantener activo el financiamiento de nuestros clientes. En este video aprenderemos a registrar cobranzas en campo mediante los diferentes métodos de pago y la aplicación de retenciones SUNAT." | Mostrar la lista de facturas pendientes con sus fechas de vencimiento. |
| **00:25 - 01:10** | Tocar el botón **"Pagar"** en la primera factura. Se abre el selector de Métodos de Pago: *Efectivo, Depósito, Cheque, Comprobante de retención*. Seleccionar **"Efectivo"**.<br>1. Ingresar el importe cobrado (ej: S/ 500.00).<br>2. Tocar el ícono de cámara para adjuntar la **foto del recibo de cobranza**.<br>3. Pulsar **"Continuar"** y confirmar. | "**Método 1: Cobro en Efectivo.** Si el cliente nos entrega dinero en efectivo, seleccionamos 'Efectivo', verificamos la moneda, digitamos el monto exacto recaudado y capturamos obligatoriamente la fotografía nítida del recibo físico provisional entregado al cliente. Presionamos 'Continuar', verificamos los datos y confirmamos el pago." | Mostrar la digitación y la carga de la foto del recibo físico. |
| **01:10 - 02:10** | Volver a la lista de deudas o tocar otra factura pendiente. Seleccionar **"Pagar"** y elegir **"Depósito"** (o Transferencia):<br>1. Desplegar y elegir **Banco** (ej: *BCP*).<br>2. Seleccionar la **Fecha** del depósito.<br>3. Digitar el **Número de Operación**.<br>4. Digitar el **Monto** abonado.<br>5. Adjuntar dos fotos obligatorias: **Foto del Voucher** y **Foto del Recibo**.<br>6. Pulsar **"Continuar"** y confirmar. | "**Método 2: Depósito o Transferencia Bancaria.** Si el cliente abonó a las cuentas corrientes de SOLAR, elegimos 'Depósito'. Seleccionamos el banco de destino, la fecha de la transferencia y digitamos con mucho cuidado el número de operación bancaria. Ingresamos el monto y adjuntamos las dos evidencias obligatorias: la fotografía del voucher bancario y la del recibo de cobranza. Confirmamos el registro." | Resaltar con la voz la obligatoriedad de adjuntar ambas fotos (voucher y recibo). |
| **02:10 - 03:00** | Explicar el método **"Comprobante de Retención"** (tocar en la opción):<br>1. Mostrar el campo de porcentaje fijado en **3%** (o ingresar 3%).<br>2. Digitar el número de serie y correlativo del comprobante electrónico de SUNAT entregado por el cliente.<br>3. Adjuntar foto del comprobante de retención.<br>4. Confirmar. | "**Método 3: Comprobante de Retención SUNAT.** Si el cliente es un Agente de Retención designado por la SUNAT, nos retendrá el **3% fijo** del total de la factura. Seleccionamos 'Comprobante de retención', digitamos el número del documento emitido por el cliente, verificamos que el cálculo coincida con el 3% exacto, adjuntamos la evidencia y confirmamos." | Enfatizar la tasa del 3% como estándar legal y contable de SOLAR. |
| **03:00 - 03:40** | Regresar a la vista de **"Recibos Electrónicos"** donde figuran todos los pagos temporales registrados en la visita. Tocar los **tres puntos (`...`)** de uno de ellos para mostrar las opciones: *Editar* o *Anular*. | "Todos los pagos registrados se acumulan en la lista de Recibos Electrónicos de la visita. En esta etapa previa, si nos equivocamos en un dígito del número de operación o en el monto, podemos tocar los tres puntos (...) para **editar o anular** el pago antes de enviarlo a contabilidad." | Mostrar el menú de opciones contextuales con claridad. |
| **03:40 - 04:30** | Pulsar el botón **"Guardar"**. Se abre la ventana modal de advertencia: **'Confirmar cobranzas a enviar'**. Leer el mensaje de advertencia y presionar el botón **"Generar documento"**. El sistema emite los comprobantes oficiales inmutables. | "**¡Paso crítico inmutable!** Una vez verificados todos los recibos, presionamos 'Guardar'. La app nos solicitará una confirmación definitiva. Al presionar **'Generar documento'**, los recibos se graban permanentemente en los servidores contables de SOLAR y **ya no podrán ser editados ni anulados** desde el celular. Presionamos 'Generar documento' y nuestra cobranza queda cerrada. En el Video 09 veremos el Cierre de Visita y Documentos Electrónicos." | Mantener el foco en el botón 'Generar documento' y la advertencia inmutable. |

---

### 4. Reglas de Negocio Clave y Prevención de Errores

> [!CAUTION]
> **Inmutabilidad tras 'Generar Documento':** Una vez presionado este botón, la cobranza impacta directamente en el ERP comercial y contable. Si cometió un error en el número de operación bancaria o monto, deberá tramitar una regularización formal con el área de Tesorería.
> 
> **Retención SUNAT Fija al 3%:** Nunca ingrese porcentajes distintos de retención a menos que exista un cambio de régimen tributario formal autorizado por la empresa.
