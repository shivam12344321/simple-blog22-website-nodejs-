const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database Connection
const db = require('./config/database');

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, 
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true
  }
}));

// Passport Initialization
app.use(passport.initialize());
app.use(passport.session());

// Passport Local Strategy
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email, password, done) => {
    try {
      const connection = await db.getConnection();
      const [users] = await connection.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      connection.release();

      if (users.length === 0) {
        return done(null, false, { message: 'No user found with that email' });
      }

      const user = users[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return done(null, false, { message: 'Password is incorrect' });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const connection = await db.getConnection();
    const [users] = await connection.query(
      'SELECT id, username, email, created_at FROM users WHERE id = ?',
      [id]
    );
    connection.release();

    if (users.length === 0) {
      return done(null, false);
    }

    done(null, users[0]);
  } catch (err) {
    done(err);
  }
});

// Routes
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const adminRoutes = require('./routes/admin');

app.use('/auth', authRoutes);
app.use('/posts', postRoutes);
app.use('/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Home Route - List all posts
app.get('/', async (req, res) => {
  try {
    const connection = await db.getConnection();
    const [posts] = await connection.query(`
      SELECT p.id, p.title, p.content, p.created_at, 
             u.username, u.id as author_id
      FROM posts p
      JOIN users u ON p.author_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `);
    connection.release();

    res.render('index', { 
      posts,
      user: req.user 
    });
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).send('Error loading posts');
  }
});

// Single Post Route
app.get('/post/:id', async (req, res) => {
  try {
    const connection = await db.getConnection();
    
    const [posts] = await connection.query(`
      SELECT p.*, u.username, u.id as author_id
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (posts.length === 0) {
      connection.release();
      return res.status(404).send('Post not found');
    }

    const post = posts[0];

    // Get comments
    const [comments] = await connection.query(`
      SELECT c.*, u.username
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at DESC
    `, [req.params.id]);

    connection.release();

    res.render('post', { 
      post, 
      comments,
      user: req.user 
    });
  } catch (err) {
    console.error('Error fetching post:', err);
    res.status(500).send('Error loading post');
  }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════╗
║  📝 Blog Website Running               ║
║  Port: ${PORT}                              ║
║  URL: http://localhost:${PORT}             ║
║  Environment: ${process.env.NODE_ENV || 'development'}        ║
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});