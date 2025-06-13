import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Cache } from 'cache-manager';
import { User } from 'generated/prisma';
import * as moment from 'moment';
import { CACHE_KEYS } from 'src/constants/constants';
import { globalVar } from 'src/constants/env';
import { AccessTokenPayloadSchema } from 'src/models/auth';
import { PrismaService } from 'src/modules/common/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prismaService: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer') {
      throw500Error();
    }

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
      AccessTokenPayloadSchema.safeParse(payload);
    if (!success) throw500Error();

    const { exp, email, id } = payloadData!;
    if (moment().unix() > exp) {
      throw500Error('Token has expired');
    }

    // check user from cache first before checking it from database
    let user: User | null =
      (await this.cacheManager.get<User>(
        `${CACHE_KEYS.LOGGED_IN_USER}-${id}`,
      )) ?? null;

    if (!user) {
      user = await this.prismaService.user.findFirst({
        where: { email, id },
      });
    }
    if (!user) throw500Error();
    else {
      await this.cacheManager.set(`${CACHE_KEYS.LOGGED_IN_USER}-${id}`, user);
    }

    return true;
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
