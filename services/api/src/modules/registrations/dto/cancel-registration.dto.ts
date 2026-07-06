import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelRegistrationDto {
  @ApiPropertyOptional({
    description: 'Motivo do cancelamento da inscrição',
    example: 'Imprevisto de trabalho.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'O motivo deve ser uma string' })
  @MaxLength(500, { message: 'O motivo não pode ultrapassar 500 caracteres' })
  reason?: string;
}
