import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendOtpCode(to: string, name: string, otpCode: string) {
    try {
      await this.mailerService.sendMail({
        to,
        subject: 'Tasdiqlash kodi (OTP)',
        template: './otp-code',
        context: {
          name,
          otpCode,
          expireMinutes: 5,
        },
      });
      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      //throw error
    }
  }
}
