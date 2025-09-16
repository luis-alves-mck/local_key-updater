import { Request, Response, NextFunction } from 'express';

export const validateKey = (req: Request, res: Response, next: NextFunction) => {
  const { key_name, key_secrets_data: { api_key } } = req.body;

  if (!key_name || typeof key_name !== 'string') {
    return res.status(400).json({ error: 'Key name is required and must be a string' });
  }

  if (!api_key || typeof api_key !== 'string') {
    return res.status(400).json({ error: 'API key is required and must be a string' });
  }

  next();
}; 