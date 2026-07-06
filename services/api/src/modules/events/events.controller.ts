import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/types/auth-user.type';
import { CreateEventDto } from './dto/create-event.dto';
import { EventQueryDto } from './dto/event-query.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsService } from './events.service';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar um novo evento em rascunho (DRAFT)' })
  @ApiResponse({
    status: 201,
    description: 'Evento criado com sucesso.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'event-uuid' },
        organizerProfileId: { type: 'string', example: 'organizer-uuid' },
        title: { type: 'string', example: 'Tech Girls Night' },
        slug: { type: 'string', example: 'tech-girls-night' },
        description: { type: 'string', example: 'Evento de lançamento.' },
        category: { type: 'string', example: 'Comunidade' },
        format: { type: 'string', example: 'ONLINE' },
        status: { type: 'string', example: 'DRAFT' },
        startDateTime: { type: 'string', example: '2026-07-24T20:00:00.000Z' },
        capacity: { type: 'integer', example: 500 },
        availableSpots: { type: 'integer', example: 500 },
        price: { type: 'string', example: '0.00' },
        isFree: { type: 'boolean', example: true },
        hasCertificate: { type: 'boolean', example: true },
        createdAt: { type: 'string', example: '2026-07-06T14:40:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos ou regras de negócio violadas' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Permissão negada no Perfil Organizador' })
  @ApiResponse({ status: 404, description: 'Perfil Organizador não encontrado ou inativo' })
  create(@CurrentUser() user: AuthUser, @Body() createDto: CreateEventDto) {
    return this.eventsService.create(user.id, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar eventos publicados (público)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de eventos obtida com sucesso.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'event-uuid' },
              title: { type: 'string', example: 'Tech Girls Night' },
              slug: { type: 'string', example: 'tech-girls-night' },
              description: { type: 'string', example: 'Descrição...' },
              category: { type: 'string', example: 'Comunidade' },
              format: { type: 'string', example: 'ONLINE' },
              status: { type: 'string', example: 'PUBLISHED' },
              startDateTime: { type: 'string', example: '2026-07-24T20:00:00.000Z' },
              endDateTime: { type: 'string', example: '2026-07-24T22:00:00.000Z' },
              city: { type: 'string', nullable: true, example: null },
              state: { type: 'string', nullable: true, example: null },
              onlineUrl: { type: 'string', example: 'https://youtube.com/live/exemplo' },
              capacity: { type: 'integer', example: 500 },
              availableSpots: { type: 'integer', example: 500 },
              isFree: { type: 'boolean', example: true },
              price: { type: 'string', example: '0.00' },
              hasCertificate: { type: 'boolean', example: true },
              organizerProfile: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'organizer-uuid' },
                  name: { type: 'string', example: 'Tech Sisters' },
                  slug: { type: 'string', example: 'tech-sisters' },
                  type: { type: 'string', example: 'COMMUNITY' },
                  logoUrl: { type: 'string', nullable: true, example: null },
                  isVerified: { type: 'boolean', example: false },
                },
              },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            total: { type: 'integer', example: 1 },
            totalPages: { type: 'integer', example: 1 },
          },
        },
      },
    },
  })
  findAllPublic(@Query() query: EventQueryDto) {
    return this.eventsService.findAllPublic(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes públicos de um evento pelo ID (público)' })
  @ApiParam({ name: 'id', description: 'ID do evento', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Evento encontrado.',
  })
  @ApiResponse({ status: 404, description: 'Evento não encontrado ou não publicado' })
  findPublicById(@Param('id') id: string) {
    return this.eventsService.findPublicById(id);
  }

  @Get('organizer/:organizerProfileId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os eventos (DRAFT, PUBLISHED, etc.) de um organizador (painel admin)' })
  @ApiParam({ name: 'organizerProfileId', description: 'ID do Perfil Organizador', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Lista de eventos obtida com sucesso.',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Usuário não pertence a este Perfil Organizador' })
  findByOrganizer(
    @CurrentUser() user: AuthUser,
    @Param('organizerProfileId') organizerProfileId: string,
  ) {
    return this.eventsService.findByOrganizer(user.id, organizerProfileId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar dados de um evento' })
  @ApiParam({ name: 'id', description: 'ID do evento', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Evento atualizado com sucesso.',
  })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Sem permissões necessárias' })
  @ApiResponse({ status: 404, description: 'Evento não encontrado ou deletado' })
  @ApiResponse({ status: 409, description: 'Slug em conflito no organizador' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() updateDto: UpdateEventDto,
  ) {
    return this.eventsService.update(user.id, id, updateDto);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publicar um evento' })
  @ApiParam({ name: 'id', description: 'ID do evento', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Evento publicado com sucesso.',
  })
  @ApiResponse({ status: 400, description: 'Evento não está em rascunho ou possui campos obrigatórios incompletos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Sem permissões necessárias' })
  @ApiResponse({ status: 404, description: 'Evento não encontrado' })
  publish(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.eventsService.publish(user.id, id);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar um evento' })
  @ApiParam({ name: 'id', description: 'ID do evento', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Evento cancelado com sucesso.',
  })
  @ApiResponse({ status: 400, description: 'Evento já encerrado ou arquivado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Apenas OWNER ou ADMIN do organizador podem cancelar o evento' })
  @ApiResponse({ status: 404, description: 'Evento não encontrado' })
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.eventsService.cancel(user.id, id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Excluir logicamente um evento' })
  @ApiParam({ name: 'id', description: 'ID do evento', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Evento excluído com sucesso.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Evento excluído com sucesso.' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Apenas OWNER ou ADMIN do organizador podem excluir o evento' })
  @ApiResponse({ status: 404, description: 'Evento não encontrado' })
  delete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.eventsService.delete(user.id, id);
  }
}
