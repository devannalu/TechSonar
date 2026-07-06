import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'ID da inscrição para a qual deseja realizar o pagamento',
    example: 'reg-uuid-12345',
  })
  @IsNotEmpty({ message: 'O ID da inscrição é obrigatório' })
  @IsUUID('4', { message: 'O ID da inscrição deve ser um UUID válido' })
  registrationId: string;

  @ApiProperty({
    description: 'Método de pagamento selecionado',
    enum: PaymentMethod,
    example: 'PIX',
  })
  @IsNotEmpty({ message: 'O método de pagamento é obrigatório' })
  @IsEnum(PaymentMethod, { message: 'Método de pagamento inválido' })
  method: PaymentMethod;
}
