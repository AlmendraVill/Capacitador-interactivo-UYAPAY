/**
 * Rutas de Base de Conocimiento (FAQs y Reglas de Negocio)
 * Implementa CAP-05, CAP-06, ADM-04, RF-017, RF-018, RF-045, RF-046.
 */
const express = require('express');

function createKnowledgeRouter(db, authMiddleware, adminMiddleware) {
  const router = express.Router();

  // 1. Listar FAQs operativas (RF-017)
  router.get('/faqs', authMiddleware, (req, res) => {
    try {
      const { category } = req.query;
      let query = "SELECT * FROM faqs WHERE status = 'active'";
      const params = [];

      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }
      query += ' ORDER BY order_num ASC, category ASC';

      const faqs = db.prepare(query).all(...params);
      res.json(faqs);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 2. Crear nueva FAQ (Admin/Editor) (RF-045)
  router.post('/faqs', adminMiddleware, (req, res) => {
    try {
      const { category, question, answer, orderNum = 1 } = req.body;
      if (!category || !question || !answer) {
        return res.status(400).json({ success: false, message: 'Categoría, pregunta y respuesta son obligatorias.' });
      }

      const id = 'faq-' + Date.now();
      db.prepare(`
        INSERT INTO faqs (id, category, question, answer, order_num)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, category.trim(), question.trim(), answer.trim(), orderNum);

      res.status(201).json({ success: true, message: 'Pregunta frecuente creada con éxito.', id });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 3. Listar Reglas de Negocio oficiales (RF-018)
  router.get('/rules', authMiddleware, (req, res) => {
    try {
      const { category } = req.query;
      let query = "SELECT * FROM business_rules WHERE status = 'active'";
      const params = [];

      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }
      query += ' ORDER BY order_num ASC';

      const rules = db.prepare(query).all(...params);
      res.json(rules);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 4. Crear nueva Regla de Negocio (Admin/Editor) (RF-046)
  router.post('/rules', adminMiddleware, (req, res) => {
    try {
      const { category, title, content, orderNum = 1 } = req.body;
      if (!category || !title || !content) {
        return res.status(400).json({ success: false, message: 'Categoría, título y contenido son obligatorios.' });
      }

      const id = 'rule-' + Date.now();
      db.prepare(`
        INSERT INTO business_rules (id, category, title, content, order_num)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, category.trim(), title.trim(), content.trim(), orderNum);

      res.status(201).json({ success: true, message: 'Regla de negocio creada con éxito.', id });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  return router;
}

module.exports = { createKnowledgeRouter };
