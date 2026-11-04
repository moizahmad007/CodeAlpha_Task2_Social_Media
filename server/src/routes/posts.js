import { Router } from 'express';
import db from '../db.js';
import { auth } from '../middleware/auth.js';
const router = Router();

router.get('/', (req, res) => {
  const viewer = Number(req.query.viewer || 0);
  const posts = db.prepare(`SELECT p.id,p.user_id,p.content,p.created_at,u.name,u.bio,
    (SELECT COUNT(*) FROM likes WHERE post_id=p.id) likes_count,
    (SELECT COUNT(*) FROM comments WHERE post_id=p.id) comments_count,
    EXISTS(SELECT 1 FROM likes WHERE post_id=p.id AND user_id=?) liked
    FROM posts p JOIN users u ON u.id=p.user_id
    ORDER BY p.created_at DESC LIMIT 100`).all(viewer);
  const comments = db.prepare(`SELECT c.id,c.post_id,c.user_id,c.content,c.created_at,u.name
    FROM comments c JOIN users u ON u.id=c.user_id
    WHERE c.post_id IN (SELECT id FROM posts ORDER BY created_at DESC LIMIT 100)
    ORDER BY c.created_at ASC`).all();
  res.json({ posts, comments });
});

router.post('/', auth, (req, res) => {
  const content = (req.body.content || '').trim();
  if (!content || content.length > 1000) return res.status(400).json({ error: 'Post must be 1–1000 characters' });
  const result = db.prepare('INSERT INTO posts(user_id,content) VALUES(?,?)').run(req.user.id, content);
  res.status(201).json({ id: result.lastInsertRowid });
});
router.delete('/:id', auth, (req, res) => {
  const result = db.prepare('DELETE FROM posts WHERE id=? AND user_id=?').run(Number(req.params.id), req.user.id);
  if (!result.changes) return res.status(404).json({ error: 'Post not found or not yours' });
  res.json({ success: true });
});
router.post('/:id/like', auth, (req, res) => {
  const postId = Number(req.params.id);
  if (!db.prepare('SELECT id FROM posts WHERE id=?').get(postId)) return res.status(404).json({ error: 'Post not found' });
  const exists = db.prepare('SELECT 1 FROM likes WHERE user_id=? AND post_id=?').get(req.user.id, postId);
  if (exists) db.prepare('DELETE FROM likes WHERE user_id=? AND post_id=?').run(req.user.id, postId);
  else db.prepare('INSERT INTO likes(user_id,post_id) VALUES(?,?)').run(req.user.id, postId);
  res.json({ liked: !exists });
});
router.post('/:id/comments', auth, (req, res) => {
  const content = (req.body.content || '').trim();
  const postId = Number(req.params.id);
  if (!content || content.length > 500) return res.status(400).json({ error: 'Comment must be 1–500 characters' });
  if (!db.prepare('SELECT id FROM posts WHERE id=?').get(postId)) return res.status(404).json({ error: 'Post not found' });
  const result = db.prepare('INSERT INTO comments(user_id,post_id,content) VALUES(?,?,?)').run(req.user.id, postId, content);
  res.status(201).json({ id: result.lastInsertRowid });
});
export default router;
