import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventFormat } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class EventQueryDto {
  @ApiPropertyOptional({ description: 'Termo para busca textual (título ou descrição)', example: 'Reativa' })
  @IsOptional()
  @IsString({ message: 'O termo de busca deve ser uma string' })
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por categoria do evento', example: 'Comunidade' })
  @IsOptional()
  @IsString({ message: 'A categoria deve ser uma string' })
  category?: string;

  @ApiPropertyOptional({ description: 'Filtrar por formato do evento', enum: EventFormat, example: 'ONLINE' })
  @IsOptional()
  @IsEnum(EventFormat, { message: 'Formato de evento inválido' })
  format?: EventFormat;

  @ApiPropertyOptional({ description: 'Filtrar por cidade (se presencial ou híbrido)', example: 'Salvador' })
  @IsOptional()
  @IsString({ message: 'A cidade deve ser uma string' })
  city?: string;

  @ApiPropertyOptional({ description: 'Filtrar por estado (UF) (se presencial ou híbrido)', example: 'BA' })
  @IsOptional()
  @IsString({ message: 'O estado deve ser uma string' })
  state?: string;

  @ApiPropertyOptional({ description: 'Filtrar por eventos gratuitos (true) ou pagos (false)', example: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'isFree deve ser um booleano' })
  isFree?: boolean;

  @ApiPropertyOptional({ description: 'Filtrar eventos iniciando após esta data (ISO 8601)', example: '2026-07-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString({}, { message: 'startsAfter deve ser uma data ISO válida' })
  startsAfter?: string;

  @ApiPropertyOptional({ description: 'Filtrar eventos iniciando antes desta data (ISO 8601)', example: '2026-08-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString({}, { message: 'startsBefore deve ser uma data ISO válida' })
  startsBefore?: string;

  @ApiPropertyOptional({ description: 'Filtrar por ID do Perfil Organizador', example: '7ca6479f-6825-4c07-b353-066cb5dcf54a' })
  @IsOptional()
  @IsUUID('4', { message: 'organizerProfileId deve ser um UUID válido' })
  organizerProfileId?: string;

  @ApiPropertyOptional({ description: 'Número da página', default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'A página deve ser um número inteiro' })
  @Min(1, { message: 'A página mínima é 1' })
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Quantidade de itens por página', default: 10, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O limite deve ser um número inteiro' })
  @Min(1, { message: 'O limite mínimo é 1' })
  @Max(50, { message: 'O limite máximo é 50' })
  limit?: number = 10;
}
