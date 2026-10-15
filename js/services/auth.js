/**
 * Servicio de Autenticación (AuthService)
 * Autenticación vía API REST SQLite con fallback local.
 */
window.UyapayServices = window.UyapayServices || {};

(function() {
  const Storage = window.UyapayServices.Storage;

  window.UyapayServices.Auth = {
    async login(username, password) {
      if (!username) {
        return { success: false, message: 'Ingresa un nombre de usuario.' };
      }

      // 1. Intentar autenticar contra el backend SQLite
      try {
        const url = (typeof window !== 'undefined' && window.location)
          ? ((window.location.protocol === 'file:' || (window.location.port && !['3000', '3100', '3101', '3102', '3103', '3104', '3105'].includes(window.location.port)))
              ? 'http://localhost:3000/api/auth/login'
              : '/api/auth/login')
          : 'http://localhost:3000/api/auth/login';

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.trim(), password: password ? password.trim() : '' })
        });

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (res.ok && data.success) {
            if (data.token) {
              data.user.token = data.token;
            }
            Storage.setCurrentSession(data.user);
            return { success: true, user: data.user };
          } else if (res.status === 401) {
            return { success: false, message: data.message || 'Credenciales incorrectas.' };
          }
        }
      } catch (e) {
        // Fallback local si el servidor no está accesible
      }

      // 2. Fallback local contra usuarios iniciales
      const user = await Storage.getUserByUsername(username.trim());
      if (!user) {
        return { success: false, message: 'Usuario no encontrado en la nómina de asesores.' };
      }

      if (user.password && password && user.password !== password.trim()) {
        return { success: false, message: 'Contraseña incorrecta.' };
      }

      const sessionData = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        loggedAt: new Date().toISOString()
      };

      Storage.setCurrentSession(sessionData);
      return { success: true, user: sessionData };
    },

    logout() {
      Storage.clearSession();
      location.reload();
    },

    getCurrentUser() {
      return Storage.getCurrentSession();
    },

    isAuthenticated() {
      return this.getCurrentUser() !== null;
    }
  };
})();
