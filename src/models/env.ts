import * as Joi from 'joi';
import { globalVar } from 'src/constants/env';

/**
 * Joi is only used for this schema
 * as the config requires it.
 *
 * For other schemas, please use zod
 */
export const EnvSchema = Joi.object({
  [globalVar.NODE_ENV]: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  [globalVar.CLIENT_SECRET]: Joi.string().min(10).required(),
  [globalVar.DATABASE_URL]: Joi.string().required(),
});
