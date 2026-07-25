import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User';
import { requireAuth } from '../middleware/requireAuth';
import {
  accessTokenCookie,
  refreshTokenCookie,
  clearedAccessTokenCookie,
  clearedRefreshTokenCookie,
} from '../lib/cookies';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function issueTokens(userId: string, role: 'user' | 'admin') {
  const accessToken = jwt.sign({ userId, role }, process.env.JWT_SECRET!, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId, role }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const { name, email, password } = parsed.data;

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ error: 'An account with that email already exists' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash, role: 'user' });

  const { accessToken, refreshToken } = issueTokens(user._id.toString(), user.role);
  res.cookie('accessToken', accessToken, accessTokenCookie);
  res.cookie('refreshToken', refreshToken, refreshTokenCookie);
  res.status(201).json({ id: user._id, email: user.email, name: user.name, role: user.role });
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const { email, password } = parsed.data;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  const { accessToken, refreshToken } = issueTokens(user._id.toString(), user.role);
  res.cookie('accessToken', accessToken, accessTokenCookie);
  res.cookie('refreshToken', refreshToken, refreshTokenCookie);
  res.json({ id: user._id, email: user.email, name: user.name, role: user.role });
});

router.post('/logout', (_req, res) => {
  res.clearCookie('accessToken', clearedAccessTokenCookie);
  res.clearCookie('refreshToken', clearedRefreshTokenCookie);
  res.status(204).end();
});

router.post('/refresh', (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).end();

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string; role: 'user' | 'admin' };
    const accessToken = jwt.sign({ userId: payload.userId, role: payload.role }, process.env.JWT_SECRET!, {
      expiresIn: '15m',
    });
    res.cookie('accessToken', accessToken, accessTokenCookie);
    res.status(200).end();
  } catch {
    res.status(401).end();
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user!.userId).select('email name role');
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ id: user._id, email: user.email, name: user.name, role: user.role });
});

export default router;
