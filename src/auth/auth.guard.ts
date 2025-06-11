import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { globalVar } from 'src/constants/env';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer') {
      throw new HttpException(
        {
          message: 'Unauthorized',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(globalVar.CLIENT_SECRET),
        ignoreExpiration: false,
      });

      console.log(JSON.stringify(payload, null, 2));
    } catch {
      throw new HttpException(
        {
          message: 'Unauthorized',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    return true;
  }
}
