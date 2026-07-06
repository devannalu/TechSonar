import { Module } from '@nestjs/common';
import { RegistrationsModule } from '../registrations/registrations.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PagarmeProvider } from './providers/pagarme.provider';

@Module({
  imports: [RegistrationsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PagarmeProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}
