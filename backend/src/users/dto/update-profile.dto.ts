import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  bio?: string;
}
