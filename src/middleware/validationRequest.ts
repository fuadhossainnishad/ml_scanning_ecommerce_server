import { NextFunction, Request, Response } from 'express';
import { AnyZodObject } from 'zod';
import catchAsync from '../utility/catchAsync';
import httpStatus from 'http-status';
import AppError from '../app/error/AppError';
import console from 'console';

const validationRequest = (schema: AnyZodObject) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('validationRequest - Raw Body:', req.body!);
      console.log('validationRequest - Raw Body Type:', typeof req.body?.data);

      // Parse JSON string in req.body.data if it exists
      if (!req.body.data) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          'Missing "data" field in request body',
          '',
        );
      }
      if (typeof req.body?.data === 'string') {
        try {
          req.body.data = JSON.parse(req.body.data);
          console.log('validationRequest - After Parse:', req.body.data);
        } catch (error) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            'Invalid JSON format in data field',
            '',
          );
        }
      }

      // Construct image object from req.files
      // if (req.files) {
      //   const files = req.files as {
      //     [fieldname: string]: Express.Multer.File[];
      //   };
      //   const imagePaths = files['image']?.map((file) => file.path) || [];
      //   const thumbnailPath = files['thumbnail']?.[0]?.path || '';
      //   req.body.image = {
      //     images: imagePaths,
      //     thumbnail: thumbnailPath,
      //   };
      //   console.log('validationRequest - Image Data:', req.body.image);
      // }

      // Validate the request
      await schema.parseAsync({
        body: {
          data: req.body.data,
          // image: req.body.image,
        },
        // cookies: req.cookies,
      });
      console.log('validationRequest - Parsed Body:', {
        data: req.body.data,
        // image: req.body.image,
      });
      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(
          new AppError(
            httpStatus.BAD_REQUEST,
            'Zod Validation error',
            error instanceof Error ? error.message : 'Unknown error',
          ),
        );
      }
    }
  });
};

export default validationRequest;
