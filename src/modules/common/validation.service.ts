import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ZodType } from 'zod';

@Injectable()
export class ValidationService {
  validate<T>(zodType: ZodType<T>, data: T): T {
    const result = zodType.safeParse(data);
    if (!result.success) {
      console.log({ errors: JSON.stringify(result.error.errors, null, 2) });
      const errors = result.error.errors.map((error) => {
        const errorPath = error.path.join('::');
        return error.message.toLowerCase().replace('string', errorPath);
      });
      throw new HttpException(
        {
          messages: errors,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    return result.data;
  }
}
