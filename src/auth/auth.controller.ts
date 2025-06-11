import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthResponseDto, SignInDto } from 'src/models/auth';
import { ErrorMessage } from 'src/models/error';
import { Response, WithResponse } from 'src/models/pagination';
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
}
