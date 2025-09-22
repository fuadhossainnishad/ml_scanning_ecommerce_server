import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { TErrorSources } from '../interface/error.interface';
import handelZodError from '../app/error/handelZodError';
import handelValidationError from '../app/error/handelValidationError';
import handelCastError from '../app/error/handelCastError';
import handelDuplicateError from '../app/error/handelDuplicateError';
import AppError from '../app/error/AppError';
import config from '../app/config';


const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // default error
  let statusCode = 500;
  let message = err?.message;
  let errorSources: TErrorSources = [{ path: '', message: '' }];

  // zod validation error
  if (err instanceof ZodError) {
    const simplifiedError = handelZodError(err);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSources = simplifiedError?.errorSources;
  }
  // mongoose validation error
  else if (err?.name === 'ValidationError') {
    const simplifiedError = handelValidationError(err);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSources = simplifiedError?.errorSources;
  } else if (err?.name === 'CastError') {
    const simplifiedError = handelCastError(err);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSources = simplifiedError?.errorSources;
  } else if (err?.code === 11000) {
    const simplifiedError = handelDuplicateError(err);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSources = simplifiedError?.errorSources;
  } else if (err instanceof AppError) {
    statusCode = err?.statusCode;
    message = err?.message;
    errorSources = [{ path: '', message: err?.message }];
  } else if (err instanceof Error) {
    message = err?.message;
    errorSources = [{ path: '', message: err?.message }];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    stack: config.NODE_ENV === 'development' ? err?.stack : null,
  });
  next();
};

export default globalErrorHandler;
