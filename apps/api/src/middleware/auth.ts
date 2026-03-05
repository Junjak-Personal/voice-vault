import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { supabase } from '../services/supabase.js';

export interface AuthEnv {
  Variables: {
    userId: string;
    accessToken: string;
  };
}

export async function authMiddleware(c: Context<AuthEnv>, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Missing authorization header' });
  }

  const token = authHeader.slice(7);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new HTTPException(401, { message: 'Invalid or expired token' });
  }

  c.set('userId', user.id);
  c.set('accessToken', token);
  await next();
}
