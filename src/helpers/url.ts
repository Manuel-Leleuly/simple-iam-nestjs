import { Request } from 'express';

export class UrlHelpers {
  static getFullUrl = (req: Request): string => {
    return `${req.protocol}://${req.get('Host')}${req.originalUrl}`;
  };
}
