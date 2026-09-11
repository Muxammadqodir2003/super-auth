import { IsString, IsOptional, Min, IsEmail } from 'class-validator';

export class RegisterUserDto {
  @IsEmail()
  @IsString()
  email: string;

  @IsString()
  @Min(3)
  firstName: string;

  @IsOptional()
  @IsString()
  @Min(3)
  lastName: string;

  @IsString()
  @Min(8)
  password: string;
}
