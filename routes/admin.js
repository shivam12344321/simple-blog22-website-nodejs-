const express = require('express');
const { isAuthenticated } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Dashboard
router.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    const connection = await db.getConnection();

    const [posts] = await connection.query(
      'SELECT id, title, created_at, updated_at FROM posts WHERE author_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    connection.release();

    res.render('dashboard', { posts, user: req.user });
  } catch (err) {
    console.error('Error fetching dashboard:', err);
    res.status(500).send('Error loading dashboard');
  }
});

module.exports = router;