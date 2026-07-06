import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { EventStatus, OrganizerMemberRole, RegistrationStatus, TicketStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CancelRegistrationDto } from './dto/cancel-registration.dto';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { RegistrationQueryDto } from './dto/registration-query.dto';
import { generateTicketCode } from './utils/generate-ticket-code.util';

@Injectable()
export class RegistrationsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async ensureOrganizerMember(userId: string, organizerProfileId: string) {
    const member = await this.prisma.organizerMember.findFirst({
      where: {
        organizerProfileId,
        userId,
        isActive: true,
      },
    });

    if (!member) {
      throw new ForbiddenException('Você não é um membro ativo da organização deste evento');
    }

    return member;
  }

  async ensureCanViewRegistration(userId: string, registrationId: string) {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        event: {
          select: { organizerProfileId: true },
        },
      },
    });

    if (!registration) {
      throw new NotFoundException('Inscrição não encontrada');
    }

    if (registration.userId === userId) {
      return registration;
    }

    await this.ensureOrganizerMember(userId, registration.event.organizerProfileId);

    return registration;
  }

  async ensureCanCancelRegistration(userId: string, registrationId: string) {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        event: {
          select: { organizerProfileId: true },
        },
      },
    });

    if (!registration) {
      throw new NotFoundException('Inscrição não encontrada');
    }

    if (registration.userId === userId) {
      return { registration, isAdmin: false };
    }

    const member = await this.prisma.organizerMember.findFirst({
      where: {
        organizerProfileId: registration.event.organizerProfileId,
        userId,
        isActive: true,
      },
    });

    const allowedRoles: OrganizerMemberRole[] = [
      OrganizerMemberRole.OWNER,
      OrganizerMemberRole.ADMIN,
      OrganizerMemberRole.EVENT_MANAGER,
    ];

    if (!member || !allowedRoles.includes(member.role)) {
      throw new ForbiddenException('Você não tem permissão para cancelar inscrições neste evento');
    }

    return { registration, isAdmin: true };
  }

  async generateUniqueTicketCode(): Promise<string> {
    while (true) {
      const code = generateTicketCode();
      const existing = await this.prisma.ticket.findUnique({
        where: { code },
      });

      if (!existing) {
        return code;
      }
    }
  }

  async create(userId: string, dto: CreateRegistrationDto) {
    await this.checkUserActive(userId);

    const event = await this.prisma.event.findFirst({
      where: { id: dto.eventId, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado');
    }

    if (event.status !== EventStatus.PUBLISHED) {
      throw new BadRequestException('Não é possível se inscrever em um evento que não está publicado');
    }

    const blockedStatuses: EventStatus[] = [EventStatus.CANCELED, EventStatus.FINISHED, EventStatus.ARCHIVED];
    if (blockedStatuses.includes(event.status)) {
      throw new BadRequestException('Não é possível se inscrever em um evento cancelado, finalizado ou arquivado');
    }

    // Verificar se já possui inscrição ativa ou pendente
    const existingRegistration = await this.prisma.registration.findUnique({
      where: {
        userId_eventId: { userId, eventId: dto.eventId },
      },
    });

    if (existingRegistration && existingRegistration.status !== RegistrationStatus.CANCELED) {
      throw new ConflictException('Você já possui uma inscrição ativa ou pendente para este evento');
    }

    // Verificar vagas disponíveis
    if (event.availableSpots !== null && event.availableSpots <= 0) {
      throw new BadRequestException('Não há vagas disponíveis para este evento');
    }

    // Executar inscrição em transação do Prisma
    return this.prisma.$transaction(async (tx) => {
      if (event.isFree) {
        // Reduzir vaga no evento
        const updatedEvent = await tx.event.update({
          where: { id: dto.eventId },
          data: {
            availableSpots: {
              decrement: 1,
            },
          },
        });

        if (updatedEvent.availableSpots !== null && updatedEvent.availableSpots < 0) {
          throw new BadRequestException('Não há vagas disponíveis para este evento');
        }

        // Criar ou atualizar inscrição para CONFIRMED
        const registration = await tx.registration.upsert({
          where: {
            userId_eventId: { userId, eventId: dto.eventId },
          },
          update: {
            status: RegistrationStatus.CONFIRMED,
            canceledAt: null,
          },
          create: {
            userId,
            eventId: dto.eventId,
            status: RegistrationStatus.CONFIRMED,
          },
        });

        // Gerar e criar ticket ativo
        const code = await this.generateUniqueTicketCode();
        const ticket = await tx.ticket.create({
          data: {
            registrationId: registration.id,
            eventId: dto.eventId,
            code,
            status: TicketStatus.ACTIVE,
            pricePaid: 0,
          },
        });

        return {
          id: registration.id,
          status: registration.status,
          eventId: registration.eventId,
          userId: registration.userId,
          ticket: {
            id: ticket.id,
            code: ticket.code,
            status: ticket.status,
          },
          event: {
            id: event.id,
            title: event.title,
            isFree: true,
          },
        };
      } else {
        // Evento Pago: criar com PENDING_PAYMENT, sem criar ticket e sem reduzir vaga
        const registration = await tx.registration.upsert({
          where: {
            userId_eventId: { userId, eventId: dto.eventId },
          },
          update: {
            status: RegistrationStatus.PENDING_PAYMENT,
            canceledAt: null,
          },
          create: {
            userId,
            eventId: dto.eventId,
            status: RegistrationStatus.PENDING_PAYMENT,
          },
        });

        return {
          id: registration.id,
          status: registration.status,
          eventId: registration.eventId,
          userId: registration.userId,
          ticket: null,
          event: {
            id: event.id,
            title: event.title,
            isFree: false,
            price: event.price.toString(),
          },
          nextStep: 'PAYMENT_REQUIRED',
        };
      }
    });
  }

  async findMine(userId: string) {
    await this.checkUserActive(userId);

    const registrations = await this.prisma.registration.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDateTime: true,
            format: true,
            city: true,
            state: true,
            organizerProfile: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        ticket: {
          select: {
            id: true,
            code: true,
            status: true,
          },
        },
      },
      orderBy: { registeredAt: 'desc' },
    });

    return registrations;
  }

  async findById(userId: string, registrationId: string) {
    await this.checkUserActive(userId);
    const registration = await this.ensureCanViewRegistration(userId, registrationId);

    const fullRegistration = await this.prisma.registration.findUnique({
      where: { id: registration.id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDateTime: true,
            format: true,
            city: true,
            state: true,
            organizerProfile: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        ticket: {
          select: {
            id: true,
            code: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return fullRegistration;
  }

  async cancel(userId: string, registrationId: string, dto?: CancelRegistrationDto) {
    await this.checkUserActive(userId);
    const { registration } = await this.ensureCanCancelRegistration(userId, registrationId);

    const event = await this.prisma.event.findUnique({
      where: { id: registration.eventId },
    });

    if (!event) {
      throw new NotFoundException('Evento relacionado não encontrado');
    }

    if (registration.status === RegistrationStatus.CANCELED) {
      throw new BadRequestException('Esta inscrição já está cancelada');
    }

    return this.prisma.$transaction(async (tx) => {
      const isConfirmed = registration.status === RegistrationStatus.CONFIRMED;

      // 1. Atualizar inscrição para CANCELED
      await tx.registration.update({
        where: { id: registrationId },
        data: {
          status: RegistrationStatus.CANCELED,
          canceledAt: new Date(),
        },
      });

      // 2. Se estava CONFIRMED e existia ticket, cancelar ticket e devolver vaga se o evento ainda não iniciou
      if (isConfirmed) {
        await tx.ticket.updateMany({
          where: { registrationId, status: TicketStatus.ACTIVE },
          data: { status: TicketStatus.CANCELED },
        });

        const eventNotStarted = new Date() < new Date(event.startDateTime);
        if (eventNotStarted) {
          await tx.event.update({
            where: { id: event.id },
            data: {
              availableSpots: {
                increment: 1,
              },
            },
          });
        }
      }

      return {
        message: 'Inscrição cancelada com sucesso.',
      };
    });
  }

  async findByEvent(userId: string, eventId: string, query: RegistrationQueryDto) {
    await this.checkUserActive(userId);

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado');
    }

    // Validar se usuário pertence ao organizador
    await this.ensureOrganizerMember(userId, event.organizerProfileId);

    const where: any = { eventId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.user = {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [total, registrations] = await Promise.all([
      this.prisma.registration.count({ where }),
      this.prisma.registration.findMany({
        where,
        skip,
        take: limit,
        orderBy: { registeredAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profile: {
                select: {
                  displayName: true,
                  city: true,
                  state: true,
                },
              },
            },
          },
          ticket: {
            select: {
              id: true,
              code: true,
              status: true,
            },
          },
          payment: {
            select: {
              id: true,
              status: true,
              method: true,
              amount: true,
            },
          },
        },
      }),
    ]);

    return {
      data: registrations,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
