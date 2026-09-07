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

  window.UyapayServices.Storage = {
    // ---- USUARIOS ----
    async getUsers() {
      try {
        const res = await fetch('/api/users');
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
      return users.find(u => (u.username || '').toLowerCase() === (username || '').toLowerCase()) || null;
    },

    async registerUser(userData) {
      try {
        const res = await fetch('/api/users', {
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
      try {
        const res = await fetch('/api/results');
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
      // 1. Guardar en Backend SQLite
      try {
        const res = await fetch('/api/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(evalData)
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            // Actualizar caché local
            const local = getLocalItem(KEYS.RESULTS, []);
            local.unshift(json.result);
            setLocalItem(KEYS.RESULTS, local);
            return json.result;
          }
        }
      } catch (e) {
        // Fallback local si el servidor no está corriendo
      }

      // 2. Guardado local de respaldo
      const results = getLocalItem(KEYS.RESULTS, []);
      const score = evalData.numericScore !== undefined ? evalData.numericScore : 20;
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
        score: evalData.score || `${score} / 20`,
        numericScore: score,
        status: evalData.status || 'Aprobado',
        durationSeconds: duration,
        formattedDuration: formattedDuration,
        completedAt: evalData.completedAt || new Date().toLocaleString('es-PE'),
        interactions: evalData.interactions || []
      };

      results.unshift(newResult);
      setLocalItem(KEYS.RESULTS, results);
      return newResult;
    },

    // ---- RANKING GENERAL CON DESEMPATE (RF-MVP-042 A 047) ----
    async getLeaderboard() {
      try {
        const res = await fetch('/api/leaderboard');
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
      try {
        await fetch('/api/live-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData)
        });
      } catch (e) {
        // No pasa nada si está offline
      }
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
      try {
        await fetch('/api/reset', { method: 'POST' });
      } catch (e) {}

      if (hasStorage) {
        localStorage.removeItem(KEYS.USERS);
        localStorage.removeItem(KEYS.RESULTS);
        localStorage.removeItem(KEYS.SESSION);
      }
    }
  };
})();
