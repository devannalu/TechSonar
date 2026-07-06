import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PagarmeCreatePixOrderInput, PagarmeOrderResponse } from '../types/pagarme.types';
import { getPagarmeAuthHeader } from '../utils/pagarme-auth.util';

@Injectable()
export class PagarmeProvider {
  private readonly logger = new Logger(PagarmeProvider.name);
  private readonly baseUrl: string;
  private readonly secretKey: string;
  private readonly statementDescriptor: string;
  private readonly pixExpiresIn: number;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('PAGARME_BASE_URL') || 'https://api.pagar.me/core/v5';
    this.secretKey = this.configService.get<string>('PAGARME_SECRET_KEY') || 'change_me';
    this.statementDescriptor = this.configService.get<string>('PAGARME_STATEMENT_DESCRIPTOR') || 'TECHSONAR';
    this.pixExpiresIn = parseInt(this.configService.get<string>('PAGARME_PIX_EXPIRES_IN_SECONDS') || '1800', 10);
  }

  private buildAuthHeader(): string {
    return getPagarmeAuthHeader(this.secretKey);
  }

  async createPixOrder(input: PagarmeCreatePixOrderInput): Promise<PagarmeOrderResponse> {
    const authHeader = this.buildAuthHeader();

    const payload = {
      code: input.code,
      items: [
        {
          amount: input.amount,
          description: input.description,
          quantity: 1,
          code: input.eventId,
        },
      ],
      customer: {
        name: input.customerName,
        email: input.customerEmail,
        type: 'individual',
      },
      payments: [
        {
          payment_method: 'pix',
          pix: {
            expires_in: this.pixExpiresIn,
          },
        },
      ],
      metadata: input.metadata,
    };

    try {
      this.logger.log(`Enviando pedido PIX para o Pagar.me com o código: ${input.code}`);
      const response = await axios.post<PagarmeOrderResponse>(
        `${this.baseUrl}/orders`,
        payload,
        {
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
          },
        },
      );
      this.logger.log(`Pedido PIX criado com sucesso no Pagar.me. ID: ${response.data.id}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Erro ao criar pedido PIX no Pagar.me: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`,
      );
      throw new InternalServerErrorException(
        'Falha de comunicação com o provedor de pagamentos (Pagar.me)',
      );
    }
  }

  async createCreditCardOrder(): Promise<never> {
    throw new NotImplementedException(
      'Pagamento com cartão de crédito será implementado em uma etapa futura usando tokenização segura.',
    );
  }

  parseWebhookPayload(payload: any) {
    if (!payload) {
      throw new BadRequestException('Payload do webhook está vazio');
    }

    const eventType = payload.type;
    const data = payload.data;

    if (!eventType || !data) {
      return null;
    }

    // Pagar.me v5 order ou charge webhook structure
    const providerOrderId = data.order?.id || data.id; // Se for order event vs charge event
    const providerChargeId = data.charges?.[0]?.id || (eventType.startsWith('charge.') ? data.id : null);
    const providerPaymentId = data.charges?.[0]?.last_transaction?.id || data.last_transaction?.id || null;

    return {
      eventType,
      providerOrderId,
      providerChargeId,
      providerPaymentId,
      payload,
    };
  }
}
