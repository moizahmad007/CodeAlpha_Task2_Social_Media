import { Router } from 'express';
import db from '../db.js';
import { auth } from '../middleware/auth.js';
const router = Router();
router.delete('/:id', auth, (req, res) => {
  const result = db.prepare('DELETE FROM comments WHERE id=? AND user_id=?').run(Number(req.params.id), req.user.id);
  if (!result.changes) return res.status(404).json({ error: 'Comment not found or not yours' });
  res.json({ success: true });
});
export default router;
