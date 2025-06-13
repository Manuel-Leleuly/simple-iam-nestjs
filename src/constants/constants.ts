import { z } from 'zod';

export const ACCESS_TOKEN_EXPIRE_SECONDS = 3600;
export const REFRESH_TOKEN_EXPIRE_SECONDS = 86400;

export const CACHE_KEYS = z.enum(['LOGGED_IN_USER']).Enum;
