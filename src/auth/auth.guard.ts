import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as moment from 'moment';
import { PrismaService } from 'src/common/prisma.service';
import { globalVar } from 'src/constants/env';
import { TokenPayloadSchema } from 'src/models/auth';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prismaService: PrismaService,
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
      });
    } catch {
      throw500Error();
    }

    const { success, data: payloadData } =
      TokenPayloadSchema.safeParse(payload);
    if (!success) throw500Error();

    const { exp, email, id } = payloadData!;
    if (moment().unix() > exp) {
      throw500Error('Token has expired');
    }

    // TODO: find a way to store this locally
    const user = await this.prismaService.user.findFirst({
      where: { email, id },
    });
    if (!user) throw500Error();

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
