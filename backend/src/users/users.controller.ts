import { Body, Controller, Patch, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { User } from 'src/common/decorators/user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard)
  @Patch('update-profile')
  async updateProfile(
    @User('id') userId: string,
    @Body() profileData: UpdateProfileDto,
  ) {
    await this.usersService.updateProfile(userId, profileData);
    return { message: 'Profile update successfully' };
  }

  @UseGuards(AuthGuard)
  @Patch('update-password')
  async updatePassword(
    @Body() body: UpdatePasswordDto,
    @User('id') userId: string,
  ) {
    return await this.usersService.updatePassword(userId, body);
  }

  @UseGuards(AuthGuard)
  @Post('update-email')
  async updateEmail(@Body() body: { email: string }) {
    return await this.usersService.updateEmail(body.email);
  }

  @UseGuards(AuthGuard)
  @Patch('verify-update-email')
  async verifyUpdateEmail(
    @Body() body: { newEmail: string; otp: string },
    @User('id') userId: string,
  ) {
    return await this.usersService.verifyUpdateEmail(
      userId,
      body.newEmail,
      body.otp,
    );
  }
}
