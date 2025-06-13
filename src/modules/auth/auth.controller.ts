import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthResponseDto, SignInDto } from 'src/models/auth';
import { ErrorMessage } from 'src/models/error';
import { Response, WithResponse } from 'src/models/pagination';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Controller('/v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign In user',
    description: 'Exchange username and password with access token',
    tags: ['Auth'],
  })
  @ApiBody({ type: SignInDto })
  @ApiOkResponse({
    description: 'Login Success',
    type: WithResponse(AuthResponseDto),
  })
  @ApiUnauthorizedResponse({
    description: 'Username and/or password is invalid',
    type: ErrorMessage,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Error',
    type: ErrorMessage,
  })
  async signIn(@Body() request: SignInDto): Promise<Response<AuthResponseDto>> {
    const result = await this.authService.signIn(request);
    return {
      data: result,
    };
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh token',
    description: 'Create new access token using refresh token',
    tags: ['Auth'],
  })
  @ApiOkResponse({
    description: 'New access token created successfully',
    type: WithResponse(AuthResponseDto),
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Error',
    type: ErrorMessage,
  })
  async refreshToken(
    @Headers() headers: Record<string, string>,
  ): Promise<Response<AuthResponseDto>> {
    const result = await this.authService.refreshToken(
      headers['authorization'],
    );
    return {
      data: result,
    };
  }
}
