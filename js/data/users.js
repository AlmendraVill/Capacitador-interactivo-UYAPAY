/**
 * Catálogo oficial de usuarios para la capacitación de 12 asesores B2C - UYAPAY
 */
if (typeof window === 'undefined') {
  global.window = {};
}
window.UyapayData = window.UyapayData || {};

window.UyapayData.INITIAL_USERS = [
  // Administradores / Capacitadores
  { id: 'usr-admin', username: 'admin', name: 'Administrador UYAPAY', role: 'admin', password: '123' },
  
  // 12 Asesores Comerciales
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
  { id: 'usr-hernan', username: 'hernan', name: 'Hernan Pacco', role: 'asesor', password: '123' }, 
  { id: 'usr-edward', username: 'edward', name: 'Edward Velásquez', role: 'asesor', password: '123' },
  { id: 'usr-henry', username: 'henry', name: 'Henry Macedo', role: 'asesor', password: '123' },
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.UyapayData;
}

