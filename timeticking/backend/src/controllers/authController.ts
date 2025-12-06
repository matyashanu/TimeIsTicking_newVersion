import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

interface UserRecord {
  id: string;
  username: string;
  email: string;
  hashedPassword: string;
  emailVerified: boolean;
  emailVerificationToken?: string;
}

// In-memory user store (note: non-persistent)
const users: UserRecord[] = [];

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

async function createTransporter() {
  try {
    // Use a real SMTP in production. For dev, use ethereal test account
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } catch (e) {
    // fallback to json transport
    return nodemailer.createTransport({ jsonTransport: true } as any);
  }
}

export async function signup(req: Request, res: Response) {
  const { username, email, password } = req.body as { username?: string; email?: string; password?: string };
  if (!username || username.length < 3) return res.status(400).json({ message: 'Username must be at least 3 characters' });
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ message: 'Valid email required' });
  if (!password || password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });

  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) return res.status(400).json({ message: 'Email already in use' });

  const hashed = await bcrypt.hash(password, 10);
  const user: UserRecord = {
    id: uuid(),
    username,
    email,
    hashedPassword: hashed,
    emailVerified: true, // Auto-verify for now (no email required)
  };
  users.push(user);

  // Issue JWT immediately instead of sending verification email
  const token = jwt.sign({ sub: user.id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  return res.status(201).json({ message: 'Signup successful', token });
}

export async function verifyEmail(req: Request, res: Response) {
  const token = req.query.token as string;
  if (!token) return res.status(400).json({ message: 'Missing token' });
  const user = users.find((u) => u.emailVerificationToken === token);
  if (!user) return res.status(404).json({ message: 'Token not found' });
  user.emailVerified = true;
  delete user.emailVerificationToken;
  return res.json({ message: 'Email verified' });
}

export async function login(req: Request, res: Response) {
  const { identifier, password } = req.body as { identifier?: string; password?: string };
  if (!identifier || !password) return res.status(400).json({ message: 'Identifier and password required' });
  const lower = identifier.toLowerCase();
  // allow login by email OR username
  const user = users.find((u) => u.email.toLowerCase() === lower || u.username.toLowerCase() === lower);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.hashedPassword);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ sub: user.id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  return res.json({ token });
}
