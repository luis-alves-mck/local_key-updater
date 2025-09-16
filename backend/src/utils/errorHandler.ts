import { Response } from 'express';

/**
 * Handle errors and send appropriate response
 * @param {Response} res - Express response object
 * @param {unknown} error - Error object
 */
export const handleError = (res: Response, error: unknown): void => {
  console.error(error);
  
  if (error instanceof Error) {
    if (error.name === 'ValidationError') {
      res.status(400).json({
        message: 'Validation Error',
        errors: Object.values((error as any).errors).map((err: any) => err.message)
      });
      return;
    }
    
    if ((error as any).code === 11000) {
      res.status(400).json({
        message: 'Duplicate key error',
        field: Object.keys((error as any).keyPattern)[0]
      });
      return;
    }
  }
  
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
  });
}; 