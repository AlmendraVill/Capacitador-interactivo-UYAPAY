# Guión de Video 04: Inicio de Visita y Gestión de Geolocalización (3 Casos)

---

### 1. Ficha Técnica del Módulo
* **Código de Video:** VID-04
* **Título:** Inicio de Visita y Validación de Geolocalización (Presencial, Reajuste por Foto y Llamada)
* **Módulos Involucrados:** `visits_plan`, `preview_visit`, `set_customer_location`
* **Duración Estimada:** 04:00 minutos
* **Perfil:** Asesor Comercial en Ruta (B2C / B2B)
* **Objetivo de Aprendizaje:** Capacitar al asesor en la correcta apertura de una visita bajo los 3 escenarios operativos reales: llegada física dentro de la geocerca de 50 metros, reestablecimiento de coordenadas con fotografía de fachada cuando el GPS difiere, e inicio de gestión remota por llamada telefónica respetando la cuota máxima diaria.

---

### 2. Checklist Previo a la Grabación (Antes de presionar REC)

- [ ] **Pantalla Inicial:** Módulo **"Plan de visitas"** con la agenda del día abierta.
- [ ] **GPS Activo:** Asegurarse de que el GPS del celular esté encendido.
- [ ] **Preparación de los 3 Casos:**
  - **Cliente Caso A:** Un cliente donde las coordenadas del asesor coincidan (< 50 metros) o botón "Iniciar visita" activo.
  - **Cliente Caso B:** Un cliente con ubicación desactualizada / fuera de radio (> 50 metros) para demostrar la función de "Reestablecer ubicación" y cámara.
  - **Cliente Caso C:** Un cliente donde se pueda demostrar el switch de "Visita telefónica".
- [ ] **Cámara:** Permiso de cámara concedido para tomar la foto de fachada en el Caso B.
- [ ] **Contador de Llamadas:** Verificar que no se hayan consumido las 5 llamadas del día en el usuario de prueba.

---

### 3. Pauta de Grabación Paso a Paso

| Momento / Tiempo | Acción en Pantalla (Tus dedos) | Locución / Discurso Sugerido (Tu voz) | Nota de Grabación / Ritmo |
| :--- | :--- | :--- | :--- |
| **00:00 - 00:25** | En el Home, tocar **"Plan de visitas"**. Mostrar la lista de clientes programados para hoy: *Pendientes, Realizados, No visitados*. | "¡Hola, equipo! Bienvenidos al Video 04, uno de los módulos más importantes de la operativa en campo. En este video aprenderemos los 3 escenarios que podemos enfrentar al llegar a un cliente para dar inicio a nuestra visita: dentro de radio, fuera de radio y visita por llamada telefónica." | Mostrar el Plan de Visitas del día con claridad. |
| **00:25 - 01:20** | **CASO A:** Seleccionar un cliente cercano. La pantalla de vista previa detecta la posición GPS a menos de 50m. El botón **"Iniciar visita"** se encuentra habilitado en azul/verde. Tocar **"Iniciar visita"**. Carga el carrusel de tareas con mensaje de éxito: *'Visita iniciada correctamente'*. | "**Escenario 1: Llegada presencial dentro del radio (< 50 metros).** Cuando estamos físicamente en la puerta del cliente y a menos de 50 metros de su coordenada registrada, el GPS lo valida automáticamente. El botón 'Iniciar visita' se habilita al instante; simplemente lo presionamos y la app nos abre el carrusel de tareas en progreso. ¡Así de rápido!" | Resaltar el botón activo y la transición exitosa al carrusel de tareas. |
| **01:20 - 01:35** | Retroceder o volver al Plan de Visitas para mostrar el segundo escenario con otro cliente. | "Ahora bien, ¿qué sucede si llegamos al punto del cliente, pero la app indica que estamos fuera del radio o el cliente no tiene geolocalización confirmada? Veamos el Escenario 2." | Transición fluida hacia el segundo cliente. |
| **01:35 - 02:40** | **CASO B:** Seleccionar un cliente fuera de radio. El botón "Iniciar visita" aparece deshabilitado o muestra distancia > 50m. Tocar el botón/enlace **"Reestablecer ubicación"** (o en 'Cambiar dirección'). Se abre la pantalla de captura (`set_customer_location_page`). Tocar el ícono de **Cámara**, simular o tomar la foto de la fachada del local. Pulsar **"Guardar"**. El sistema actualiza el punto y el botón "Iniciar visita" se activa. | "**Escenario 2: Fuera de radio o reestablecer ubicación.** Si estás en la fachada real pero el cliente tenía coordenadas erróneas o no confirmadas, presionamos 'Reestablecer ubicación'. La app nos solicitará una fotografía en tiempo real de la fachada del establecimiento como evidencia física in situ. Tomamos la fotografía nítida, presionamos 'Guardar' y el sistema sincronizará de inmediato las coordenadas actuales a la base de datos de SOLAR, permitiéndonos iniciar la visita formal." | Enfocar bien la cámara a una fachada representativa y presionar Guardar. |
| **02:40 - 03:00** | Volver al Plan de Visitas para el tercer escenario. | "Finalmente, existe un tercer escenario operativo: cuando coordinamos la venta a distancia mediante llamada telefónica sin acudir físicamente al local." | Pausa explicativa de 2 segundos. |
| **03:00 - 03:40** | **CASO C:** Seleccionar un cliente. En la vista previa, ubicar y activar el switch **"Visita telefónica"**. El botón "Iniciar visita" se habilita. Pulsar **"Iniciar visita"**. | "**Escenario 3: Visita por llamada telefónica.** Si el cliente se atiende de forma remota, activamos el switch 'Visita telefónica'. Notarán que el botón 'Iniciar visita' se desbloquea de inmediato. **¡Atención a la regla de negocio!** Solo disponemos de un límite estricto de **5 llamadas telefónicas al día**. Superado este cupo, no se podrán abrir más visitas remotas, salvo excepciones autorizadas fuera de ruta." | Hacer énfasis verbal en el límite de 5 llamadas mientras se activa el switch. |
| **03:40 - 04:00** | Mostrar el carrusel de tareas en progreso (`visit_in_progress_page`). | "Una vez iniciada la visita por cualquiera de estos tres métodos, quedamos posicionados en el carrusel de tareas de campo. En el Video 05 aprenderemos a ejecutar la Exhibición de Marca y Trade Marketing. ¡Continuemos!" | Dejar visible el carrusel de tareas y detener la grabación. |

---

### 4. Reglas de Negocio Clave y Prevención de Errores

> [!CAUTION]
> **Tope de 5 Llamadas Diarias:** La app audita rigurosamente el uso del switch de visita telefónica. No gastes tus llamadas en clientes que vas a visitar presencialmente.
> 
> **Fotografía de Fachada Obligatoria en Reajuste:** La foto de fachada queda almacenada en el servidor y es revisada por supervisión de créditos y cobranzas. No tomes fotos al piso ni a paredes vacías, ya que la auditoría anulará la actualización geográfica.
