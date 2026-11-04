import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../data');
fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, 'social.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  bio TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS likes (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id, post_id)
);
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS follows (
  follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(follower_id, following_id),
  CHECK(follower_id <> following_id)
);
`);

const count = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
if (!count) {
  const password = bcrypt.hashSync('Demo123!', 10);
  const insertUser = db.prepare('INSERT INTO users(name,email,password,bio) VALUES(?,?,?,?)');
  const a = insertUser.run('Ayesha Khan', 'ayesha@demo.local', password, 'Frontend developer | Coffee lover ☕').lastInsertRowid;
  const b = insertUser.run('Hamza Ali', 'hamza@demo.local', password, 'Building things one line at a time.').lastInsertRowid;
  const insertPost = db.prepare('INSERT INTO posts(user_id,content) VALUES(?,?)');
  const p1 = insertPost.run(a, 'Just launched my first portfolio website! Excited for what comes next 🚀').lastInsertRowid;
  insertPost.run(b, 'Learning full-stack development with Node.js and React. What are you building this week?');
  db.prepare('INSERT INTO follows(follower_id,following_id) VALUES(?,?)').run(b, a);
  db.prepare('INSERT INTO likes(user_id,post_id) VALUES(?,?)').run(b, p1);
  db.prepare('INSERT INTO comments(user_id,post_id,content) VALUES(?,?,?)').run(b, p1, 'Congratulations! Looks great.');
}
export default db;
