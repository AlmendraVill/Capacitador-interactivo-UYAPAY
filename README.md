# Capacitador Interactivo UYAPAY (B2C)

Plataforma web interactiva para la capacitación, simulación móvil y evaluación práctica de asesores de ventas de **UYAPAY**.

---

## 📁 Estructura del Proyecto

El proyecto está modularizado siguiendo las mejores prácticas de separación de responsabilidades (*Separation of Concerns*):

```text
Capacitador-interactivo-UYAPAY/
├── css/
│   ├── styles.css           # Estilos de la plataforma web, ranking, podio, modales y monitor
│   └── simulator.css        # Estilos del simulador móvil nativo (smartphone)
├── js/
│   ├── data/
│   │   ├── users.js         # Nómina oficial de usuarios y perfiles
│   │   └── cases.js         # Catálogo de los 30 casos oficiales, productos Shell/Michelin/Hyundai y reglas desacopladas
│   ├── services/
│   │   ├── storage.js       # Servicio de persistencia híbrida (SQLite REST API + localStorage)
│   │   ├── evaluator.js     # Motor de evaluación desacoplado, cronómetro global y consolidador de notas
│   │   └── auth.js          # Servicio de autenticación, hash PBKDF2 y sesiones
│   ├── portal.js            # Controlador principal de la plataforma web y gestor de tabs
│   └── simulator.js         # Controlador del simulador móvil (8 flujos, emisor de eventos desacoplado)
├── test/
│   ├── business_rules.test.js    # Pruebas unitarias de reglas de negocio, calificación y selección estratificada
│   └── server_integration.test.js # Pruebas de integración E2E del backend Express y SQLite
├── index.html               # Vista principal (Portal web, Dashboard, Podio, Historial y Arena de 5 Tabs)
├── simulator.html           # Vista del simulador de la aplicación móvil UYAPAY
├── server.js                # Servidor backend Node.js con SQLite (WAL mode), SSE en vivo y exportación
├── uyapay.sqlite            # Base de datos persistente SQLite centralizada
├── Casos de Prueba...md     # Especificación de los 30 casos de negocio reales
├── Flujos de Resolución...md# Secuencia paso a paso según el Manual de Usuario UYAPAY
├── FLUJOS_DEL_SISTEMA.md    # Documentación técnica de flujos del sistema y arquitectura multi-tab
├── REQUISITOS DEL MVP.md    # Especificación formal de requisitos funcionales y no funcionales
└── README.md                # Documentación general del sistema
```

---

## 🚀 Características Principales del Sistema

1. **Evaluación Práctica Multi-Caso en Pestañas (5 Tabs):**
   - El asesor resuelve **5 casos prácticos en pestañas interactivas independientes**.
   - Selección estratificada balanceada entre los 5 módulos pedagógicos clave con filtro anti-repetición.
   - Navegación ágil entre casos con indicadores de avance (`⏳ En evaluación`, `✅ Completado`).

2. **Simulador Móvil Desacoplado (RF-MVP-008 a 015):**
   - Réplica fiel de la aplicación móvil oficial (arquitectura Flutter de UYAPAY) en un marco de smartphone.
   - Cobertura de 8 flujos operativos: Plan de visitas, tareas de inicio, registro de fotos, tracking de precios, configuración de pedidos, gestión de cobranzas, cotizaciones Tipo 3 y comprobantes digitales.
   - Catálogo multi-marca real: lubricantes Shell, neumáticos Michelin y BFGoodrich.
   - **El simulador no calcula notas:** emite eventos neutros (`SIMULATOR_EVENT`) y reacciona a las directivas del evaluador.

3. **Motor de Evaluación Independiente (RF-MVP-026 a 035):**
   - Audita en tiempo real cada interacción contra las reglas configuradas del caso activo.
   - Detección rigurosa de errores, omisiones críticas y casos trampa (ej. bypass GPS, justificaciones de tareas, cobros no consolidados).
   - Calificación en escala vigesimal (0 a 20) con deducción de 4 puntos por error.

4. **Cronómetro Global Continuo (RF-MVP-019/024/034):**
   - Cronómetro visual activo durante toda la evaluación (`⏱️ MM:SS`) que no se reinicia al cambiar de pestaña.
   - El tiempo total acumulado se registra como **criterio primario de desempate**.

5. **Ranking General, Podio Top 3 y Control de Publicación (RF-MVP-042 a 047):**
   - **Podio Top 3** con medallas y tarjetas destacadas (🥇 Oro, 🥈 Plata, 🥉 Bronce).
   - Criterios oficiales de clasificación:
     1. Mayor puntuación obtenida.
     2. Menor tiempo de resolución (desempate).
     3. Menor cantidad de errores cometidos.
   - **Bloqueo/Publicación de Podio:** Los administradores pueden mantener el podio en reserva durante la jornada y liberarlo en vivo para los asesores con un clic.

6. **Monitor en Vivo y Analítica de Errores (Exclusivo Administrador):**
   - Transmisión en tiempo real vía *Server-Sent Events (SSE)*: visualización inmediata del asesor activo, paso en curso, errores acumulados y live feed de eventos.
   - **Matriz analítica de casos críticos:** Identifica los casos con mayor tasa de falla y las reglas operativas con errores más frecuentes para capacitación correctiva.
   - **Exportación de reportes:** Descarga del consolidado de evaluaciones en **CSV (UTF-8 con BOM)** y **Excel (.xls)**.

7. **Seguridad y Persistencia Centralizada:**
   - Base de datos **SQLite persistente con WAL (Write-Ahead Logging)** para concurrencia multi-usuario sin bloqueos.
   - Cifrado criptográfico de contraseñas con **PBKDF2** (10,000 iteraciones, sal criptográfica y comparación en tiempo constante).
   - Soporte para acceso en red local (Wi-Fi o cableada) para conectar celulares y computadoras de evaluación simultáneamente.

---

## 👥 Nómina Oficial de Usuarios (1 Administrador y 14 Asesores Comerciales)

| Usuario | Contraseña | Rol | Acceso y Funciones |
|---|---|---|---|
| `admin` | `123` | Administrador | Dashboard, Monitor en vivo SSE, Control de Podio, Analítica de Errores, Exportación CSV/Excel |
| `edward` | `123` | Asesor Comercial | Evaluación práctica, Ranking y Podio, Mis calificaciones |
| `henry` | `123` | Asesor Comercial | Evaluación práctica, Ranking y Podio, Mis calificaciones |
| `alvaro` | `123` | Asesor Comercial | Evaluación práctica, Ranking y Podio, Mis calificaciones |
| `lruiz` | `123` | Asesor Comercial | Evaluación práctica, Ranking y Podio, Mis calificaciones |
| `percy` | `123` | Asesor Comercial | Evaluación práctica, Ranking y Podio, Mis calificaciones |
| `danilo` | `123` | Asesor Comercial | Evaluación práctica, Ranking y Podio, Mis calificaciones |
| `betsy` | `123` | Asesor Comercial | Evaluación práctica, Ranking y Podio, Mis calificaciones |
| `williams` | `123` | Asesor Comercial | Evaluación práctica, Ranking y Podio, Mis calificaciones |
| `larce` | `123` | Asesor Comercial | Evaluación práctica, Ranking y Podio, Mis calificaciones |
| `dino` | `123` | Asesor Comercial | Evaluación práctica, Ranking y Podio, Mis calificaciones |
| `natalio` | `123` | Asesor Comercial | Evaluación práctica, Ranking y Podio, Mis calificaciones |
| `marco` | `123` | Asesor Comercial | Evaluación práctica, Ranking y Podio, Mis calificaciones |
| `antonio` | `123` | Asesor Comercial | Evaluación práctica, Ranking y Podio, Mis calificaciones |
| `hernan` | `123` | Asesor Comercial | Evaluación práctica, Ranking y Podio, Mis calificaciones |

---

## 🧩 Catálogo Oficial de 30 Casos de Negocio

El sistema cuenta con la batería oficial de **30 casos activos** (`CP-01` al `CP-30`), cubriendo el 100% de las especificaciones operativas y organizados en **5 estratos pedagógicos**:

| Estrato | Área Temática | Casos Incluidos | Competencias Evaluadas |
|---|---|---|---|
| **1** | Venta Regular y Catálogo Base | `CP-01`, `CP-04`, `CP-06`, `CP-12`, `CP-15`, `CP-20`, `CP-25` | Registro de pedidos contado/crédito, bonificaciones por volumen, repuestos Hyundai sin promo, ventas multi-ítem de mantenimiento y casos trampa de competencia. |
| **2** | Condiciones Especiales, Políticas y B2B | `CP-02`, `CP-05`, `CP-13`, `CP-17`, `CP-18`, `CP-24`, `CP-28` | Listas de precio diferenciadas (Oficina, 1, 2, 3, EC), crédito corporativo (45/60 días), trampas de línea suspendida y control de descuento estratégico excesivo. |
| **3** | Políticas Promocionales, Bonificaciones y Escalas | `CP-03`, `CP-07`, `CP-14`, `CP-19`, `CP-30` | Escalas escalonadas de descuento por tramos volumétricos (Michelin), exclusión mutua de promociones combo y consulta de documentos electrónicos. |
| **4** | Gestión de Ruta, Visitas, GPS y Contingencias | `CP-08`, `CP-09`, `CP-10`, `CP-22`, `CP-27` | Historial de visitas, bypass GPS para visitas telefónicas, contingencia por falla de satélite en zonas remotas y alta de clientes fuera de ruta. |
| **5** | Cobranzas, SUNAT, Liquidación y Cierre | `CP-11`, `CP-16`, `CP-21`, `CP-23`, `CP-26`, `CP-29` | Cobranza multimoneda fraccionada (Soles + Dólares + Depósito), retención de SUNAT (3%) en facturas > S/. 700, auditoría morosa y balance de liquidación diaria. |

---

## ⚙️ Ejecución y Pruebas

### Iniciar la Plataforma:
```bash
npm start
```
El servidor arrancará en `http://localhost:3000` y mostrará automáticamente la dirección IP de red local para pruebas desde smartphones físicos (ej. `http://192.168.1.XX:3000`).

### Ejecutar Suite de Pruebas:
```bash
npm test
```
Ejecuta las pruebas unitarias y de integración end-to-end con el test runner nativo de Node.js (`node --test`).
