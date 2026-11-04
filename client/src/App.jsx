import React, { createContext, useContext, useEffect, useState } from 'react';
import { Routes, Route, Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Home, UserRound, LogOut, Heart, MessageCircle, Users, Plus, Send, Trash2, Compass, Sparkles } from 'lucide-react';
import { api, getToken } from './api';

const AuthCtx = createContext(null);
const useAuth = () => useContext(AuthCtx);
function AuthProvider({ children }) {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('pulse_user')); } catch { return null; } });
  const login = data => { localStorage.setItem('pulse_token', data.token); localStorage.setItem('pulse_user', JSON.stringify(data.user)); setUser(data.user); };
  const logout = () => { localStorage.removeItem('pulse_token'); localStorage.removeItem('pulse_user'); setUser(null); };
  const updateUser = u => { localStorage.setItem('pulse_user', JSON.stringify(u)); setUser(u); };
  return <AuthCtx.Provider value={{ user, login, logout, updateUser }}>{children}</AuthCtx.Provider>;
}
function Guard({ children }) { return useAuth().user ? children : <Navigate to="/login" replace />; }
function Avatar({ name, size = 'normal' }) { return <div className={`avatar ${size}`}>{(name || '?').slice(0,1).toUpperCase()}</div>; }

function Layout({ children }) {
  const { user, logout } = useAuth();
  return <div className="app-shell"><header className="topbar"><Link to="/" className="brand"><span className="brand-mark">p</span> pulse</Link>
    <nav><Link to="/"><Home size={17}/> <span>Feed</span></Link><Link to="/discover"><Compass size={17}/> <span>Discover</span></Link>{user && <Link to={`/profile/${user.id}`}><UserRound size={17}/> <span>Profile</span></Link>}</nav>
    <div className="top-user">{user ? <><Avatar name={user.name}/><span>{user.name}</span><button className="icon-btn" title="Log out" onClick={logout}><LogOut size={18}/></button></> : <Link className="btn small" to="/login">Log in</Link>}</div>
  </header><main>{children}</main><footer>Made to connect. <span>© 2026 Pulse Social</span></footer></div>;
}
function AuthPage({ mode }) {
  const { user, login } = useAuth(); const nav = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'' }); const [error,setError] = useState(''); const [busy,setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;
  const change = e => setForm({ ...form, [e.target.name]: e.target.value });
  async function submit(e) { e.preventDefault(); setBusy(true); setError(''); try { const data = await api(`/auth/${mode}`, { method:'POST', body:JSON.stringify(form) }); login(data); nav('/'); } catch(err) { setError(err.message); } finally { setBusy(false); } }
  return <div className="auth-wrap"><div className="auth-card"><div className="brand auth-brand"><span className="brand-mark">p</span> pulse</div><h1>{mode === 'login' ? 'Welcome back' : 'Join the conversation'}</h1><p className="muted">{mode === 'login' ? 'Log in to catch up with your community.' : 'Create an account and share what matters.'}</p>
    <form onSubmit={submit}>{mode === 'register' && <label>Your name<input name="name" value={form.name} onChange={change} placeholder="e.g. Moiz Ahmad" required/></label>}<label>Email address<input name="email" type="email" value={form.email} onChange={change} placeholder="you@example.com" required/></label><label>Password<input name="password" type="password" minLength="6" value={form.password} onChange={change} placeholder="At least 6 characters" required/></label>
    {error && <div className="error">{error}</div>}<button className="btn full" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</button></form>
    <p className="switch-auth">{mode === 'login' ? "Don't have an account?" : 'Already have an account?'} <Link to={mode === 'login' ? '/register' : '/login'}>{mode === 'login' ? 'Sign up' : 'Log in'}</Link></p>
    {mode === 'login' && <div className="demo-note">Demo accounts: ayesha@demo.local / Demo123! &nbsp;·&nbsp; hamza@demo.local / Demo123!</div>}
  </div></div>;
}
function Composer({ onPosted }) {
  const { user } = useAuth(); const [content,setContent] = useState(''); const [error,setError] = useState('');
  async function post(e) { e.preventDefault(); try { await api('/posts',{method:'POST',body:JSON.stringify({content})}); setContent(''); setError(''); onPosted(); } catch(err) { setError(err.message); } }
  return <form className="composer card" onSubmit={post}><div className="composer-head"><Avatar name={user.name}/><span>Share something with your community</span></div><textarea value={content} onChange={e=>setContent(e.target.value)} maxLength="1000" placeholder="What's happening?" required/><div className="composer-foot">{error ? <span className="error">{error}</span> : <span className="muted">{content.length}/1000</span>}<button className="btn" disabled={!content.trim()}><Plus size={17}/> Publish</button></div></form>;
}
function PostCard({ post, comments, refresh }) {
  const { user } = useAuth(); const [comment,setComment] = useState(''); const [showComments,setShowComments] = useState(false); const [busy,setBusy] = useState(false);
  async function like() { await api(`/posts/${post.id}/like`,{method:'POST'}); refresh(); }
  async function sendComment(e) { e.preventDefault(); if (!comment.trim()) return; await api(`/posts/${post.id}/comments`,{method:'POST',body:JSON.stringify({content:comment})}); setComment(''); refresh(); setShowComments(true); }
  async function remove() { if (confirm('Delete this post?')) { await api(`/posts/${post.id}`,{method:'DELETE'}); refresh(); } }
  const postComments = comments.filter(c => c.post_id === post.id);
  return <article className="post card"><div className="post-head"><Avatar name={post.name}/><div className="post-author"><strong>{post.name}</strong><small>{new Date(post.created_at + (post.created_at.endsWith('Z')?'':'Z')).toLocaleString()}</small></div>{post.user_id === user.id && <button className="icon-btn danger" title="Delete post" onClick={remove}><Trash2 size={17}/></button>}</div>
    <p className="post-content">{post.content}</p><div className="post-stats"><span><Heart size={14}/> {post.likes_count} likes</span><button onClick={()=>setShowComments(!showComments)}><MessageCircle size={14}/> {post.comments_count} comments</button></div>
    <div className="post-actions"><button className={post.liked ? 'liked' : ''} onClick={like}><Heart size={18} fill={post.liked?'currentColor':'none'}/> {post.liked?'Liked':'Like'}</button><button onClick={()=>setShowComments(!showComments)}><MessageCircle size={18}/> Comment</button></div>
    {showComments && <div className="comments"><form onSubmit={sendComment} className="comment-form"><input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Write a comment…" maxLength="500"/><button className="send-btn" disabled={!comment.trim()}><Send size={17}/></button></form>{postComments.map(c=><div className="comment" key={c.id}><Avatar name={c.name} size="tiny"/><div className="comment-bubble"><strong>{c.name}</strong><p>{c.content}</p></div>{c.user_id===user.id && <button className="icon-btn" onClick={async()=>{await api(`/comments/${c.id}`,{method:'DELETE'});refresh();}}><Trash2 size={14}/></button>}</div>)}</div>}
  </article>;
}
function Feed() {
  const { user } = useAuth(); const [data,setData] = useState({posts:[],comments:[]}); const [loading,setLoading] = useState(true); const [error,setError] = useState('');
  async function refresh() { try { setData(await api(`/posts?viewer=${user.id}`)); setError(''); } catch(e) { setError(e.message); } finally { setLoading(false); } }
  useEffect(()=>{refresh();},[]);
  return <div className="page-grid"><section className="feed-column"><div className="page-heading"><div><span className="eyebrow">YOUR COMMUNITY</span><h1>Home feed</h1><p className="muted">See what people are sharing today.</p></div><span className="heading-icon"><Sparkles/></span></div><Composer onPosted={refresh}/>{error && <div className="error">{error}</div>}{loading ? <div className="card empty">Loading your feed…</div> : data.posts.length ? data.posts.map(p=><PostCard key={p.id} post={p} comments={data.comments} refresh={refresh}/>) : <div className="card empty">No posts yet. Be the first to share something!</div>}</section><Sidebar/></div>;
}
function Sidebar() {
  const { user } = useAuth(); const [people,setPeople] = useState([]);
  useEffect(()=>{api('/users').then(setPeople).catch(()=>{});},[]);
  return <aside className="sidebar"><div className="card side-card"><h3>About you</h3><div className="side-profile"><Avatar name={user.name} size="large"/><div><strong>{user.name}</strong><small>{user.email}</small></div></div><p className="muted">{user.bio || 'Add a bio to tell people a little about yourself.'}</p><Link className="text-link" to={`/profile/${user.id}`}>View your profile →</Link></div><div className="card side-card"><h3><Users size={17}/> People to follow</h3>{people.length ? people.slice(0,5).map(p=><div className="person-row" key={p.id}><Avatar name={p.name} size="small"/><div><strong>{p.name}</strong><small>{p.followers} followers</small></div><Link to={`/profile/${p.id}`} className="mini-link">View</Link></div>) : <p className="muted">New people will appear here.</p>}<Link className="text-link" to="/discover">Explore community →</Link></div></aside>;
}
function Discover() {
 const [people,setPeople]=useState([]); const [q,setQ]=useState('');
 useEffect(()=>{api('/users').then(setPeople).catch(()=>{});},[]);
 const filtered=people.filter(p=>p.name.toLowerCase().includes(q.toLowerCase()));
 return <div className="narrow"><div className="page-heading"><div><span className="eyebrow">FIND YOUR PEOPLE</span><h1>Discover</h1><p className="muted">Meet members of the Pulse community.</p></div></div><input className="search" placeholder="Search people…" value={q} onChange={e=>setQ(e.target.value)}/><div className="people-grid">{filtered.map(p=><div className="card person-card" key={p.id}><Avatar name={p.name} size="large"/><h3>{p.name}</h3><p className="muted">{p.bio || 'No bio added yet.'}</p><small>{p.followers} followers</small><Link className="btn outline full" to={`/profile/${p.id}`}>View profile</Link></div>)}</div></div>;
}
function Profile() {
 const { id }=useParams(); const { user, updateUser }=useAuth(); const [data,setData]=useState(null); const [following,setFollowing]=useState(false); const [editing,setEditing]=useState(false); const [form,setForm]=useState({name:'',bio:''}); const [error,setError]=useState('');
 async function load(){try{const d=await api(`/users/${id}`);setData(d);setForm({name:d.user.name,bio:d.user.bio||''});if(Number(id)!==user.id){const s=await api(`/users/${id}/follow-status`);setFollowing(s.following);}}catch(e){setError(e.message);}}
 useEffect(()=>{load();},[id]);
 if(error)return <div className="narrow card empty">{error}</div>; if(!data)return <div className="narrow card empty">Loading profile…</div>;
 const own=data.user.id===user.id;
 async function follow(){await api(`/users/${id}/follow`,{method:'POST'});load();}
 async function save(e){e.preventDefault();try{const u=await api('/users/me',{method:'PUT',body:JSON.stringify(form)});updateUser(u);setEditing(false);load();}catch(e){setError(e.message);}}
 return <div className="narrow"><div className="profile-cover"></div><section className="card profile-card"><div className="profile-top"><Avatar name={data.user.name} size="profile"/>{own?<button className="btn outline" onClick={()=>setEditing(!editing)}>Edit profile</button>:<button className="btn" onClick={follow}>{following?'Following':'＋ Follow'}</button>}</div>
 {editing?<form className="edit-form" onSubmit={save}><label>Name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label><label>Bio<textarea maxLength="240" value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})}/></label><button className="btn">Save changes</button></form>:<><h1>{data.user.name}</h1><p className="muted">{data.user.bio || 'This user has not added a bio yet.'}</p></>}<div className="profile-stats"><span><strong>{data.posts.length}</strong> posts</span><span><strong>{data.user.followers}</strong> followers</span><span><strong>{data.user.following}</strong> following</span></div></section>
 <div className="section-title"><h2>{own?'Your posts':`${data.user.name.split(' ')[0]}'s posts`}</h2></div>{data.posts.length?data.posts.map(p=><ProfilePost key={p.id} post={p}/>):<div className="card empty">No posts to show yet.</div>}</div>;
}
function ProfilePost({post}){return <article className="card profile-post"><p>{post.content}</p><small>{new Date(post.created_at+(post.created_at.endsWith('Z')?'':'Z')).toLocaleString()} · {post.likes_count} likes · {post.comments_count} comments</small></article>}

function AppRoutes(){return <Layout><Routes><Route path="/login" element={<AuthPage mode="login"/>}/><Route path="/register" element={<AuthPage mode="register"/>}/><Route path="/" element={<Guard><Feed/></Guard>}/><Route path="/discover" element={<Guard><Discover/></Guard>}/><Route path="/profile/:id" element={<Guard><Profile/></Guard>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></Layout>}
export default function App(){return <AuthProvider><AppRoutes/></AuthProvider>}
