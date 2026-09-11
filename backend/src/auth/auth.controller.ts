import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/registerUserDto';
import { UserAgent } from 'src/common/decorators/user-agent.decorator';
import { UAParser } from 'ua-parser-js';
import { SessionHelper } from './session-helper';

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
  verifyOtp(
    @Body() req: { email: string; otp: string; fingerprint: string },
    @UserAgent() userAgent: string,
  ) {
    const ipAddress = this.sessionHelper.getIpAddress(req);
    const location = this.sessionHelper.getLocation(ipAddress);
    const userAgentParsed = new UAParser(userAgent).getResult();

    return this.authService.verifyOTP(
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
  }
}
