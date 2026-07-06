import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackQueryDto } from './dto/feedback-query.dto';
import { FeedbacksService } from './feedbacks.service';

@ApiTags('Feedbacks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('feedbacks')
export class FeedbacksController {
  constructor(private readonly feedbacksService: FeedbacksService) {}

  @Post()
  @ApiOperation({ summary: 'Enviar feedback pós-evento (privado)' })
  @ApiResponse({
    status: 201,
    description: 'Feedback enviado com sucesso.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'feedback-uuid' },
        registrationId: { type: 'string', example: 'registration-uuid' },
        eventId: { type: 'string', example: 'event-uuid' },
        userId: { type: 'string', example: 'user-uuid' },
        overallRating: { type: 'integer', example: 5 },
        contentRating: { type: 'integer', example: 5 },
        organizationRating: { type: 'integer', example: 4 },
        speakerRating: { type: 'integer', example: 5 },
        positiveComment: { type: 'string', example: 'Evento muito bom.' },
        improvementComment: { type: 'string', example: 'Mais tempo para networking.' },
        wouldRecommend: { type: 'boolean', example: true },
        createdAt: { type: 'string', example: '2026-07-06T16:56:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos ou participante não fez check-in' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Permissão negada (inscrição não pertence ao participante)' })
  @ApiResponse({ status: 404, description: 'Inscrição não encontrada' })
  @ApiResponse({ status: 409, description: 'Feedback já enviado anteriormente para esta inscrição' })
  create(@CurrentUser() user: AuthUser, @Body() createDto: CreateFeedbackDto) {
    return this.feedbacksService.create(user.id, createDto);
  }

  @Get('me/event/:eventId')
  @ApiOperation({ summary: 'Consultar feedback do participante logado para um evento específico (privado)' })
  @ApiParam({ name: 'eventId', description: 'ID do evento', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Status do feedback retornado com sucesso.',
    schema: {
      type: 'object',
      properties: {
        hasFeedback: { type: 'boolean', example: true },
        feedback: {
          type: 'object',
          nullable: true,
          properties: {
            id: { type: 'string', example: 'feedback-uuid' },
            overallRating: { type: 'integer', example: 5 },
            createdAt: { type: 'string', example: '2026-07-06T16:56:00.000Z' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Você não possui inscrição neste evento' })
  findMineByEvent(@CurrentUser() user: AuthUser, @Param('eventId') eventId: string) {
    return this.feedbacksService.findMineByEvent(user.id, eventId);
  }

  @Get('event/:eventId')
  @ApiOperation({ summary: 'Listar feedbacks de um evento (painel do organizador)' })
  @ApiParam({ name: 'eventId', description: 'ID do evento', type: 'string' })
  @ApiResponse({ status: 200, description: 'Lista de feedbacks obtida com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Usuário não pertence ao organizador do evento' })
  @ApiResponse({ status: 404, description: 'Evento não encontrado' })
  findByEvent(
    @CurrentUser() user: AuthUser,
    @Param('eventId') eventId: string,
    @Query() query: FeedbackQueryDto,
  ) {
    return this.feedbacksService.findByEvent(user.id, eventId, query);
  }

  @Get('event/:eventId/metrics')
  @ApiOperation({ summary: 'Obter consolidação de métricas de avaliações do evento (painel do organizador)' })
  @ApiParam({ name: 'eventId', description: 'ID do evento', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Métricas consolidadas com sucesso.',
    schema: {
      type: 'object',
      properties: {
        eventId: { type: 'string', example: 'event-uuid' },
        totalFeedbacks: { type: 'integer', example: 10 },
        averageOverallRating: { type: 'number', example: 4.7 },
        averageContentRating: { type: 'number', example: 4.8 },
        averageOrganizationRating: { type: 'number', example: 4.6 },
        averageSpeakerRating: { type: 'number', example: 4.9 },
        recommendationRate: { type: 'integer', example: 90 },
        ratingDistribution: {
          type: 'object',
          properties: {
            '1': { type: 'integer', example: 0 },
            '2': { type: 'integer', example: 0 },
            '3': { type: 'integer', example: 1 },
            '4': { type: 'integer', example: 2 },
            '5': { type: 'integer', example: 7 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Usuário não pertence ao organizador do evento' })
  @ApiResponse({ status: 404, description: 'Evento não encontrado' })
  getMetricsByEvent(@CurrentUser() user: AuthUser, @Param('eventId') eventId: string) {
    return this.feedbacksService.getMetricsByEvent(user.id, eventId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de um feedback pelo ID (privado)' })
  @ApiParam({ name: 'id', description: 'ID do feedback', type: 'string' })
  @ApiResponse({ status: 200, description: 'Feedback encontrado.' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Sem permissões necessárias' })
  @ApiResponse({ status: 404, description: 'Feedback não encontrado' })
  findById(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.feedbacksService.findById(user.id, id);
  }
}
