const express = require('express');
const { isAuthenticated } = require('../middleware/auth');
const { validatePost, handleValidationErrors } = require('../middleware/validation');
const db = require('../config/database');

const router = express.Router();

// Create post page
router.get('/create', isAuthenticated, (req, res) => {
  res.render('create-post', { errors: [] });
});

// Create post
router.post('/create', isAuthenticated, validatePost, handleValidationErrors, async (req, res) => {
  const { title, content } = req.body;

  try {
    const connection = await db.getConnection();

    await connection.query(
      'INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)',
      [title, content, req.user.id]
    );

    connection.release();
    res.redirect('/');
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).render('create-post', { 
      errors: [{ msg: 'Error creating post' }]
    });
  }
});

// Edit post page
router.get('/edit/:id', isAuthenticated, async (req, res) => {
  try {
    const connection = await db.getConnection();

    const [posts] = await connection.query(
      'SELECT * FROM posts WHERE id = ? AND author_id = ?',
      [req.params.id, req.user.id]
    );

    connection.release();

    if (posts.length === 0) {
      return res.status(403).send('Not authorized to edit this post');
    }

    res.render('edit-post', { post: posts[0], errors: [] });
  } catch (err) {
    console.error('Error fetching post:', err);
    res.status(500).send('Error loading post');
  }
});

// Update post
router.post('/edit/:id', isAuthenticated, validatePost, handleValidationErrors, async (req, res) => {
  const { title, content } = req.body;

  try {
    const connection = await db.getConnection();

    // Check if user owns the post
    const [posts] = await connection.query(
      'SELECT author_id FROM posts WHERE id = ?',
      [req.params.id]
    );

    if (posts.length === 0 || posts[0].author_id !== req.user.id) {
      connection.release();
      return res.status(403).send('Not authorized to edit this post');
    }

    await connection.query(
      'UPDATE posts SET title = ?, content = ?, updated_at = NOW() WHERE id = ?',
      [title, content, req.params.id]
    );

    connection.release();
    res.redirect(`/post/${req.params.id}`);
  } catch (err) {
    console.error('Error updating post:', err);
    res.status(500).send('Error updating post');
  }
});

// Delete post
router.post('/delete/:id', isAuthenticated, async (req, res) => {
  try {
    const connection = await db.getConnection();

    // Check if user owns the post
    const [posts] = await connection.query(
      'SELECT author_id FROM posts WHERE id = ?',
      [req.params.id]
    );

    if (posts.length === 0 || posts[0].author_id !== req.user.id) {
      connection.release();
      return res.status(403).send('Not authorized to delete this post');
    }

    await connection.query('DELETE FROM posts WHERE id = ?', [req.params.id]);

    connection.release();
    res.redirect('/');
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).send('Error deleting post');
  }
});

module.exports = router;