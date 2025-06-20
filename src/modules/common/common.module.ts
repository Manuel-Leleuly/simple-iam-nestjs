import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { PrismaService } from './prisma.service';
import { ValidationService } from './validation.service';

@Global()
@Module({
  imports: [
    WinstonModule.forRoot({
      format: winston.format.json(),
      transports: [new winston.transports.Console()],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [
    PrismaService,
    ValidationService,
    // {
    //   provide: APP_FILTER,
    //   useClass: ErrorFilter,
    // },
  ],
  exports: [PrismaService, ValidationService],
})
export class CommonModule {
  //   configure(consumer: MiddlewareConsumer) {
  //     throw new Error('Method not implemented.');
  //   }
}
