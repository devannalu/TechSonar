import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { EventStatus, OrganizerMemberRole, PaymentMethod, PaymentStatus, RegistrationStatus, TicketStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RegistrationsService } from '../registrations/registrations.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PagarmeProvider } from './providers/pagarme.provider';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pagarmeProvider: PagarmeProvider,
    private readonly registrationsService: RegistrationsService,
  ) {}

  private async checkUserActive(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Usuário inativo ou bloqueado');
    }
  }

  async ensureCanViewPayment(userId: string, paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        registration: true,
        event: {
          select: { organizerProfileId: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    if (payment.userId === userId || payment.registration?.userId === userId) {
      return payment;
    }

    // Verificar se é membro da organização do evento
    const member = await this.prisma.organizerMember.findFirst({
      where: {
        organizerProfileId: payment.event.organizerProfileId,
        userId,
        isActive: true,
      },
    });

    if (!member) {
      throw new ForbiddenException('Você não tem permissão para visualizar este pagamento');
    }

    return payment;
  }

  async ensureRegistrationBelongsToUser(userId: string, registrationId: string) {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      throw new NotFoundException('Inscrição não encontrada');
    }

    if (registration.userId !== userId) {
      throw new ForbiddenException('Esta inscrição não pertence ao seu usuário');
    }

    return registration;
  }

  async findById(userId: string, paymentId: string) {
    await this.checkUserActive(userId);
    return this.ensureCanViewPayment(userId, paymentId);
  }

  async findByRegistration(userId: string, registrationId: string) {
    await this.checkUserActive(userId);
    await this.ensureRegistrationBelongsToUser(userId, registrationId);

    const payment = await this.prisma.payment.findUnique({
      where: { registrationId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDateTime: true,
            isFree: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Nenhum pagamento encontrado para esta inscrição');
    }

    return payment;
  }

  async createPayment(userId: string, dto: CreatePaymentDto) {
    await this.checkUserActive(userId);
    const registration = await this.ensureRegistrationBelongsToUser(userId, dto.registrationId);

    if (registration.status === RegistrationStatus.CONFIRMED) {
      throw new ConflictException('Esta inscrição já está confirmada.');
    }

    if (registration.status !== RegistrationStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Apenas inscrições com pagamento pendente podem receber pagamentos.');
    }

    const event = await this.prisma.event.findFirst({
      where: { id: registration.eventId, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado');
    }

    if (event.isFree) {
      throw new BadRequestException('Este evento é gratuito. Não há necessidade de criar pagamento.');
    }

    if (event.status !== EventStatus.PUBLISHED) {
      throw new BadRequestException('O evento associado deve estar publicado para receber pagamentos.');
    }

    // Verificar se já possui vagas
    if (event.availableSpots !== null && event.availableSpots <= 0) {
      throw new BadRequestException('Não há vagas disponíveis para este evento no momento.');
    }

    // Verificar se já existe um pagamento local
    const existingPayment = await this.prisma.payment.findUnique({
      where: { registrationId: dto.registrationId },
    });

    if (existingPayment) {
      if (existingPayment.status === PaymentStatus.PAID) {
        throw new ConflictException('Esta inscrição já foi paga.');
      }

      // Se pendente e não expirado, reaproveitar
      if (
        existingPayment.status === PaymentStatus.PENDING &&
        existingPayment.expiresAt &&
        new Date(existingPayment.expiresAt) > new Date()
      ) {
        return existingPayment;
      }
    }

    if (dto.method === PaymentMethod.CREDIT_CARD) {
      await this.pagarmeProvider.createCreditCardOrder();
    }

    if (dto.method !== PaymentMethod.PIX) {
      throw new BadRequestException('Método de pagamento inválido ou não suportado nesta etapa.');
    }

    // Fluxo do PIX:
    // 1. Criar ou atualizar pagamento local como PENDING
    const payment = await this.prisma.payment.upsert({
      where: { registrationId: dto.registrationId },
      update: {
        status: PaymentStatus.PENDING,
        method: PaymentMethod.PIX,
        amount: event.price,
        discountAmount: 0,
        refundedAmount: 0,
        currency: 'BRL',
        pixQrCode: null,
        pixCopyPaste: null,
        providerOrderId: null,
        providerChargeId: null,
        expiresAt: null,
        paidAt: null,
        canceledAt: null,
      },
      create: {
        registrationId: dto.registrationId,
        eventId: registration.eventId,
        userId,
        status: PaymentStatus.PENDING,
        method: PaymentMethod.PIX,
        amount: event.price,
        currency: 'BRL',
      },
    });

    // 2. Chamar o provedor Pagar.me
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    try {
      const amountInCents = Math.round(Number(event.price) * 100);
      const pagarmeOrder = await this.pagarmeProvider.createPixOrder({
        code: payment.id,
        amount: amountInCents,
        description: `Ingresso - ${event.title}`,
        eventId: event.id,
        customerName: user?.name || 'Participante TechSonar',
        customerEmail: user?.email || '',
        metadata: {
          paymentId: payment.id,
          registrationId: registration.id,
          eventId: event.id,
          userId,
        },
      });

      // 3. Atualizar o pagamento local com os dados do Pix obtidos do Pagar.me
      const charge = pagarmeOrder.charges?.[0];
      const transaction = charge?.last_transaction;

      const expiresAt = transaction?.expires_at ? new Date(transaction.expires_at) : null;

      const updatedPayment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          providerOrderId: pagarmeOrder.id,
          providerChargeId: charge?.id || null,
          pixQrCode: transaction?.qr_code_url || null,
          pixCopyPaste: transaction?.qr_code || null,
          expiresAt,
        },
      });

      return updatedPayment;
    } catch (error) {
      // Se falhar o Pagar.me, deixar o pagamento como FAILED
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
        },
      });
      throw error;
    }
  }

  async handlePagarmeWebhook(payload: any) {
    const parsed = this.pagarmeProvider.parseWebhookPayload(payload);
    if (!parsed) {
      // Cria um log genérico recebido
      await this.prisma.paymentWebhookLog.create({
        data: {
          eventType: payload?.type || 'unknown',
          payload: payload || {},
          processStatus: 'ignored',
          errorMessage: 'Payload inválido ou vazio',
        },
      });
      return { status: 'ignored' };
    }

    const { eventType, providerOrderId, providerChargeId, providerPaymentId } = parsed;

    // Buscar log ou criar novo
    const webhookLog = await this.prisma.paymentWebhookLog.create({
      data: {
        eventType,
        payload,
        processStatus: 'received',
      },
    });

    // Achar o pagamento local correspondente
    const payment = await this.prisma.payment.findFirst({
      where: {
        OR: [
          { providerOrderId: providerOrderId || undefined },
          { providerChargeId: providerChargeId || undefined },
          { providerPaymentId: providerPaymentId || undefined },
        ],
      },
      include: {
        registration: true,
      },
    });

    if (!payment) {
      await this.prisma.paymentWebhookLog.update({
        where: { id: webhookLog.id },
        data: {
          processStatus: 'not_found',
          errorMessage: `Nenhum pagamento correspondente aos IDs: Order: ${providerOrderId}, Charge: ${providerChargeId}`,
        },
      });
      return { status: 'not_found' };
    }

    // Vincular o webhook log ao payment
    await this.prisma.paymentWebhookLog.update({
      where: { id: webhookLog.id },
      data: { paymentId: payment.id },
    });

    // Idempotência: se o pagamento já estiver PAID, apenas ignorar as próximas ações
    if (payment.status === PaymentStatus.PAID) {
      await this.prisma.paymentWebhookLog.update({
        where: { id: webhookLog.id },
        data: {
          processStatus: 'ignored',
          errorMessage: 'Pagamento já processado anteriormente como PAID',
        },
      });
      return { status: 'already_paid' };
    }

    try {
      if (['charge.paid', 'order.paid'].includes(eventType)) {
        await this.confirmPaymentFromWebhook(payment, webhookLog.id);
      } else if (['charge.payment_failed', 'order.payment_failed'].includes(eventType)) {
        await this.failPaymentFromWebhook(payment.id, webhookLog.id);
      } else if (['charge.canceled', 'order.canceled'].includes(eventType)) {
        await this.cancelPaymentFromWebhook(payment.id, webhookLog.id);
      } else {
        await this.prisma.paymentWebhookLog.update({
          where: { id: webhookLog.id },
          data: { processStatus: 'ignored' },
        });
      }
      return { status: 'processed' };
    } catch (error: any) {
      this.logger.error(`Erro ao processar webhook ${webhookLog.id}: ${error.message}`);
      await this.prisma.paymentWebhookLog.update({
        where: { id: webhookLog.id },
        data: {
          processStatus: 'failed',
          errorMessage: error.message,
        },
      });
      return { status: 'error', error: error.message };
    }
  }

  async confirmPaymentFromWebhook(payment: any, webhookLogId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: payment.eventId },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado para confirmação de pagamento');
    }

    await this.prisma.$transaction(async (tx) => {
      // Dupla checagem sob lock da transação
      const currentPayment = await tx.payment.findUnique({
        where: { id: payment.id },
      });

      if (currentPayment?.status === PaymentStatus.PAID) {
        return;
      }

      // Validar vaga no momento da confirmação do webhook
      const currentEvent = await tx.event.findUnique({
        where: { id: payment.eventId },
      });

      if (currentEvent && currentEvent.availableSpots !== null && currentEvent.availableSpots <= 0) {
        // Sem vagas disponíveis no momento do webhook:
        // Atualiza pagamento para PAID, mas deixa log como failed (NO_AVAILABLE_SPOTS)
        // Não cria ingresso nem confirma a inscrição
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PAID,
            paidAt: new Date(),
          },
        });

        await tx.paymentWebhookLog.update({
          where: { id: webhookLogId },
          data: {
            processStatus: 'failed',
            errorMessage: 'NO_AVAILABLE_SPOTS',
          },
        });
        return;
      }

      // Decrementar vaga
      await tx.event.update({
        where: { id: payment.eventId },
        data: {
          availableSpots: {
            decrement: 1,
          },
        },
      });

      // Confirmar pagamento
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          paidAt: new Date(),
        },
      });

      if (payment.registrationId) {
        // Confirmar inscrição
        await tx.registration.update({
          where: { id: payment.registrationId },
          data: {
            status: RegistrationStatus.CONFIRMED,
          },
        });

        // Gerar ticket ativo
        await this.generateTicketForPaidRegistration(payment.registrationId, tx);
      }

      // Marcar webhook como processado com sucesso
      await tx.paymentWebhookLog.update({
        where: { id: webhookLogId },
        data: {
          processStatus: 'processed',
          processedAt: new Date(),
        },
      });
    });
  }

  async failPaymentFromWebhook(paymentId: string, webhookLogId: string) {
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.FAILED,
      },
    });

    await this.prisma.paymentWebhookLog.update({
      where: { id: webhookLogId },
      data: {
        processStatus: 'processed',
        processedAt: new Date(),
      },
    });
  }

  async cancelPaymentFromWebhook(paymentId: string, webhookLogId: string) {
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.CANCELED,
        canceledAt: new Date(),
      },
    });

    await this.prisma.paymentWebhookLog.update({
      where: { id: webhookLogId },
      data: {
        processStatus: 'processed',
        processedAt: new Date(),
      },
    });
  }

  async generateTicketForPaidRegistration(registrationId: string, tx: any) {
    const registration = await tx.registration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) return;

    // Verificar se já existe ticket para evitar duplicidade
    const existingTicket = await tx.ticket.findUnique({
      where: { registrationId },
    });

    if (existingTicket) return;

    // Gerar código único de ticket
    let ticketCode = '';
    while (true) {
      const tempCode = this.registrationsService.generateUniqueTicketCode; // Wait, let's call the registrations service code or helper
      // To bypass dependencies check here we can just reuse generateTicketCode helper locally
      const year = new Date().getFullYear();
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let rand = '';
      for (let i = 0; i < 6; i++) {
        rand += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      ticketCode = `TS-${year}-${rand}`;

      const codeExists = await tx.ticket.findUnique({
        where: { code: ticketCode },
      });

      if (!codeExists) {
        break;
      }
    }

    const event = await tx.event.findUnique({
      where: { id: registration.eventId },
    });

    await tx.ticket.create({
      data: {
        registrationId,
        eventId: registration.eventId,
        code: ticketCode,
        status: TicketStatus.ACTIVE,
        pricePaid: event?.price || 0,
      },
    });
  }
}
