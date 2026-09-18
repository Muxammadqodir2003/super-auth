import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterUserDto } from './dto/registerUserDto';
import * as argon from 'argon2';
import { MailService } from 'src/mail/mail.service';
import { Redis } from 'ioredis';
import { TokenService } from 'src/token/token.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
    private readonly tokenService: TokenService,
  ) {}

  async register(data: RegisterUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.mailService.sendOtpCode(data.email, data.firstName, otp);
    await this.redisClient.set(`otp:${data.email}`, otp, 'EX', 60 * 5);

    const passwordHash = await argon.hash(data.password);
    const userData = { ...data, passwordHash };
    await this.redisClient.set(
      `user:${data.email}`,
      JSON.stringify(userData),
      'EX',
      60 * 5,
    );

    return { message: 'Otp has been sent to your email' };
  }

  async verifyOTP(
    email: string,
    otp: string,
    fingerprint: string,
    ipAddress: string,
    country: string,
    city: string,
    browser: string,
    os: string,
    deviceType: string,
  ) {
    const storedOtp = await this.redisClient.get(`otp:${email}`);

    if (!storedOtp) {
      throw new BadRequestException('OTP expired or invalid');
    }

    if (storedOtp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    const userData = await this.redisClient.get(`user:${email}`);
    if (!userData) {
      throw new BadRequestException('User not found');
    }
    const user = JSON.parse(userData);

    const newUser = await this.prisma.user.create({
      data: user,
    });

    const session = await this.prisma.session.create({
      data: {
        userId: newUser.id,
        fingerprint,
        ipAddress,
        country,
        city,
        browser,
        os,
        deviceType,
      },
    });

    const tokens = this.tokenService.generateTokens({ sessionId: session.id });
    await this.tokenService.saveToken(session.id, tokens.refreshToken);

    await this.redisClient.del(`otp:${email}`);
    await this.redisClient.del(`user:${email}`);

    return { user: newUser, ...tokens };
  }

  async login(
    email: string,
    password: string,
    fingerprint: string,
    ipAddress: string,
    country: string,
    city: string,
    browser: string,
    os: string,
    deviceType: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isPasswordValid = await argon.verify(user.passwordHash, password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid password');
    }

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        fingerprint,
        ipAddress,
        country,
        city,
        browser,
        os,
        deviceType,
      },
    });

    const tokens = this.tokenService.generateTokens({ sessionId: session.id });
    await this.tokenService.saveToken(session.id, tokens.refreshToken);

    return { user, ...tokens };
  }

  async refreshToken(refreshToken: string, fingerprint: string) {
    const tokenDb = await this.tokenService.findToken(refreshToken);
    const payload = this.tokenService.verifyRefreshToken(refreshToken);

    if (!tokenDb || !payload) {
      throw new BadRequestException('Token not found');
    }

    const session = await this.prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: { user: { select: { id: true } } },
    });

    if (session?.fingerprint !== fingerprint) {
      throw new BadRequestException('Invalid fingerprint');
    }

    const tokens = this.tokenService.generateTokens({
      sessionId: payload.sessionId,
    });
    await this.tokenService.saveToken(payload.sessionId, tokens.refreshToken);

    return { user: session?.user, ...tokens };
  }

  async logout(sessionId: string) {
    await this.tokenService.removeToken(sessionId);
    await this.prisma.session.delete({
      where: { id: sessionId },
    });
  }

  async deleteUser(userId: string) {
    await this.prisma.user.delete({
      where: { id: userId },
    });
  }
}
