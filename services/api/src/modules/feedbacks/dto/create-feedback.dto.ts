import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class CreateFeedbackDto {
  @ApiProperty({
    description: 'ID da inscrição para a qual deseja enviar o feedback',
    example: 'reg-uuid-12345',
  })
  @IsNotEmpty({ message: 'O ID da inscrição é obrigatório' })
  @IsUUID('4', { message: 'O ID da inscrição deve ser um UUID válido' })
  registrationId: string;

  @ApiProperty({
    description: 'Nota geral sobre o evento (de 1 a 5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsNotEmpty({ message: 'A nota geral é obrigatória' })
  @IsInt({ message: 'A nota geral deve ser um número inteiro' })
  @Min(1, { message: 'A nota geral mínima é 1' })
  @Max(5, { message: 'A nota geral máxima é 5' })
  overallRating: number;

  @ApiPropertyOptional({
    description: 'Nota sobre o conteúdo das palestras/atividades (de 1 a 5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt({ message: 'A nota de conteúdo deve ser um número inteiro' })
  @Min(1, { message: 'A nota de conteúdo mínima é 1' })
  @Max(5, { message: 'A nota de conteúdo máxima é 5' })
  contentRating?: number;

  @ApiPropertyOptional({
    description: 'Nota sobre a organização do evento (de 1 a 5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt({ message: 'A nota de organização deve ser um número inteiro' })
  @Min(1, { message: 'A nota de organização mínima é 1' })
  @Max(5, { message: 'A nota de organização máxima é 5' })
  organizationRating?: number;

  @ApiPropertyOptional({
    description: 'Nota sobre os palestrantes do evento (de 1 a 5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt({ message: 'A nota de palestrantes deve ser um número inteiro' })
  @Min(1, { message: 'A nota de palestrantes mínima é 1' })
  @Max(5, { message: 'A nota de palestrantes máxima é 5' })
  speakerRating?: number;

  @ApiPropertyOptional({
    description: 'Comentário sobre pontos positivos do evento',
    example: 'Evento fantástico, excelente organização e palestrantes.',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'O comentário positivo deve ser uma string' })
  @MaxLength(1000, { message: 'O comentário positivo não pode ultrapassar 1000 caracteres' })
  positiveComment?: string;

  @ApiPropertyOptional({
    description: 'Comentário sobre pontos a melhorar no evento',
    example: 'Mais tomadas na sala principal e água disponível para os participantes.',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'O comentário de melhoria deve ser uma string' })
  @MaxLength(1000, { message: 'O comentário de melhoria não pode ultrapassar 1000 caracteres' })
  improvementComment?: string;

  @ApiPropertyOptional({
    description: 'Indica se o participante recomendaria o evento para outras pessoas',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'wouldRecommend deve ser um booleano' })
  wouldRecommend?: boolean;
}
