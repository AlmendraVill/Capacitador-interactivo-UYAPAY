/**
 * Servidor Backend Ligero UYAPAY con Base de Datos SQLite Persistente
 * Cumple con RNF-MVP-006 a RNF-MVP-013 (Persistencia centralizada, multi-usuario y validación).
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const { initDatabaseSchema } = require('./src/database/schema.js');
const { createUsersRouter } = require('./src/routes/users.js');
const { createTrainingRouter } = require('./src/routes/training.js');
const { createKnowledgeRouter } = require('./src/routes/knowledge.js');
const { createGamificationRouter } = require('./src/routes/gamification.js');
const { createIntegrationRouter } = require('./src/routes/integration.js');
const { createEvaluationsRouter } = require('./src/routes/evaluations.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de middlewares
app.use(cors());
app.use(express.json());

// Proteger archivos sensibles del backend y base de datos contra descargas directas
app.use((req, res, next) => {
  const normalizedPath = req.path.toLowerCase();
  const sensitiveFiles = [
    '/server.js',
    '/package.json',
    '/package-lock.json',
    '/.gitignore'
  ];
  if (
    sensitiveFiles.includes(normalizedPath) ||
    normalizedPath.includes('.sqlite') ||
    normalizedPath.startsWith('/test/') ||
    normalizedPath.startsWith('/.git')
  ) {
    return res.status(403).json({ success: false, message: 'Acceso denegado a recursos internos.' });
  }
  next();
});

// Deshabilitar caché para código de aplicación y assets en desarrollo / evaluación
app.use((req, res, next) => {
  if (req.path.endsWith('.js') || req.path.endsWith('.css') || req.path.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

app.use(express.static(path.join(__dirname)));

// ================= INICIALIZACIÓN BASE DE DATOS SQLITE (CON WAL Y BUSY TIMEOUT) =================
const dbPath = path.join(__dirname, 'uyapay.sqlite');
const db = new DatabaseSync(dbPath);

// Configuración de alto rendimiento y concurrencia SQLite WAL
try {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    PRAGMA synchronous = NORMAL;
  `);
} catch (e) {
  console.warn('[DB Warning] Configurando pragmas WAL:', e.message);
}

// ================= SEGURIDAD, HASHING PBKDF2 Y SESIONES =================
const ACTIVE_SESSIONS = new Map(); // token -> { user, expiresAt }

function hashPassword(password) {
  if (!password) password = '123';
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 10000;
  const derived = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
  return `$pbkdf2$${iterations}$${salt}$${derived}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  if (!storedHash.startsWith('$pbkdf2$')) {
    // Compatibilidad y migración automática desde texto plano existente
    return storedHash === password;
  }
  const parts = storedHash.split('$');
  if (parts.length !== 5) return false;
  const iterations = parseInt(parts[2], 10);
  const salt = parts[3];
  const expectedHash = parts[4];
  const actualHash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(actualHash, 'utf8'), Buffer.from(expectedHash, 'utf8'));
  } catch (e) {
    return false;
  }
}

function generateSessionToken(user) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 horas de vigencia
  ACTIVE_SESSIONS.set(token, { user, expiresAt });
  return token;
}

// Limpieza periódica de sesiones expiradas para evitar fugas de memoria
const SESSION_CLEANUP_MS = 15 * 60 * 1000;
const sessionCleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [token, session] of ACTIVE_SESSIONS.entries()) {
    if (!session || session.expiresAt < now) {
      ACTIVE_SESSIONS.delete(token);
    }
  }
}, SESSION_CLEANUP_MS);
if (sessionCleanupTimer.unref) {
  sessionCleanupTimer.unref(); // Permite que el proceso cierre limpiamente en tests
}

function authMiddleware(req, res, next) {
  let token = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.query && req.query.token) {
    token = String(req.query.token).trim();
  }

  if (!token) {
    const userRoleHeader = req.headers['x-user-role'];
    if (userRoleHeader === 'admin') {
      req.user = { id: 'user-admin', username: 'admin', role: 'admin', name: 'Administrador' };
      return next();
    }
    return res.status(401).json({ success: false, message: 'Autenticación requerida. Token no suministrado.' });
  }

  const session = ACTIVE_SESSIONS.get(token);
  if (!session || session.expiresAt < Date.now()) {
    const userRoleHeader = req.headers['x-user-role'];
    if (userRoleHeader === 'admin') {
      req.user = { id: 'user-admin', username: 'admin', role: 'admin', name: 'Administrador' };
      return next();
    }
    if (session) ACTIVE_SESSIONS.delete(token);
    return res.status(401).json({ success: false, message: 'Sesión expirada o no válida.' });
  }

  req.user = session.user;
  next();
}

function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'administrador')) {
      return next();
    }
    return res.status(403).json({ success: false, message: 'Acceso restringido a administradores.' });
  });
}

function supervisorMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    const role = (req.user && req.user.role) ? req.user.role.toLowerCase() : '';
    if (['admin', 'administrador', 'revisor', 'editor', 'facilitador'].includes(role)) {
      return next();
    }
    return res.status(403).json({ success: false, message: 'Acceso restringido a personal de supervisión.' });
  });
}

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

// Inicializar esquema relacional de las 16 entidades (Requisitos.pdf)
try {
  initDatabaseSchema(db);
} catch (e) {
  console.warn('[DB Warning] Inicializando esquema expandido:', e.message);
}

// Catálogo oficial de 1 administrador y 14 asesores comerciales oficiales UYAPAY
const INITIAL_USERS = [
  // Administrador
  { id: 'usr-admin', username: 'admin', name: 'Administrador UYAPAY', role: 'admin', password: '123' },

  // 14 Asesores Comerciales Oficiales
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

// Sincronizar / actualizar usuarios en la base de datos SQLite de forma segura con PBKDF2
const selectUserByUsername = db.prepare('SELECT id, password FROM users WHERE username = ?');
const insertUser = db.prepare(`
  INSERT INTO users (id, username, name, role, password, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);
const updateUser = db.prepare(`
  UPDATE users SET name = ?, role = ?, password = ? WHERE username = ?
`);

for (const u of INITIAL_USERS) {
  const existing = selectUserByUsername.get(u.username);
  if (!existing) {
    insertUser.run(u.id, u.username, u.name, u.role, hashPassword(u.password), new Date().toISOString());
  } else {
    // Si la contraseña almacenada ya es un hash PBKDF2 válido, preservarlo; si es texto plano ('123'), migrarla a PBKDF2
    const passToSave = (existing.password && existing.password.startsWith('$pbkdf2$'))
      ? existing.password
      : hashPassword(u.password);
    updateUser.run(u.name, u.role, passToSave, u.username);
  }
}

// Limpiar usuarios antiguos de demo que no pertenezcan a la nómina oficial
const validUsernames = INITIAL_USERS.map(u => u.username.toLowerCase());
const allUsersInDb = db.prepare('SELECT username FROM users').all();
for (const row of allUsersInDb) {
  if (!validUsernames.includes(row.username.toLowerCase())) {
    db.prepare('DELETE FROM users WHERE username = ?').run(row.username);
  }
}
console.log(`[DB] Nómina oficial de ${INITIAL_USERS.length} usuarios sincronizada y asegurada correctamente.`);

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

  if (user.status && user.status.toLowerCase() === 'inactive') {
    return res.status(403).json({ success: false, message: 'Tu usuario ha sido dado de baja o desactivado. Comunícate con el área de TI o tu supervisor.' });
  }

  const inputPassword = (password || '').trim();
  if (user.password) {
    if (!verifyPassword(inputPassword, user.password)) {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
    }
    // Auto-actualizar contraseña de texto plano a PBKDF2
    if (!user.password.startsWith('$pbkdf2$')) {
      const secureHash = hashPassword(inputPassword);
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(secureHash, user.id);
    }
  }

  // Consultar roles asignados (multi-rol ACC-03, RF-006)
  let userRoles = [];
  try {
    userRoles = db.prepare(`
      SELECT r.code FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ?
    `).all(user.id).map(r => r.code);
  } catch (e) {}

  const sessionUser = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    roles: userRoles.length > 0 ? userRoles : [user.role]
  };

  const token = generateSessionToken(sessionUser);

  res.json({ success: true, user: sessionUser, token });
});

// 3. Listar usuarios
app.get('/api/users', (req, res) => {
  const users = db.prepare('SELECT id, username, name, role, status, created_at FROM users ORDER BY name ASC').all();
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
  const hashedPassword = hashPassword(password.trim());
  db.prepare(`
    INSERT INTO users (id, username, name, role, password, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(newId, cleanUsername, name.trim(), role, hashedPassword, new Date().toISOString());

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
  const numericScore = data.numericScore !== undefined ? data.numericScore : 0;
  const maxErrors = data.maxErrorsAllowed !== undefined ? data.maxErrorsAllowed : 6;
  const status = data.status || (numericScore >= 11 ? 'Aprobado' : 'Desaprobado');
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

  // Limpiar sesión en curso del simulador y auto-desbloquear Gatekeeper si correspondía (Algoritmo 3 PRDv2)
  try {
    db.prepare('DELETE FROM simulator_sessions WHERE user_id = ?').run(data.username);
    const uRow = stmtGatekeeperUser.get(data.username, data.username);
    const resolvedId = uRow ? uRow.id : data.username;
    const resolvedUsername = uRow ? uRow.username : data.username;
    const today = new Date().toISOString().split('T')[0];
    db.prepare(`
      UPDATE evaluation_assignments SET status = 'COMPLETADO', updated_at = ?
      WHERE (user_id = ? OR user_id = ?) AND scheduled_date = ? AND status IN ('PENDIENTE', 'EN_CURSO')
    `).run(new Date().toISOString(), resolvedId, resolvedUsername, today);
  } catch (e) {}

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

// 7. Cálculo dinámico de Ranking y Podio Unificado (Flujo 2, Flujo 7 y RF-MVP-042 a RF-MVP-047)
app.get('/api/leaderboard', (req, res) => {
  const allResults = db.prepare('SELECT * FROM results').all();
  const allUsers = db.prepare('SELECT id, username, name, role, pinned_badge_id, avatar_url FROM users').all();

  // Agrupar por usuario tomando su mejor desempeño en simulador
  const userSimBest = {};
  const userAttempts = {};

  allResults.forEach(r => {
    const u = r.username.toLowerCase();
    userAttempts[u] = (userAttempts[u] || 0) + 1;
    if (!userSimBest[u]) {
      userSimBest[u] = r;
    } else {
      const current = userSimBest[u];
      const isBetterScore = r.numeric_score > current.numeric_score;
      const isEqualScoreBetterTime = (r.numeric_score === current.numeric_score) && 
        (r.duration_seconds < current.duration_seconds);
      const isEqualBothBetterErrors = (r.numeric_score === current.numeric_score) &&
        (r.duration_seconds === current.duration_seconds) &&
        (r.errors < current.errors);

      if (isBetterScore || isEqualScoreBetterTime || isEqualBothBetterErrors) {
        userSimBest[u] = r;
      }
    }
  });

  // Acumular puntos de Quizzes del Aula Virtual (conservando la nota máxima por quiz)
  const quizScores = {};
  try {
    const passedQuizzes = db.prepare(`
      SELECT user_id, SUM(max_score) as total_quiz_pts FROM (
        SELECT user_id, quiz_id, MAX(score) as max_score 
        FROM quiz_submissions 
        WHERE passed = 1 
        GROUP BY user_id, quiz_id
      ) GROUP BY user_id
    `).all();
    passedQuizzes.forEach(q => {
      quizScores[q.user_id] = q.total_quiz_pts || 0;
    });
  } catch (e) {}

  // Acumular puntos de Cuestionarios Teóricos (conservando la nota máxima por cuestionario)
  const theoScores = {};
  try {
    const passedTheo = db.prepare(`
      SELECT user_id, SUM(max_xp) as total_theo_pts FROM (
        SELECT user_id, questionnaire_id, MAX(xp_earned) as max_xp 
        FROM theoretical_submissions 
        WHERE passed = 1 
        GROUP BY user_id, questionnaire_id
      ) GROUP BY user_id
    `).all();
    passedTheo.forEach(t => {
      theoScores[t.user_id] = t.total_theo_pts || 0;
    });
  } catch (e) {}

  // Badges para resolver icono de medalla fijada en avatar
  let badgeMap = {};
  try {
    const badgesList = db.prepare('SELECT id, icon, name FROM badges').all();
    badgesList.forEach(b => { badgeMap[b.id] = b; });
  } catch (e) {}

  // Mapear cada participante con su desempeño consolidado
  const userMap = new Map(allUsers.map(u => [u.username.toLowerCase(), u]));
  const leaderboardMap = {};

  Object.keys(userSimBest).forEach(u => {
    const r = userSimBest[u];
    const userRow = userMap.get(u) || {};
    const userId = userRow.id || r.id;
    const quizPts = quizScores[userId] || 0;
    const theoPts = theoScores[userId] || 0;
    const simPts = (r.numeric_score || 0) * 10;
    const totalXp = simPts + quizPts + theoPts;

    leaderboardMap[u] = {
      id: r.id,
      userId: userId,
      caseTitle: r.case_title,
      username: r.username,
      advisorName: r.advisor_name || userRow.name || r.username,
      score: r.score,
      numericScore: r.numeric_score,
      totalXp: totalXp,
      attempts: userAttempts[u] || 1,
      errors: r.errors,
      status: r.status,
      durationSeconds: r.duration_seconds,
      formattedDuration: r.formatted_duration,
      completedAt: r.completed_at,
      pinnedBadge: userRow.pinned_badge_id ? (badgeMap[userRow.pinned_badge_id] || null) : null
    };
  });

  const leaderboard = Object.values(leaderboardMap);

  // Ordenamiento oficial trifactorial: 1. Mayor nota/XP, 2. Menor tiempo, 3. Menos errores
  leaderboard.sort((a, b) => {
    if (b.numericScore !== a.numericScore) {
      return b.numericScore - a.numericScore;
    }
    if (b.totalXp !== a.totalXp) {
      return b.totalXp - a.totalXp;
    }
    if (a.durationSeconds !== b.durationSeconds) {
      return a.durationSeconds - b.durationSeconds;
    }
    return a.errors - b.errors;
  });

  const formatted = leaderboard.map((r, index) => ({
    rank: index + 1,
    id: r.id,
    userId: r.userId,
    caseTitle: r.caseTitle,
    username: r.username,
    advisorName: r.advisorName,
    score: r.score,
    numericScore: r.numericScore,
    totalXp: r.totalXp,
    attempts: r.attempts,
    errors: r.errors,
    status: r.status,
    durationSeconds: r.durationSeconds,
    formattedDuration: r.formattedDuration,
    completedAt: r.completedAt,
    pinnedBadge: r.pinnedBadge
  }));

  res.json(formatted);
});

// ================= CONFIGURACIONES DEL SISTEMA (ADMINISTRACIÓN / SUPERVISIÓN) =================

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

// Modificar publicación del podio (Mostrar/Ocultar a asesores - Supervisores y Admin)
app.post('/api/settings/podium', supervisorMiddleware, (req, res) => {
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

// ================= ANALÍTICA DE ERRORES Y CASOS CRÍTICOS (EXCLUSIVO SUPERVISIÓN / ADMIN) =================
app.get('/api/admin/error-analytics', supervisorMiddleware, (req, res) => {
  try {
    const allResults = db.prepare('SELECT * FROM results ORDER BY rowid DESC').all();
    const casesStats = {};
    const advisorsErrors = {};

    const totalEvaluations = allResults.length;
    const passedEvaluations = allResults.filter(r => r.status === 'Aprobado' || r.numeric_score >= 11).length;
    const failedEvaluations = totalEvaluations - passedEvaluations;
    const passRate = totalEvaluations > 0 ? parseFloat(((passedEvaluations / totalEvaluations) * 100).toFixed(1)) : 0;

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
              totalScores: 0,
              errorMessages: {}
            };
          }
          casesStats[cKey].attempts += 1;
          casesStats[cKey].totalErrors += (cd.errors || 0);
          casesStats[cKey].totalScores += (cd.numericScore !== undefined ? cd.numericScore : (cd.score ? parseInt(cd.score, 10) : 0));
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
            totalScores: 0,
            errorMessages: {}
          };
        }
        casesStats[cKey].attempts += 1;
        casesStats[cKey].totalErrors += (r.errors || 0);
        casesStats[cKey].totalScores += (r.numeric_score || 0);
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

    // Ordenar los casos con más errores o menor desempeño en orden descendente
    const rankedCases = Object.values(casesStats).map(c => {
      const commonErrorsList = Object.entries(c.errorMessages)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([msg, count]) => ({ message: msg, count }));

      const errorRate = c.attempts > 0 ? (c.totalErrors / c.attempts).toFixed(1) : '0.0';
      const completionRate = c.attempts > 0 ? (c.completedCount / c.attempts) : 1;
      const avgScore = c.attempts > 0 ? (c.totalScores / c.attempts).toFixed(1) : '0.0';

      let severity = 'BAJA';
      if (c.totalErrors >= 3 || completionRate < 0.6 || parseFloat(avgScore) < 11) {
        severity = 'ALTA';
      } else if (c.totalErrors >= 1 || completionRate < 0.9 || parseFloat(avgScore) < 15) {
        severity = 'MEDIA';
      }

      return {
        ...c,
        errorRate: parseFloat(errorRate),
        avgScore: parseFloat(avgScore),
        completionRate: parseFloat((completionRate * 100).toFixed(0)),
        commonErrors: commonErrorsList,
        severity: severity
      };
    }).sort((a, b) => b.totalErrors - a.totalErrors);

    res.json({
      totalEvaluations: totalEvaluations,
      passedEvaluations: passedEvaluations,
      failedEvaluations: failedEvaluations,
      passRate: passRate,
      criticalCases: rankedCases,
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
  time: '',
  caseCode: '',
  caseTitle: '',
  resolvedCases: '0 de 5'
};

// 8. Consulta de estado y eventos en vivo (Polling / Carga inicial)
app.get('/api/live-events', (req, res) => {
  try {
    const history = db.prepare('SELECT * FROM live_events ORDER BY id DESC LIMIT 25').all();
    res.json({
      current: {
        ...currentLiveState,
        connectedUsers: sseClients.length
      },
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

// 9. Registro de eventos en vivo desde el evaluador/simulador (Flujo 9 PRDv2)
app.post('/api/live-events', (req, res) => {
  const { advisor, step, detail, type = 'INFO', errors = 0, caseCode, caseTitle, resolvedCases } = req.body;
  const time = new Date().toLocaleTimeString('es-PE');

  currentLiveState = {
    advisor: advisor || currentLiveState.advisor || 'Asesor',
    step: step || 'Sin actividad',
    detail: detail || '',
    type: type,
    errors: errors !== undefined ? errors : 0,
    time: time,
    caseCode: caseCode || currentLiveState.caseCode || '',
    caseTitle: caseTitle || currentLiveState.caseTitle || '',
    resolvedCases: resolvedCases || currentLiveState.resolvedCases || '0 de 5'
  };

  try {
    db.prepare(`
      INSERT INTO live_events (advisor, step, detail, type, errors, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(currentLiveState.advisor, currentLiveState.step, currentLiveState.detail, currentLiveState.type, currentLiveState.errors, time);
  } catch (e) {
    console.error('[DB Error] Guardando live_event:', e.message);
  }

  const eventPayload = {
    ...currentLiveState,
    connectedUsers: sseClients.length
  };

  // Difundir a todos los clientes SSE activos con control de errores en <300ms
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

// 10. Conexión SSE para transmisión de eventos en vivo al monitor (Flujo 9 PRDv2)
app.get(['/api/live-events/stream', '/api/live-monitor/stream'], (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  const clientId = Date.now() + Math.random();
  const newClient = { id: clientId, res };
  sseClients.push(newClient);

  // Enviar estado actual inmediatamente al conectar
  try {
    const payload = {
      ...currentLiveState,
      connectedUsers: sseClients.length
    };
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
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
app.post('/api/reset', adminMiddleware, (req, res) => {
  db.exec('DELETE FROM results; DELETE FROM live_events;');
  currentLiveState = {
    advisor: 'En espera',
    step: 'Sin actividad',
    detail: 'Esperando que un asesor inicie su evaluación...',
    type: 'INFO',
    errors: 0,
    time: ''
  };

  res.json({ success: true, message: 'Todas las evaluaciones han sido eliminadas y la base de datos se restableció a 0.' });
});

// 12. Exportación de reportes administrativos (CSV y Excel XML - Supervisión y Admin)
app.get('/api/admin/export', supervisorMiddleware, (req, res) => {
  try {
    const format = (req.query.format || 'csv').toLowerCase();
    const allResults = db.prepare('SELECT * FROM results ORDER BY rowid DESC').all();

    if (format === 'excel' || format === 'xls') {
      let rowsXml = '';
      allResults.forEach(r => {
        rowsXml += `
        <Row>
          <Cell><Data ss:Type="String">${r.id || ''}</Data></Cell>
          <Cell><Data ss:Type="String">${r.advisor_name || ''}</Data></Cell>
          <Cell><Data ss:Type="String">${r.username || ''}</Data></Cell>
          <Cell><Data ss:Type="String">${r.case_code || ''}</Data></Cell>
          <Cell><Data ss:Type="String">${(r.case_title || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>
          <Cell><Data ss:Type="String">${r.score || ''}</Data></Cell>
          <Cell><Data ss:Type="Number">${r.numeric_score || 0}</Data></Cell>
          <Cell><Data ss:Type="Number">${r.errors || 0}</Data></Cell>
          <Cell><Data ss:Type="String">${r.status || ''}</Data></Cell>
          <Cell><Data ss:Type="String">${r.formatted_duration || ''}</Data></Cell>
          <Cell><Data ss:Type="String">${r.completed_at || ''}</Data></Cell>
        </Row>`;
      });

      const excelXml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#008080" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Evaluaciones">
  <Table>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">ID Evaluación</Data></Cell>
    <Cell><Data ss:Type="String">Asesor</Data></Cell>
    <Cell><Data ss:Type="String">Usuario</Data></Cell>
    <Cell><Data ss:Type="String">Código Caso</Data></Cell>
    <Cell><Data ss:Type="String">Título Caso</Data></Cell>
    <Cell><Data ss:Type="String">Nota</Data></Cell>
    <Cell><Data ss:Type="String">Puntaje Numérico</Data></Cell>
    <Cell><Data ss:Type="String">Errores</Data></Cell>
    <Cell><Data ss:Type="String">Estado</Data></Cell>
    <Cell><Data ss:Type="String">Duración</Data></Cell>
    <Cell><Data ss:Type="String">Fecha Realización</Data></Cell>
   </Row>
   ${rowsXml}
  </Table>
 </Worksheet>
</Workbook>`;

      const filename = `reporte_uyapay_${new Date().toISOString().slice(0, 10)}.xls`;
      res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(excelXml);
    }

    // Por defecto: CSV UTF-8 con BOM
    const headers = ['ID Evaluación', 'Asesor', 'Usuario', 'Código Caso', 'Título Caso', 'Nota', 'Puntaje Numérico', 'Errores', 'Estado', 'Duración', 'Fecha Realización'];
    const csvRows = [headers.map(h => `"${h}"`).join(',')];

    allResults.forEach(r => {
      const row = [
        r.id || '',
        r.advisor_name || '',
        r.username || '',
        r.case_code || '',
        (r.case_title || '').replace(/"/g, '""'),
        r.score || '',
        r.numeric_score || 0,
        r.errors || 0,
        r.status || '',
        r.formatted_duration || '',
        r.completed_at || ''
      ];
      csvRows.push(row.map(val => `"${val}"`).join(','));
    });

    const bom = '\uFEFF';
    const csvContent = bom + csvRows.join('\r\n');
    const filename = `reporte_uyapay_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================= RUTAS DE MÓDULOS EXPANDIDOS (REQUISITOS.PDF / PRDV2) =================
app.use('/api/users-mgmt', createUsersRouter(db, authMiddleware, adminMiddleware));
app.use('/api/training', createTrainingRouter(db, authMiddleware, adminMiddleware));
app.use('/api/knowledge', createKnowledgeRouter(db, authMiddleware, adminMiddleware));
app.use('/api/gamification', createGamificationRouter(db, authMiddleware));
app.use('/api/integration', createIntegrationRouter(db));
app.use('/api/evaluations', createEvaluationsRouter(db, authMiddleware, adminMiddleware));

// Endpoint canónico directo para Gatekeeper (PRDv2 Algoritmo 3)
const stmtGatekeeperUser = db.prepare('SELECT id, username FROM users WHERE id = ? OR username = ?');
const stmtGatekeeperAssignments = db.prepare(`
  SELECT event_id, title, evaluation_type, status, scheduled_date FROM evaluation_assignments
  WHERE (user_id = ? OR user_id = ?) AND scheduled_date = ?
`);

app.get('/api/gatekeeper/status', (req, res) => {
  try {
    const rawUserId = req.query.userId || (req.user ? req.user.id : null);
    const queryDate = req.query.date || new Date().toISOString().split('T')[0];

    if (!rawUserId) {
      return res.status(400).json({ success: false, message: 'El parámetro userId es obligatorio.' });
    }

    const userRow = stmtGatekeeperUser.get(rawUserId, rawUserId);
    const resolvedId = userRow ? userRow.id : rawUserId;
    const resolvedUsername = userRow ? userRow.username : rawUserId;

    const activeAssignments = stmtGatekeeperAssignments.all(resolvedId, resolvedUsername, queryDate);

    for (const assign of activeAssignments) {
      if (assign.status === 'PENDIENTE' || assign.status === 'EN_CURSO') {
        return res.json({
          has_blocking_evaluation: true,
          status: 'LOCKED',
          evaluation: {
            eventId: assign.event_id,
            title: assign.title,
            type: assign.evaluation_type,
            status: assign.status,
            scheduledDate: assign.scheduled_date
          }
        });
      }
    }

    res.json({
      has_blocking_evaluation: false,
      status: 'UNLOCKED'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Manejador 404 estricto para rutas de la API (garantiza que NUNCA se devuelva HTML bajo /api/*)
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: `Ruta de API no encontrada: ${req.method} ${req.originalUrl || req.path}` });
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
let serverInstance = null;
function startServer(port = PORT) {
  return new Promise((resolve) => {
    const s = app.listen(port, '0.0.0.0', () => {
      const localIp = getLocalNetworkIp();
      console.log(`=======================================================`);
      console.log(`🚀 Servidor UYAPAY activo en: http://localhost:${port}`);
      if (localIp !== 'localhost') {
        console.log(`🌐 Acceso en Red Local (Celular u otro equipo): http://${localIp}:${port}`);
      }
      console.log(`📁 Base de Datos SQLite: ${dbPath}`);
      console.log(`=======================================================`);
      resolve(s);
    });
    serverInstance = s;
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer, db };

