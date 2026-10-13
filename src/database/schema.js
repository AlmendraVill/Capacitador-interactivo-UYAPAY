/**
 * Esquema de Base de Datos Relacional y Migraciones SQLite
 * Cumple con Requisitos.pdf (16 entidades principales, RNF-005, RNF-008, RNF-010).
 */

function initDatabaseSchema(db) {
  // 1. Ampliación segura de la tabla users existente
  try {
    db.exec("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active';");
  } catch (e) {
    // Ya existe la columna
  }

  try {
    db.exec("ALTER TABLE users ADD COLUMN email TEXT;");
  } catch (e) {
    // Ya existe la columna
  }

  // 2. Creación de las tablas para las 16 entidades
  db.exec(`
    -- Roles del sistema (ACC-03, RF-006, RF-048)
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT
    );

    -- Asignación multi-rol a usuarios (M:N)
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id TEXT NOT NULL,
      role_id TEXT NOT NULL,
      PRIMARY KEY (user_id, role_id)
    );

    -- Módulos de capacitación (CAP-01, RF-007, RF-008)
    CREATE TABLE IF NOT EXISTS modules (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      order_num INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active'
    );

    -- Asociación de módulos con roles con acceso (M:N)
    CREATE TABLE IF NOT EXISTS module_roles (
      module_id TEXT NOT NULL,
      role_id TEXT NOT NULL,
      PRIMARY KEY (module_id, role_id)
    );

    -- Biblioteca de videos de capacitación (CAP-01, RF-008, RF-042)
    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      module_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      video_url TEXT NOT NULL,
      duration_seconds INTEGER DEFAULT 0,
      order_num INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active'
    );

    -- Cuestionarios asociados a videos / temas (CAP-02, RF-010)
    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      video_id TEXT NOT NULL,
      title TEXT NOT NULL,
      min_pass_score INTEGER DEFAULT 14
    );

    -- Banco de preguntas para cuestionarios y evaluaciones rápidas (ADM-02, RF-010, RF-043)
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL,
      question_text TEXT NOT NULL,
      explanation TEXT
    );

    -- Alternativas de cada pregunta (con indicador de respuesta correcta)
    CREATE TABLE IF NOT EXISTS question_options (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL,
      option_text TEXT NOT NULL,
      is_correct INTEGER NOT NULL
    );

    -- Registro histórico de cuestionarios rendidos por usuarios (RF-011, RF-012)
    CREATE TABLE IF NOT EXISTS quiz_submissions (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      max_score INTEGER NOT NULL,
      passed INTEGER NOT NULL,
      answers_json TEXT,
      submitted_at TEXT NOT NULL
    );

    -- Preguntas frecuentes / FAQ operativas (CAP-05, ADM-04, RF-017, RF-045)
    CREATE TABLE IF NOT EXISTS faqs (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      order_num INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active'
    );

    -- Reglas de negocio operativas de UYAPAY B2C (CAP-06, RF-018, RF-046)
    CREATE TABLE IF NOT EXISTS business_rules (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      order_num INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active'
    );

    -- Catálogo de insignias de desempeño (SEG-03, RF-038)
    CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      criteria TEXT NOT NULL
    );

    -- Insignias asignadas a usuarios (RF-038, RF-039)
    CREATE TABLE IF NOT EXISTS user_badges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      badge_id TEXT NOT NULL,
      awarded_at TEXT NOT NULL,
      UNIQUE(user_id, badge_id)
    );

    -- Acumulado histórico de puntajes (SEG-01, SEG-02, RF-036, RF-037)
    CREATE TABLE IF NOT EXISTS user_scores (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      source_type TEXT NOT NULL, -- 'EVALUATION', 'QUIZ', 'ONBOARDING'
      source_id TEXT,
      points INTEGER NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL
    );

    -- Evaluaciones periódicas y obligatorias (EVA-09, EVA-10, ADM-06, RF-030 a RF-033)
    CREATE TABLE IF NOT EXISTS scheduled_evaluations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      frequency TEXT NOT NULL, -- 'quincenal', 'mensual', 'unica'
      is_mandatory INTEGER DEFAULT 1,
      next_due_date TEXT,
      status TEXT DEFAULT 'active'
    );

    -- Catálogo administrable de casos de prueba (EVA-01, ADM-03, RF-019, RF-044)
    CREATE TABLE IF NOT EXISTS evaluation_cases (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      module_code TEXT,
      client_name TEXT,
      instructions TEXT,
      scoring_json TEXT,
      rules_json TEXT,
      status TEXT DEFAULT 'active'
    );

    -- Persistencia del Onboarding Interactivo de 7 Hitos (Flujo 5 PRDv2)
    CREATE TABLE IF NOT EXISTS user_onboarding (
      user_id TEXT PRIMARY KEY,
      completed_tasks_json TEXT NOT NULL DEFAULT '[]',
      exam_unlocked INTEGER NOT NULL DEFAULT 0,
      exam_passed INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    -- Persistencia granular de sesión activa del simulador móvil ante recargas / F5 (Flujo 6 PRDv2)
    CREATE TABLE IF NOT EXISTS simulator_sessions (
      user_id TEXT PRIMARY KEY,
      current_case_code TEXT,
      cases_progress_json TEXT NOT NULL DEFAULT '[]',
      active_tab_index INTEGER DEFAULT 0,
      elapsed_seconds INTEGER DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    -- Asignaciones de evaluación y Gatekeeper de bloqueo/desbloqueo (Algoritmo 3 PRDv2)
    CREATE TABLE IF NOT EXISTS evaluation_assignments (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      evaluation_type TEXT NOT NULL DEFAULT 'SIMULADOR',
      scheduled_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDIENTE',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Eventos del Calendario de Evaluaciones (Flujo 12 PRDv2)
    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      evaluation_type TEXT NOT NULL DEFAULT 'SIMULADOR', -- 'SIMULADOR' o 'CUESTIONARIO'
      level TEXT DEFAULT 'basico', -- 'basico', 'intermedio', 'avanzado'
      questionnaire_id TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      assigned_users_json TEXT NOT NULL DEFAULT '[]',
      created_by TEXT,
      created_at TEXT NOT NULL
    );

    -- Banco Institucional de Cuestionarios Teóricos (Google Forms Style - Flujo 12 PRDv2)
    CREATE TABLE IF NOT EXISTS theoretical_questionnaires (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      duration_minutes INTEGER DEFAULT 20,
      xp_reward INTEGER DEFAULT 50,
      questions_json TEXT NOT NULL DEFAULT '[]',
      created_by TEXT,
      created_at TEXT NOT NULL
    );

    -- Sumisiones y Auditoría Forense de Cuestionarios Teóricos
    CREATE TABLE IF NOT EXISTS theoretical_submissions (
      id TEXT PRIMARY KEY,
      questionnaire_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      numeric_score REAL NOT NULL,
      passed INTEGER NOT NULL,
      xp_earned INTEGER NOT NULL,
      answers_json TEXT NOT NULL DEFAULT '[]',
      duration_seconds INTEGER DEFAULT 0,
      submitted_at TEXT NOT NULL
    );
  `);

  // 3. Sembrado de datos iniciales esenciales (Seed Data)
  seedInitialData(db);
}

function seedInitialData(db) {
  // A. Roles Oficiales (Participante, Editor, Facilitador, Administrador)
  const roleCount = db.prepare('SELECT COUNT(*) as count FROM roles').get().count;
  if (roleCount === 0) {
    const roles = [
      { id: 'rol-admin', code: 'admin', name: 'Administrador', description: 'Acceso total y configuración de la plataforma' },
      { id: 'rol-facilitador', code: 'facilitador', name: 'Facilitador / Supervisor', description: 'Monitoreo en vivo, reportes de desempeño y auditoría' },
      { id: 'rol-editor', code: 'editor', name: 'Editor de Contenidos', description: 'Gestión de videos, FAQs, reglas de negocio y preguntas' },
      { id: 'rol-participante', code: 'participante', name: 'Participante (Asesor)', description: 'Acceso a capacitaciones, simulador y evaluaciones prácticas' }
    ];
    const insertRole = db.prepare('INSERT INTO roles (id, code, name, description) VALUES (?, ?, ?, ?)');
    roles.forEach(r => insertRole.run(r.id, r.code, r.name, r.description));
  }

  // B. Sincronizar roles de los usuarios existentes
  const allUsers = db.prepare('SELECT id, username, role FROM users').all();
  const insertUserRole = db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)');
  
  for (const u of allUsers) {
    if (u.role === 'admin') {
      insertUserRole.run(u.id, 'rol-admin');
      insertUserRole.run(u.id, 'rol-facilitador');
      insertUserRole.run(u.id, 'rol-editor');
    } else {
      insertUserRole.run(u.id, 'rol-participante');
    }
  }

  // C. Módulos Temáticos Oficiales
  const moduleCount = db.prepare('SELECT COUNT(*) as count FROM modules').get().count;
  if (moduleCount === 0) {
    const modules = [
      { id: 'mod-01', code: 'VENTAS', title: 'Ventas y Toma de Pedidos B2C', description: 'Configuración comercial, pedidos contado/crédito, bonificaciones y regalos.', icon: '🛒', order_num: 1 },
      { id: 'mod-02', code: 'COBRANZAS', title: 'Cobranzas y Liquidación de Ruta', description: 'Cobranzas mixtas (efectivo + voucher), recibos provisionales y arqueo diario.', icon: '💰', order_num: 2 },
      { id: 'mod-03', code: 'RUTA_GPS', title: 'Gestión de Ruta, GPS y Tareas', description: 'Plan de visitas, geocerca de 50m, bypass justificado y tareas T1 a T5.', icon: '📍', order_num: 3 },
      { id: 'mod-04', code: 'POLITICAS', title: 'Políticas Comerciales y Promociones', description: 'Listas de precios Oficina/1/2/3/4 y exclusión mutua de promociones combo.', icon: '🏷️', order_num: 4 },
      { id: 'mod-05', code: 'DOCUMENTOS', title: 'Documentos Electrónicos y Cartera', description: 'Consulta de facturas electrónicas, notas de crédito y estados de cuenta.', icon: '📄', order_num: 5 }
    ];

    const insertModule = db.prepare('INSERT INTO modules (id, code, title, description, icon, order_num) VALUES (?, ?, ?, ?, ?, ?)');
    modules.forEach(m => insertModule.run(m.id, m.code, m.title, m.description, m.icon, m.order_num));

    // Todos los roles tienen acceso a los módulos por defecto
    const insertModuleRole = db.prepare('INSERT OR IGNORE INTO module_roles (module_id, role_id) VALUES (?, ?)');
    modules.forEach(m => {
      insertModuleRole.run(m.id, 'rol-participante');
      insertModuleRole.run(m.id, 'rol-facilitador');
      insertModuleRole.run(m.id, 'rol-admin');
    });
  }

  // D. Biblioteca de Videos y Cuestionarios de Refuerzo (CAP-01, CAP-02)
  const videoCount = db.prepare('SELECT COUNT(*) as count FROM videos').get().count;
  if (videoCount === 0) {
    const initialVideos = [
      {
        id: 'vid-01',
        module_id: 'mod-01',
        title: 'Toma de Pedidos y Selección de Listas de Precios',
        description: 'Aprende a configurar la condición de pago (contado o crédito), lista de precios correcta y selección de productos Shell y Michelin.',
        video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        duration_seconds: 180,
        order_num: 1,
        quiz: {
          id: 'quiz-01',
          title: 'Cuestionario de Refuerzo: Toma de Pedidos',
          questions: [
            {
              id: 'q-01-1',
              text: '¿Cuál es el porcentaje de descuento comercial aplicado a ventas con condición Contado?',
              options: [
                { text: '5% de descuento', is_correct: 1 },
                { text: '3% de descuento', is_correct: 0 },
                { text: '10% de descuento', is_correct: 0 }
              ],
              explanation: 'Las ventas al contado gozan de un 5% de descuento oficial en UYAPAY B2C.'
            },
            {
              id: 'q-01-2',
              text: 'Para un cliente nuevo sin historial crediticio que realiza su primera compra, ¿qué lista se debe aplicar?',
              options: [
                { text: 'Lista Oficina', is_correct: 1 },
                { text: 'Lista 3 (Mayorista)', is_correct: 0 },
                { text: 'Lista B2B corporativa', is_correct: 0 }
              ],
              explanation: 'Los clientes nuevos inician obligatoriamente con Lista Oficina.'
            },
            {
              id: 'q-01-3',
              text: 'Si el cliente solicita un producto pero no está presente el decisor para firmar la compra, ¿qué documento corresponde generar?',
              options: [
                { text: 'Guardar como Cotización (Tipo 3)', is_correct: 1 },
                { text: 'Emitir Orden de Compra definitiva', is_correct: 0 },
                { text: 'Registrar un cobro por adelantado', is_correct: 0 }
              ],
              explanation: 'Las cotizaciones Tipo 3 no comprometen inventario ni línea de crédito cuando falta la autorización del decisor.'
            }
          ]
        }
      },
      {
        id: 'vid-02',
        module_id: 'mod-02',
        title: 'Gestión de Cobranzas y Arqueo Diario',
        description: 'Procedimiento de cobranza mixta, registro fotográfico de vouchers y liquidación de cierre de ruta.',
        video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        duration_seconds: 210,
        order_num: 2,
        quiz: {
          id: 'quiz-02',
          title: 'Cuestionario de Refuerzo: Cobranzas y Liquidación',
          questions: [
            {
              id: 'q-02-1',
              text: 'Al registrar un pago con depósito bancario, ¿qué requisito es obligatorio para validar el cobro?',
              options: [
                { text: 'Fotografía legible del voucher bancario', is_correct: 1 },
                { text: 'Firma manual en un papel suelto', is_correct: 0 },
                { text: 'Llamar al gerente comercial', is_correct: 0 }
              ],
              explanation: 'Todo depósito bancario exige comprobante fotográfico para su conciliación en tesorería.'
            },
            {
              id: 'q-02-2',
              text: '¿Es suficiente con registrar los cobros individuales en el móvil para cerrar la jornada?',
              options: [
                { text: 'No, es obligatorio realizar el Consolidado de Cobranza', is_correct: 1 },
                { text: 'Sí, los cobros se transmiten automáticamente sin consolidar', is_correct: 0 },
                { text: 'Solo si el cobro fue en efectivo', is_correct: 0 }
              ],
              explanation: 'El consolidado de cobranza es el paso formal indispensable para la validación central.'
            },
            {
              id: 'q-02-3',
              text: 'En una cobranza mixta de USD 350 (USD 200 efectivo + USD 150 depósito), ¿cuántos recibos provisionales se emiten?',
              options: [
                { text: '2 recibos provisionales (uno por cada modalidad)', is_correct: 1 },
                { text: '1 solo recibo global', is_correct: 0 },
                { text: 'No se emiten recibos', is_correct: 0 }
              ],
              explanation: 'Cada medio de pago genera su propio recibo provisional con su trazabilidad de pago.'
            }
          ]
        }
      },
      {
        id: 'vid-03',
        module_id: 'mod-03',
        title: 'Ruta, Geocercas GPS y Visitas Telefónicas',
        description: 'Reglas de geolocalización a 50 metros y uso ético y auditado de la visita telefónica.',
        video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        duration_seconds: 160,
        order_num: 3,
        quiz: {
          id: 'quiz-03',
          title: 'Cuestionario de Refuerzo: Geocerca y Visita Telefónica',
          questions: [
            {
              id: 'q-03-1',
              text: '¿Cuál es el radio máximo permitido por la geocerca para iniciar una visita presencial normal?',
              options: [
                { text: '50 metros del punto registrado', is_correct: 1 },
                { text: '500 metros', is_correct: 0 },
                { text: '1 kilómetro', is_correct: 0 }
              ],
              explanation: 'La geocerca móvil oficial de UYAPAY B2C valida presencia en un radio de 50 metros.'
            },
            {
              id: 'q-03-2',
              text: 'Si estás a 250 metros del cliente y debes atenderlo, ¿cuál es la acción correcta?',
              options: [
                { text: 'Activar la modalidad de Visita Telefónica justificada', is_correct: 1 },
                { text: 'Falsear la ubicación GPS con aplicaciones externas', is_correct: 0 },
                { text: 'Ignorar la visita y retirarse', is_correct: 0 }
              ],
              explanation: 'La visita telefónica permite registrar la atención comercial de forma transparente y auditada.'
            },
            {
              id: 'q-03-3',
              text: 'Si el cliente está ocupado descargando mercadería y no realiza pedido, ¿cómo se cierra la tarea?',
              options: [
                { text: 'Justificar tarea con motivo: Cliente muy ocupado', is_correct: 1 },
                { text: 'Generar un pedido ficticio para completar la cuota', is_correct: 0 },
                { text: 'Dejar la visita abierta indefinidamente', is_correct: 0 }
              ],
              explanation: 'El cierre formal de tareas con justificación mantiene el 100% de cumplimiento de ruta sin faltas éticas.'
            }
          ]
        }
      }
    ];

    const insertVideo = db.prepare(`
      INSERT INTO videos (id, module_id, title, description, video_url, duration_seconds, order_num)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertQuiz = db.prepare(`
      INSERT INTO quizzes (id, video_id, title, min_pass_score)
      VALUES (?, ?, ?, ?)
    `);
    const insertQuestion = db.prepare(`
      INSERT INTO questions (id, quiz_id, question_text, explanation)
      VALUES (?, ?, ?, ?)
    `);
    const insertOption = db.prepare(`
      INSERT INTO question_options (id, question_id, option_text, is_correct)
      VALUES (?, ?, ?, ?)
    `);

    for (const v of initialVideos) {
      insertVideo.run(v.id, v.module_id, v.title, v.description, v.video_url, v.duration_seconds, v.order_num);
      if (v.quiz) {
        insertQuiz.run(v.quiz.id, v.id, v.quiz.title, 14);
        for (const q of v.quiz.questions) {
          insertQuestion.run(q.id, v.quiz.id, q.text, q.explanation);
          for (let i = 0; i < q.options.length; i++) {
            const opt = q.options[i];
            insertOption.run(`${q.id}-opt-${i}`, q.id, opt.text, opt.is_correct);
          }
        }
      }
    }
  }

  // E. Preguntas Frecuentes (FAQs) Operativas (CAP-05, RF-017)
  const faqCount = db.prepare('SELECT COUNT(*) as count FROM faqs').get().count;
  if (faqCount === 0) {
    const faqs = [
      {
        id: 'faq-01',
        category: 'Geolocalización y GPS',
        question: '¿Qué hacer si me encuentro a más de 50 metros del cliente?',
        answer: 'La app UYAPAY valida un radio de 50 metros. Si la atención es a distancia o el cliente cambió de punto de atención, debes activar la opción de "Visita Telefónica", la cual registra la gestión sin penalización por geolocalización.'
      },
      {
        id: 'faq-02',
        category: 'Condiciones Comerciales',
        question: '¿Cuáles son los descuentos comerciales por condición de pago?',
        answer: '• Contado: 5% de descuento\n• Crédito 15 días: 4% de descuento\n• Crédito 30 días: 3% de descuento\n• Crédito 45 días: 2% de descuento\n• Crédito 60 días: 1% de descuento'
      },
      {
        id: 'faq-03',
        category: 'Promociones y Regalos',
        question: '¿Puedo aplicar dos promociones del mismo combo a un pedido?',
        answer: 'No. Las promociones del mismo grupo o paquete son mutuamente excluyentes (por ejemplo: descuento por volumen vs. regalo de botellas). Aplicar ambas provocará un error de validación comercial.'
      },
      {
        id: 'faq-04',
        category: 'Cobranzas',
        question: '¿Cómo procedo si el cliente realiza un pago mixto (efectivo y transferencia)?',
        answer: 'Debes registrar dos recibos provisionales independientes: uno para el monto en efectivo y otro para el depósito bancario. El depósito requiere obligatoriamente tomar o adjuntar la fotografía del voucher de la transacción.'
      },
      {
        id: 'faq-05',
        category: 'Ventas y Cotizaciones',
        question: '¿Cuándo se debe usar una Cotización Tipo 3 en lugar de un Pedido definitivo?',
        answer: 'Se utiliza cuando se presenta una propuesta comercial formal pero el decisor de compras no se encuentra disponible para autorizar la orden. La cotización permite cotizar precios y vigencia sin bloquear inventario ni línea de crédito.'
      }
    ];

    const insertFaq = db.prepare('INSERT INTO faqs (id, category, question, answer, order_num) VALUES (?, ?, ?, ?, ?)');
    faqs.forEach((f, idx) => insertFaq.run(f.id, f.category, f.question, f.answer, idx + 1));
  }

  // F. Reglas de Negocio Oficiales (CAP-06, RF-018)
  const rulesCount = db.prepare('SELECT COUNT(*) as count FROM business_rules').get().count;
  if (rulesCount === 0) {
    const rules = [
      {
        id: 'rule-01',
        category: 'Listas de Precio',
        title: 'Jerarquía y Segmentación de Listas de Precios',
        content: 'En el canal minorista B2C, la lista Oficina representa el precio base sugerido. Las listas 1, 2 y 3 otorgan precios más competitivos según el volumen y la antigüedad del cliente. Para clientes corporativos B2B se aplican las listas 5, 6, 7 y 8 según autorización crediticia.'
      },
      {
        id: 'rule-02',
        category: 'Tareas en Ruta',
        title: 'Secuencia Obligatoria de Tareas de Visita (T1 a T5)',
        content: 'Toda visita en ruta debe cumplir con el flujo estándar: T1 Inicio de Visita → T2 Registro Fotográfico de Exhibición Inicial y Final → T3 Tracking de Precios de Competencia (o registro del motivo de omisión justificado) → T4 Verificación de Cartera y Deudas → T5 Toma de Pedido o Justificación formal de Cierre.'
      },
      {
        id: 'rule-03',
        category: 'Créditos',
        title: 'Política de Clientes Morosos y Bloqueos de Venta',
        content: 'Clientes con deudas vencidas mayores a 40 días se consideran en tramo moroso o dudoso. Para emitir un nuevo pedido a crédito es obligatorio amortizar primero la deuda vencida o solicitar autorización excepcional al área de créditos.'
      },
      {
        id: 'rule-04',
        category: 'Liquidación',
        title: 'Cuadre y Consolidado Diario Obligatorio',
        content: 'Al concluir las visitas del día, todo asesor debe generar la "Liquidación de Cobranza Diaria". El arqueo debe cuadrar exactamente los soles, dólares y vouchers antes de la entrega formal en caja.'
      }
    ];

    const insertRule = db.prepare('INSERT INTO business_rules (id, category, title, content, order_num) VALUES (?, ?, ?, ?, ?)');
    rules.forEach((r, idx) => insertRule.run(r.id, r.category, r.title, r.content, idx + 1));
  }

  // G. Catálogo de Insignias Oficiales (SEG-03, RF-038)
  const badgeCount = db.prepare('SELECT COUNT(*) as count FROM badges').get().count;
  if (badgeCount === 0) {
    const badges = [
      { id: 'bdg-perfect', code: 'PERFECT_SCORE', name: 'Calificación Perfecta', description: 'Obtuvo una nota de 20/20 en una evaluación práctica multi-caso', icon: '🏆', criteria: 'score_20' },
      { id: 'bdg-zero-errors', code: 'ZERO_ERRORS', name: 'Precisión Impecable', description: 'Completó la evaluación práctica con 0 errores operativos', icon: '🛡️', criteria: 'errors_0' },
      { id: 'bdg-speedster', code: 'FAST_RESOLVER', name: 'Velocista Comercial', description: 'Resolvió los 5 casos prácticos en menos de 4 minutos', icon: '⚡', criteria: 'time_fast' },
      { id: 'bdg-quiz-master', code: 'QUIZ_MASTER', name: 'Maestro Teórico', description: 'Aprobó todos los cuestionarios de video de capacitación', icon: '🎓', criteria: 'all_quizzes_passed' },
      { id: 'bdg-cobranzas', code: 'COLLECTION_PRO', name: 'Especialista en Cobranzas', description: 'Resolvió exitosamente los casos de cobranzas y liquidación de ruta', icon: '💼', criteria: 'cobranzas_success' },
      { id: 'bdg-pioneer', code: 'PIONEER', name: 'Pionero UYAPAY', description: 'Completó el recorrido inicial de inducción a la plataforma', icon: '🌟', criteria: 'onboarding_complete' }
    ];

    const insertBadge = db.prepare('INSERT INTO badges (id, code, name, description, icon, criteria) VALUES (?, ?, ?, ?, ?, ?)');
    badges.forEach(b => insertBadge.run(b.id, b.code, b.name, b.description, b.icon, b.criteria));
  }

  // H. Cuestionarios Teóricos Institucionales (Flujo 12 PRDv2)
  const questCount = db.prepare('SELECT COUNT(*) as count FROM theoretical_questionnaires').get().count;
  if (questCount === 0) {
    const questionnaires = [
      {
        id: 'quest-sunat-01',
        title: 'Evaluación de Políticas de Cobranza y Facturación SUNAT',
        description: 'Evaluación teórica institucional sobre emisión de comprobantes, retenciones tributarias del 3% y liquidación diaria de cobranzas.',
        duration_minutes: 20,
        xp_reward: 50,
        created_by: 'admin',
        questions_json: JSON.stringify([
          {
            id: 'q1',
            text: '¿Cuál es el porcentaje y el monto mínimo a partir del cual aplica la retención de SUNAT en comprobantes electrónicos emitidos en soles?',
            type: 'single',
            options: [
              '3% en montos mayores a S/. 700.00',
              '5% en montos mayores a S/. 1,000.00',
              '1.5% en cualquier monto sin importar el total',
              'No aplica retención en transacciones comerciales B2C'
            ],
            correctAnswers: ['3% en montos mayores a S/. 700.00'],
            explanation: 'Según normativa SUNAT y la regla oficial UYAPAY, los comprobantes en soles que superen S/. 700 están sujetos al 3% de retención tributaria.'
          },
          {
            id: 'q2',
            text: '¿Qué acción debe realizar obligatoriamente el asesor si un cliente presenta deudas vencidas mayores a 40 días?',
            type: 'single',
            options: [
              'Amortizar la deuda vencida antes de emitir nuevo pedido a crédito o solicitar autorización excepcional',
              'Emitir el pedido aplicando una lista especial de descuento sin consultar',
              'Proceder con la venta normal pues la línea de crédito nunca se suspende',
              'Cancelar la cuenta del cliente de forma inmediata y definitiva'
            ],
            correctAnswers: ['Amortizar la deuda vencida antes de emitir nuevo pedido a crédito o solicitar autorización excepcional'],
            explanation: 'Clientes con mora superior a 40 días entran en tramo dudoso; para otorgar más crédito es indispensable amortizar o contar con excepción aprobada.'
          },
          {
            id: 'q3',
            text: '¿Cuáles de los siguientes componentes deben registrarse y cuadrar exactamente en la Liquidación de Cobranza Diaria?',
            type: 'multiple',
            options: [
              'Efectivo en Soles (billetes y monedas)',
              'Efectivo en Dólares americanos',
              'Vouchers de Depósito / Transferencia Bancaria',
              'Pagarés informales sin firma'
            ],
            correctAnswers: [
              'Efectivo en Soles (billetes y monedas)',
              'Efectivo en Dólares americanos',
              'Vouchers de Depósito / Transferencia Bancaria'
            ],
            explanation: 'El arqueo diario consolida soles, dólares y transferencias bancarias verificadas con número de operación bancaria.'
          }
        ])
      },
      {
        id: 'quest-michelin-02',
        title: 'Examen de Reglas Comerciales, Promociones y Escalas Michelin',
        description: 'Verificación de conocimientos sobre aplicación de listas de precios B2C/B2B y escalas de volumen.',
        duration_minutes: 15,
        xp_reward: 40,
        created_by: 'admin',
        questions_json: JSON.stringify([
          {
            id: 'qm1',
            text: 'En la jerarquía de precios de UYAPAY B2C, ¿cuál es la lista base sugerida para ventas regulares en ruta?',
            type: 'single',
            options: [
              'Lista Oficina (OF)',
              'Lista Especial Corporativa (EC)',
              'Lista 8 Mayorista',
              'Lista de Remate'
            ],
            correctAnswers: ['Lista Oficina (OF)'],
            explanation: 'La lista Oficina (OF) es el precio base sugerido para clientes minoristas en el canal B2C.'
          },
          {
            id: 'qm2',
            text: '¿Puede un asesor aplicar un descuento estratégico mayor al valor total del producto sin autorización previa?',
            type: 'true_false',
            options: [
              'Falso',
              'Verdadero'
            ],
            correctAnswers: ['Falso'],
            explanation: 'Un descuento que exceda el valor unitario es considerado una trampa/error grave y el sistema lo rechaza de inmediato.'
          }
        ])
      }
    ];

    const now = new Date().toISOString();
    const insertQuest = db.prepare(`
      INSERT INTO theoretical_questionnaires (id, title, description, duration_minutes, xp_reward, questions_json, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    questionnaires.forEach(q => {
      insertQuest.run(q.id, q.title, q.description, q.duration_minutes, q.xp_reward, q.questions_json, q.created_by, now);
    });
  }

  // I. Eventos Iniciales del Calendario de Evaluaciones (Flujo 12 PRDv2)
  const eventCount = db.prepare('SELECT COUNT(*) as count FROM calendar_events').get().count;
  if (eventCount === 0) {
    const today = new Date().toISOString().split('T')[0];
    const events = [
      {
        id: 'evt-cal-01',
        title: 'Evaluación Práctica Mensual B2C - Simulador',
        evaluation_type: 'SIMULADOR',
        level: 'intermedio',
        questionnaire_id: null,
        start_date: today,
        end_date: today,
        assigned_users_json: JSON.stringify(['usr-edward', 'usr-henry', 'usr-alvaro', 'usr-lruiz']),
        created_by: 'admin'
      },
      {
        id: 'evt-cal-02',
        title: 'Cuestionario de Políticas de Cobranza SUNAT',
        evaluation_type: 'CUESTIONARIO',
        level: 'basico',
        questionnaire_id: 'quest-sunat-01',
        start_date: today,
        end_date: today,
        assigned_users_json: JSON.stringify(['usr-edward', 'usr-alvaro', 'usr-percy']),
        created_by: 'admin'
      }
    ];

    const now = new Date().toISOString();
    const insertEvt = db.prepare(`
      INSERT INTO calendar_events (id, title, evaluation_type, level, questionnaire_id, start_date, end_date, assigned_users_json, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    events.forEach(e => {
      insertEvt.run(e.id, e.title, e.evaluation_type, e.level, e.questionnaire_id, e.start_date, e.end_date, e.assigned_users_json, e.created_by, now);
    });
  }
}

module.exports = { initDatabaseSchema };
