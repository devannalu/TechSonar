import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateRegistrationDto {
  @ApiProperty({
    description: 'ID do evento no qual deseja se inscrever',
    example: 'e88a0322-8ce8-4ca4-bf4b-e85dcf54aef9',
  })
  @IsNotEmpty({ message: 'O ID do evento é obrigatório' })
  @IsUUID('4', { message: 'O ID do evento deve ser um UUID válido' })
  eventId: string;
}
