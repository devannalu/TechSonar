import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { CheckinQueryDto } from './dto/checkin-query.dto';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { ManualCheckinDto } from './dto/manual-checkin.dto';
import { CheckinsService } from './checkins.service';

@ApiTags('Checkins')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('checkins')
export class CheckinsController {
  constructor(private readonly checkinsService: CheckinsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar presença (check-in) do próprio participante via QR Code' })
  @ApiResponse({
    status: 201,
    description: 'Check-in realizado com sucesso.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'checkin-uuid' },
        eventId: { type: 'string', example: 'event-uuid' },
        userId: { type: 'string', example: 'user-uuid' },
        registrationId: { type: 'string', example: 'registration-uuid' },
        method: { type: 'string', example: 'QR_CODE' },
        checkedInAt: { type: 'string', example: '2026-07-06T16:30:00.000Z' },
        event: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'event-uuid' },
            title: { type: 'string', example: 'Tech Girls Night' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos, fora da janela de check-in ou inscrição não confirmada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Evento, inscrição ou ingresso não encontrado' })
  @ApiResponse({ status: 409, description: 'Presença já confirmada anteriormente' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCheckinDto) {
    return this.checkinsService.create(user.id, dto);
  }

  @Post('manual')
  @ApiOperation({ summary: 'Registrar presença manual (check-in manual) de um participante (para organizadores)' })
  @ApiResponse({
    status: 201,
    description: 'Check-in manual realizado com sucesso.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'checkin-uuid' },
        registrationId: { type: 'string', example: 'registration-uuid' },
        eventId: { type: 'string', example: 'event-uuid' },
        userId: { type: 'string', example: 'user-uuid' },
        method: { type: 'string', example: 'MANUAL' },
        validatedById: { type: 'string', example: 'organizer-user-uuid' },
        notes: { type: 'string', example: 'Documento conferido na entrada.' },
        checkedInAt: { type: 'string', example: '2026-07-06T16:30:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos, status da inscrição/ingresso incorreto' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Permissão negada (usuário não pertence ao organizador do evento)' })
  @ApiResponse({ status: 404, description: 'Inscrição ou ingresso não encontrado' })
  @ApiResponse({ status: 409, description: 'Presença já confirmada anteriormente' })
  manual(@CurrentUser() user: AuthUser, @Body() dto: ManualCheckinDto) {
    return this.checkinsService.manual(user.id, dto);
  }

  @Get('me/event/:eventId')
  @ApiOperation({ summary: 'Obter status e detalhes do check-in do próprio participante para um evento' })
  @ApiParam({ name: 'eventId', description: 'ID do evento', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Status do check-in consultado com sucesso.',
    schema: {
      type: 'object',
      properties: {
        hasCheckin: { type: 'boolean', example: true },
        checkin: {
          type: 'object',
          nullable: true,
          properties: {
            id: { type: 'string', example: 'checkin-uuid' },
            method: { type: 'string', example: 'QR_CODE' },
            checkedInAt: { type: 'string', example: '2026-07-06T16:30:00.000Z' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Usuário não possui inscrição neste evento' })
  findMineByEvent(@CurrentUser() user: AuthUser, @Param('eventId') eventId: string) {
    return this.checkinsService.findMineByEvent(user.id, eventId);
  }

  @Get('event/:eventId')
  @ApiOperation({ summary: 'Listar check-ins de um evento (painel do organizador)' })
  @ApiParam({ name: 'eventId', description: 'ID do evento', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Lista de check-ins obtida com sucesso.',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Usuário não pertence ao organizador do evento' })
  @ApiResponse({ status: 404, description: 'Evento não encontrado' })
  findByEvent(
    @CurrentUser() user: AuthUser,
    @Param('eventId') eventId: string,
    @Query() query: CheckinQueryDto,
  ) {
    return this.checkinsService.findByEvent(user.id, eventId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de um check-in pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do check-in', type: 'string' })
  @ApiResponse({ status: 200, description: 'Check-in encontrado.' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Permissão negada (não é o dono do check-in nem organizador)' })
  @ApiResponse({ status: 404, description: 'Check-in não encontrado' })
  findById(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.checkinsService.findById(user.id, id);
  }
}
