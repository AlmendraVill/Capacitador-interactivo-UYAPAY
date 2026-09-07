# Capacitador Interactivo UYAPAY (B2C)

Plataforma web interactiva para la capacitación, simulación móvil y evaluación práctica de asesores de ventas de **UYAPAY**.

---

## 📁 Estructura del Proyecto

El proyecto está modularizado siguiendo las mejores prácticas de separación de responsabilidades (*Separation of Concerns*):

```text
Capacitador-interactivo-UYAPAY/
├── css/
│   ├── styles.css           # Estilos de la plataforma web, ranking, podio y monitor
│   └── simulator.css        # Estilos del simulador móvil nativo (smartphone)
├── js/
│   ├── data/
│   │   ├── users.js         # Catálogo de usuarios y perfiles predeterminados
│   │   └── cases.js         # Catálogo de los 15 casos prácticos y reglas desacopladas
│   ├── services/
│   │   ├── storage.js       # Servicio de persistencia y cálculo del Ranking General
│   │   ├── evaluator.js     # Motor de evaluación desacoplado y cronómetro en vivo
│   │   └── auth.js          # Servicio de autenticación y sesiones
│   ├── portal.js            # Controlador principal de la plataforma web
│   └── simulator.js         # Controlador del simulador móvil (emisor de eventos)
├── index.html               # Vista principal (Portal web, Dashboard, Podio y Evaluación)
├── simulator.html           # Vista del simulador de la aplicación móvil UYAPAY
├── Casos de Prueba...md     # Catálogo de los 15 casos de negocio reales
├── Flujos de Resolución...md# Secuencia paso a paso según el Manual UYAPAY 2025
├── REQUISITOS DEL MVP.md    # Especificación formal de requisitos del MVP
└── README.md                # Documentación del sistema
```

---

## 🚀 Características Principales del MVP

1. **Simulador Móvil Desacoplado (RF-MVP-008 a 015):**
   - Emula la app móvil UYAPAY en un marco de smartphone realista.
   - El simulador no conoce la lógica de puntuación: emite eventos (`SIMULATOR_EVENT`) y reacciona a las directivas del evaluador.

2. **Motor de Evaluación Independiente (RF-MVP-026 a 035):**
   - Audita en tiempo real las acciones contra las reglas del caso activo.
   - Maneja el control estricto de errores, omisiones y casos trampa.
   - Calcula la calificación en escala vigesimal (0 a 20) según penalizaciones configurables.

3. **Cronómetro en Tiempo Real (RF-MVP-019/024/034):**
   - Cronómetro visual activo en la cabecera durante toda la evaluación (`⏱️ MM:SS`).
   - Registra el tiempo exacto de resolución como criterio clave de desempate.

4. **Ranking General & Podio (RF-MVP-042 a 047):**
   - Vista disponible para Administrador y Asesores.
   - **Podio Top 3** con medallas y tarjetas destacadas (🥇 Oro, 🥈 Plata, 🥉 Bronce).
   - Tabla oficial de posiciones calculada dinámicamente:
     1. Mayor puntuación.
     2. Menor tiempo de resolución (desempate).
     3. Menor cantidad de errores.

5. **Monitor en Vivo para el Administrador:**
   - Visualización en tiempo real del asesor evaluado, paso actual y errores acumulados.
   - Live Feed de auditoría de cada clic e interacción.

6. **Persistencia de Datos (`localStorage`):**
   - Conserva usuarios, notas, tiempos y resultados históricos de forma automática.

---

## 👥 Usuarios de Prueba

| Usuario | Contraseña | Rol | Acceso |
|---|---|---|---|
| `admin` | *(opcional)* `admin` | Administrador | Dashboard, Monitor en vivo, Ranking y Podio, Historial |
| `alvaro` | *(opcional)* `123` | Asesor | Evaluación práctica, Ranking y Podio, Mis calificaciones |
| `maria` | *(opcional)* `123` | Asesor | Evaluación práctica, Ranking y Podio, Mis calificaciones |
| `carlos` | *(opcional)* `123` | Asesor | Evaluación práctica, Ranking y Podio, Mis calificaciones |

---

## 🧩 Catálogo de 15 Casos de Negocio

El sistema incluye el catálogo completo de 15 casos definidos en los documentos de negocio:
- **Ventas con Promociones (Regalo / Descuento):** Casos 1, 2, 9, 10, 14.
- **Ventas B2B y Repuestos (Sin promo):** Casos 3, 12.
- **Casos Trampa (Procesos y omisiones críticas):** Casos 4 (Tracking solo foto), 5 (Cobranza sin consolidar), 13 (Condición mal aplicada).
- **Consultas Operativas:** Casos 6 (Notas de crédito), 7 (Estado de cuenta), 8 (Seguimiento de pedidos), 11 (Alta de cliente), 15 (Historial previo).
