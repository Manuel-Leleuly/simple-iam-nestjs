import { ApiProperty, OmitType } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { PrismaModel } from 'src/_gen/prisma-class';
import { z } from 'zod';
import { mustAlpha, mustAlphaNumeric } from './models';

export class UserResponseDto extends OmitType(PrismaModel.User, [
  'password',
  'deleted_at',
] as const) {}

export const UserCreateSchema = z.object({
  first_name: z
    .string()
    .min(2)
    .max(50)
    .refine(...mustAlpha),
  last_name: z
    .string()
    .min(2)
    .max(50)
    .nullish()
    .refine(...mustAlpha),
  username: z
    .string()
    .min(5)
    .refine(...mustAlphaNumeric),
  email: z.string().email(),
  password: z.string().min(8),
});

export class UserCreateDto extends createZodDto(UserCreateSchema) {}

export const UserUpdateSchema = z.object({
  first_name: z
    .string()
    .min(2)
    .max(50)
    .refine(...mustAlpha)
    .optional(),
  last_name: z
    .string()
    .min(2)
    .max(50)
    .refine(...mustAlpha)
    .optional(),
  username: z
    .string()
    .min(5)
    .refine(...mustAlphaNumeric)
    .optional(),
});

export class UserUpdateDto extends createZodDto(UserUpdateSchema) {}

export const GetUserListQuerySchema = z.object({
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  email: z.string().email().nullish(),
  offset: z.number().positive().nullish(),
  limit: z.number().positive().nullish(),
});

export class GetUserListQueryDto extends createZodDto(GetUserListQuerySchema) {}

export class DeleteUserDto {
  @ApiProperty()
  data: boolean;
}
