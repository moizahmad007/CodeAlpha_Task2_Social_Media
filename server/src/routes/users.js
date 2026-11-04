import { Router } from 'express';
import db from '../db.js';
import { auth } from '../middleware/auth.js';
const router = Router();

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const user = db.prepare(`SELECT id,name,email,bio,created_at,
    (SELECT COUNT(*) FROM follows WHERE following_id=users.id) followers,
    (SELECT COUNT(*) FROM follows WHERE follower_id=users.id) following
    FROM users WHERE id=?`).get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const posts = db.prepare(`SELECT p.id,p.content,p.created_at,
    (SELECT COUNT(*) FROM likes WHERE post_id=p.id) likes_count,
    (SELECT COUNT(*) FROM comments WHERE post_id=p.id) comments_count
    FROM posts p WHERE p.user_id=? ORDER BY p.created_at DESC`).all(id);
  res.json({ user, posts });
});

router.put('/me', auth, (req, res) => {
  const name = (req.body.name || '').trim();
  const bio = (req.body.bio || '').trim().slice(0, 240);
  if (!name) return res.status(400).json({ error: 'Name is required' });
  db.prepare('UPDATE users SET name=?,bio=? WHERE id=?').run(name, bio, req.user.id);
  res.json(db.prepare('SELECT id,name,email,bio,created_at FROM users WHERE id=?').get(req.user.id));
});

router.post('/:id/follow', auth, (req, res) => {
  const target = Number(req.params.id);
  if (target === req.user.id) return res.status(400).json({ error: 'You cannot follow yourself' });
  if (!db.prepare('SELECT id FROM users WHERE id=?').get(target)) return res.status(404).json({ error: 'User not found' });
  const exists = db.prepare('SELECT 1 FROM follows WHERE follower_id=? AND following_id=?').get(req.user.id, target);
  if (exists) db.prepare('DELETE FROM follows WHERE follower_id=? AND following_id=?').run(req.user.id, target);
  else db.prepare('INSERT INTO follows(follower_id,following_id) VALUES(?,?)').run(req.user.id, target);
  res.json({ following: !exists });
});
router.get('/:id/follow-status', auth, (req, res) => {
  const row = db.prepare('SELECT 1 FROM follows WHERE follower_id=? AND following_id=?').get(req.user.id, Number(req.params.id));
  res.json({ following: !!row });
});
router.get('/', auth, (req, res) => {
  const users = db.prepare(`SELECT id,name,bio,
    (SELECT COUNT(*) FROM follows WHERE following_id=users.id) followers
    FROM users WHERE id<>? ORDER BY followers DESC LIMIT 8`).all(req.user.id);
  res.json(users);
});
export default router;
