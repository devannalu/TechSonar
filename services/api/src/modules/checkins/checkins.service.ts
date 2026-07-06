import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CheckinMethod, EventStatus, OrganizerMemberRole, RegistrationStatus, TicketStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CheckinQueryDto } from './dto/checkin-query.dto';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { ManualCheckinDto } from './dto/manual-checkin.dto';

@Injectable()
export class CheckinsService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureUserIsActive(userId: string) {
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

  async ensureCanManageCheckin(userId: string, organizerProfileId: string) {
    const member = await this.ensureOrganizerMember(userId, organizerProfileId);

    const allowedRoles: OrganizerMemberRole[] = [
      OrganizerMemberRole.OWNER,
      OrganizerMemberRole.ADMIN,
      OrganizerMemberRole.EVENT_MANAGER,
      OrganizerMemberRole.CHECKIN_STAFF,
    ];

    if (!allowedRoles.includes(member.role)) {
      throw new ForbiddenException(
        'Você não tem permissão para gerenciar check-ins (requer OWNER, ADMIN, EVENT_MANAGER ou CHECKIN_STAFF)',
      );
    }

    return member;
  }

  async ensureCanViewCheckin(userId: string, checkinId: string) {
    const checkin = await this.prisma.checkin.findUnique({
      where: { id: checkinId },
      include: {
        registration: {
          select: { userId: true },
        },
        event: {
          select: { organizerProfileId: true },
        },
      },
    });

    if (!checkin) {
      throw new NotFoundException('Check-in não encontrado');
    }

    if (checkin.userId === userId || checkin.registration.userId === userId) {
      return checkin;
    }

    // Se for organizador
    await this.ensureOrganizerMember(userId, checkin.event.organizerProfileId);

    return checkin;
  }

  validateCheckinWindow(event: {
    checkinStartsAt: Date | null;
    checkinEndsAt: Date | null;
  }) {
    const now = new Date();

    if (event.checkinStartsAt && now < new Date(event.checkinStartsAt)) {
      throw new BadRequestException('O check-in ainda não está disponível para este evento.');
    }

    if (event.checkinEndsAt && now > new Date(event.checkinEndsAt)) {
      throw new BadRequestException('O período de check-in deste evento já foi encerrado.');
    }
  }

  async create(userId: string, dto: CreateCheckinDto) {
    await this.ensureUserIsActive(userId);

    const event = await this.prisma.event.findFirst({
      where: { id: dto.eventId, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado');
    }

    const blockedStatuses: EventStatus[] = [EventStatus.CANCELED, EventStatus.ARCHIVED];
    if (blockedStatuses.includes(event.status)) {
      throw new BadRequestException('Não é possível realizar check-in em um evento cancelado ou arquivado');
    }

    // Validar janela de check-in
    this.validateCheckinWindow(event);

    // Buscar Inscrição do participante
    const registration = await this.prisma.registration.findUnique({
      where: {
        userId_eventId: { userId, eventId: dto.eventId },
      },
    });

    if (!registration) {
      throw new NotFoundException('Você não possui inscrição neste evento');
    }

    if (registration.status === RegistrationStatus.CHECKED_IN) {
      throw new ConflictException('O check-in já foi realizado para esta inscrição');
    }

    if (registration.status !== RegistrationStatus.CONFIRMED) {
      throw new BadRequestException('Sua inscrição precisa estar confirmada para realizar check-in');
    }

    // Buscar Ticket do participante
    const ticket = await this.prisma.ticket.findUnique({
      where: { registrationId: registration.id },
    });

    if (!ticket) {
      throw new NotFoundException('Ingresso não encontrado para esta inscrição');
    }

    if (ticket.status !== TicketStatus.ACTIVE) {
      throw new BadRequestException('Seu ingresso precisa estar ativo para realizar check-in');
    }

    // Executar check-in em transação
    return this.prisma.$transaction(async (tx) => {
      // Criar Checkin
      const checkin = await tx.checkin.create({
        data: {
          registrationId: registration.id,
          eventId: dto.eventId,
          userId,
          method: CheckinMethod.QR_CODE,
        },
      });

      // Atualizar inscrição para CHECKED_IN
      await tx.registration.update({
        where: { id: registration.id },
        data: { status: RegistrationStatus.CHECKED_IN },
      });

      // Atualizar Ticket para USED
      await tx.ticket.update({
        where: { id: ticket.id },
        data: { status: TicketStatus.USED },
      });

      return {
        id: checkin.id,
        eventId: checkin.eventId,
        userId: checkin.userId,
        registrationId: checkin.registrationId,
        method: checkin.method,
        checkedInAt: checkin.checkedInAt,
        event: {
          id: event.id,
          title: event.title,
        },
      };
    });
  }

  async manual(userId: string, dto: ManualCheckinDto) {
    await this.ensureUserIsActive(userId);

    const registration = await this.prisma.registration.findUnique({
      where: { id: dto.registrationId },
      include: {
        event: true,
      },
    });

    if (!registration) {
      throw new NotFoundException('Inscrição não encontrada');
    }

    const event = registration.event;
    if (event.deletedAt) {
      throw new NotFoundException('Evento relacionado foi excluído');
    }

    const blockedStatuses: EventStatus[] = [EventStatus.CANCELED, EventStatus.ARCHIVED];
    if (blockedStatuses.includes(event.status)) {
      throw new BadRequestException('Não é possível realizar check-in em um evento cancelado ou arquivado');
    }

    // Verificar se usuário logado é organizador com permissão para check-in
    await this.ensureCanManageCheckin(userId, event.organizerProfileId);

    if (registration.status === RegistrationStatus.CHECKED_IN) {
      throw new ConflictException('O check-in já foi realizado para esta inscrição');
    }

    if (registration.status !== RegistrationStatus.CONFIRMED) {
      throw new BadRequestException('A inscrição do participante deve estar confirmada para realizar check-in');
    }

    // Buscar Ticket
    const ticket = await this.prisma.ticket.findUnique({
      where: { registrationId: registration.id },
    });

    if (!ticket) {
      throw new NotFoundException('Ingresso não encontrado para esta inscrição');
    }

    if (ticket.status !== TicketStatus.ACTIVE) {
      throw new BadRequestException('O ingresso do participante deve estar ativo para realizar check-in');
    }

    // Executar em transação
    return this.prisma.$transaction(async (tx) => {
      const checkin = await tx.checkin.create({
        data: {
          registrationId: registration.id,
          eventId: event.id,
          userId: registration.userId,
          method: CheckinMethod.MANUAL,
          validatedById: userId,
          notes: dto.notes || null,
        },
      });

      // Atualizar inscrição
      await tx.registration.update({
        where: { id: registration.id },
        data: { status: RegistrationStatus.CHECKED_IN },
      });

      // Atualizar Ticket
      await tx.ticket.update({
        where: { id: ticket.id },
        data: { status: TicketStatus.USED },
      });

      return {
        id: checkin.id,
        registrationId: checkin.registrationId,
        eventId: checkin.eventId,
        userId: checkin.userId,
        method: checkin.method,
        validatedById: checkin.validatedById,
        notes: checkin.notes,
        checkedInAt: checkin.checkedInAt,
      };
    });
  }

  async findMineByEvent(userId: string, eventId: string) {
    await this.ensureUserIsActive(userId);

    const registration = await this.prisma.registration.findUnique({
      where: {
        userId_eventId: { userId, eventId },
      },
    });

    if (!registration) {
      throw new NotFoundException('Você não possui inscrição neste evento');
    }

    const checkin = await this.prisma.checkin.findUnique({
      where: { registrationId: registration.id },
      select: {
        id: true,
        method: true,
        checkedInAt: true,
      },
    });

    if (checkin) {
      return {
        hasCheckin: true,
        checkin,
      };
    }

    return {
      hasCheckin: false,
      checkin: null,
    };
  }

  async findByEvent(userId: string, eventId: string, query: CheckinQueryDto) {
    await this.ensureUserIsActive(userId);

    const event = await this.prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado');
    }

    // Verificar se usuário é organizador do evento
    await this.ensureOrganizerMember(userId, event.organizerProfileId);

    const where: any = { eventId };

    if (query.method) {
      where.method = query.method;
    }

    if (query.search) {
      where.registration = {
        user: {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
          ],
        },
      };
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [total, checkins] = await Promise.all([
      this.prisma.checkin.count({ where }),
      this.prisma.checkin.findMany({
        where,
        skip,
        take: limit,
        orderBy: { checkedInAt: 'desc' },
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
          registration: {
            select: {
              id: true,
              status: true,
              ticket: {
                select: {
                  id: true,
                  code: true,
                  status: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const mappedCheckins = checkins.map((c) => ({
      id: c.id,
      method: c.method,
      checkedInAt: c.checkedInAt,
      user: c.user,
      registration: {
        id: c.registration.id,
        status: c.registration.status,
      },
      ticket: c.registration.ticket,
    }));

    return {
      data: mappedCheckins,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(userId: string, checkinId: string) {
    await this.ensureUserIsActive(userId);
    const checkin = await this.ensureCanViewCheckin(userId, checkinId);

    const fullCheckin = await this.prisma.checkin.findUnique({
      where: { id: checkin.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            startDateTime: true,
          },
        },
        registration: {
          select: {
            id: true,
            status: true,
            registeredAt: true,
          },
        },
      },
    });

    return fullCheckin;
  }
}
