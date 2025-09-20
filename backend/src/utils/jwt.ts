import jwt from 'jsonwebtoken';
import { IUser } from '@/models/User';

export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
}

export const generateToken = (user: IUser): string => {
  const payload: JwtPayload = {
    userId: user._id as string,
    email: user.email,
    username: user.username,
  };

  const secret = process.env.JWT_SECRET || 'fallback-secret-key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

export const verifyToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_SECRET || 'fallback-secret-key';
  return jwt.verify(token, secret) as JwtPayload;
};

export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};