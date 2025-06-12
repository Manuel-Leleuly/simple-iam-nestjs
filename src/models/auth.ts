import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const SignInSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export class SignInDto extends createZodDto(SignInSchema) {}

export class AuthResponseDto {
  @ApiProperty()
  access_token: string;
}

export const TokenPayloadSchema = z.object({
  id: z.string().nonempty(),
  email: z.string().email().nonempty(),
  exp: z.number().positive(),
  iat: z.number().positive(),
});

export class TokenPayloadDto extends createZodDto(TokenPayloadSchema) {}
