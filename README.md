# CodeAlpha Task 2 — Social Media Platform

A full-stack social media application built with React, Vite, Node.js, Express and SQLite.

## Features
- Register and log in with hashed passwords and JWT authentication
- User profiles with bio and profile editing
- Create and delete your own posts
- Global feed with newest posts first
- Like / unlike posts
- Comment on posts and delete your own comments
- Follow / unfollow users
- Profile pages with follower/following counts and user posts
- Responsive layout

## Requirements
- Node.js 18+
- npm

## Run locally

### 1. Backend
```bash
cd server
cp .env.example .env
npm install
npm run dev
```
Backend runs at `http://localhost:5000`.

### 2. Frontend
Open a second terminal:
```bash
cd client
npm install
npm run dev
```
Open the Vite URL shown in the terminal (normally `http://localhost:5173`).

## Demo flow
1. Register two accounts in separate browser sessions.
2. Create posts from each account.
3. Like and comment on posts.
4. Open another user's profile and follow them.
5. Check the feed and profile follower/following counts.

## API overview
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/:id`
- `PUT /api/users/me`
- `POST /api/users/:id/follow`
- `GET /api/posts`
- `POST /api/posts`
- `DELETE /api/posts/:id`
- `POST /api/posts/:id/like`
- `POST /api/posts/:id/comments`
- `DELETE /api/comments/:id`

## Notes
- SQLite database is created automatically at `server/data/social.db` and seeded with demo accounts/posts on first run.
- Passwords are hashed using bcrypt; protected API routes use JWT.
- This is a learning/demo application. Add production-grade validation, rate limiting, moderation, image storage and deployment secrets before public deployment.
