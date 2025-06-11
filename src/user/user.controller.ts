import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthGuard } from 'src/auth/auth.guard';
import { PaginationHelper } from 'src/helpers/pagination';
import { UrlHelpers } from 'src/helpers/url';
import { ErrorMessage, ValidationErrorMessage } from 'src/models/error';
import {
  Response,
  ResponseWithPagination,
  WithPagination,
  WithResponse,
} from 'src/models/pagination';
import {
  DeleteUserDto,
  UserCreateDto,
  UserResponseDto,
  UserUpdateDto,
} from 'src/models/user';
import { UserService } from './user.service';

@Controller('/v1/users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new user',
    description: 'Create new user',
    tags: ['User'],
  })
  @ApiBody({ type: UserCreateDto })
  @ApiCreatedResponse({
    description: 'The user is successfully created',
    type: WithResponse(UserResponseDto),
  })
  @ApiBadRequestResponse({
    description: 'Bad request',
    type: ValidationErrorMessage,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Error',
    type: ErrorMessage,
  })
  async createUser(
    @Body() request: UserCreateDto,
  ): Promise<Response<UserResponseDto>> {
    const result = await this.userService.createUser(request);
    return {
      data: result,
    };
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all users',
    description: 'Get all users',
    tags: ['User'],
  })
  @ApiQuery({ name: 'First Name', required: false, type: 'string' })
  @ApiQuery({ name: 'Last Name', required: false, type: 'string' })
  @ApiQuery({ name: 'Email', required: false, type: 'string' })
  @ApiQuery({ name: 'Offset', required: false, type: 'number' })
  @ApiQuery({ name: 'Limit', required: false, type: 'number' })
  @ApiOkResponse({
    description: 'Successfully get all users',
    type: WithPagination(UserResponseDto),
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorMessage,
  })
  @ApiBadRequestResponse({
    description: 'Bad request',
    type: ValidationErrorMessage,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Error',
    type: ErrorMessage,
  })
  async getUsers(
    @Req() req: Request,
    @Query('First Name') firstName?: string,
    @Query('Last Name') lastName?: string,
    @Query('Email') email?: string,
    @Query('Offset', new ParseIntPipe({ optional: true })) offset?: number,
    @Query('Limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<ResponseWithPagination<UserResponseDto>> {
    const { data: users, hasNext } = await this.userService.getUserList({
      firstName,
      lastName,
      email,
      offset,
      limit,
    });

    return {
      data: users,
      paging: PaginationHelper.getPagination(
        UrlHelpers.getFullUrl(req),
        hasNext,
      ),
    };
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get(':userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user detail by the user id',
    description: 'Get user detail by the user id',
    tags: ['User'],
  })
  @ApiOkResponse({
    description: 'Successfully get user detail',
    type: WithResponse(UserResponseDto),
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorMessage,
  })
  @ApiNotFoundResponse({
    description: 'User does not exist',
    type: ErrorMessage,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Error',
    type: ErrorMessage,
  })
  async getUserDetail(
    @Param('userId') userId: string,
  ): Promise<Response<UserResponseDto>> {
    const user = await this.userService.getUserDetail(userId);

    return {
      data: user,
    };
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Patch(':userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user by user id',
    description: 'Can only update first name, last name, and/or username',
    tags: ['User'],
  })
  @ApiBody({ type: UserUpdateDto })
  @ApiOkResponse({
    description: 'Update user successful',
    type: WithResponse(UserResponseDto),
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorMessage,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: ErrorMessage,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request',
    type: ValidationErrorMessage,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Error',
    type: ErrorMessage,
  })
  async updateUser(
    @Param('userId') userId: string,
    @Body() request: UserUpdateDto,
  ): Promise<Response<UserResponseDto>> {
    const updatedUser = await this.userService.updateUserById(userId, request);

    return {
      data: updatedUser,
    };
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Delete(':userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete user by user id',
    description: 'Soft delete',
    tags: ['User'],
  })
  @ApiOkResponse({
    description: 'Delete user successful',
    type: DeleteUserDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorMessage,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: ErrorMessage,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Error',
    type: ErrorMessage,
  })
  async deleteUser(
    @Param('userId') userId: string,
  ): Promise<Response<boolean>> {
    const result = await this.userService.deleteUserById(userId);

    return {
      data: result,
    };
  }
}
