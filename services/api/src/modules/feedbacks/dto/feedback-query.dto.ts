import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class FeedbackQueryDto {
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
    description: 'Filtrar por nota geral específica (de 1 a 5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'A nota deve ser um número inteiro' })
  @Min(1, { message: 'A nota mínima é 1' })
  @Max(5, { message: 'A nota máxima é 5' })
  rating?: number;

  @ApiPropertyOptional({
    description: 'Buscar participante por nome ou e-mail',
    example: 'Anna',
  })
  @IsOptional()
  @IsString({ message: 'O termo de busca deve ser uma string' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por se recomendaria o evento (true) ou não (false)',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'wouldRecommend deve ser um booleano' })
  wouldRecommend?: boolean;
}
