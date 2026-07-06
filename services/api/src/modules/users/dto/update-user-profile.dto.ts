import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional, IsString, IsUrl, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateUserProfileDto {
  @ApiPropertyOptional({ description: 'Nome de exibição', example: 'Anna' })
  @IsOptional()
  @IsString({ message: 'O nome de exibição deve ser uma string' })
  displayName?: string;

  @ApiPropertyOptional({ description: 'Nome de usuário único', example: 'devannalu', minLength: 3 })
  @IsOptional()
  @IsString({ message: 'O nome de usuário deve ser uma string' })
  @MinLength(3, { message: 'O nome de usuário deve ter pelo menos 3 caracteres' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'O nome de usuário não pode conter espaços ou caracteres especiais (apenas letras, números, sublinhas e hífens)',
  })
  username?: string;

  @ApiPropertyOptional({ description: 'Telefone de contato', example: '+5571999999999' })
  @IsOptional()
  @IsString({ message: 'O telefone deve ser uma string' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Cadastro de Pessoa Física', example: '12345678909' })
  @IsOptional()
  @IsString({ message: 'O CPF deve ser uma string' })
  cpf?: string;

  @ApiPropertyOptional({ description: 'Data de nascimento', example: '2000-01-01' })
  @IsOptional()
  @IsDateString({}, { message: 'A data de nascimento deve ser uma data válida no formato ISO' })
  birthDate?: string;

  @ApiPropertyOptional({ description: 'URL do avatar', example: 'https://example.com/avatar.png' })
  @IsOptional()
  @IsUrl({}, { message: 'A URL do avatar deve ser uma URL válida' })
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Biografia do usuário', example: 'Desenvolvedora apaixonada por tecnologia.', maxLength: 500 })
  @IsOptional()
  @IsString({ message: 'A biografia deve ser uma string' })
  @MaxLength(500, { message: 'A biografia não pode ultrapassar 500 caracteres' })
  bio?: string;

  @ApiPropertyOptional({ description: 'Cidade', example: 'Salvador' })
  @IsOptional()
  @IsString({ message: 'A cidade deve ser uma string' })
  city?: string;

  @ApiPropertyOptional({ description: 'Estado (UF)', example: 'BA' })
  @IsOptional()
  @IsString({ message: 'O estado deve ser uma string' })
  state?: string;

  @ApiPropertyOptional({ description: 'País', example: 'Brasil' })
  @IsOptional()
  @IsString({ message: 'O país deve ser uma string' })
  country?: string;

  @ApiPropertyOptional({ description: 'Permitir notificações por e-mail', example: true })
  @IsOptional()
  @IsBoolean({ message: 'notifyEmail deve ser um booleano' })
  notifyEmail?: boolean;

  @ApiPropertyOptional({ description: 'Permitir notificações push', example: true })
  @IsOptional()
  @IsBoolean({ message: 'notifyPush deve ser um booleano' })
  notifyPush?: boolean;

  @ApiPropertyOptional({ description: 'Perfil visível ao público', example: true })
  @IsOptional()
  @IsBoolean({ message: 'isPublic deve ser um booleano' })
  isPublic?: boolean;
}
