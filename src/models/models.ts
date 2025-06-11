import { createArguments } from 'src/utils/utils';
import validator from 'validator';
import { z } from 'zod';

export const IdSchema = z.object({
  id: z.string(),
});

export const TimeRecordSchema = z.object({
  created_at: z.string(),
  updated_at: z.string(),
  // optional if the record is still kept after deleting
  deleted_at: z.string().nullish(),
});

// validator helpers
export const mustAlpha = createArguments(z.string().refine, validator.isAlpha, {
  message: 'String must only contain alphabet',
});

export const mustAlphaNumeric = createArguments(
  z.string().refine,
  validator.isAlphanumeric,
  {
    message: 'String must be alphanumeric',
  },
);
