import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'Anna Luiza',
    minLength: 2,
  })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @IsString({ message: 'O nome deve ser uma string' })
  @MinLength(2, { message: 'O nome deve ter pelo menos 2 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Endereço de e-mail do usuário',
    example: 'anna@example.com',
  })
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  @IsEmail({}, { message: 'O e-mail deve ser um endereço de e-mail válido' })
  email: string;

  @ApiProperty({
    description: 'Senha de acesso',
    example: '12345678',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @IsString({ message: 'A senha deve ser uma string' })
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres' })
  password: string;
}
