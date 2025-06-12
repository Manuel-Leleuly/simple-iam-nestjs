import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as moment from 'moment';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from 'src/common/prisma.service';
import { ValidationService } from 'src/common/validation.service';
import { TOKEN_EXPIRY_SECONDS } from 'src/constants/constants';
import { globalVar } from 'src/constants/env';
import {
  AuthResponseDto,
  SignInDto,
  SignInSchema,
  TokenPayloadDto,
} from 'src/models/auth';
import { Logger } from 'winston';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private validationService: ValidationService,
    private configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
  ) {}

  async signIn(request: SignInDto): Promise<AuthResponseDto> {
    this.logger.debug(`Sign In: ${JSON.stringify(request, null, 2)}`);

    const signInRequest = this.validationService.validate(
      SignInSchema,
      request,
    );

    const user = await this.prismaService.user.findFirst({
      where: { username: signInRequest.username },
    });
    if (!user) {
      throw new HttpException(
        {
          message: 'Wrong username and/or password',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const isPasswordValid = await bcrypt.compare(
      signInRequest.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new HttpException(
        {
          message: 'Wrong username and/or password',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const payload: Omit<TokenPayloadDto, 'iat'> = {
      id: user.id,
      email: user.email,
      exp: moment().add(TOKEN_EXPIRY_SECONDS, 'seconds').unix(),
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>(globalVar.CLIENT_SECRET),
    });

    return {
      access_token: accessToken,
    };
  }
}
