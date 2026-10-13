# Guión de Video 07: Tareas en Ruta – Toma de Pedidos y Cotizaciones

---

### 1. Ficha Técnica del Módulo
* **Código de Video:** VID-07
* **Título:** Tareas en Ruta: Toma de Pedidos, Políticas Comerciales, Catálogo y Cotizaciones
* **Módulos Involucrados:** `visit_in_progress`, `advise_order`, `cart_section`, `store_section`
* **Duración Estimada:** 04:30 minutos
* **Perfil:** Asesor Comercial en Ruta (B2C / B2B)
* **Objetivo de Aprendizaje:** Capacitar al asesor en todo el ciclo de venta en ruta: parametrización del pedido (Padre/Hijo, Contado vs Crédito con plazos, lista de precios, moneda), cumplimiento de la regla de marca única por pedido, navegación en el catálogo, aplicación de promociones y bonificaciones por volumen, selección de despacho y fecha estimada, y la diferencia crítica entre 'Guardar como Cotización' y 'Confirmar Orden de Compra como Pedido'.

---

### 2. Checklist Previo a la Grabación (Antes de presionar REC)

- [ ] **Pantalla Inicial:** En la visita en progreso, posicionado en la tarea **"Toma de pedidos"** (`advise_order.dart`).
- [ ] **Cliente de Prueba:** Cliente con línea de crédito suficiente y direcciones de entrega registradas.
- [ ] **Productos Seleccionados:** Tener identificados 2 SKUs de una misma marca (ej. marca **Shell**: *Shell Helix Ultra 5W-40* y *Shell Rimula R4 X 15W-40*) para aplicar una promoción por volumen de regalo o descuento.
- [ ] **Teclado:** Listo para ingresar cantidades o buscar por SKU.
- [ ] **Grabador:** Grabación a 1080p con toques visibles.

---

### 3. Pauta de Grabación Paso a Paso

| Momento / Tiempo | Acción en Pantalla (Tus dedos) | Locución / Discurso Sugerido (Tu voz) | Nota de Grabación / Ritmo |
| :--- | :--- | :--- | :--- |
| **00:00 - 00:25** | En el carrusel de tareas, tocar **"Toma de pedidos"**. Carga la pantalla de pedidos de la visita. Pulsar el botón principal **"Crear Pedido o Cotización"**. | "¡Bienvenidos al Video 07! Llegamos al momento cumbre de la labor comercial: la toma de pedidos y cotizaciones. En este video aprenderemos a configurar las condiciones de venta, explorar el catálogo, aplicar promociones y emitir órdenes válidas para el ERP de SOLAR." | Entrada limpia y toque en 'Crear Pedido o Cotización'. |
| **00:25 - 01:15** | Se abre el formulario de cabecera: <br>1. Seleccionar cliente **Padre o Hijo**.<br>2. Condición de pago: Seleccionar **Crédito** y desplegar el plazo (ej: **30 días**).<br>3. Verificar la **Lista de Precios**.<br>4. Seleccionar la **Línea de Negocio y Marca** (ej. **Shell**).<br>5. Verificar la **Moneda** (Soles / Dólares). | "Primero configuramos los parámetros comerciales del pedido:<br>1. Elegimos si el pedido se factura a nombre del Cliente Padre o a una Sucursal Hijo.<br>2. Definimos la condición de pago: Contado o Crédito. Si es Crédito, seleccionamos el plazo autorizado, por ejemplo 30 días, verificando que el cliente tenga línea disponible.<br>3. Comprobamos la lista de precios asignada y la moneda.<br>4. **¡Atención a la Regla de Oro de SOLAR!** Debemos seleccionar una **marca única** por pedido. El sistema no permite mezclar lubricantes Shell con neumáticos Michelin en el mismo carrito. Cada marca requiere su propio pedido independiente." | Tocar cada desplegable con calma. Enfatizar con la voz la regla de no mezclar marcas. |
| **01:15 - 01:50** | Pulsar el botón **"Agregar Producto"**. Se abre el **Catálogo Comercial**. Usar el buscador para escribir el SKU o nombre (ej. *'Rimula'*). Mostrar los resultados filtrados. | "Presionamos 'Agregar Producto' y accedemos a nuestro catálogo. Podemos filtrar por categorías o usar el buscador superior digitando el código SKU o el nombre del lubricante. Observamos el precio de lista, la unidad de medida y el stock disponible." | Realizar una búsqueda rápida y fluida para que aparezca el producto. |
| **01:50 - 02:45** | Seleccionar el producto. Usar los botones **`+` y `-`** o tocar el campo numérico para ingresar la cantidad (ej. **20 unidades**).<br>Activar la pestaña de **Promociones**: mostrar el selector entre **Regalo (Bonificación en especie)** o **Descuento comercial**. Tocar el botón de **Check (Confirmar cambios)**. Luego pulsar **"Agregar producto"** al carrito. | "Ajustamos la cantidad deseada usando los botones más y menos o digitando directamente en el teclado. Si el volumen califica para una promoción, activamos la pestaña de promociones y seleccionamos el beneficio negociado: bonificación de unidades de regalo o descuento en dinero. **¡Paso clave!** Presionamos el botón de confirmación con el check para aplicar la bonificación y luego 'Agregar producto' al pedido." | Mostrar con detalle el check de confirmación de la promoción antes de agregar al carrito. |
| **02:45 - 03:30** | Ir al carrito de compras y pulsar **"Continuar"** o **"Confirmar pedido"**. Carga la **Ventana de Confirmación del Pedido**. Deslizar por los campos:<br>1. Seleccionar la **Dirección de entrega**.<br>2. Elegir la **Fecha estimada de entrega** en el calendario.<br>3. Mostrar el switch de **Venta Segura**. | "En la ventana de confirmación revisamos los importes: Subtotal, IGV y Total final. Aquí seleccionamos la dirección física de entrega donde el transporte de SOLAR dejará la mercadería, definimos la fecha estimada de entrega y marcamos si corresponde a una 'Venta Segura'." | Seleccionar la dirección en el desplegable y tocar la fecha en el datepicker. |
| **03:30 - 04:05** | Señalar las dos opciones inferiores: **"Guardar como cotización"** vs **"Confirmar orden de compra como pedido"**. Tocar **"Confirmar orden de compra como pedido"** (o simular guardado). Aparece modal de éxito y el pedido figura con estado **"Enviado"**. | "Ahora tenemos dos caminos estratégicos:<br>• Si el cliente aún está evaluando la compra, presionamos **'Guardar como cotización'**, lo que nos permite mantener la propuesta viva sin comprometer inventario.<br>• Si la venta está cerrada, presionamos **'Confirmar orden de compra como pedido'**. Inmediatamente el pedido se transmitirá a la central con estado 'Enviado'." | Mostrar la ventana de confirmación y el cambio de estado a 'Enviado'. |
| **04:05 - 04:30** | En la lista de pedidos de la visita, tocar los **tres puntos (`...`)** junto al pedido emitido. Mostrar las opciones: *Ver y compartir, Editar, Anular*. Pulsar **"Guardar"** en la tarea. | "Presionando los tres puntos (...), podemos ver y compartir el resumen con el cliente vía WhatsApp o PDF. Recuerda que puedes editarlo o anularlo únicamente antes de que sea aprobado o facturado por créditos. Presionamos 'Guardar' para culminar la tarea. En el Video 08 veremos la Gestión de Cobranzas en Campo." | Mostrar el menú de los tres puntos, presionar Guardar y cortar el clip. |

---

### 4. Reglas de Negocio Clave y Prevención de Errores

> [!CAUTION]
> **Segregación Estricta de Marcas:** Jamás intente combinar productos de diferentes marcas (ej. Shell y Michelin) en la misma orden. Cada línea de negocio cuenta con almacenes, políticas de crédito y facturación independientes en SOLAR.
> 
> **Confirmación de Promociones:** Si agrega unidades promocionales pero olvida presionar el check de confirmación de la promoción, el pedido se emitirá a precio regular sin bonificación.
