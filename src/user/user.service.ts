import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from 'src/common/prisma.service';
import { ValidationService } from 'src/common/validation.service';
import {
  GetUserListQueryDto,
  GetUserListQuerySchema,
  UserCreateDto,
  UserCreateSchema,
  UserResponseDto,
  UserUpdateDto,
  UserUpdateSchema,
} from 'src/models/user';
import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';

@Injectable()
export class UserService {
  constructor(
    private validationService: ValidationService,
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private prismaService: PrismaService,
  ) {}

  async createUser(request: UserCreateDto): Promise<UserResponseDto> {
    this.logger.debug(`Create new user: ${JSON.stringify(request, null, 2)}`);
    const createUserRequest = this.validationService.validate(
      UserCreateSchema,
      request,
    );

    const totalUserWithSameUsername = await this.prismaService.user.count({
      where: {
        username: createUserRequest.username,
      },
    });

    if (totalUserWithSameUsername) {
      throw new HttpException(
        'Username already exists',
        HttpStatus.BAD_REQUEST,
      );
    }

    createUserRequest.password = await bcrypt.hash(request.password, 10);

    let newId = uuidV4().replaceAll('-', '');
    // TODO: find a better way to make sure the id is unique
    while (true) {
      const totalUserWithSameId = await this.prismaService.user.count({
        where: {
          id: newId,
        },
      });
      if (!totalUserWithSameId) break;
      newId = uuidV4().replaceAll('-', '');
    }

    return await this.prismaService.user.create({
      data: {
        ...createUserRequest,
        id: newId,
      },
      omit: {
        password: true,
        deleted_at: true,
      },
    });
  }

  async getUserList(searchParams: GetUserListQueryDto): Promise<{
    data: UserResponseDto[];
    hasNext: boolean;
  }> {
    this.logger.debug(
      `Get user list: ${JSON.stringify(searchParams, null, 2)}`,
    );

    const { email, firstName, lastName, limit, offset } =
      this.validationService.validate(GetUserListQuerySchema, searchParams);

    const users = await this.prismaService.user.findMany({
      omit: {
        password: true,
        deleted_at: true,
      },
      where: {
        first_name: {
          contains: firstName ?? undefined,
        },
        last_name: {
          contains: lastName ?? undefined,
        },
        email: email ?? undefined,
        deleted_at: null,
      },
      take: limit ? +limit : 10,
      skip: offset ? +offset : 0,
      orderBy: {
        created_at: 'desc',
      },
    });

    let hasNext = true;
    const nextUsersCount = await this.prismaService.user.count({
      where: {
        first_name: {
          contains: firstName ?? undefined,
        },
        last_name: {
          contains: lastName ?? undefined,
        },
        email: email ?? undefined,
      },
      take: 1,
      skip: (offset ? +offset : 0) + 1,
    });
    if (!nextUsersCount) hasNext = false;

    return {
      data: users,
      hasNext,
    };
  }

  async getUserDetail(userId: string): Promise<UserResponseDto> {
    this.logger.debug(`Get user detail: ${userId}`);

    const user = await this.prismaService.user.findFirst({
      where: {
        id: userId,
      },
      omit: {
        password: true,
        deleted_at: true,
      },
    });

    if (!user) {
      throw new HttpException(
        {
          message: `User ${userId} not found`,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return user;
  }

  async updateUserById(
    userId: string,
    request: UserUpdateDto,
  ): Promise<UserResponseDto> {
    this.logger.debug(
      `update user by id: ${userId} => ${JSON.stringify(request, null, 2)}`,
    );

    const userUpdateRequest = this.validationService.validate(
      UserUpdateSchema,
      request,
    );

    const user = await this.prismaService.user.findFirst({
      where: { id: userId },
    });
    if (!user) {
      throw new HttpException(
        {
          message: `User ${userId} not found`,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return await this.prismaService.user.update({
      where: { id: userId },
      data: {
        first_name: userUpdateRequest.first_name ?? undefined,
        last_name: userUpdateRequest.last_name ?? undefined,
        username: userUpdateRequest.username ?? undefined,
      },
      omit: { password: true, deleted_at: true },
    });
  }

  async deleteUserById(userId: string): Promise<boolean> {
    this.logger.debug(`Delete user by id: ${userId}`);

    const user = await this.prismaService.user.findFirst({
      where: { id: userId },
    });
    if (!user) {
      throw new HttpException(
        {
          message: `User ${userId} not found`,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        deleted_at: new Date(),
      },
    });

    return true;
  }
}
