import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
const router = Router();
const tokenFor = user => jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'dev_secret_change_me', { expiresIn: '7d' });

router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name?.trim() || !email?.trim() || !password || password.length < 6)
    return res.status(400).json({ error: 'Name, valid email and password (6+ characters) are required' });
  try {
    const result = db.prepare('INSERT INTO users(name,email,password) VALUES(?,?,?)')
      .run(name.trim(), email.trim().toLowerCase(), bcrypt.hashSync(password, 10));
    const user = db.prepare('SELECT id,name,email,bio,created_at FROM users WHERE id=?').get(result.lastInsertRowid);
    res.status(201).json({ token: tokenFor(user), user });
  } catch (e) {
    res.status(409).json({ error: e.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 'Email is already registered' : 'Could not create account' });
  }
});
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email=?').get((email || '').trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password || '', user.password)) return res.status(401).json({ error: 'Incorrect email or password' });
  const safe = { id: user.id, name: user.name, email: user.email, bio: user.bio, created_at: user.created_at };
  res.json({ token: tokenFor(safe), user: safe });
});
export default router;
