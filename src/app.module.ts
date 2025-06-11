import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { EnvSchema } from './models/env';
import { UserModule } from './user/user.module';

@Module({
  imports: [
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
