# REQUISITOS DEL MVP

# 1. Objetivo del MVP

El MVP deberá permitir que un usuario:

1. Reciba un caso de evaluación.
2. Lea el escenario e instrucciones.
3. Ingrese al simulador de UYAPAY B2C.
4. Ejecute las acciones necesarias para resolver el caso.
5. Sea evaluado automáticamente según las acciones realizadas.
6. Obtenga un puntaje.
7. Visualice su resultado y tiempo de resolución.
8. Quede registrado en un ranking general.

La arquitectura deberá permitir posteriormente incorporar **nuevas reglas de puntuación, evaluaciones periódicas, insignias, puntaje acumulado, feedback avanzado y otros criterios de ranking**, sin reconstruir el núcleo del evaluador.

---

# 2. Requisitos funcionales

## A. Gestión de casos

| ID | Requisito | Descripción | Prioridad |
| --- | --- | --- | --- |
| **RF-MVP-001** | Registro de casos | El sistema deberá permitir definir los casos que serán utilizados en las evaluaciones. | Crítica |
| **RF-MVP-002** | Identificación del caso | Cada caso deberá contar con un identificador único. | Alta |
| **RF-MVP-003** | Escenario | Cada caso deberá contener una descripción del escenario que el usuario debe resolver. | Crítica |
| **RF-MVP-004** | Instrucciones | Cada caso deberá contener las instrucciones necesarias para su resolución. | Crítica |
| **RF-MVP-005** | Acciones esperadas | Cada caso deberá tener configuradas las acciones que el usuario debe ejecutar para resolverlo. | Crítica |
| **RF-MVP-006** | Secuencia de acciones | Las acciones de un caso podrán establecer una secuencia o flujo esperado. | Alta |
| **RF-MVP-007** | Caso activo/inactivo | El sistema deberá permitir determinar si un caso está disponible para evaluación. | Media |

### Estructura conceptual

Cada caso debería poder representarse aproximadamente así:

```
CASO 001
│
├── Escenario
├── Instrucciones
│
├── Paso 1 → Acción esperada
├── Paso 2 → Acción esperada
├── Paso 3 → Acción esperada
├── Paso 4 → Acción esperada
│
└── Resultado esperado
```

Esto es importante porque **no deberías programar la solución de cada caso directamente en el código**. El caso debe ser información/configuración que consume el evaluador.

---

# 3. Simulador UYAPAY B2C

| ID | Requisito | Descripción | Prioridad |
| --- | --- | --- | --- |
| **RF-MVP-008** | Simulador navegable | El sistema deberá proporcionar una réplica web navegable de los flujos de UYAPAY B2C incluidos en el alcance del MVP. | Crítica |
| **RF-MVP-009** | Pantallas | El simulador deberá disponer de las pantallas necesarias para ejecutar los casos definidos. | Crítica |
| **RF-MVP-010** | Navegación | El usuario deberá poder desplazarse entre las pantallas correspondientes al flujo evaluado. | Crítica |
| **RF-MVP-011** | Acciones simuladas | El usuario deberá poder ejecutar las acciones necesarias dentro del simulador. | Crítica |
| **RF-MVP-012** | Datos simulados | El simulador deberá utilizar datos de prueba necesarios para ejecutar los casos. | Alta |
| **RF-MVP-013** | Estados | El simulador deberá mantener el estado necesario durante la ejecución de un caso. | Alta |
| **RF-MVP-014** | Eventos evaluables | Las acciones relevantes ejecutadas por el usuario deberán generar eventos identificables por el evaluador. | Crítica |
| **RF-MVP-015** | Flujo completo | El usuario deberá poder completar un caso de inicio a fin dentro del simulador. | Crítica |

### Regla fundamental

El simulador **no debe conocer la lógica de puntuación**.

Debe hacer algo conceptualmente similar a:

```
Usuario hace clic en "Confirmar pedido"
             ↓
Simulador registra evento
             ↓
"EJECUTAR_CONFIRMACION_PEDIDO"
             ↓
Evaluador recibe evento
             ↓
Valida contra el caso
             ↓
Genera resultado
```

Esto desacopla el simulador del sistema de evaluación.

---

# 4. Ejecución de evaluaciones

| ID | Requisito | Descripción | Prioridad |
| --- | --- | --- | --- |
| **RF-MVP-016** | Iniciar evaluación | El sistema deberá permitir iniciar una evaluación asociada a un usuario. | Crítica |
| **RF-MVP-017** | Asignar caso | El sistema deberá asignar uno o más casos al usuario según la configuración de la evaluación. | Crítica |
| **RF-MVP-018** | Mostrar instrucciones | Antes de comenzar, el sistema deberá mostrar el escenario e instrucciones del caso. | Crítica |
| **RF-MVP-019** | Inicio de cronómetro | El sistema deberá registrar el momento de inicio de resolución del caso. | Alta |
| **RF-MVP-020** | Registro de acciones | El sistema deberá registrar las acciones ejecutadas durante la resolución. | Crítica |
| **RF-MVP-021** | Validación de acciones | El sistema deberá determinar si las acciones realizadas corresponden a las esperadas. | Crítica |
| **RF-MVP-022** | Registro de errores | El sistema deberá registrar las acciones incorrectas o no esperadas. | Alta |
| **RF-MVP-023** | Finalizar caso | El sistema deberá detectar o permitir indicar la finalización del caso. | Crítica |
| **RF-MVP-024** | Detener cronómetro | Al finalizar el caso deberá registrarse el tiempo total de resolución. | Alta |
| **RF-MVP-025** | Resultado del caso | El sistema deberá generar un resultado para cada caso completado. | Crítica |

---

# 5. Motor de evaluación y puntuación

Aquí está la parte más importante para que **no tengas que reemplazar el MVP**.

En lugar de construir:

> "Si pasa esto, suma 20 puntos".
> 

Conviene construir un **motor de reglas configurable**.

| ID | Requisito | Descripción | Prioridad |
| --- | --- | --- | --- |
| **RF-MVP-026** | Motor de evaluación | El sistema deberá contar con un componente independiente encargado de evaluar las acciones realizadas. | Crítica |
| **RF-MVP-027** | Reglas de evaluación | El sistema deberá poder asociar reglas de evaluación a los casos. | Crítica |
| **RF-MVP-028** | Acción correcta | El motor deberá identificar cuando una acción coincide con una acción esperada. | Crítica |
| **RF-MVP-029** | Acción incorrecta | El motor deberá identificar acciones que no corresponden al flujo esperado. | Crítica |
| **RF-MVP-030** | Acción omitida | El motor deberá poder identificar acciones esperadas que no fueron ejecutadas. | Alta |
| **RF-MVP-031** | Resultado por acción | Cada acción evaluada deberá generar un resultado que pueda ser utilizado para calcular el puntaje. | Alta |
| **RF-MVP-032** | Cálculo de puntaje | El sistema deberá calcular el puntaje final a partir de los resultados de las acciones. | Crítica |
| **RF-MVP-033** | Escala de puntuación | La escala utilizada para el puntaje deberá estar definida como una regla configurable y no como lógica fija de cada pantalla. | Crítica |
| **RF-MVP-034** | Tiempo | El motor deberá conservar el tiempo de resolución como variable independiente del puntaje. | Alta |
| **RF-MVP-035** | Resultado final | El sistema deberá almacenar el puntaje final, tiempo y resultado de la evaluación. | Crítica |

### Ejemplo de configuración

En vez de programarlo directamente:

```
Confirmar pedido = 20 puntos
```

La estructura podría ser:

```
Regla:
    evento: CONFIRMAR_PEDIDO
    condición: acción_correcta
    puntuación: +20
```

Y posteriormente podrías cambiarla a:

```
Regla:
    evento: CONFIRMAR_PEDIDO
    condición: acción_correcta
    puntuación: +10
    módulo: PEDIDOS
    dificultad: MEDIA
```

**sin modificar el simulador.**

---

# 6. Resultados

| ID | Requisito | Descripción | Prioridad |
| --- | --- | --- | --- |
| **RF-MVP-036** | Resultado individual | El usuario deberá poder visualizar el resultado de su evaluación. | Alta |
| **RF-MVP-037** | Puntaje obtenido | El resultado deberá mostrar el puntaje obtenido. | Crítica |
| **RF-MVP-038** | Tiempo obtenido | El resultado deberá mostrar el tiempo utilizado. | Alta |
| **RF-MVP-039** | Acciones correctas | El resultado podrá mostrar la cantidad de acciones correctas. | Alta |
| **RF-MVP-040** | Errores | El resultado deberá conservar la cantidad de acciones incorrectas. | Alta |
| **RF-MVP-041** | Historial | El sistema deberá conservar las evaluaciones realizadas por cada usuario. | Crítica |

---

# 7. Ranking MVP

Aquí también evitaría construir un ranking desechable.

| ID | Requisito | Descripción | Prioridad |
| --- | --- | --- | --- |
| **RF-MVP-042** | Ranking general | El sistema deberá generar un ranking de los usuarios evaluados. | Alta |
| **RF-MVP-043** | Orden por puntuación | El ranking deberá ordenar inicialmente por mayor puntuación. | Crítica |
| **RF-MVP-044** | Desempate por tiempo | En caso de empate, podrá utilizarse el menor tiempo de resolución como segundo criterio. | Alta |
| **RF-MVP-045** | Posición | El sistema deberá determinar la posición de cada usuario. | Alta |
| **RF-MVP-046** | Podio | El sistema deberá permitir destacar los tres primeros puestos. | Media |
| **RF-MVP-047** | Actualización | El ranking deberá actualizarse automáticamente al registrar nuevos resultados. | Alta |

### Y aquí viene la decisión arquitectónica importante:

El ranking no debería guardar:

```
Juan = posición 1
Pedro = posición 2
Luis = posición 3
```

Debería guardar los **resultados**, y calcular la posición:

```
RESULTADOS
    ↓
Puntaje
    ↓
Tiempo
    ↓
Ordenamiento
    ↓
Ranking
```

Así, cuando después agregues nuevas reglas, el ranking se recalcula.

---

# 8. Requisitos no funcionales

## Arquitectura

| ID | Requisito | Descripción |
| --- | --- | --- |
| **RNF-MVP-001** | Arquitectura modular | El simulador, evaluador, puntuación y ranking deberán estar desacoplados funcionalmente. |
| **RNF-MVP-002** | Escalabilidad funcional | La arquitectura deberá permitir agregar nuevos casos sin modificar la estructura principal del evaluador. |
| **RNF-MVP-003** | Extensibilidad | Deberá ser posible incorporar nuevas reglas de puntuación posteriormente. |
| **RNF-MVP-004** | Reutilización | Los componentes del evaluador deberán poder reutilizarse para futuras evaluaciones. |
| **RNF-MVP-005** | Configuración | Las reglas, casos y criterios que razonablemente puedan cambiar deberán manejarse como datos/configuración y no como valores fijos en el código. |

## Seguridad

| ID | Requisito |
| --- | --- |
| **RNF-MVP-006** | El acceso a la evaluación deberá requerir autenticación. |
| **RNF-MVP-007** | Cada evaluación deberá estar asociada a un usuario identificado. |
| **RNF-MVP-008** | Un usuario no deberá poder modificar directamente su puntaje o resultado desde el frontend. |
| **RNF-MVP-009** | Los resultados deberán validarse y almacenarse desde el backend. |

## Datos y trazabilidad

| ID | Requisito |
| --- | --- |
| **RNF-MVP-010** | Las interacciones realizadas durante una evaluación deberán conservarse en la base de datos. |
| **RNF-MVP-011** | Cada interacción deberá estar asociada al usuario, evaluación y caso correspondiente. |
| **RNF-MVP-012** | Los resultados deberán conservarse para consulta histórica. |
| **RNF-MVP-013** | Deberá registrarse fecha y hora de inicio y finalización de la evaluación. |

## Usabilidad

| ID | Requisito |
| --- | --- |
| **RNF-MVP-014** | La interfaz deberá ser sencilla y orientada a la ejecución de la evaluación. |
| **RNF-MVP-015** | El usuario deberá poder identificar claramente el caso, instrucciones, progreso y resultado. |
| **RNF-MVP-016** | El simulador deberá mantener una experiencia consistente con los flujos principales de UYAPAY B2C. |
| **RNF-MVP-017** | La aplicación deberá funcionar desde navegador web sin requerir instalación. |

---

# 9. Modelo de datos mínimo

Para construirlo correctamente, yo partiría al menos de estas entidades:

```
USUARIO
   │
   └── EVALUACIÓN
          │
          ├── CASO
          │     │
          │     └── ACCIONES ESPERADAS
          │
          ├── INTERACCIONES REALIZADAS
          │
          └── RESULTADO
                 ├── PUNTAJE
                 └── TIEMPO
```

Y conceptualmente:

| Entidad | Propósito |
| --- | --- |
| **Usuario** | Persona que realiza la evaluación. |
| **Caso** | Escenario que debe resolver. |
| **Paso/Acción esperada** | Acciones necesarias para resolver el caso. |
| **Evaluación** | Instancia de un usuario ejecutando uno o varios casos. |
| **Interacción** | Acción efectivamente ejecutada por el usuario. |
| **Regla de evaluación** | Define cómo interpretar una acción. |
| **Resultado** | Resultado de un caso/evaluación. |
| **Puntuación** | Puntos obtenidos. |
| **Ranking** | Vista calculada a partir de los resultados. |