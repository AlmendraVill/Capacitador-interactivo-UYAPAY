# Guión de Video 09: Cierre de Visita y Documentos Electrónicos

---

### 1. Ficha Técnica del Módulo
* **Código de Video:** VID-09
* **Título:** Finalización de la Visita, Tiempos en Ruta, Justificación de Tareas y Auditoría de Documentos Electrónicos
* **Módulos Involucrados:** `finished_visit`, `finished_visit_summary_page`, `electronic_documents_section`
* **Duración Estimada:** 03:00 minutos
* **Perfil:** Asesor Comercial en Ruta (B2C / B2B)
* **Objetivo de Aprendizaje:** Enseñar al asesor el cierre formal y exitoso de una visita comercial: revisión de métricas operativas (tiempo de traslado y tiempo de atención), justificación estricta de tareas que no pudieron completarse, y consulta, verificación y compartición de comprobantes en el Módulo de Documentos Electrónicos.

---

### 2. Checklist Previo a la Grabación (Antes de presionar REC)

- [ ] **Pantalla Inicial:** En la visita en progreso con al menos una o dos tareas terminadas (o simulando una tarea omitida para demostrar la justificación).
- [ ] **Módulo de Documentos Electrónicos:** Tener al menos un documento (recibo de cobro, factura o pedido) registrado en la base de datos para mostrar la consulta y el PDF/detalle.
- [ ] **Conexión a Internet:** Activa para la sincronización del cierre de visita con el servidor central.
- [ ] **Grabador:** Grabación a 1080p, pantalla limpia sin banners emergentes.

---

### 3. Pauta de Grabación Paso a Paso

| Momento / Tiempo | Acción en Pantalla (Tus dedos) | Locución / Discurso Sugerido (Tu voz) | Nota de Grabación / Ritmo |
| :--- | :--- | :--- | :--- |
| **00:00 - 00:20** | En el carrusel de tareas de la visita, desplazarse al final y tocar la opción o botón **"Finalizar visita"** (`finished_visit_summary_page.dart`). | "¡Bienvenidos al Video 09, el último módulo de nuestra serie tutorial de UYAPAY B2C! Una vez concluidas las gestiones con el cliente, debemos realizar el cierre formal de la visita y auditar los documentos emitidos durante la jornada." | Transición fluida al resumen de fin de visita. |
| **00:20 - 00:55** | Carga la pantalla de **Resumen de Visita**. Señalar los dos relojes/indicadores métricos: **Tiempo de traslado** (minutos de viaje) y **Tiempo de atención** (minutos dentro del local). | "Al presionar 'Finalizar visita', el sistema nos muestra una auditoría de tiempos en ruta: el Tiempo de Traslado transcurrido desde la visita anterior y el Tiempo de Atención efectivo que dedicamos a este cliente. Estas métricas son clave para medir la productividad de nuestra ruta diaria." | Pausar 2 segundos en las tarjetas de tiempo. |
| **00:55 - 01:40** | En la lista de tareas del resumen, señalar si alguna tarea quedó marcada con advertencia o no completada. Mostrar el campo o modal **"Justificación de tareas no realizadas"**. Escribir o seleccionar un motivo (ej: *"Cliente no disponía de liquidez para cobranza"* o *"Encargado ocupado"*). | "Si por alguna circunstancia operativa no pudiste realizar una de las tareas (como cobranza o pedidos), la app te exigirá de forma obligatoria ingresar una **Justificación**. Seleccionamos el motivo y redactamos la explicación comercial. Sin esta justificación, el sistema no permitirá cerrar la visita y penalizará tu efectividad." | Escribir la justificación en pantalla y guardarla. |
| **01:40 - 02:05** | Presionar el botón principal **"Finalizar visita"**. Aparece modal de confirmación y la app regresa al **Plan de Visitas del Día**, donde el cliente ahora figura con estado **"Realizado"** (marcado con check o color verde). | "Presionamos 'Finalizar visita'. El sistema sincroniza todos los eventos con el servidor central y nos devuelve al Plan de Visitas. Notarán que el cliente pasa inmediatamente a estado 'Realizado'. ¡Una visita cerrada con éxito!" | Mostrar la tarjeta del cliente cambiando a estado 'Realizado'. |
| **02:05 - 02:40** | Abrir el **Menú lateral (hamburguesa)** y tocar la opción **"Documentos Electrónicos"** (`electronic_documents_section`). Deslizar por los filtros: *Facturas, Letras, Recibos de Cobro, Notas de Crédito*. Tocar un recibo o factura emitida hoy. | "Para cerrar nuestra jornada o hacer seguimiento postventa, abrimos el menú lateral y seleccionamos 'Documentos Electrónicos'. Desde aquí podemos filtrar y consultar todos los comprobantes emitidos: facturas, letras de cambio, recibos de cobro y notas de crédito. Al tocar sobre un documento, podemos ver el detalle completo, su PDF oficial y compartirlo con el cliente." | Mostrar el visor de documentos electrónicos y el detalle del recibo. |
| **02:40 - 03:00** | Regresar al Home principal. | "¡Felicidades! Con estos 9 módulos dominas al 100% el ecosistema comercial de UYAPAY B2C. ¡Muchos éxitos en tus rutas de venta y cobranza con SOLAR!" | Despedida con el logo corporativo visible en pantalla y cortar grabación. |

---

### 4. Reglas de Negocio Clave y Prevención de Errores

> [!IMPORTANT]
> **Justificación Obligatoria de Tareas:** Cualquier tarea omitida sin justificación válida queda registrada como infracción operativa en los reportes de supervisión comercial. Justifique siempre con fundamentos verídicos.
> 
> **Sincronización al Cierre:** Al finalizar la visita, asegúrese de contar con señal de datos para que el estado 'Realizado' y los tiempos se transmitan al ERP en tiempo real.
