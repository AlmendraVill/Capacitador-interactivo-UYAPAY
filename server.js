/**
 * Servidor Backend Ligero UYAPAY con Base de Datos SQLite Persistente
 * Cumple con RNF-MVP-006 a RNF-MVP-013 (Persistencia centralizada, multi-usuario y validación).
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const { DatabaseSync } = require('node:sqlite');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ================= INICIALIZACIÓN BASE DE DATOS SQLITE =================
const dbPath = path.join(__dirname, 'uyapay.sqlite');
const db = new DatabaseSync(dbPath);

// Crear tablas si no existen
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS results (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    case_code TEXT NOT NULL,
    case_title TEXT NOT NULL,
    username TEXT NOT NULL,
    advisor_name TEXT NOT NULL,
    score TEXT NOT NULL,
    numeric_score INTEGER NOT NULL,
    errors INTEGER NOT NULL,
    max_errors INTEGER NOT NULL,
    status TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    formatted_duration TEXT NOT NULL,
    completed_at TEXT NOT NULL,
    interactions TEXT,
    cases_details TEXT
  );

  CREATE TABLE IF NOT EXISTS live_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    advisor TEXT NOT NULL,
    step TEXT NOT NULL,
    detail TEXT NOT NULL,
    type TEXT NOT NULL,
    errors INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Migración segura si la columna cases_details no existía en bases creadas previamente
try {
  db.exec("ALTER TABLE results ADD COLUMN cases_details TEXT;");
} catch (e) {
  // Ya existe la columna
}

// Inicializar configuración de visibilidad del podio (por defecto: '0' = Oculto a asesores)
const podiumRow = db.prepare("SELECT value FROM settings WHERE key = 'podium_visible'").get();
if (!podiumRow) {
  db.prepare("INSERT INTO settings (key, value) VALUES ('podium_visible', '0')").run();
}

// Catálogo oficial de administradores y 12 asesores oficiales UYAPAY
const INITIAL_USERS = [
  // Administradores / Capacitadores
  { id: 'usr-admin', username: 'admin', name: 'Administrador UYAPAY', role: 'admin', password: '123' },
  

  // 12 Asesores Comerciales Oficiales
  { id: 'usr-edward', username: 'edward', name: 'Edward Velásquez', role: 'asesor', password: '123' },
  { id: 'usr-henry', username: 'henry', name: 'Henry Macedo', role: 'asesor', password: '123' },
  { id: 'usr-alvaro', username: 'alvaro', name: 'Álvaro Rodríguez', role: 'asesor', password: '123' },
  { id: 'usr-lruiz', username: 'lruiz', name: 'Leonardo Ruíz', role: 'asesor', password: '123' },
  { id: 'usr-percy', username: 'percy', name: 'Percy Chambilla', role: 'asesor', password: '123' },
  { id: 'usr-danilo', username: 'danilo', name: 'Danilo Salas', role: 'asesor', password: '123' },
  { id: 'usr-betsy', username: 'betsy', name: 'Betsy Ramos', role: 'asesor', password: '123' },
  { id: 'usr-williams', username: 'williams', name: 'Williams Campos', role: 'asesor', password: '123' },
  { id: 'usr-larce', username: 'larce', name: 'Leonardo Arce', role: 'asesor', password: '123' },
  { id: 'usr-dino', username: 'dino', name: 'Dino Quispe', role: 'asesor', password: '123' },
  { id: 'usr-natalio', username: 'natalio', name: 'Natalio Ari', role: 'asesor', password: '123' },
  { id: 'usr-marco', username: 'marco', name: 'Marco Alarcón', role: 'asesor', password: '123' },
  { id: 'usr-antonio', username: 'antonio', name: 'Antonio Andrade', role: 'asesor', password: '123' },
  { id: 'usr-hernan', username: 'hernan', name: 'Hernan Pacco', role: 'asesor', password: '123' }
];

// Sincronizar / actualizar usuarios en la base de datos SQLite
const upsertUser = db.prepare(`
  INSERT INTO users (id, username, name, role, password, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT(username) DO UPDATE SET
    name = excluded.name,
    role = excluded.role,
    password = excluded.password
`);

for (const u of INITIAL_USERS) {
  upsertUser.run(u.id, u.username, u.name, u.role, u.password, new Date().toISOString());
}

// Limpiar usuarios antiguos de demo que no pertenezcan a la nómina oficial
const validUsernames = INITIAL_USERS.map(u => u.username.toLowerCase());
const allUsersInDb = db.prepare('SELECT username FROM users').all();
for (const row of allUsersInDb) {
  if (!validUsernames.includes(row.username.toLowerCase())) {
    db.prepare('DELETE FROM users WHERE username = ?').run(row.username);
  }
}
console.log(`[DB] Nómina oficial de ${INITIAL_USERS.length} usuarios sincronizada correctamente.`);

// Sembrar evaluaciones iniciales de demostración si la tabla está vacía
const resultsCount = db.prepare('SELECT COUNT(*) as count FROM results').get().count;
if (resultsCount === 0) {
  const insertResult = db.prepare(`
    INSERT INTO results (
      id, case_id, case_code, case_title, username, advisor_name,
      score, numeric_score, errors, max_errors, status,
      duration_seconds, formatted_duration, completed_at, interactions, cases_details
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertResult.run(
    'eval-seed-1', 'case-1', 'B2C-01', 'Caso 1: Venta simple contado con regalo por volumen',
    'alvaro', 'Álvaro Rodríguez', '20 / 20', 20, 0, 2, 'Aprobado',
    38, '00:38', new Date(Date.now() - 3600000).toLocaleString('es-PE'), '[]',
    JSON.stringify([{ caseCode: 'B2C-01', caseTitle: 'Caso 1: Venta simple contado con regalo', score: '20 / 20', numericScore: 20, errors: 0, completed: true, actionsLog: [] }])
  );

  insertResult.run(
    'eval-seed-2', 'case-2', 'B2C-02', 'Caso 2: Venta a crédito 30 días con descuento en dinero',
    'lruiz', 'Leonardo Ruíz', '16 / 20', 16, 1, 2, 'Aprobado',
    52, '00:52', new Date(Date.now() - 7200000).toLocaleString('es-PE'), '[]',
    JSON.stringify([{ caseCode: 'B2C-02', caseTitle: 'Caso 2: Venta a crédito 30 días', score: '16 / 20', numericScore: 16, errors: 1, completed: true, actionsLog: [{ time: '10:15:00', type: 'ERROR', step: 'Configurar pedido', detail: 'Seleccionó condición errónea' }] }])
  );

  console.log('[DB] Se han sembrado resultados iniciales para el ranking.');
}

// Clientes suscritos a Server-Sent Events (SSE) para el monitor en vivo
let sseClients = [];

// ================= RUTAS DE LA API REST =================

// 1. Salud del servicio
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 2. Autenticación de usuarios
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username) {
    return res.status(400).json({ success: false, message: 'Ingresa un nombre de usuario.' });
  }

  const cleanInput = username.trim();
  const user = db.prepare(`
    SELECT * FROM users 
    WHERE LOWER(username) = LOWER(?) 
       OR LOWER(name) = LOWER(?)
  `).get(cleanInput, cleanInput);

  if (!user) {
    return res.status(401).json({ success: false, message: 'Usuario no encontrado en la plataforma.' });
  }

  if (user.password && password && user.password !== password.trim()) {
    return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
  }

  const sessionUser = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role
  };

  res.json({ success: true, user: sessionUser });
});

// 3. Listar usuarios
app.get('/api/users', (req, res) => {
  const users = db.prepare('SELECT id, username, name, role, created_at FROM users ORDER BY name ASC').all();
  res.json(users);
});

// 4. Registrar nuevo usuario
app.post('/api/users', (req, res) => {
  const { username, name, role = 'asesor', password = '123' } = req.body;
  if (!username || !name) {
    return res.status(400).json({ success: false, message: 'Nombre y usuario son obligatorios.' });
  }

  const cleanUsername = username.trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = ?').get(cleanUsername);
  if (existing) {
    return res.status(409).json({ success: false, message: 'Ese nombre de usuario ya está registrado.' });
  }

  const newId = 'usr-' + Date.now();
  db.prepare(`
    INSERT INTO users (id, username, name, role, password, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(newId, cleanUsername, name.trim(), role, password.trim(), new Date().toISOString());

  res.status(201).json({
    success: true,
    user: { id: newId, username: cleanUsername, name: name.trim(), role }
  });
});

// 5. Listar resultados de evaluaciones
app.get('/api/results', (req, res) => {
  const results = db.prepare('SELECT * FROM results ORDER BY rowid DESC').all();
  const parsed = results.map(r => ({
    id: r.id,
    caseId: r.case_id,
    caseCode: r.case_code,
    caseTitle: r.case_title,
    username: r.username,
    advisorName: r.advisor_name,
    score: r.score,
    numericScore: r.numeric_score,
    errors: r.errors,
    maxErrorsAllowed: r.max_errors,
    status: r.status,
    durationSeconds: r.duration_seconds,
    formattedDuration: r.formatted_duration,
    completedAt: r.completed_at,
    interactions: JSON.parse(r.interactions || '[]'),
    casesDetails: JSON.parse(r.cases_details || '[]')
  }));
  res.json(parsed);
});

// 6. Guardar nueva evaluación (RF-MVP-035)
app.post('/api/results', (req, res) => {
  const data = req.body;
  if (!data.username) {
    return res.status(400).json({ success: false, message: 'El usuario es obligatorio.' });
  }

  const id = data.id || ('eval-' + Date.now());
  const numericScore = data.numericScore !== undefined ? data.numericScore : Math.max(0, 20 - ((data.errors || 0) * 4));
  const maxErrors = data.maxErrorsAllowed !== undefined ? data.maxErrorsAllowed : 2;
  const status = data.status || ((data.errors || 0) <= maxErrors ? 'Aprobado' : 'Desaprobado');
  const durationSeconds = data.durationSeconds || 0;
  const mins = Math.floor(durationSeconds / 60);
  const secs = durationSeconds % 60;
  const formattedDuration = data.formattedDuration || `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  const completedAt = data.completedAt || new Date().toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'medium' });

  db.prepare(`
    INSERT INTO results (
      id, case_id, case_code, case_title, username, advisor_name,
      score, numeric_score, errors, max_errors, status,
      duration_seconds, formatted_duration, completed_at, interactions, cases_details
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.caseId || 'case-1',
    data.caseCode || 'B2C-01',
    data.caseTitle || 'Caso 1: Venta simple contado con regalo',
    data.username,
    data.advisorName || data.username,
    data.score || `${numericScore} / 20`,
    numericScore,
    data.errors || 0,
    maxErrors,
    status,
    durationSeconds,
    formattedDuration,
    completedAt,
    JSON.stringify(data.interactions || []),
    JSON.stringify(data.casesDetails || [])
  );

  const savedRecord = {
    id,
    caseId: data.caseId,
    caseCode: data.caseCode,
    caseTitle: data.caseTitle,
    username: data.username,
    advisorName: data.advisorName,
    score: `${numericScore} / 20`,
    numericScore,
    errors: data.errors,
    maxErrorsAllowed: maxErrors,
    status,
    durationSeconds,
    formattedDuration,
    completedAt,
    casesDetails: data.casesDetails || [],
    interactions: data.interactions || []
  };

  res.status(201).json({ success: true, result: savedRecord });
});

// 7. Cálculo dinámico de Ranking y Podio (RF-MVP-042 a RF-MVP-047)
app.get('/api/leaderboard', (req, res) => {
  const allResults = db.prepare('SELECT * FROM results').all();

  // Agrupar por usuario tomando su mejor desempeño
  const userBest = {};
  allResults.forEach(r => {
    const u = r.username.toLowerCase();
    if (!userBest[u]) {
      userBest[u] = r;
    } else {
      const current = userBest[u];
      const isBetterScore = r.numeric_score > current.numeric_score;
      const isEqualScoreBetterTime = (r.numeric_score === current.numeric_score) && 
        (r.duration_seconds < current.duration_seconds);
      const isEqualBothBetterErrors = (r.numeric_score === current.numeric_score) &&
        (r.duration_seconds === current.duration_seconds) &&
        (r.errors < current.errors);

      if (isBetterScore || isEqualScoreBetterTime || isEqualBothBetterErrors) {
        userBest[u] = r;
      }
    }
  });

  const leaderboard = Object.values(userBest);

  // Ordenamiento oficial: 1. Mayor puntaje, 2. Menor tiempo, 3. Menor errores
  leaderboard.sort((a, b) => {
    if (b.numeric_score !== a.numeric_score) {
      return b.numeric_score - a.numeric_score;
    }
    if (a.duration_seconds !== b.duration_seconds) {
      return a.duration_seconds - b.duration_seconds;
    }
    return a.errors - b.errors;
  });

  const formatted = leaderboard.map((r, index) => ({
    rank: index + 1,
    id: r.id,
    caseTitle: r.case_title,
    username: r.username,
    advisorName: r.advisor_name,
    score: r.score,
    numericScore: r.numeric_score,
    errors: r.errors,
    status: r.status,
    durationSeconds: r.duration_seconds,
    formattedDuration: r.formatted_duration,
    completedAt: r.completed_at
  }));

  res.json(formatted);
});

// ================= CONFIGURACIONES DEL SISTEMA (ADMINISTRACIÓN) =================

// Consulta del estado de publicación del podio
app.get('/api/settings/podium', (req, res) => {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'podium_visible'").get();
    const visible = row ? row.value === '1' : false;
    res.json({ podiumVisible: visible });
  } catch (err) {
    res.json({ podiumVisible: false });
  }
});

// Modificar publicación del podio (Mostrar/Ocultar a asesores)
app.post('/api/settings/podium', (req, res) => {
  try {
    const { visible } = req.body;
    const val = visible ? '1' : '0';
    db.prepare(`
      INSERT INTO settings (key, value) VALUES ('podium_visible', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(val);

    const eventPayload = {
      type: 'PODIUM_STATUS_CHANGED',
      podiumVisible: Boolean(visible),
      time: new Date().toLocaleTimeString('es-PE')
    };

    // Difundir inmediatamente a todos los clientes SSE conectados
    sseClients = sseClients.filter(client => {
      try {
        client.res.write(`data: ${JSON.stringify(eventPayload)}\n\n`);
        return true;
      } catch (err) {
        return false;
      }
    });

    res.json({ success: true, podiumVisible: Boolean(visible) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================= ANALÍTICA DE ERRORES Y CASOS CRÍTICOS (EXCLUSIVO ADMIN) =================
app.get('/api/admin/error-analytics', (req, res) => {
  try {
    const allResults = db.prepare('SELECT * FROM results ORDER BY rowid DESC').all();
    const casesStats = {};
    const advisorsErrors = {};

    allResults.forEach(r => {
      const casesDetails = JSON.parse(r.cases_details || '[]');
      const advisor = r.advisor_name || r.username;
      
      if (!advisorsErrors[advisor]) {
        advisorsErrors[advisor] = {
          advisorName: advisor,
          username: r.username,
          totalEvaluations: 0,
          totalErrors: 0,
          history: []
        };
      }
      advisorsErrors[advisor].totalEvaluations += 1;
      advisorsErrors[advisor].totalErrors += (r.errors || 0);

      // Si la evaluación guardó el desglose detallado de los 5 casos
      if (casesDetails.length > 0) {
        casesDetails.forEach(cd => {
          const cKey = cd.caseCode || cd.caseTitle || 'B2C';
          if (!casesStats[cKey]) {
            casesStats[cKey] = {
              caseCode: cd.caseCode || 'B2C',
              caseTitle: cd.caseTitle || cKey,
              client: cd.client || '',
              attempts: 0,
              totalErrors: 0,
              completedCount: 0,
              errorMessages: {}
            };
          }
          casesStats[cKey].attempts += 1;
          casesStats[cKey].totalErrors += (cd.errors || 0);
          if (cd.completed) casesStats[cKey].completedCount += 1;

          // Registrar las reglas específicas que fallaron
          (cd.actionsLog || []).filter(a => a.type === 'ERROR').forEach(err => {
            const msg = err.detail || err.step || 'Acción errónea';
            casesStats[cKey].errorMessages[msg] = (casesStats[cKey].errorMessages[msg] || 0) + 1;
          });
        });
      } else {
        // Compatibilidad con registros simples monocaso
        const cKey = r.case_code || r.case_title || 'B2C-01';
        if (!casesStats[cKey]) {
          casesStats[cKey] = {
            caseCode: r.case_code || 'B2C-01',
            caseTitle: r.case_title,
            client: '',
            attempts: 0,
            totalErrors: 0,
            completedCount: 0,
            errorMessages: {}
          };
        }
        casesStats[cKey].attempts += 1;
        casesStats[cKey].totalErrors += (r.errors || 0);
        if (r.status === 'Aprobado') casesStats[cKey].completedCount += 1;
      }

      // Historial para auditoría de errores por asesor
      const interactions = JSON.parse(r.interactions || '[]');
      const errorActions = interactions.filter(a => a.type === 'ERROR');
      advisorsErrors[advisor].history.push({
        resultId: r.id,
        caseCode: r.case_code,
        caseTitle: r.case_title,
        completedAt: r.completed_at,
        score: r.score,
        numericScore: r.numeric_score,
        errors: r.errors,
        status: r.status,
        duration: r.formatted_duration,
        casesDetails: casesDetails,
        errorActions: errorActions
      });
    });

    // Ordenar los casos con más errores en orden descendente
    const rankedCases = Object.values(casesStats).map(c => {
      const commonErrorsList = Object.entries(c.errorMessages)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([msg, count]) => ({ message: msg, count }));

      const errorRate = c.attempts > 0 ? (c.totalErrors / c.attempts).toFixed(1) : '0.0';
      return {
        ...c,
        errorRate: parseFloat(errorRate),
        commonErrors: commonErrorsList,
        severity: c.totalErrors >= 3 ? 'ALTA' : (c.totalErrors >= 1 ? 'MEDIA' : 'BAJA')
      };
    }).sort((a, b) => b.totalErrors - a.totalErrors);

    res.json({
      topErrorCases: rankedCases,
      advisorsErrors: Object.values(advisorsErrors)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Estado en memoria del último evento en vivo para sincronización inmediata
let currentLiveState = {
  advisor: 'En espera',
  step: 'Sin actividad',
  detail: 'Esperando que un asesor inicie su evaluación...',
  type: 'INFO',
  errors: 0,
  time: ''
};

// 8. Consulta de estado y eventos en vivo (Polling / Carga inicial)
app.get('/api/live-events', (req, res) => {
  try {
    const history = db.prepare('SELECT * FROM live_events ORDER BY id DESC LIMIT 25').all();
    res.json({
      current: currentLiveState,
      history: history.map(h => ({
        id: h.id,
        advisor: h.advisor,
        step: h.step,
        detail: h.detail,
        type: h.type,
        errors: h.errors,
        time: h.created_at
      }))
    });
  } catch (err) {
    res.json({ current: currentLiveState, history: [] });
  }
});

// 9. Registro de eventos en vivo desde el evaluador/simulador
app.post('/api/live-events', (req, res) => {
  const { advisor, step, detail, type = 'INFO', errors = 0 } = req.body;
  const time = new Date().toLocaleTimeString('es-PE');

  currentLiveState = {
    advisor: advisor || currentLiveState.advisor || 'Asesor',
    step: step || 'Sin actividad',
    detail: detail || '',
    type: type,
    errors: errors !== undefined ? errors : 0,
    time: time
  };

  try {
    db.prepare(`
      INSERT INTO live_events (advisor, step, detail, type, errors, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(currentLiveState.advisor, currentLiveState.step, currentLiveState.detail, currentLiveState.type, currentLiveState.errors, time);
  } catch (e) {
    console.error('[DB Error] Guardando live_event:', e.message);
  }

  const eventPayload = { ...currentLiveState };

  // Difundir a todos los clientes SSE activos con control de errores
  sseClients = sseClients.filter(client => {
    try {
      client.res.write(`data: ${JSON.stringify(eventPayload)}\n\n`);
      return true;
    } catch (err) {
      return false;
    }
  });

  res.json({ success: true, current: currentLiveState });
});

// 10. Conexión SSE para transmisión de eventos en vivo al monitor de administración
app.get('/api/live-events/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  sseClients.push(newClient);

  // Enviar estado actual inmediatamente al conectar
  try {
    res.write(`data: ${JSON.stringify(currentLiveState)}\n\n`);
  } catch (err) {}

  // Heartbeat ping cada 15 segundos para mantener viva la conexión en redes móviles/Wi-Fi
  const pingInterval = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch (e) {
      clearInterval(pingInterval);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(pingInterval);
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

// 11. Reiniciar datos demo (solo administración)
app.post('/api/reset', (req, res) => {
  db.exec('DELETE FROM results; DELETE FROM live_events;');
  currentLiveState = {
    advisor: 'En espera',
    step: 'Sin actividad',
    detail: 'Esperando que un asesor inicie su evaluación...',
    type: 'INFO',
    errors: 0,
    time: ''
  };
  
  // Re-sembrar resultados demo
  const insertResult = db.prepare(`
    INSERT INTO results (
      id, case_id, case_code, case_title, username, advisor_name,
      score, numeric_score, errors, max_errors, status,
      duration_seconds, formatted_duration, completed_at, interactions, cases_details
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertResult.run(
    'eval-seed-1', 'case-1', 'B2C-01', 'Caso 1: Venta simple contado con regalo por volumen',
    'maria', 'María Fernandez', '20 / 20', 20, 0, 2, 'Aprobado',
    38, '00:38', new Date().toLocaleString('es-PE'), '[]',
    JSON.stringify([{ caseCode: 'B2C-01', caseTitle: 'Caso 1: Venta simple contado con regalo', score: '20 / 20', numericScore: 20, errors: 0, completed: true, actionsLog: [] }])
  );

  insertResult.run(
    'eval-seed-2', 'case-1', 'B2C-01', 'Caso 1: Venta simple contado con regalo por volumen',
    'carlos', 'Carlos Mendoza', '16 / 20', 16, 1, 2, 'Aprobado',
    52, '00:52', new Date().toLocaleString('es-PE'), '[]',
    JSON.stringify([{ caseCode: 'B2C-01', caseTitle: 'Caso 1: Venta simple contado con regalo', score: '16 / 20', numericScore: 16, errors: 1, completed: true, actionsLog: [{ time: '10:15:00', type: 'ERROR', step: 'Fotos obligatorias', detail: 'Faltó foto de fachada' }] }])
  );

  res.json({ success: true, message: 'Datos restablecidos con éxito.' });
});

// Función para obtener dinámicamente la IP de la red local (Wi-Fi / Ethernet)
function getLocalNetworkIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Ignorar localhost, direcciones IPv6 y direcciones APIPA (169.254.x.x)
      if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('169.254')) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Iniciar servidor escuchando en todas las interfaces de red (0.0.0.0) para soporte multi-dispositivo
app.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalNetworkIp();
  console.log(`=======================================================`);
  console.log(`🚀 Servidor UYAPAY activo en: http://localhost:${PORT}`);
  if (localIp !== 'localhost') {
    console.log(`🌐 Acceso en Red Local (Celular u otro equipo): http://${localIp}:${PORT}`);
  }
  console.log(`📁 Base de Datos SQLite: ${dbPath}`);
  console.log(`=======================================================`);
});
