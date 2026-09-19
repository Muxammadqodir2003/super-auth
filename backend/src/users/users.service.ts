import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as argon from 'argon2';
import { UpdatePasswordDto } from './dto/update-password.dto';
import Redis from 'ioredis';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
    private readonly mailService: MailService,
  ) {}

  async updateProfile(userId: string, profileData: UpdateProfileDto) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { ...profileData },
    });
  }

  async updatePassword(userId: string, data: UpdatePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new BadRequestException('User not found');

    const isPasswordValid = await argon.verify(
      user?.passwordHash,
      data.oldPassword,
    );
    if (!isPasswordValid) throw new BadRequestException('Pasworn is not match');

    const newHashedPassword = await argon.hash(data.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHashedPassword },
    });

    return { message: 'Password updated successfully' };
  }

  async updateEmail(email: string) {
    const existUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!existUser) throw new ConflictException('A user exist with this email');

    if (existUser.email === email)
      throw new BadRequestException(
        'Your email the same with new email, Please enter new email',
      );

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.mailService.sendVerifyChangeOtp(email, existUser.firstName, otp);
    await this.redisClient.set(`update-email-otp:${email}`, otp, 'EX', 60 * 5);
    return { message: 'Otp sent successfully' };
  }

  async verifyUpdateEmail(userId: string, newEmail: string, otp: string) {
    const redisOtp = await this.redisClient.get(`update-email-otp:${newEmail}`);
    if (!redisOtp) throw new BadRequestException('Otp not found');

    if (redisOtp !== otp) throw new BadRequestException('Otp has been expired');

    await this.prisma.user.update({
      where: { id: userId },
      data: { email: newEmail },
    });
    await this.redisClient.del(`update-email-otp:${newEmail}`);

    return { message: 'Email updated successfully' };
  }
}
