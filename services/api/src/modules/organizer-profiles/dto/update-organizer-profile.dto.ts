import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrganizerProfileType } from '@prisma/client';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, IsUrl, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateOrganizerProfileDto {
  @ApiPropertyOptional({
    description: 'Tipo de Perfil Organizador',
    enum: OrganizerProfileType,
    example: 'COMMUNITY',
  })
  @IsOptional()
  @IsEnum(OrganizerProfileType, { message: 'Tipo de perfil organizador inválido' })
  type?: OrganizerProfileType;

  @ApiPropertyOptional({
    description: 'Nome do organizador',
    example: 'Tech Sisters',
    minLength: 2,
  })
  @IsOptional()
  @IsString({ message: 'O nome deve ser uma string' })
  @MinLength(2, { message: 'O nome deve ter pelo menos 2 caracteres' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Slug de identificação único (URL-friendly)',
    example: 'tech-sisters',
    minLength: 3,
  })
  @IsOptional()
  @IsString({ message: 'O slug deve ser uma string' })
  @MinLength(3, { message: 'O slug deve ter pelo menos 3 caracteres' })
  @Matches(/^[a-z0-9_-]+$/, {
    message: 'O slug deve conter apenas letras minúsculas, números, sublinhas e hífens, sem espaços',
  })
  slug?: string;

  @ApiPropertyOptional({
    description: 'Descrição detalhada do organizador',
    example: 'Comunidade para mulheres na tecnologia.',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'A descrição deve ser uma string' })
  @MaxLength(1000, { message: 'A descrição não pode ultrapassar 1000 caracteres' })
  description?: string;

  @ApiPropertyOptional({
    description: 'URL da imagem de logotipo',
    example: 'https://example.com/logo.png',
  })
  @IsOptional()
  @IsUrl({}, { message: 'A URL do logo deve ser uma URL válida' })
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'URL da imagem do banner',
    example: 'https://example.com/banner.png',
  })
  @IsOptional()
  @IsUrl({}, { message: 'A URL do banner deve ser uma URL válida' })
  bannerUrl?: string;

  @ApiPropertyOptional({ description: 'Cidade do organizador', example: 'Salvador' })
  @IsOptional()
  @IsString({ message: 'A cidade deve ser uma string' })
  city?: string;

  @ApiPropertyOptional({ description: 'Estado (UF) do organizador', example: 'BA' })
  @IsOptional()
  @IsString({ message: 'O estado deve ser uma string' })
  state?: string;

  @ApiPropertyOptional({ description: 'País do organizador', example: 'Brasil' })
  @IsOptional()
  @IsString({ message: 'O país deve ser uma string' })
  country?: string;

  @ApiPropertyOptional({
    description: 'Website oficial',
    example: 'https://techsonar.com',
  })
  @IsOptional()
  @IsUrl({}, { message: 'O website deve ser uma URL válida' })
  website?: string;

  @ApiPropertyOptional({ description: 'Perfil ou usuário do Instagram', example: '@tech.sisterss' })
  @IsOptional()
  @IsString({ message: 'O instagram deve ser uma string' })
  instagram?: string;

  @ApiPropertyOptional({ description: 'Link do perfil no LinkedIn', example: 'https://linkedin.com/company/techsisters' })
  @IsOptional()
  @IsString({ message: 'O linkedin deve ser uma string' })
  linkedin?: string;

  @ApiPropertyOptional({ description: 'E-mail de contato', example: 'contato@techsonar.com' })
  @IsOptional()
  @IsEmail({}, { message: 'O e-mail de contato deve ser um endereço de e-mail válido' })
  email?: string;

  @ApiPropertyOptional({ description: 'Telefone de contato', example: '+5571999999999' })
  @IsOptional()
  @IsString({ message: 'O telefone deve ser uma string' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Perfil está ativo', example: true })
  @IsOptional()
  @IsBoolean({ message: 'isActive deve ser um booleano' })
  isActive?: boolean;
}
