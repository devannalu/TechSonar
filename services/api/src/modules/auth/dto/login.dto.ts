import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
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
  })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @IsString({ message: 'A senha deve ser uma string' })
  password: string;
}
