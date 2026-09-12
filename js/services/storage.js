/**
 * Servicio de Almacenamiento y Persistencia (StorageService)
 * Conexión híbrida: Base de Datos SQLite Backend (vía API REST) + Respaldo Local (localStorage).
 * Cumple con RNF-MVP-009, RNF-MVP-010 y RF-MVP-042 a RF-MVP-047.
 */
window.UyapayServices = window.UyapayServices || {};

(function() {
  const KEYS = {
    USERS: 'uyapay_users_v1',
    RESULTS: 'uyapay_results_v1',
    SESSION: 'uyapay_active_session_v1'
  };

  const memoryStorage = {};

  function isLocalStorageAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch(e) {
      return false;
    }
  }

  const hasStorage = isLocalStorageAvailable();

  function getLocalItem(key, defaultValue = null) {
    try {
      const raw = hasStorage ? localStorage.getItem(key) : memoryStorage[key];
      return raw ? JSON.parse(raw) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  function setLocalItem(key, value) {
    try {
      const serialized = JSON.stringify(value);
      if (hasStorage) {
        localStorage.setItem(key, serialized);
      } else {
        memoryStorage[key] = serialized;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function resolveUrl(url) {
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      return url;
    }
    return 'http://localhost:3000' + url;
  }

  function getAuthHeaders() {
    const session = getLocalItem(KEYS.SESSION, null);
    const headers = { 'Content-Type': 'application/json' };
    if (session && session.token) {
      headers['Authorization'] = `Bearer ${session.token}`;
    }
    if (session && session.role) {
      headers['X-User-Role'] = session.role;
    }
    return headers;
  }

  window.UyapayServices.Storage = {
    // ---- USUARIOS ----
    async getUsers() {
      try {
        const res = await fetch(resolveUrl('/api/users'));
        if (res.ok) {
          const users = await res.json();
          setLocalItem(KEYS.USERS, users);
          return users;
        }
      } catch (e) {
        // Fallback local
      }
      return getLocalItem(KEYS.USERS, (window.UyapayData && window.UyapayData.INITIAL_USERS) || []);
    },

    async getUserByUsername(username) {
      const users = await this.getUsers();
      const clean = (username || '').toLowerCase().trim();
      return users.find(u => 
        (u.username || '').toLowerCase() === clean ||
        (u.name || '').toLowerCase() === clean
      ) || null;
    },

    async registerUser(userData) {
      try {
        const res = await fetch(resolveUrl('/api/users'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });
        const data = await res.json();
        if (res.ok && data.success) {
          return data;
        }
      } catch (e) {
        // Fallback local
      }

      // Registro local si está offline
      const users = getLocalItem(KEYS.USERS, []);
      const newId = 'usr-' + Date.now();
      const newUser = { id: newId, role: 'asesor', ...userData };
      users.push(newUser);
      setLocalItem(KEYS.USERS, users);
      return { success: true, user: newUser };
    },

    // ---- RESULTADOS E HISTORIAL ----
    async getResults() {
      // 1. Intentar leer de Firebase Cloud Firestore (Nube)
      const fb = window.UyapayServices && window.UyapayServices.Firebase;
      if (fb && fb.isReady()) {
        try {
          const cloudResults = await fb.getResults();
          if (Array.isArray(cloudResults) && cloudResults.length > 0) {
            setLocalItem(KEYS.RESULTS, cloudResults);
            return cloudResults;
          }
        } catch (e) {
          console.warn('[Storage] Leyendo de Firebase fallback:', e);
        }
      }

      // 2. Intentar backend SQLite
      try {
        const res = await fetch(resolveUrl('/api/results'));
        if (res.ok) {
          const data = await res.json();
          setLocalItem(KEYS.RESULTS, data);
          return data;
        }
      } catch (e) {
        // Fallback local
      }
      return getLocalItem(KEYS.RESULTS, []);
    },

    async getUserResults(username) {
      const results = await this.getResults();
      return results.filter(r => (r.username || '').toLowerCase() === (username || '').toLowerCase());
    },

    async saveResult(evalData) {
      let savedResult = null;

      // 1. Guardar en Firebase Cloud Firestore (Nube)
      const fb = window.UyapayServices && window.UyapayServices.Firebase;
      if (fb && fb.isReady()) {
        try {
          savedResult = await fb.saveResult(evalData);
        } catch (fbErr) {
          console.warn('[Storage] Error guardando en Firebase:', fbErr);
        }
      }

      // 2. Guardar en Backend SQLite (API REST local de respaldo)
      try {
        const res = await fetch(resolveUrl('/api/results'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(evalData)
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            savedResult = savedResult || json.result;
            const local = getLocalItem(KEYS.RESULTS, []);
            local.unshift(json.result);
            setLocalItem(KEYS.RESULTS, local);
          }
        }
      } catch (e) {
        // Fallback local si el servidor no está corriendo
      }

      if (savedResult) {
        return savedResult;
      }

      // 3. Guardado local de respaldo (localStorage)
      const results = getLocalItem(KEYS.RESULTS, []);
      const score = evalData.numericScore !== undefined ? evalData.numericScore : 0;
      const duration = evalData.durationSeconds || 0;
      const mins = Math.floor(duration / 60);
      const secs = duration % 60;
      const formattedDuration = evalData.formattedDuration || `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

      const newResult = {
        id: evalData.id || ('eval-' + Date.now()),
        username: evalData.username || 'alvaro',
        advisorName: evalData.advisorName || 'Alvaro Rodriguez',
        caseId: evalData.caseId || 'case-1',
        caseCode: evalData.caseCode || 'B2C-01',
        caseTitle: evalData.caseTitle || 'Caso 1',
        errors: evalData.errors || 0,
        score: evalData.score || `${score < 10 ? '0' + score : score} / 20`,
        numericScore: score,
        status: evalData.status || (score >= 11 ? 'Aprobado' : 'Desaprobado'),
        durationSeconds: duration,
        formattedDuration: formattedDuration,
        completedAt: evalData.completedAt || new Date().toLocaleString('es-PE'),
        interactions: evalData.interactions || [],
        casesDetails: evalData.casesDetails || []
      };

      results.unshift(newResult);
      setLocalItem(KEYS.RESULTS, results);
      return newResult;
    },

    // ---- ESTADO DE VISIBILIDAD DEL PODIO (RF-MVP-042) ----
    async getPodiumStatus() {
      // 1. Consultar estado en la nube desde Firebase
      const fb = window.UyapayServices && window.UyapayServices.Firebase;
      if (fb && fb.isReady()) {
        try {
          const cloudStatus = await fb.getPodiumStatus();
          setLocalItem('uyapay_podium_visible', cloudStatus);
          return Boolean(cloudStatus);
        } catch (e) {}
      }

      // 2. Fallback backend local
      try {
        const res = await fetch(resolveUrl('/api/settings/podium'));
        if (res.ok) {
          const data = await res.json();
          setLocalItem('uyapay_podium_visible', data.podiumVisible);
          return Boolean(data.podiumVisible);
        }
      } catch (e) {}
      return Boolean(getLocalItem('uyapay_podium_visible', false));
    },

    async setPodiumStatus(visible) {
      const val = Boolean(visible);

      // 1. Sincronizar en Firebase Cloud Firestore (Notifica a todos los asesores)
      const fb = window.UyapayServices && window.UyapayServices.Firebase;
      if (fb && fb.isReady()) {
        try {
          await fb.setPodiumStatus(val);
        } catch (e) {
          console.warn('[Storage] Error publicando podio en Firebase:', e);
        }
      }

      // 2. Sincronizar en backend SQLite local
      try {
        const res = await fetch(resolveUrl('/api/settings/podium'), {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ visible: val })
        });
        if (res.ok) {
          const data = await res.json();
          setLocalItem('uyapay_podium_visible', data.podiumVisible);
          return Boolean(data.podiumVisible);
        }
      } catch (e) {}
      setLocalItem('uyapay_podium_visible', val);
      return val;
    },

    // ---- ANALÍTICA DE ERRORES Y CASOS CRÍTICOS (ADMIN) ----
    async getErrorAnalytics() {
      try {
        const res = await fetch(resolveUrl('/api/admin/error-analytics'), {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {}
      return { topErrorCases: [], advisorsErrors: [] };
    },

    // ---- RANKING GENERAL CON DESEMPATE (RF-MVP-042 A 047) ----
    async getLeaderboard() {
      try {
        const res = await fetch(resolveUrl('/api/leaderboard'));
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        // Fallback a cálculo local
      }

      const results = await this.getResults();
      const userBest = {};

      results.forEach(res => {
        const u = (res.username || '').toLowerCase();
        if (!userBest[u]) {
          userBest[u] = res;
        } else {
          const current = userBest[u];
          const isBetterScore = res.numericScore > current.numericScore;
          const isEqualScoreBetterTime = (res.numericScore === current.numericScore) && 
            (res.durationSeconds < current.durationSeconds);
          const isEqualBothBetterErrors = (res.numericScore === current.numericScore) &&
            (res.durationSeconds === current.durationSeconds) &&
            (res.errors < current.errors);

          if (isBetterScore || isEqualScoreBetterTime || isEqualBothBetterErrors) {
            userBest[u] = res;
          }
        }
      });

      const leaderboard = Object.values(userBest);
      leaderboard.sort((a, b) => {
        if (b.numericScore !== a.numericScore) return b.numericScore - a.numericScore;
        if (a.durationSeconds !== b.durationSeconds) return (a.durationSeconds || 0) - (b.durationSeconds || 0);
        return (a.errors || 0) - (b.errors || 0);
      });

      return leaderboard.map((item, index) => ({
        ...item,
        rank: index + 1
      }));
    },

    // ---- EVENTOS EN VIVO ----
    async sendLiveEvent(eventData) {
      const fb = window.UyapayServices && window.UyapayServices.Firebase;
      if (fb && fb.isReady()) {
        try {
          fb.sendLiveEvent(eventData);
        } catch (e) {}
      }

      try {
        await fetch(resolveUrl('/api/live-events'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData)
        });
      } catch (e) {
        // No pasa nada si está offline
      }
    },

    async getLiveStatus() {
      try {
        const res = await fetch(resolveUrl('/api/live-events'));
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {}
      return { current: null, history: [] };
    },

    // ---- SESIÓN ACTIVA ----
    setCurrentSession(user) {
      setLocalItem(KEYS.SESSION, user);
    },

    getCurrentSession() {
      return getLocalItem(KEYS.SESSION, null);
    },

    clearSession() {
      setLocalItem(KEYS.SESSION, null);
    },

    // ---- RESETEAR A DEMO ----
    async resetAll() {
      // 1. Limpiar y re-sembrar en Firebase Cloud Firestore (Nube)
      const fb = window.UyapayServices && window.UyapayServices.Firebase;
      if (fb && fb.isReady()) {
        try {
          await fb.resetAll();
        } catch (fbErr) {
          console.warn('[Storage] Error al reiniciar Firebase Firestore:', fbErr);
        }
      }

      // 2. Limpiar y re-sembrar en Backend SQLite (API local)
      try {
        await fetch(resolveUrl('/api/reset'), {
          method: 'POST',
          headers: getAuthHeaders()
        });
      } catch (e) {
        console.warn('[Storage] Error al reiniciar backend SQLite:', e);
      }

      // 3. Limpiar almacenamiento local (PRESERVANDO la sesión del usuario activo)
      if (hasStorage) {
        localStorage.removeItem(KEYS.RESULTS);
        localStorage.removeItem(KEYS.USERS);
        // NOTA: NO eliminar KEYS.SESSION para no desloguear al administrador
      }
    }
  };
})();
