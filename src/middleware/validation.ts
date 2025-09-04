import { Request, Response, NextFunction } from 'express';

export const validateUUID = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.params[paramName];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!value || !uuidRegex.test(value)) {
      res.status(400).json({
        error: `Invalid ${paramName}. Must be a valid UUID.`
      });
      return;
    }
    
    next();
  };
};

export const validateJSON = (req: Request, res: Response, next: NextFunction): void => {
  if (req.is('application/json') && Object.keys(req.body).length === 0) {
    res.status(400).json({
      error: 'Request body must contain valid JSON'
    });
    return;
  }
  
  next();
};