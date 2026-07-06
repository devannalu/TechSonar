import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserAccountDto {
  @ApiPropertyOptional({ description: 'Nome completo', example: 'Anna Luiza', minLength: 2 })
  @IsOptional()
  @IsString({ message: 'O nome deve ser uma string' })
  @MinLength(2, { message: 'O nome deve ter pelo menos 2 caracteres' })
  name?: string;

  @ApiPropertyOptional({ description: 'Endereço de e-mail', example: 'newemail@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'O e-mail deve ser um endereço de e-mail válido' })
  email?: string;
}
