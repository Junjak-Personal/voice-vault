import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authRoutes } from './routes/auth.js';
import { memoRoutes } from './routes/memos.js';
import { groupRoutes } from './routes/groups.js';
import { uploadRoutes } from './routes/upload.js';

export const app = new Hono().basePath('/api');

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  }),
);

app.route('/auth', authRoutes);
app.route('/memos', memoRoutes);
app.route('/groups', groupRoutes);
app.route('/upload', uploadRoutes);

app.get('/health', (c) => c.json({ status: 'ok' }));
