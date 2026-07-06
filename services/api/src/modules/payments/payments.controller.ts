import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar pagamento para uma inscrição (privado)' })
  @ApiResponse({
    status: 201,
    description: 'Pagamento Pix criado ou pagamento pendente retornado com sucesso.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'payment-uuid' },
        registrationId: { type: 'string', example: 'reg-uuid' },
        status: { type: 'string', example: 'PENDING' },
        method: { type: 'string', example: 'PIX' },
        amount: { type: 'string', example: '49.90' },
        currency: { type: 'string', example: 'BRL' },
        provider: { type: 'string', example: 'pagarme' },
        providerOrderId: { type: 'string', example: 'order-12345' },
        providerChargeId: { type: 'string', example: 'charge-12345' },
        pixQrCode: { type: 'string', example: 'https://qr-code-url.png' },
        pixCopyPaste: { type: 'string', example: '00020126360014...' },
        expiresAt: { type: 'string', example: '2026-07-06T15:30:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos, evento gratuito, evento sem vaga ou método inválido' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado (não é dono da inscrição)' })
  @ApiResponse({ status: 409, description: 'Inscrição já está paga ou confirmada' })
  createPayment(@CurrentUser() user: AuthUser, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.createPayment(user.id, dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter detalhes de um pagamento pelo ID (privado)' })
  @ApiParam({ name: 'id', description: 'ID do pagamento', type: 'string' })
  @ApiResponse({ status: 200, description: 'Pagamento encontrado.' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Sem permissões necessárias' })
  @ApiResponse({ status: 404, description: 'Pagamento não encontrado' })
  findById(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.paymentsService.findById(user.id, id);
  }

  @Get('registration/:registrationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter detalhes do pagamento vinculado a uma inscrição (privado)' })
  @ApiParam({ name: 'registrationId', description: 'ID da inscrição', type: 'string' })
  @ApiResponse({ status: 200, description: 'Pagamento encontrado.' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Sem permissões necessárias' })
  @ApiResponse({ status: 404, description: 'Nenhum pagamento encontrado para esta inscrição' })
  findByRegistration(@CurrentUser() user: AuthUser, @Param('registrationId') registrationId: string) {
    return this.paymentsService.findByRegistration(user.id, registrationId);
  }

  @Post('webhooks/pagarme')
  @ApiOperation({ summary: 'Receber webhook do Pagar.me para atualizações de status (público)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        type: { type: 'string', example: 'charge.paid' },
        data: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Webhook recebido e processado.' })
  handlePagarmeWebhook(@Body() payload: any) {
    return this.paymentsService.handlePagarmeWebhook(payload);
  }
}
