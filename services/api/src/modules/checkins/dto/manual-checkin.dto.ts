import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ManualCheckinDto {
  @ApiProperty({
    description: 'ID da inscrição do participante para a qual o organizador está validando presença manualmente',
    example: 'reg-uuid-12345',
  })
  @IsNotEmpty({ message: 'O ID da inscrição é obrigatório' })
  @IsUUID('4', { message: 'O ID da inscrição deve ser um UUID válido' })
  registrationId: string;

  @ApiPropertyOptional({
    description: 'Observações adicionais sobre o check-in manual',
    example: 'Documento conferido na entrada.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'As observações devem ser uma string' })
  @MaxLength(500, { message: 'As observações não podem ultrapassar 500 caracteres' })
  notes?: string;
}
