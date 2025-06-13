import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Cache } from 'cache-manager';
import { User } from 'generated/prisma';
import * as moment from 'moment';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import {
  ACCESS_TOKEN_EXPIRE_SECONDS,
  CACHE_KEYS,
  REFRESH_TOKEN_EXPIRE_SECONDS,
} from 'src/constants/constants';
import { globalVar } from 'src/constants/env';
import {
  AccessTokenPayloadDto,
  AccessTokenPayloadSchema,
  AuthResponseDto,
  RefreshTokenPayloadDto,
  RefreshTokenPayloadSchema,
  SignInDto,
  SignInSchema,
} from 'src/models/auth';
import { PrismaService } from 'src/modules/common/prisma.service';
import { ValidationService } from 'src/modules/common/validation.service';
import { Logger } from 'winston';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private validationService: ValidationService,
    private configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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

    const payloadAccess: Omit<AccessTokenPayloadDto, 'iat'> = {
      id: user.id,
      email: user.email,
      exp: moment().add(ACCESS_TOKEN_EXPIRE_SECONDS, 'seconds').unix(),
    };

    const accessToken = await this.jwtService.signAsync(payloadAccess, {
      secret: this.configService.get<string>(globalVar.CLIENT_SECRET),
    });

    const payloadRefresh: Omit<RefreshTokenPayloadDto, 'iat'> = {
      id: user.id,
      email: user.email,
      access_token: accessToken,
      exp: moment().add(REFRESH_TOKEN_EXPIRE_SECONDS, 'seconds').unix(),
    };

    const refreshToken = await this.jwtService.signAsync(payloadRefresh, {
      secret: this.configService.get<string>(globalVar.CLIENT_SECRET),
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refreshToken(auth: string): Promise<AuthResponseDto> {
    this.logger.debug(`Refresh token: ${auth}`);

    const [type, token] = auth.split(' ');
    if (type !== 'Bearer') throw500Error();

    let payload = {};

    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(globalVar.CLIENT_SECRET),
        ignoreExpiration: true,
      });
    } catch {
      throw500Error();
    }

    const { success, data: payloadData } =
      RefreshTokenPayloadSchema.safeParse(payload);
    if (!success) throw500Error();

    const refreshPayload = payloadData!;
    if (moment().unix() > refreshPayload.exp) {
      throw500Error('Refresh Token has expired');
    }

    // check user from cache first before checking it from database
    let user: User | null =
      (await this.cacheManager.get<User>(
        `${CACHE_KEYS.LOGGED_IN_USER}-${refreshPayload.id}`,
      )) ?? null;

    if (!user) {
      user = await this.prismaService.user.findFirst({
        where: {
          email: refreshPayload.email,
          id: refreshPayload.id,
        },
      });
    }
    if (!user) throw500Error();
    else {
      await this.cacheManager.set(
        `${CACHE_KEYS.LOGGED_IN_USER}-${refreshPayload.id}`,
        user,
      );
    }

    try {
      payload = await this.jwtService.verifyAsync(refreshPayload.access_token, {
        secret: this.configService.get<string>(globalVar.CLIENT_SECRET),
        ignoreExpiration: true,
      });
    } catch {
      throw500Error();
    }

    const accessPayload = AccessTokenPayloadSchema.safeParse(payload);
    if (!accessPayload.success) throw500Error();

    const { email, id } = accessPayload.data!;
    if (user?.email !== email || user.id !== id) {
      throw500Error();
    }

    const newAccessPayload: Omit<AccessTokenPayloadDto, 'iat'> = {
      email,
      id,
      exp: moment().add(ACCESS_TOKEN_EXPIRE_SECONDS, 'seconds').unix(),
    };
    const newAccessToken = await this.jwtService.signAsync(newAccessPayload, {
      secret: this.configService.get<string>(globalVar.CLIENT_SECRET),
    });

    const newRefreshPayload: Omit<RefreshTokenPayloadDto, 'iat'> = {
      email,
      id,
      access_token: newAccessToken,
      exp: moment().add(REFRESH_TOKEN_EXPIRE_SECONDS, 'seconds').unix(),
    };
    const newRefreshToken = await this.jwtService.signAsync(newRefreshPayload, {
      secret: this.configService.get<string>(globalVar.CLIENT_SECRET),
    });

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }
}

// helpers
const throw500Error = (message: string = 'Unauthorzed') => {
  throw new HttpException(
    {
      message: 'Unauthorized',
    },
    HttpStatus.UNAUTHORIZED,
  );
};
