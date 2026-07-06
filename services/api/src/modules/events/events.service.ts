import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { EventFormat, EventStatus, OrganizerMemberRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { EventQueryDto } from './dto/event-query.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { generateEventSlug } from './utils/generate-event-slug.util';

@Injectable()
export class EventsService {
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

  async ensureOrganizerPermission(
    userId: string,
    organizerProfileId: string,
    allowedRoles: OrganizerMemberRole[],
  ) {
    const member = await this.prisma.organizerMember.findFirst({
      where: {
        organizerProfileId,
        userId,
        isActive: true,
      },
    });

    if (!member || !allowedRoles.includes(member.role)) {
      throw new ForbiddenException('Você não tem permissão para realizar esta ação neste organizador');
    }

    return member;
  }

  validateEventBusinessRules(dto: {
    format: EventFormat;
    city?: string;
    state?: string;
    locationName?: string;
    address?: string;
    onlineUrl?: string;
    isFree?: boolean;
    price?: number;
    startDateTime: string;
    endDateTime?: string;
    checkinStartsAt?: string;
    checkinEndsAt?: string;
  }) {
    // 1. Validar formato
    if (dto.format === EventFormat.PRESENTIAL) {
      if (!dto.city || !dto.state || (!dto.locationName && !dto.address)) {
        throw new BadRequestException(
          'Eventos presenciais precisam de cidade, estado e local de realização ou endereço',
        );
      }
    } else if (dto.format === EventFormat.ONLINE) {
      if (!dto.onlineUrl) {
        throw new BadRequestException('Eventos online precisam de uma URL de transmissão (onlineUrl)');
      }
    } else if (dto.format === EventFormat.HYBRID) {
      if (!dto.city || !dto.state || (!dto.locationName && !dto.address) || !dto.onlineUrl) {
        throw new BadRequestException(
          'Eventos híbridos precisam tanto de dados presenciais (cidade, estado, local) quanto da URL online',
        );
      }
    }

    // 2. Validar preços e gratuidade
    if (dto.isFree === true && dto.price && dto.price > 0) {
      throw new BadRequestException('Se o evento for gratuito, o preço deve ser igual a 0');
    }

    if (dto.price && dto.price > 0 && dto.isFree === true) {
      throw new BadRequestException('Se o preço for maior que 0, o evento não pode ser gratuito');
    }

    // 3. Validar datas
    const start = new Date(dto.startDateTime);
    if (dto.endDateTime) {
      const end = new Date(dto.endDateTime);
      if (end <= start) {
        throw new BadRequestException('A data de término deve ser posterior à data de início');
      }
    }

    if (dto.checkinStartsAt && dto.checkinEndsAt) {
      const chInStart = new Date(dto.checkinStartsAt);
      const chInEnd = new Date(dto.checkinEndsAt);
      if (chInEnd <= chInStart) {
        throw new BadRequestException(
          'A data de término do check-in deve ser posterior à data de início do check-in',
        );
      }
    }
  }

  async generateUniqueSlug(
    organizerProfileId: string,
    title: string,
    requestedSlug?: string,
  ): Promise<string> {
    const baseSlug = requestedSlug ? generateEventSlug(requestedSlug) : generateEventSlug(title);
    let uniqueSlug = baseSlug;
    let counter = 2;

    while (true) {
      const existing = await this.prisma.event.findFirst({
        where: {
          organizerProfileId,
          slug: uniqueSlug,
          deletedAt: null,
        },
      });

      if (!existing) {
        break;
      }

      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    return uniqueSlug;
  }

  async create(userId: string, dto: CreateEventDto) {
    await this.checkUserActive(userId);

    // Verificar se Perfil Organizador existe e está ativo
    const organizer = await this.prisma.organizerProfile.findFirst({
      where: {
        id: dto.organizerProfileId,
        deletedAt: null,
        isActive: true,
      },
    });

    if (!organizer) {
      throw new NotFoundException('Perfil Organizador não encontrado ou está inativo');
    }

    // Verificar permissão
    await this.ensureOrganizerPermission(userId, dto.organizerProfileId, [
      OrganizerMemberRole.OWNER,
      OrganizerMemberRole.ADMIN,
      OrganizerMemberRole.EVENT_MANAGER,
    ]);

    // Validar regras de negócio
    this.validateEventBusinessRules(dto);

    // Gerar slug único no organizador
    const slug = await this.generateUniqueSlug(dto.organizerProfileId, dto.title, dto.slug);

    const event = await this.prisma.event.create({
      data: {
        organizerProfileId: dto.organizerProfileId,
        title: dto.title,
        slug,
        description: dto.description,
        category: dto.category,
        format: dto.format,
        status: dto.status || EventStatus.DRAFT,
        startDateTime: new Date(dto.startDateTime),
        endDateTime: dto.endDateTime ? new Date(dto.endDateTime) : null,
        timezone: dto.timezone || 'America/Bahia',
        locationName: dto.locationName,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country || 'Brasil',
        onlineUrl: dto.onlineUrl,
        capacity: dto.capacity,
        availableSpots: dto.capacity,
        price: dto.price || 0,
        isFree: dto.isFree ?? (dto.price ? dto.price === 0 : true),
        hasCertificate: dto.hasCertificate ?? true,
        checkinStartsAt: dto.checkinStartsAt ? new Date(dto.checkinStartsAt) : null,
        checkinEndsAt: dto.checkinEndsAt ? new Date(dto.checkinEndsAt) : null,
        bannerUrl: dto.bannerUrl,
      },
    });

    return event;
  }

  async findAllPublic(query: EventQueryDto) {
    const where: any = {
      status: EventStatus.PUBLISHED,
      deletedAt: null,
    };

    if (query.organizerProfileId) {
      where.organizerProfileId = query.organizerProfileId;
    }

    if (query.format) {
      where.format = query.format;
    }

    if (query.isFree !== undefined) {
      where.isFree = query.isFree;
    }

    if (query.category) {
      where.category = {
        equals: query.category,
        mode: 'insensitive',
      };
    }

    if (query.city) {
      where.city = {
        equals: query.city,
        mode: 'insensitive',
      };
    }

    if (query.state) {
      where.state = {
        equals: query.state,
        mode: 'insensitive',
      };
    }

    if (query.startsAfter) {
      where.startDateTime = {
        ...where.startDateTime,
        gte: new Date(query.startsAfter),
      };
    }

    if (query.startsBefore) {
      where.startDateTime = {
        ...where.startDateTime,
        lte: new Date(query.startsBefore),
      };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [total, events] = await Promise.all([
      this.prisma.event.count({ where }),
      this.prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDateTime: 'asc' },
        include: {
          organizerProfile: {
            select: {
              id: true,
              name: true,
              slug: true,
              type: true,
              logoUrl: true,
              isVerified: true,
            },
          },
        },
      }),
    ]);

    return {
      data: events,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findPublicById(id: string) {
    const event = await this.prisma.event.findFirst({
      where: {
        id,
        status: EventStatus.PUBLISHED,
        deletedAt: null,
      },
      include: {
        organizerProfile: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            logoUrl: true,
            isVerified: true,
            description: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado');
    }

    return event;
  }

  async findByOrganizer(userId: string, organizerProfileId: string) {
    await this.checkUserActive(userId);

    // Verificar se usuário é membro do organizador
    await this.ensureOrganizerPermission(userId, organizerProfileId, [
      OrganizerMemberRole.OWNER,
      OrganizerMemberRole.ADMIN,
      OrganizerMemberRole.EVENT_MANAGER,
      OrganizerMemberRole.CHECKIN_STAFF,
      OrganizerMemberRole.FINANCE_MANAGER,
      OrganizerMemberRole.CERTIFICATE_MANAGER,
      OrganizerMemberRole.ANALYTICS_VIEWER,
      OrganizerMemberRole.SUPPORT,
    ]);

    const events = await this.prisma.event.findMany({
      where: {
        organizerProfileId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return events;
  }

  async update(userId: string, id: string, dto: UpdateEventDto) {
    await this.checkUserActive(userId);

    const event = await this.prisma.event.findFirst({
      where: { id, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado');
    }

    // Verificar permissão
    await this.ensureOrganizerPermission(userId, event.organizerProfileId, [
      OrganizerMemberRole.OWNER,
      OrganizerMemberRole.ADMIN,
      OrganizerMemberRole.EVENT_MANAGER,
    ]);

    // Validar regras de negócio mesclando com o atual
    const merged = {
      format: dto.format || event.format,
      city: dto.city !== undefined ? dto.city : (event.city || undefined),
      state: dto.state !== undefined ? dto.state : (event.state || undefined),
      locationName: dto.locationName !== undefined ? dto.locationName : (event.locationName || undefined),
      address: dto.address !== undefined ? dto.address : (event.address || undefined),
      onlineUrl: dto.onlineUrl !== undefined ? dto.onlineUrl : (event.onlineUrl || undefined),
      isFree: dto.isFree !== undefined ? dto.isFree : event.isFree,
      price: dto.price !== undefined ? dto.price : Number(event.price),
      startDateTime: dto.startDateTime || event.startDateTime.toISOString(),
      endDateTime: dto.endDateTime !== undefined ? dto.endDateTime : (event.endDateTime?.toISOString() || undefined),
      checkinStartsAt: dto.checkinStartsAt !== undefined ? dto.checkinStartsAt : (event.checkinStartsAt?.toISOString() || undefined),
      checkinEndsAt: dto.checkinEndsAt !== undefined ? dto.checkinEndsAt : (event.checkinEndsAt?.toISOString() || undefined),
    };

    this.validateEventBusinessRules(merged);

    const updateData: any = { ...dto };

    if (dto.slug) {
      const slugNormalized = generateEventSlug(dto.slug);
      const slugExists = await this.prisma.event.findFirst({
        where: {
          organizerProfileId: event.organizerProfileId,
          slug: slugNormalized,
          deletedAt: null,
          NOT: { id },
        },
      });

      if (slugExists) {
        throw new ConflictException('Este slug já está em uso para outro evento deste organizador');
      }

      updateData.slug = slugNormalized;
    }

    // Como não há inscrições nesse passo, se capacity mudar, sincronizar availableSpots
    if (dto.capacity !== undefined) {
      updateData.availableSpots = dto.capacity;
    }

    // Converter datas para Date
    if (dto.startDateTime) updateData.startDateTime = new Date(dto.startDateTime);
    if (dto.endDateTime) updateData.endDateTime = new Date(dto.endDateTime);
    if (dto.checkinStartsAt) updateData.checkinStartsAt = new Date(dto.checkinStartsAt);
    if (dto.checkinEndsAt) updateData.checkinEndsAt = new Date(dto.checkinEndsAt);

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: updateData,
    });

    return updatedEvent;
  }

  async publish(userId: string, id: string) {
    await this.checkUserActive(userId);

    const event = await this.prisma.event.findFirst({
      where: { id, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado');
    }

    await this.ensureOrganizerPermission(userId, event.organizerProfileId, [
      OrganizerMemberRole.OWNER,
      OrganizerMemberRole.ADMIN,
      OrganizerMemberRole.EVENT_MANAGER,
    ]);

    if (event.status !== EventStatus.DRAFT) {
      throw new BadRequestException('Apenas eventos em rascunho (DRAFT) podem ser publicados');
    }

    // Validar campos mínimos
    if (!event.title || !event.format || !event.startDateTime || !event.capacity) {
      throw new BadRequestException('Campos mínimos obrigatórios ausentes no evento para publicação');
    }

    this.validateEventBusinessRules({
      format: event.format,
      city: event.city || undefined,
      state: event.state || undefined,
      locationName: event.locationName || undefined,
      address: event.address || undefined,
      onlineUrl: event.onlineUrl || undefined,
      isFree: event.isFree,
      price: Number(event.price),
      startDateTime: event.startDateTime.toISOString(),
      endDateTime: event.endDateTime?.toISOString() || undefined,
      checkinStartsAt: event.checkinStartsAt?.toISOString() || undefined,
      checkinEndsAt: event.checkinEndsAt?.toISOString() || undefined,
    });

    const publishedEvent = await this.prisma.event.update({
      where: { id },
      data: {
        status: EventStatus.PUBLISHED,
      },
    });

    return publishedEvent;
  }

  async cancel(userId: string, id: string) {
    await this.checkUserActive(userId);

    const event = await this.prisma.event.findFirst({
      where: { id, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado');
    }

    await this.ensureOrganizerPermission(userId, event.organizerProfileId, [
      OrganizerMemberRole.OWNER,
      OrganizerMemberRole.ADMIN,
    ]);

    if (event.status === EventStatus.FINISHED || event.status === EventStatus.ARCHIVED) {
      throw new BadRequestException('Não é possível cancelar um evento encerrado ou arquivado');
    }

    const canceledEvent = await this.prisma.event.update({
      where: { id },
      data: {
        status: EventStatus.CANCELED,
      },
    });

    return canceledEvent;
  }

  async delete(userId: string, id: string) {
    await this.checkUserActive(userId);

    const event = await this.prisma.event.findFirst({
      where: { id, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado');
    }

    await this.ensureOrganizerPermission(userId, event.organizerProfileId, [
      OrganizerMemberRole.OWNER,
      OrganizerMemberRole.ADMIN,
    ]);

    await this.prisma.event.update({
      where: { id },
      data: {
        status: EventStatus.ARCHIVED,
        deletedAt: new Date(),
      },
    });

    return {
      message: 'Evento excluído com sucesso.',
    };
  }
}
