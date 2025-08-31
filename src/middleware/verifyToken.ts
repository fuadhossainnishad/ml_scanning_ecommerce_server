import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import AppError from '../app/error/AppError';
import config from '../app/config';
import { UserPayload } from '../types/express';

const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'No token provided or invalid format',
      '',
    );
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(
      token,
      config.jwt_access_secret as string,
    ) as UserPayload;

    if (!decoded.id || !decoded.email || !decoded.role) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid token payload', '');
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid or expired token', '');
  }
};

export default verifyToken;
