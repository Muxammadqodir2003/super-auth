import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenModule } from 'src/token/token.module';
import { SessionHelper } from './session-helper';

@Module({
  imports: [TokenModule],
  controllers: [AuthController],
  providers: [AuthService, SessionHelper],
})
export class AuthModule {}
