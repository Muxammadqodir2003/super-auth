import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/registerUserDto';
import { UserAgent } from 'src/common/decorators/user-agent.decorator';
import { UAParser } from 'ua-parser-js';
import { SessionHelper } from './session-helper';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionHelper: SessionHelper,
  ) {}

  @Post('register')
  register(@Body() req: RegisterUserDto) {
    return this.authService.register(req);
  }

  @Post('verify-otp')
  async verifyOtp(
    @Body() req: { email: string; otp: string; fingerprint: string },
    @UserAgent() userAgent: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = this.sessionHelper.getIpAddress(req);
    const location = this.sessionHelper.getLocation(ipAddress);
    const userAgentParsed = new UAParser(userAgent).getResult();

    const data = await this.authService.verifyOTP(
      req.email,
      req.otp,
      req.fingerprint,
      ipAddress,
      location.country || 'Unknown',
      location.city || 'Unknown',
      userAgentParsed.browser.name || 'Unknown',
      userAgentParsed.os.name || 'Unknown',
      userAgentParsed.device.type || 'Unknown',
    );

    res.cookie('refreshToken', data.refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'none',
      secure: true,
      path: '/',
    });
    return data;
  }

  @Post('login')
  async login(
    @Body() req: { email: string; password: string; fingerprint: string },
    @UserAgent() userAgent: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = this.sessionHelper.getIpAddress(req);
    const location = this.sessionHelper.getLocation(ipAddress);
    const userAgentParsed = new UAParser(userAgent).getResult();

    const data = await this.authService.login(
      req.email,
      req.password,
      req.fingerprint,
      ipAddress,
      location.country || 'Unknown',
      location.city || 'Unknown',
      userAgentParsed.browser.name || 'Unknown',
      userAgentParsed.os.name || 'Unknown',
      userAgentParsed.device.type || 'Unknown',
    );

    res.cookie('refreshToken', data.refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'none',
      secure: true,
      path: '/',
    });
    return data;
  }
}
