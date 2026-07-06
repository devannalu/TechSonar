import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventFormat, EventStatus } from '@prisma/client';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, IsUrl, Matches, MaxLength, Min, MinLength } from 'class-validator';

export class CreateEventDto {
  @ApiProperty({
    description: 'ID do Perfil Organizador ao qual o evento pertence',
    example: '7ca6479f-6825-4c07-b353-066cb5dcf54a',
  })
  @IsNotEmpty({ message: 'O ID do perfil organizador é obrigatório' })
  @IsUUID('4', { message: 'O ID do perfil organizador deve ser um UUID válido' })
  organizerProfileId: string;

  @ApiProperty({
    description: 'Título do evento',
    example: 'Tech Girls Night',
    minLength: 3,
  })
  @IsNotEmpty({ message: 'O título do evento é obrigatório' })
  @IsString({ message: 'O título deve ser uma string' })
  @MinLength(3, { message: 'O título deve ter pelo menos 3 caracteres' })
  title: string;

  @ApiPropertyOptional({
    description: 'Slug identificador do evento. Se não informado, será gerado automaticamente a partir do título.',
    example: 'tech-girls-night',
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
    description: 'Descrição detalhada do evento',
    example: 'Evento de lançamento da comunidade Tech Sisters com palestras e networking.',
    maxLength: 3000,
  })
  @IsOptional()
  @IsString({ message: 'A descrição deve ser uma string' })
  @MaxLength(3000, { message: 'A descrição não pode ultrapassar 3000 caracteres' })
  description?: string;

  @ApiPropertyOptional({ description: 'Categoria do evento', example: 'Comunidade' })
  @IsOptional()
  @IsString({ message: 'A categoria deve ser uma string' })
  category?: string;

  @ApiProperty({
    description: 'Formato do evento',
    enum: EventFormat,
    example: 'ONLINE',
  })
  @IsNotEmpty({ message: 'O formato do evento é obrigatório' })
  @IsEnum(EventFormat, { message: 'Formato do evento inválido' })
  format: EventFormat;

  @ApiPropertyOptional({
    description: 'Status inicial do evento',
    enum: EventStatus,
    default: EventStatus.DRAFT,
    example: 'DRAFT',
  })
  @IsOptional()
  @IsEnum(EventStatus, { message: 'Status do evento inválido' })
  status?: EventStatus;

  @ApiProperty({
    description: 'Data e hora de início do evento (ISO 8601)',
    example: '2026-07-24T20:00:00.000Z',
  })
  @IsNotEmpty({ message: 'A data e hora de início são obrigatórias' })
  @IsDateString({}, { message: 'A data de início deve ser uma data ISO válida' })
  startDateTime: string;

  @ApiPropertyOptional({
    description: 'Data e hora de término do evento (ISO 8601)',
    example: '2026-07-24T22:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'A data de término deve ser uma data ISO válida' })
  endDateTime?: string;

  @ApiPropertyOptional({
    description: 'Fuso horário do evento',
    default: 'America/Bahia',
    example: 'America/Bahia',
  })
  @IsOptional()
  @IsString({ message: 'O fuso horário deve ser uma string' })
  timezone?: string;

  @ApiPropertyOptional({ description: 'Nome do local (se presencial ou híbrido)', example: 'Hub Salvador' })
  @IsOptional()
  @IsString({ message: 'O nome do local deve ser uma string' })
  locationName?: string;

  @ApiPropertyOptional({ description: 'Endereço completo (se presencial ou híbrido)', example: 'Av. da França, 393 - Comércio' })
  @IsOptional()
  @IsString({ message: 'O endereço deve ser uma string' })
  address?: string;

  @ApiPropertyOptional({ description: 'Cidade do evento (se presencial ou híbrido)', example: 'Salvador' })
  @IsOptional()
  @IsString({ message: 'A cidade deve ser uma string' })
  city?: string;

  @ApiPropertyOptional({ description: 'Estado (UF) do evento (se presencial ou híbrido)', example: 'BA' })
  @IsOptional()
  @IsString({ message: 'O estado deve ser uma string' })
  state?: string;

  @ApiPropertyOptional({ description: 'País do evento', default: 'Brasil', example: 'Brasil' })
  @IsOptional()
  @IsString({ message: 'O país deve ser uma string' })
  country?: string;

  @ApiPropertyOptional({
    description: 'URL de acesso online (se online ou híbrido)',
    example: 'https://youtube.com/live/exemplo',
  })
  @IsOptional()
  @IsUrl({}, { message: 'A URL online deve ser uma URL válida' })
  onlineUrl?: string;

  @ApiProperty({
    description: 'Capacidade máxima de participantes',
    example: 500,
    minimum: 1,
  })
  @IsNotEmpty({ message: 'A capacidade é obrigatória' })
  @IsInt({ message: 'A capacidade deve ser um número inteiro' })
  @Min(1, { message: 'A capacidade deve ser pelo menos 1' })
  capacity: number;

  @ApiPropertyOptional({
    description: 'Preço do ingresso (se pago)',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'O preço deve ser um número' })
  @Min(0, { message: 'O preço não pode ser negativo' })
  price?: number;

  @ApiPropertyOptional({
    description: 'Indica se o evento é gratuito',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isFree deve ser um booleano' })
  isFree?: boolean;

  @ApiPropertyOptional({
    description: 'Indica se o evento emite certificado',
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'hasCertificate deve ser um booleano' })
  hasCertificate?: boolean;

  @ApiPropertyOptional({
    description: 'Data de início do check-in (ISO 8601)',
    example: '2026-07-24T19:30:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'A data de início do check-in deve ser uma data ISO válida' })
  checkinStartsAt?: string;

  @ApiPropertyOptional({
    description: 'Data de término do check-in (ISO 8601)',
    example: '2026-07-24T21:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'A data de término do check-in deve ser uma data ISO válida' })
  checkinEndsAt?: string;

  @ApiPropertyOptional({
    description: 'URL do banner do evento',
    example: 'https://example.com/banner.png',
  })
  @IsOptional()
  @IsUrl({}, { message: 'A URL do banner deve ser uma URL válida' })
  bannerUrl?: string;
}
