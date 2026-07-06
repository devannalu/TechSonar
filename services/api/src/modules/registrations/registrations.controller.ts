import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { RegistrationQueryDto } from './dto/registration-query.dto';
import { RegistrationsService } from './registrations.service';

@ApiTags('Registrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post()
  @ApiOperation({ summary: 'Inscrever-se em um evento' })
  @ApiResponse({
    status: 201,
    description: 'Inscrição realizada com sucesso.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'registration-uuid' },
        status: { type: 'string', example: 'CONFIRMED' },
        eventId: { type: 'string', example: 'event-uuid' },
        userId: { type: 'string', example: 'user-uuid' },
        ticket: {
          type: 'object',
          nullable: true,
          properties: {
            id: { type: 'string', example: 'ticket-uuid' },
            code: { type: 'string', example: 'TS-2026-A8F2K9' },
            status: { type: 'string', example: 'ACTIVE' },
          },
        },
        event: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'event-uuid' },
            title: { type: 'string', example: 'Tech Girls Night' },
            isFree: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Regras de negócio violadas (evento não publicado, sem vagas, cancelado)' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 409, description: 'Inscrição duplicada no mesmo evento' })
  create(@CurrentUser() user: AuthUser, @Body() createDto: CreateRegistrationDto) {
    return this.registrationsService.create(user.id, createDto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Listar inscrições do próprio usuário logado' })
  @ApiResponse({
    status: 200,
    description: 'Lista de inscrições obtida com sucesso.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'registration-uuid' },
          status: { type: 'string', example: 'CONFIRMED' },
          registeredAt: { type: 'string', example: '2026-07-06T14:48:00.000Z' },
          event: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'event-uuid' },
              title: { type: 'string', example: 'Tech Girls Night' },
              startDateTime: { type: 'string', example: '2026-07-24T20:00:00.000Z' },
              format: { type: 'string', example: 'ONLINE' },
              city: { type: 'string', nullable: true, example: null },
              state: { type: 'string', nullable: true, example: null },
              organizerProfile: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'organizer-uuid' },
                  name: { type: 'string', example: 'Tech Sisters' },
                  type: { type: 'string', example: 'COMMUNITY' },
                },
              },
            },
          },
          ticket: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'string', example: 'ticket-uuid' },
              code: { type: 'string', example: 'TS-2026-A8F2K9' },
              status: { type: 'string', example: 'ACTIVE' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findMine(@CurrentUser() user: AuthUser) {
    return this.registrationsService.findMine(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de uma inscrição' })
  @ApiParam({ name: 'id', description: 'ID da inscrição', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Inscrição encontrada.',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Permissão negada (não é dono nem membro do organizador)' })
  @ApiResponse({ status: 404, description: 'Inscrição não encontrada' })
  findById(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.registrationsService.findById(user.id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar uma inscrição' })
  @ApiParam({ name: 'id', description: 'ID da inscrição', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Inscrição cancelada com sucesso.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Inscrição cancelada com sucesso.' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Inscrição já cancelada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Permissão negada para cancelar inscrição de terceiros' })
  @ApiResponse({ status: 404, description: 'Inscrição não encontrada' })
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.registrationsService.cancel(user.id, id);
  }

  @Get('event/:eventId')
  @ApiOperation({ summary: 'Listar inscrições de um evento (painel do organizador)' })
  @ApiParam({ name: 'eventId', description: 'ID do evento', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Lista de inscrições obtida com sucesso.',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Usuário não pertence ao organizador do evento' })
  @ApiResponse({ status: 404, description: 'Evento não encontrado' })
  findByEvent(
    @CurrentUser() user: AuthUser,
    @Param('eventId') eventId: string,
    @Query() query: RegistrationQueryDto,
  ) {
    return this.registrationsService.findByEvent(user.id, eventId, query);
  }
}
