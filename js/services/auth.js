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
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.trim(), password: password ? password.trim() : '' })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          Storage.setCurrentSession(data.user);
          return { success: true, user: data.user };
        } else if (res.status === 401) {
          return { success: false, message: data.message || 'Credenciales incorrectas.' };
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
