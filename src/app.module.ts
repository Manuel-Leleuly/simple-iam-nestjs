import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EnvSchema } from './models/env';
import { AuthModule } from './modules/auth/auth.module';
import { CommonModule } from './modules/common/common.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    CacheModule.register({
      ttl: 10000,
      max: 2,
      isGlobal: true,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: EnvSchema,
    }),
    CommonModule,
    UserModule,
    AuthModule,
  ],
  controllers: [],
})
export class AppModule {}
