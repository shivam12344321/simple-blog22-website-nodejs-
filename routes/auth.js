const express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const { isAuthenticated, isGuest } = require('../middleware/auth');
const { validateRegister, handleValidationErrors } = require('../middleware/validation');
const db = require('../config/database');

const router = express.Router();

// Register page
router.get('/register', isGuest, (req, res) => {
  res.render('register', { errors: [] });
});

// Register post
router.post('/register', isGuest, validateRegister, handleValidationErrors, async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const connection = await db.getConnection();

    // Check if user already exists
    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUsers.length > 0) {
      connection.release();
      return res.status(400).render('register', { 
        errors: [{ msg: 'Email or username already exists' }]
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await connection.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    connection.release();

    res.redirect('/auth/login?success=Registration successful. Please login.');
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).render('register', { 
      errors: [{ msg: 'Error registering user' }]
    });
  }
});

// Login page
router.get('/login', isGuest, (req, res) => {
  res.render('login', { message: req.query.success || '' });
});

// Login post
router.post('/login', isGuest, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/auth/login',
  failureMessage: true
}));

// Logout
router.get('/logout', isAuthenticated, (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.redirect('/');
  });
});

module.exports = router;