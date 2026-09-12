/**
 * Servicio de Integración con Firebase Cloud Firestore (FirebaseService)
 * Proporciona persistencia en la nube en tiempo real para:
 * 1. Resultados y notas de asesores al terminar la evaluación.
 * 2. Lectura y monitoreo en vivo para el Administrador.
 * 3. Control de visibilidad del Podio en tiempo real (Asesores escuchan cambios del Admin).
 */
window.UyapayServices = window.UyapayServices || {};

(function() {
  let db = null;
  let initialized = false;
  let podiumUnsubscribe = null;
  let resultsUnsubscribe = null;
  let liveUnsubscribe = null;

  const FirebaseService = {
    /**
     * Verifica si el usuario ha configurado sus credenciales en firebase-config.js
     */
    isConfigured() {
      const cfg = window.FIREBASE_CONFIG;
      if (!cfg || !cfg.apiKey || !cfg.projectId) return false;
      if (cfg.apiKey === 'TU_API_KEY' || cfg.projectId === 'TU_PROYECTO') return false;
      return true;
    },

    /**
     * Verifica si Firebase SDK está cargado y listo para usarse
     */
    isReady() {
      return initialized && db !== null;
    },

    /**
     * Inicializa la conexión con Cloud Firestore
     */
    init() {
      if (initialized) return true;
      if (!this.isConfigured()) {
        console.info('[Firebase] Configuración pendiente en js/services/firebase-config.js. Usando modo local.');
        return false;
      }

      if (typeof firebase === 'undefined' || typeof firebase.firestore !== 'function') {
        console.warn('[Firebase] SDK de Firebase no detectado en la página.');
        return false;
      }

      try {
        if (!firebase.apps.length) {
          firebase.initializeApp(window.FIREBASE_CONFIG);
        }
        db = firebase.firestore();
        initialized = true;
        console.log('🔥 [Firebase Cloud] Conectado exitosamente a Firestore (' + window.FIREBASE_CONFIG.projectId + ').');
        return true;
      } catch (err) {
        console.error('[Firebase Error] Error inicializando Firestore:', err);
        return false;
      }
    },

    // ================= 1. GUARDAR RESULTADOS DE ASESORES (NUBE) =================
    /**
     * Guarda la evaluación de un asesor en la colección 'results' de Firestore
     * Cumple con el requisito de almacenamiento cloud gratuito multi-dispositivo.
     */
    async saveResult(evalData) {
      if (!this.init()) return null;

      try {
        const id = evalData.id || ('eval-' + Date.now());
        const numericScore = evalData.numericScore !== undefined ? evalData.numericScore : 0;
        const durationSeconds = evalData.durationSeconds || 0;
        const mins = Math.floor(durationSeconds / 60);
        const secs = durationSeconds % 60;
        const formattedDuration = evalData.formattedDuration || `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

        const payload = {
          id: id,
          advisorName: evalData.advisorName || evalData.username || 'Asesor',
          username: (evalData.username || 'asesor').toLowerCase().trim(),
          caseId: evalData.caseId || 'multi-5-cases',
          caseCode: evalData.caseCode || '5 Casos B2C',
          caseTitle: evalData.caseTitle || 'Evaluación de 5 Casos B2C',
          score: evalData.score || `${numericScore < 10 ? '0' + numericScore : numericScore} / 20`,
          numericScore: numericScore,
          errors: evalData.errors !== undefined ? evalData.errors : 0,
          maxErrorsAllowed: evalData.maxErrorsAllowed || 6,
          status: evalData.status || (numericScore >= 11 ? 'Aprobado' : 'Desaprobado'),
          durationSeconds: durationSeconds,
          formattedDuration: formattedDuration,
          completedAt: evalData.completedAt || new Date().toLocaleString('es-PE'),
          casesDetails: evalData.casesDetails || [],
          interactions: evalData.interactions || [],
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Guardar documento en Firestore con su ID único
        await db.collection('results').doc(id).set(payload, { merge: true });
        console.log(`🔥 [Firebase] Evaluación guardada en la nube para: ${payload.advisorName} (${payload.score})`);
        return payload;
      } catch (err) {
        console.error('[Firebase Error] Guardando evaluación en Firestore:', err);
        return null;
      }
    },

    // ================= 2. LECTURA Y ESCUCHA EN TIEMPO REAL (ADMIN Y RANKING) =================
    /**
     * Obtiene todos los resultados guardados en Firestore
     */
    async getResults() {
      if (!this.init()) return [];

      try {
        const snapshot = await db.collection('results').get();
        const list = [];
        snapshot.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() });
        });
        return list;
      } catch (err) {
        console.error('[Firebase Error] Leyendo resultados de Firestore:', err);
        return [];
      }
    },

    /**
     * Escucha en tiempo real la llegada de nuevas notas de asesores
     * El panel de administración y el ranking se actualizan automáticamente
     */
    onResultsChange(callback) {
      if (!this.init()) return () => {};

      try {
        if (resultsUnsubscribe) {
          resultsUnsubscribe();
        }

        resultsUnsubscribe = db.collection('results').onSnapshot(
          snapshot => {
            const list = [];
            snapshot.forEach(doc => {
              list.push({ id: doc.id, ...doc.data() });
            });
            if (typeof callback === 'function') {
              callback(list);
            }
          },
          err => {
            console.warn('[Firebase Snapshot Error] Colección results:', err.message);
          }
        );

        return resultsUnsubscribe;
      } catch (err) {
        console.error('[Firebase Error] onResultsChange:', err);
        return () => {};
      }
    },

    // ================= 3. CONTROL DEL PODIO EN TIEMPO REAL =================
    /**
     * El Administrador publica u oculta el podio oficial en Firestore
     */
    async setPodiumStatus(visible) {
      if (!this.init()) return Boolean(visible);

      try {
        const val = Boolean(visible);
        await db.collection('settings').doc('podium').set({
          visible: val,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log(`🔥 [Firebase] Estado del podio actualizado a: ${val ? 'VISIBLE' : 'OCULTO'}`);
        return val;
      } catch (err) {
        console.error('[Firebase Error] Actualizando estado del podio:', err);
        return Boolean(visible);
      }
    },

    /**
     * Lee el estado actual del podio desde Firestore
     */
    async getPodiumStatus() {
      if (!this.init()) return false;

      try {
        const doc = await db.collection('settings').doc('podium').get();
        if (doc.exists) {
          return Boolean(doc.data().visible);
        }
        return false;
      } catch (err) {
        console.error('[Firebase Error] Leyendo podio:', err);
        return false;
      }
    },

    /**
     * Los Asesores (y el Admin) escuchan en tiempo real el cambio del podio
     * Cuando el admin presiona el botón, la vista del asesor se abre automáticamente
     */
    onPodiumStatusChange(callback) {
      if (!this.init()) return () => {};

      try {
        if (podiumUnsubscribe) {
          podiumUnsubscribe();
        }

        podiumUnsubscribe = db.collection('settings').doc('podium').onSnapshot(
          doc => {
            const visible = doc.exists ? Boolean(doc.data().visible) : false;
            if (typeof callback === 'function') {
              callback(visible);
            }
          },
          err => {
            console.warn('[Firebase Snapshot Error] Podio settings:', err.message);
          }
        );

        return podiumUnsubscribe;
      } catch (err) {
        console.error('[Firebase Error] onPodiumStatusChange:', err);
        return () => {};
      }
    },

    // ================= 4. MONITOR EN VIVO EN LA NUBE =================
    /**
     * Envía evento de interacción hacia Firestore
     */
    async sendLiveEvent(eventData) {
      if (!this.init()) return;

      try {
        const time = new Date().toLocaleTimeString('es-PE');
        const payload = {
          advisor: eventData.advisor || 'Asesor',
          step: eventData.step || 'Acción',
          detail: eventData.detail || '',
          type: eventData.type || 'INFO',
          errors: eventData.errors !== undefined ? eventData.errors : 0,
          time: time,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Estado en vivo actual (sobreescritura rápida)
        await db.collection('settings').doc('live_state').set(payload);
      } catch (err) {
        // Silencioso si hay error en vivo
      }
    },

    /**
     * Escucha en tiempo real los eventos en vivo del monitor
     */
    onLiveEvent(callback) {
      if (!this.init()) return () => {};

      try {
        if (liveUnsubscribe) {
          liveUnsubscribe();
        }

        liveUnsubscribe = db.collection('settings').doc('live_state').onSnapshot(
          doc => {
            if (doc.exists && typeof callback === 'function') {
              callback(doc.data());
            }
          },
          err => {}
        );

        return liveUnsubscribe;
      } catch (err) {
        return () => {};
      }
    },

    /**
     * Restablece todos los datos en Cloud Firestore:
     * - Elimina todas las evaluaciones acumuladas en 'results'
     * - Re-siembra los 2 resultados oficiales de demo (Álvaro y Leonardo)
     * - Restablece el podio a no visible
     * - Restablece el estado en vivo a 'En espera'
     */
    async resetAll() {
      if (!this.init()) return false;

      try {
        // 1. Borrar todos los documentos de la colección 'results'
        const snapshot = await db.collection('results').get();
        if (!snapshot.empty) {
          const batch = db.batch();
          snapshot.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();
        }

        // 2. Restablecer podio a oculto
        await this.setPodiumStatus(false);

        // 3. Restablecer monitor en vivo
        await db.collection('settings').doc('live_state').set({
          advisor: 'En espera',
          step: 'Sin actividad',
          detail: 'Esperando que un asesor inicie su evaluación...',
          type: 'INFO',
          errors: 0,
          time: new Date().toLocaleTimeString('es-PE'),
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('🔥 [Firebase] Colección results limpiada a 0 evaluaciones y configuración restablecida.');
        return true;
      } catch (err) {
        console.error('[Firebase Error] Error al restablecer datos en Firestore:', err);
        return false;
      }
    }
  };

  window.UyapayServices.Firebase = FirebaseService;
})();
