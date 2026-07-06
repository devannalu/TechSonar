import { ApiPropertyOptional } from '@nestjs/swagger';
import { RegistrationStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class RegistrationQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrar inscrições por status',
    enum: RegistrationStatus,
    example: 'CONFIRMED',
  })
  @IsOptional()
  @IsEnum(RegistrationStatus, { message: 'Status de inscrição inválido' })
  status?: RegistrationStatus;

  @ApiPropertyOptional({
    description: 'Número da página',
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'A página deve ser um número inteiro' })
  @Min(1, { message: 'A página mínima é 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Limite de itens por página',
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O limite deve ser um número inteiro' })
  @Min(1, { message: 'O limite mínimo é 1' })
  @Max(50, { message: 'O limite máximo é 50' })
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Buscar participante por nome ou e-mail',
    example: 'Anna',
  })
  @IsOptional()
  @IsString({ message: 'O termo de busca deve ser uma string' })
  search?: string;
}
