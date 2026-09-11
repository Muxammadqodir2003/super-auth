import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  generateTokens(payload: any) {
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  async saveToken(sessionId: string, refreshToken: string) {
    await this.prisma.token.upsert({
      where: { sessionId },
      update: {
        refreshToken,
      },
      create: {
        sessionId,
        refreshToken,
      },
    });
  }

  verifyAccessToken(accessToken: string) {
    return this.jwtService.verify(accessToken);
  }

  verifyRefreshToken(refreshToken: string) {
    return this.jwtService.verify(refreshToken, {
      ignoreExpiration: true,
    });
  }
}
