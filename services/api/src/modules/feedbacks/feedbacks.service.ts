import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { RegistrationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { FeedbackQueryDto } from './dto/feedback-query.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbacksService {
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

  async ensureCanViewFeedback(userId: string, feedbackId: string) {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id: feedbackId },
      include: {
        registration: {
          select: { userId: true },
        },
        event: {
          select: { organizerProfileId: true },
        },
      },
    });

    if (!feedback) {
      throw new NotFoundException('Feedback não encontrado');
    }

    if (feedback.userId === userId || feedback.registration.userId === userId) {
      return feedback;
    }

    // Se for organizador
    await this.ensureOrganizerMember(userId, feedback.event.organizerProfileId);

    return feedback;
  }

  async create(userId: string, dto: CreateFeedbackDto) {
    await this.ensureUserIsActive(userId);

    const registration = await this.prisma.registration.findUnique({
      where: { id: dto.registrationId },
    });

    if (!registration) {
      throw new NotFoundException('Inscrição não encontrada');
    }

    if (registration.userId !== userId) {
      throw new ForbiddenException('Esta inscrição não pertence ao seu usuário');
    }

    if (registration.status === RegistrationStatus.CONFIRMED) {
      throw new BadRequestException('Você precisa realizar check-in no evento antes de enviar feedback');
    }

    if (registration.status !== RegistrationStatus.CHECKED_IN) {
      throw new BadRequestException('Apenas participantes que compareceram ao evento podem enviar feedback');
    }

    // Verificar se feedback já existe para esta inscrição
    const existingFeedback = await this.prisma.feedback.findUnique({
      where: { registrationId: dto.registrationId },
    });

    if (existingFeedback) {
      throw new ConflictException('O feedback já foi enviado para esta inscrição');
    }

    const feedback = await this.prisma.feedback.create({
      data: {
        registrationId: dto.registrationId,
        eventId: registration.eventId,
        userId,
        overallRating: dto.overallRating,
        contentRating: dto.contentRating || null,
        organizationRating: dto.organizationRating || null,
        speakerRating: dto.speakerRating || null,
        positiveComment: dto.positiveComment || null,
        improvementComment: dto.improvementComment || null,
        wouldRecommend: dto.wouldRecommend ?? null,
      },
    });

    return feedback;
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

    const feedback = await this.prisma.feedback.findUnique({
      where: { registrationId: registration.id },
      select: {
        id: true,
        overallRating: true,
        createdAt: true,
      },
    });

    if (feedback) {
      return {
        hasFeedback: true,
        feedback,
      };
    }

    return {
      hasFeedback: false,
      feedback: null,
    };
  }

  async findByEvent(userId: string, eventId: string, query: FeedbackQueryDto) {
    await this.ensureUserIsActive(userId);

    const event = await this.prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado');
    }

    await this.ensureOrganizerMember(userId, event.organizerProfileId);

    const where: any = { eventId };

    if (query.rating !== undefined) {
      where.overallRating = query.rating;
    }

    if (query.wouldRecommend !== undefined) {
      where.wouldRecommend = query.wouldRecommend;
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

    const [total, feedbacks] = await Promise.all([
      this.prisma.feedback.count({ where }),
      this.prisma.feedback.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
            },
          },
        },
      }),
    ]);

    return {
      data: feedbacks,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMetricsByEvent(userId: string, eventId: string) {
    await this.ensureUserIsActive(userId);

    const event = await this.prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado');
    }

    await this.ensureOrganizerMember(userId, event.organizerProfileId);

    const feedbacks = await this.prisma.feedback.findMany({
      where: { eventId },
    });

    const totalFeedbacks = feedbacks.length;

    if (totalFeedbacks === 0) {
      return {
        eventId,
        totalFeedbacks: 0,
        averageOverallRating: 0,
        averageContentRating: 0,
        averageOrganizationRating: 0,
        averageSpeakerRating: 0,
        recommendationRate: 0,
        ratingDistribution: {
          '1': 0,
          '2': 0,
          '3': 0,
          '4': 0,
          '5': 0,
        },
      };
    }

    let sumOverall = 0;
    let sumContent = 0;
    let countContent = 0;
    let sumOrg = 0;
    let countOrg = 0;
    let sumSpeaker = 0;
    let countSpeaker = 0;
    let countRec = 0;
    let countRecTotal = 0;

    const ratingDistribution = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
    };

    for (const f of feedbacks) {
      sumOverall += f.overallRating;

      const rateKey = f.overallRating.toString();
      if (rateKey in ratingDistribution) {
        ratingDistribution[rateKey as keyof typeof ratingDistribution]++;
      }

      if (f.contentRating !== null) {
        sumContent += f.contentRating;
        countContent++;
      }

      if (f.organizationRating !== null) {
        sumOrg += f.organizationRating;
        countOrg++;
      }

      if (f.speakerRating !== null) {
        sumSpeaker += f.speakerRating;
        countSpeaker++;
      }

      if (f.wouldRecommend !== null) {
        countRecTotal++;
        if (f.wouldRecommend) {
          countRec++;
        }
      }
    }

    const roundToOneDecimal = (value: number) => {
      return Math.round(value * 10) / 10;
    };

    const averageOverallRating = roundToOneDecimal(sumOverall / totalFeedbacks);
    const averageContentRating = countContent > 0 ? roundToOneDecimal(sumContent / countContent) : 0;
    const averageOrganizationRating = countOrg > 0 ? roundToOneDecimal(sumOrg / countOrg) : 0;
    const averageSpeakerRating = countSpeaker > 0 ? roundToOneDecimal(sumSpeaker / countSpeaker) : 0;
    const recommendationRate = countRecTotal > 0 ? Math.round((countRec / countRecTotal) * 100) : 0;

    return {
      eventId,
      totalFeedbacks,
      averageOverallRating,
      averageContentRating,
      averageOrganizationRating,
      averageSpeakerRating,
      recommendationRate,
      ratingDistribution,
    };
  }

  async findById(userId: string, feedbackId: string) {
    await this.ensureUserIsActive(userId);
    const feedback = await this.ensureCanViewFeedback(userId, feedbackId);

    const fullFeedback = await this.prisma.feedback.findUnique({
      where: { id: feedback.id },
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
          },
        },
      },
    });

    return fullFeedback;
  }
}
