import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only';

router.post('/register', async (req, res) => {
  const { username, password, name, role } = req.body;
  
  if (!username || !password || !name) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  const userRole = role || 'officer';

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [username, hashedPassword, name, userRole]
    );
    
    const userId = result.rows[0].id;
    const token = jwt.sign({ id: userId, username, name, role: userRole }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ token, user: { id: userId, username, name, role: userRole } });
  } catch (error: any) {
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(400).json({ error: 'Username already exists' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
